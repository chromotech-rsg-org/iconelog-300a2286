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
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const authHeader = req.headers.get("Authorization");
    let isAuthenticated = false;

    // Try to authenticate if auth header is present
    if (authHeader?.startsWith("Bearer ")) {
      const supabaseAuth = createClient(supabaseUrl, supabaseAnonKey, {
        global: { headers: { Authorization: authHeader } },
      });
      const token = authHeader.replace("Bearer ", "");
      const { data: { user }, error: userError } = await supabaseAuth.auth.getUser(token);
      if (!userError && user) {
        isAuthenticated = true;
        console.log("User authenticated:", user.id);
      }
    }

    const requestData = await req.json();
    const {
      url,
      method = "POST",
      headers: customHeaders = {},
      body: requestBody,
      integration_id,
      public_page_id,
    } = requestData;

    // If not authenticated, check if this is a public page request
    if (!isAuthenticated) {
      if (!public_page_id) {
        console.error("Unauthenticated request without public_page_id");
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify the page is actually public using service role
      const adminClient = createClient(supabaseUrl, serviceRoleKey);
      const { data: publicSetting } = await adminClient
        .from("public_page_settings")
        .select("is_public, allow_refresh")
        .eq("page_id", public_page_id)
        .eq("is_public", true)
        .eq("allow_refresh", true)
        .maybeSingle();

      if (!publicSetting) {
        console.error("Page is not public or refresh not allowed:", public_page_id);
        return new Response(JSON.stringify({ error: "Unauthorized - page not public" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("Public access granted for page:", public_page_id);
    }

    if (!url) {
      return new Response(JSON.stringify({ error: "URL is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("Calling external URL:", url, "Method:", method);

    // Use service role client for fetching integration data (works for both auth and public)
    const adminClient = createClient(supabaseUrl, serviceRoleKey);

    let finalHeaders: Record<string, string> = {
      "Content-Type": "application/json",
      ...customHeaders,
    };

    // Fetch auth from api_integrations if no Authorization provided
    if (!finalHeaders["Authorization"] && !finalHeaders["authorization"]) {
      let query = adminClient.from("api_integrations").select("auth_token, auth_type, headers_json");
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

    console.log("External API response status:", apiResponse.status, "Time:", executionTime, "ms");

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
    console.error("Edge function error:", error.message);
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
