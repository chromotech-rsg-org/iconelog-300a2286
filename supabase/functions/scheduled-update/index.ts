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
      .select("page_id, update_time, schedule_type, interval_minutes, last_executed_at")
      .eq("is_active", true);

    if (schedError) {
      console.error("Error fetching schedules:", schedError.message);
      return new Response(JSON.stringify({ error: schedError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter schedules: time-based match HH:MM, interval-based check elapsed minutes
    const matchingSchedules = (schedules || []).filter((s: any) => {
      if (s.schedule_type === "interval" && s.interval_minutes) {
        if (!s.last_executed_at) return true; // never executed
        const lastExec = new Date(s.last_executed_at).getTime();
        const elapsed = (now.getTime() - lastExec) / 60000;
        return elapsed >= s.interval_minutes;
      }
      // Default: time-based
      const schedTime = (s.update_time || "").substring(0, 5);
      return schedTime === currentTime;
    });

    if (matchingSchedules.length === 0) {
      console.log("No schedules to execute at", currentTime);
      return new Response(JSON.stringify({ message: "No schedules to execute", time: currentTime }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`Found ${matchingSchedules.length} schedules to execute`);

    const results: any[] = [];

    for (const schedule of matchingSchedules) {
      const pageId = schedule.page_id;

      // Get BI settings for this page (cod_cli needed for API call)
      const { data: biSetting } = await supabase
        .from("bi_settings")
        .select("cod_cli")
        .eq("page_id", pageId)
        .maybeSingle();

      if (!biSetting?.cod_cli) {
        console.log(`No cod_cli for page ${pageId}, skipping`);
        results.push({ page_id: pageId, status: "skipped", reason: "no cod_cli" });
        continue;
      }

      // Get API integrations for this page
      const { data: apiLinks } = await supabase
        .from("bi_api_integrations")
        .select("api_integration_id")
        .eq("bi_page_id", pageId);

      if (!apiLinks || apiLinks.length === 0) {
        console.log(`No API integrations for page ${pageId}, skipping`);
        results.push({ page_id: pageId, status: "skipped", reason: "no api_integrations" });
        continue;
      }

      // Get integration details
      const integrationIds = apiLinks.map((l) => l.api_integration_id);
      const { data: integrations } = await supabase
        .from("api_integrations")
        .select("name, base_url, auth_token, auth_type, headers_json")
        .in("id", integrationIds);

      if (!integrations || integrations.length === 0) {
        results.push({ page_id: pageId, status: "skipped", reason: "no integration details" });
        continue;
      }

      // Determine if this page needs date range params
      const needsDateRange = ["minutas", "entregas", "tracking"].includes(pageId) ||
        integrations.some(i => ["FOLLOWUP", "PRODUTOSDISTRIBUIDOS"].includes(i.name.toUpperCase()));

      // Calculate date range: always from Jan 1st of current year to today
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const currentYear = brtTime.getFullYear();
      const currentMonth = brtTime.getMonth() + 1; // 1-based

      // Build month-by-month chunks from January to current month
      const monthChunks: { data_inicial: string; data_final: string }[] = [];
      for (let m = 1; m <= currentMonth; m++) {
        const firstDay = new Date(currentYear, m - 1, 1);
        const lastDay = new Date(currentYear, m, 0);
        monthChunks.push({
          data_inicial: `${fmt(firstDay)} 00:00`,
          data_final: `${fmt(lastDay)} 23:59`,
        });
      }

      // Call each API integration
      for (const integration of integrations) {
        const url = integration.base_url;
        if (!url) continue;

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

        // Build request body - only include date range for APIs that need it
        const apiName = integration.name.toUpperCase();
        const apiNeedsDateRange = ["FOLLOWUP", "PRODUTOSDISTRIBUIDOS"].includes(apiName);

        // Determine cache key based on API name
        const cacheKey = `${integration.name.toLowerCase()}_${biSetting.cod_cli}`;

        try {
          console.log(`Calling API: ${integration.name} for page ${pageId}`);
          const startTime = Date.now();

          let allDataArray: any[] = [];

          if (apiNeedsDateRange) {
            // Fetch month by month from Jan to current month
            for (const chunk of monthChunks) {
              const body: Record<string, any> = { cod_cli: biSetting.cod_cli, ...chunk };
              const apiResponse = await fetch(url, {
                method: "POST",
                headers,
                body: JSON.stringify(body),
              });
              const responseBody = await apiResponse.json().catch(() => null);
              let dataArray: any[] = [];
              if (responseBody?.ocorrencias && Array.isArray(responseBody.ocorrencias)) {
                dataArray = responseBody.ocorrencias;
              } else if (responseBody?.pedidos && Array.isArray(responseBody.pedidos)) {
                dataArray = responseBody.pedidos;
              } else if (Array.isArray(responseBody)) {
                dataArray = responseBody;
              } else if (responseBody?.data && Array.isArray(responseBody.data)) {
                dataArray = responseBody.data;
              }
              allDataArray = allDataArray.concat(dataArray);
              console.log(`  Chunk ${chunk.data_inicial}: ${dataArray.length} records`);
            }
          } else {
            const body: Record<string, any> = { cod_cli: biSetting.cod_cli };
            const apiResponse = await fetch(url, {
              method: "POST",
              headers,
              body: JSON.stringify(body),
            });
            const responseBody = await apiResponse.json().catch(() => null);
            if (responseBody?.ocorrencias && Array.isArray(responseBody.ocorrencias)) {
              allDataArray = responseBody.ocorrencias;
            } else if (responseBody?.pedidos && Array.isArray(responseBody.pedidos)) {
              allDataArray = responseBody.pedidos;
            } else if (Array.isArray(responseBody)) {
              allDataArray = responseBody;
            } else if (responseBody?.data && Array.isArray(responseBody.data)) {
              allDataArray = responseBody.data;
            }
          }

          const execTime = Date.now() - startTime;

          // Save to shared cache (one extraction per API, shared by all BIs)
          await supabase.from("bi_data_cache").upsert(
            {
              page_id: "_shared",
              cache_key: cacheKey,
              data: allDataArray as any,
              cached_at: new Date().toISOString(),
            },
            { onConflict: "page_id,cache_key" }
          );

          console.log(`API ${integration.name}: ${allDataArray.length} total records, ${execTime}ms`);
          results.push({
            page_id: pageId,
            api: integration.name,
            status: 200,
            records: allDataArray.length,
            time_ms: execTime,
          });
        } catch (apiError: any) {
          console.error(`API error for ${integration.name}:`, apiError.message);
          results.push({
            page_id: pageId,
            api: integration.name,
            status: "error",
            error: apiError.message,
          });
        }
      }

      // Update last update timestamp
      await supabase.from("bi_last_update").upsert(
        { page_id: pageId, last_update_at: new Date().toISOString() },
        { onConflict: "page_id" }
      );

      // Update last_executed_at for interval-based schedules in this page
      const scheduleIds = matchingSchedules.filter((s: any) => s.page_id === pageId).map((s: any) => s.page_id);
      if (scheduleIds.length > 0) {
        await supabase.from("bi_scheduled_updates")
          .update({ last_executed_at: new Date().toISOString() } as any)
          .eq("page_id", pageId)
          .eq("is_active", true);
      }
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
