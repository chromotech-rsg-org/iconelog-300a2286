import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const anonKey = Deno.env.get("SUPABASE_ANON_KEY")!;

    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const token = authHeader.replace("Bearer ", "");

    const anonClient = createClient(supabaseUrl, anonKey, {
      global: { headers: { Authorization: authHeader } },
    });

    const { data: { user: callerUser }, error: userError } = await anonClient.auth.getUser(token);
    if (userError || !callerUser) {
      console.error("Auth error:", userError?.message);
      return new Response(JSON.stringify({ error: "Não autorizado" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const callerId = callerUser.id;

    // Check admin permission using RPC
    const { data: hasPermission } = await anonClient.rpc("has_admin_permission", {
      user_uuid: callerId,
      perm_type: "usuarios",
      action: "editar",
    });

    if (!hasPermission) {
      return new Response(JSON.stringify({ error: "Sem permissão" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { user_id, email, password, action } = await req.json();

    if (!user_id) {
      return new Response(JSON.stringify({ error: "user_id é obrigatório" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const adminClient = createClient(supabaseUrl, serviceRoleKey, {
      auth: { autoRefreshToken: false, persistSession: false },
    });

    // Handle delete action
    if (action === "delete") {
      // Check delete permission
      const { data: hasDeletePerm } = await anonClient.rpc("has_admin_permission", {
        user_uuid: callerId,
        perm_type: "usuarios",
        action: "excluir",
      });

      if (!hasDeletePerm) {
        return new Response(JSON.stringify({ error: "Sem permissão para excluir" }), {
          status: 403,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Delete user_roles, profile, and auth user
      await adminClient.from("user_roles").delete().eq("user_id", user_id);
      await adminClient.from("profiles").delete().eq("id", user_id);
      const { error } = await adminClient.auth.admin.deleteUser(user_id);

      if (error) {
        return new Response(JSON.stringify({ error: error.message }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      return new Response(JSON.stringify({ success: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Handle update action
    const updateData: Record<string, string> = {};
    if (email) updateData.email = email;
    if (password) updateData.password = password;

    if (Object.keys(updateData).length === 0) {
      return new Response(JSON.stringify({ message: "Nada para atualizar" }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { error } = await adminClient.auth.admin.updateUserById(user_id, updateData);

    if (error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // If email changed, also update profiles table
    if (email) {
      await adminClient.from("profiles").update({ email }).eq("id", user_id);
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: err.message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
