import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, serviceRoleKey);

    // Get current time in BRT (UTC-3)
    const now = new Date();
    const brtOffset = -3 * 60;
    const brtTime = new Date(now.getTime() + (brtOffset + now.getTimezoneOffset()) * 60000);
    const currentHour = brtTime.getHours().toString().padStart(2, "0");
    const currentMinute = brtTime.getMinutes().toString().padStart(2, "0");
    const currentTime = `${currentHour}:${currentMinute}`;

    console.log("Scheduled update check at BRT:", currentTime);

    // Find active schedules
    const { data: schedules, error: schedError } = await supabase
      .from("bi_scheduled_updates")
      .select("id, page_id, update_time, schedule_type, interval_minutes, last_executed_at")
      .eq("is_active", true);

    if (schedError) {
      console.error("Error fetching schedules:", schedError.message);
      return new Response(JSON.stringify({ error: schedError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter schedules that should run now
    const matchingSchedules = (schedules || []).filter((s: any) => {
      if (s.schedule_type === "interval" && s.interval_minutes) {
        if (!s.last_executed_at) return true;
        const lastExec = new Date(s.last_executed_at).getTime();
        const elapsed = (now.getTime() - lastExec) / 60000;
        return elapsed >= s.interval_minutes;
      }
      // Time-based: match HH:MM
      const schedTime = (s.update_time || "").substring(0, 5);
      return schedTime === currentTime;
    });

    if (matchingSchedules.length === 0) {
      console.log("No schedules to execute at", currentTime);
      return new Response(JSON.stringify({ message: "No schedules to execute", time: currentTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const matchingPageIds = [...new Set(matchingSchedules.map((s: any) => s.page_id))];
    console.log(`Found ${matchingSchedules.length} schedules for pages: ${matchingPageIds.join(", ")}`);

    // ── Collect all unique API+cod_cli combinations across all matching pages ──
    // Get BI settings for all matching pages
    const { data: biSettings } = await supabase
      .from("bi_settings")
      .select("page_id, cod_cli")
      .in("page_id", matchingPageIds);

    // Get all API links for matching pages
    const { data: allApiLinks } = await supabase
      .from("bi_api_integrations")
      .select("bi_page_id, api_integration_id")
      .in("bi_page_id", matchingPageIds);

    if (!allApiLinks || allApiLinks.length === 0) {
      console.log("No API integrations linked to any matching pages");
      return new Response(JSON.stringify({ message: "No API integrations found", time: currentTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get unique integration IDs
    const uniqueIntegrationIds = [...new Set(allApiLinks.map((l) => l.api_integration_id))];
    const { data: integrations } = await supabase
      .from("api_integrations")
      .select("id, name, base_url, auth_token, auth_type, headers_json, default_body")
      .in("id", uniqueIntegrationIds);

    if (!integrations || integrations.length === 0) {
      console.log("No integration details found");
      return new Response(JSON.stringify({ message: "No integrations", time: currentTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Collect unique cod_cli values
    const codCliSet = new Set<string>();
    (biSettings || []).forEach((bs: any) => { if (bs.cod_cli) codCliSet.add(bs.cod_cli); });
    const codClis = [...codCliSet];

    if (codClis.length === 0) {
      console.log("No cod_cli configured for matching pages");
      return new Response(JSON.stringify({ message: "No cod_cli", time: currentTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // ── Deduplicated fetch: one call per unique (API, cod_cli) pair ──
    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
    const currentYear = brtTime.getFullYear();
    const currentMonth = brtTime.getMonth() + 1;

    // Current year chunks
    const monthChunks: { data_inicial: string; data_final: string }[] = [];
    for (let m = 1; m <= currentMonth; m++) {
      const firstDay = new Date(currentYear, m - 1, 1);
      const lastDay = new Date(currentYear, m, 0);
      monthChunks.push({
        data_inicial: `${fmt(firstDay)} 00:00`,
        data_final: `${fmt(lastDay)} 23:59`,
      });
    }

    // Check existing cache freshness to avoid re-fetching recently updated APIs
    const allCacheKeys = integrations.flatMap(i => codClis.map(c => `${i.name.toLowerCase()}_${c}`));
    const allKeysToCheck = [...allCacheKeys];
    
    const { data: existingCache } = await supabase
      .from("bi_data_cache")
      .select("cache_key, cached_at")
      .eq("page_id", "_shared")
      .in("cache_key", allKeysToCheck);
    const cacheAgeMap = new Map<string, number>();
    (existingCache || []).forEach((c: any) => {
      const ageMinutes = (now.getTime() - new Date(c.cached_at).getTime()) / 60000;
      cacheAgeMap.set(c.cache_key, ageMinutes);
    });

    // Minimum freshness threshold: skip if updated less than 30 min ago
    const FRESHNESS_THRESHOLD_MINUTES = 30;

    const results: any[] = [];
    const fetchedKeys = new Set<string>();

    for (const integration of integrations) {
      if (!integration.base_url) continue;

      for (const codCli of codClis) {
        const cacheKey = `${integration.name.toLowerCase()}_${codCli}`;

        if (fetchedKeys.has(cacheKey)) {
          console.log(`Skipping duplicate: ${cacheKey}`);
          continue;
        }

        // Skip if cache is still fresh
        const cacheAge = cacheAgeMap.get(cacheKey);
        if (cacheAge !== undefined && cacheAge < FRESHNESS_THRESHOLD_MINUTES) {
          console.log(`Skipping fresh cache: ${cacheKey} (${Math.round(cacheAge)}min old)`);
          results.push({ api: integration.name, cod_cli: codCli, status: "skipped", reason: `cache fresh (${Math.round(cacheAge)}min)` });
          continue;
        }

        fetchedKeys.add(cacheKey);

        const headers: Record<string, string> = { "Content-Type": "application/json" };
        if (integration.auth_token) {
          if (integration.auth_type === "bearer") {
            headers["Authorization"] = `Bearer ${integration.auth_token}`;
          } else if (integration.auth_type === "basic") {
            headers["Authorization"] = `Basic ${integration.auth_token}`;
          } else {
            headers["Authorization"] = integration.auth_token;
          }
        }
        if (integration.headers_json && typeof integration.headers_json === "object") {
          Object.assign(headers, integration.headers_json);
        }

        const apiName = integration.name.toUpperCase();
        const apiNeedsDateRange = ["FOLLOWUP", "PRODUTOSDISTRIBUIDOS"].includes(apiName);
        const defaultBody = integration.default_body && typeof integration.default_body === "object"
          ? integration.default_body as Record<string, any>
          : {};

        try {
          console.log(`Fetching API: ${integration.name} for cod_cli: ${codCli}`);
          const startTime = Date.now();
          let allDataArray: any[] = [];

          if (apiNeedsDateRange) {
            for (const chunk of monthChunks) {
              const body: Record<string, any> = { ...defaultBody, cod_cli: codCli, ...chunk };
              const apiResponse = await fetch(integration.base_url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
              });
              const responseBody = await apiResponse.json().catch(() => null);
              const dataArray = extractDataArray(responseBody);
              // Tag each record with fetch metadata
              const tagged = dataArray.map((r: any) => ({
                ...r,
                _fetch_month: parseInt(chunk.data_inicial.substring(5, 7), 10),
                _fetch_year: parseInt(chunk.data_inicial.substring(0, 4), 10),
              }));
              allDataArray = allDataArray.concat(tagged);
              console.log(`  Chunk ${chunk.data_inicial}: ${dataArray.length} records`);
            }
          } else {
            const body: Record<string, any> = { ...defaultBody, cod_cli: codCli };
            const apiResponse = await fetch(integration.base_url, {
              method: "POST",
              headers,
              body: JSON.stringify(body),
            });
            const responseBody = await apiResponse.json().catch(() => null);
            allDataArray = extractDataArray(responseBody);
          }

          const execTime = Date.now() - startTime;

          // Save to shared cache
          await supabase.from("bi_data_cache").upsert(
            {
              page_id: "_shared",
              cache_key: cacheKey,
              data: allDataArray as any,
              cached_at: new Date().toISOString(),
            },
            { onConflict: "page_id,cache_key" }
          );

          console.log(`API ${integration.name} (${codCli}): ${allDataArray.length} records, ${execTime}ms`);
          results.push({
            api: integration.name,
            cod_cli: codCli,
            status: 200,
            records: allDataArray.length,
            time_ms: execTime,
          });
        } catch (apiError: any) {
          console.error(`API error for ${integration.name} (${codCli}):`, apiError.message);
          results.push({
            api: integration.name,
            cod_cli: codCli,
            status: "error",
            error: apiError.message,
          });
        }
      }

      // 2025 data fetch temporarily disabled

    // Update last_update_at for all matched pages
    for (const pageId of matchingPageIds) {
      await supabase.from("bi_last_update").upsert(
        { page_id: pageId, last_update_at: new Date().toISOString() },
        { onConflict: "page_id" }
      );
    }

    // Update last_executed_at for all matched schedules
    const scheduleIds = matchingSchedules.map((s: any) => s.id);
    if (scheduleIds.length > 0) {
      await supabase.from("bi_scheduled_updates")
        .update({ last_executed_at: new Date().toISOString() } as any)
        .in("id", scheduleIds);
    }

    return new Response(JSON.stringify({ success: true, results, time: currentTime }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("Scheduled update error:", error.message);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

function extractDataArray(body: any): any[] {
  if (!body) return [];
  if (body?.ocorrencias && Array.isArray(body.ocorrencias)) return body.ocorrencias;
  if (body?.pedidos && Array.isArray(body.pedidos)) return body.pedidos;
  if (Array.isArray(body)) return body;
  if (body?.data && Array.isArray(body.data)) return body.data;
  if (body?.results && Array.isArray(body.results)) return body.results;
  return [];
}
