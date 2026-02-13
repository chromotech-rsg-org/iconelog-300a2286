import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims?.sub) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const {
      url,
      method = "POST",
      headers: customHeaders = {},
      body: requestBody,
      integration_id,
    } = await req.json();

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    // Fetch auth from api_integrations if no Authorization provided
    if (!finalHeaders["Authorization"] && !finalHeaders["authorization"]) {
      let query = supabase.from("api_integrations").select("auth_token, auth_type, headers_json");
      if (integration_id) {
        query = query.eq("id", integration_id);
      }
      const { data: integrations } = await query.limit(1);

      if (integrations && integrations.length > 0) {
        const integration = integrations[0];
        if (integration.auth_token) {
          if (integration.auth_type === "bearer") {
            finalHeaders["Authorization"] = `Bearer ${integration.auth_token}`;
          } else if (integration.auth_type === "basic") {
            finalHeaders["Authorization"] = `Basic ${integration.auth_token}`;
          } else {
            finalHeaders["Authorization"] = integration.auth_token;
          }
        }
        if (integration.headers_json && typeof integration.headers_json === "object") {
          finalHeaders = { ...finalHeaders, ...(integration.headers_json as Record<string, string>) };
        }
      }
    }

    const fetchOptions: RequestInit = {
      method: method.toUpperCase(),
      headers: finalHeaders,
    };

    if (["POST", "PUT", "PATCH"].includes(method.toUpperCase()) && requestBody) {
      fetchOptions.body = JSON.stringify(requestBody);
    }

    const startTime = Date.now();
    const apiResponse = await fetch(url, fetchOptions);
    const executionTime = Date.now() - startTime;

    let responseBody;
    const contentType = apiResponse.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      responseBody = await apiResponse.json();
    } else {
      responseBody = await apiResponse.text();
    }

    const responseHeaders: Record<string, string> = {};
    apiResponse.headers.forEach((value, key) => {
      responseHeaders[key] = value;
    });

    return new Response(
      JSON.stringify({
        status: apiResponse.status,
        headers: responseHeaders,
        body: responseBody,
        execution_time_ms: executionTime,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error.message,
        status: 500,
        body: null,
        headers: {},
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
