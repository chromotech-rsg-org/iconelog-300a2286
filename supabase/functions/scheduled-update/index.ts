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

    // Find active schedules matching current time (within 1 minute window)
    const { data: schedules, error: schedError } = await supabase
      .from("bi_scheduled_updates")
      .select("page_id, update_time")
      .eq("is_active", true);

    if (schedError) {
      console.error("Error fetching schedules:", schedError.message);
      return new Response(JSON.stringify({ error: schedError.message }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Filter schedules matching current time (HH:MM match)
    const matchingSchedules = (schedules || []).filter((s) => {
      const schedTime = s.update_time.substring(0, 5); // "HH:MM"
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

      // Calculate date range for current month
      const firstDay = new Date(brtTime.getFullYear(), brtTime.getMonth(), 1);
      const lastDay = new Date(brtTime.getFullYear(), brtTime.getMonth() + 1, 0);
      const fmt = (d: Date) =>
        `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const dateRange = {
        data_inicial: `${fmt(firstDay)} 00:00`,
        data_final: `${fmt(lastDay)} 23:59`,
      };

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

        try {
          console.log(`Calling API: ${integration.name} for page ${pageId}`);
          const startTime = Date.now();
          const apiResponse = await fetch(url, {
            method: "POST",
            headers,
            body: JSON.stringify({
              cod_cli: biSetting.cod_cli,
              ...dateRange,
            }),
          });
          const execTime = Date.now() - startTime;

          const responseBody = await apiResponse.json().catch(() => null);

          // Extract data array
          let dataArray: any[] = [];
          if (responseBody?.ocorrencias && Array.isArray(responseBody.ocorrencias)) {
            dataArray = responseBody.ocorrencias;
          } else if (Array.isArray(responseBody)) {
            dataArray = responseBody;
          } else if (responseBody?.data && Array.isArray(responseBody.data)) {
            dataArray = responseBody.data;
          }

          // Save to cache
          const cacheKey = `${integration.name.toLowerCase()}_${biSetting.cod_cli}`;
          await supabase.from("bi_data_cache").upsert(
            {
              page_id: pageId,
              cache_key: cacheKey,
              data: dataArray as any,
              cached_at: new Date().toISOString(),
            },
            { onConflict: "page_id,cache_key" }
          );

          console.log(`API ${integration.name}: ${apiResponse.status}, ${dataArray.length} records, ${execTime}ms`);
          results.push({
            page_id: pageId,
            api: integration.name,
            status: apiResponse.status,
            records: dataArray.length,
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
