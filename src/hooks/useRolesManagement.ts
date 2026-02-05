import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Role {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface PagePermission {
  id?: string;
  role_id: string;
  page_id: string;
  visualizar: boolean;
  exportar: boolean;
  atualizar: boolean;
  apenas_dev: boolean;
}

export interface AdminPermission {
  id?: string;
  role_id: string;
  permission_type: string;
  ver: boolean;
  editar: boolean;
  criar: boolean;
  excluir: boolean;
}

export interface RoleWithPermissions extends Role {
  pagePermissions: Record<string, PagePermission>;
  adminPermissions: {
    usuarios: AdminPermission;
    perfis: AdminPermission;
    acesso_publico: AdminPermission;
    painel_controle: AdminPermission;
  };
}

export const useRolesManagement = () => {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    
    // Fetch roles
    const { data: rolesData, error: rolesError } = await supabase
      .from("roles")
      .select("*")
      .order("nome");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      setLoading(false);
      return;
    }

    // Fetch all page permissions
    const { data: pagePermsData } = await supabase
      .from("page_permissions")
      .select("*");

    // Fetch all admin permissions
    const { data: adminPermsData } = await supabase
      .from("admin_permissions")
      .select("*");

    // Map roles with their permissions
    const rolesWithPerms: RoleWithPermissions[] = (rolesData || []).map((role) => {
      const rolePagePerms = (pagePermsData || []).filter((p) => p.role_id === role.id);
      const roleAdminPerms = (adminPermsData || []).filter((p) => p.role_id === role.id);

      const pagePermissions: Record<string, PagePermission> = {};
      rolePagePerms.forEach((p) => {
        pagePermissions[p.page_id] = p;
      });

      const defaultAdminPerm = {
        id: undefined,
        role_id: role.id,
        permission_type: "",
        ver: false,
        editar: false,
        criar: false,
        excluir: false,
      };

      const adminPermissions = {
        usuarios: roleAdminPerms.find((p) => p.permission_type === "usuarios") || { ...defaultAdminPerm, permission_type: "usuarios" },
        perfis: roleAdminPerms.find((p) => p.permission_type === "perfis") || { ...defaultAdminPerm, permission_type: "perfis" },
        acesso_publico: roleAdminPerms.find((p) => p.permission_type === "acesso_publico") || { ...defaultAdminPerm, permission_type: "acesso_publico" },
        painel_controle: roleAdminPerms.find((p) => p.permission_type === "painel_controle") || { ...defaultAdminPerm, permission_type: "painel_controle" },
      };

      return {
        ...role,
        pagePermissions,
        adminPermissions,
      };
    });

    setRoles(rolesWithPerms);
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchRoles();
  }, [fetchRoles]);

  const createRole = useCallback(async (
    nome: string,
    descricao: string | null,
    pagePermissions: Record<string, Omit<PagePermission, "id" | "role_id">>,
    adminPermissions: {
      usuarios: Omit<AdminPermission, "id" | "role_id" | "permission_type">;
      perfis: Omit<AdminPermission, "id" | "role_id" | "permission_type">;
      acesso_publico: Omit<AdminPermission, "id" | "role_id" | "permission_type">;
      painel_controle: Omit<AdminPermission, "id" | "role_id" | "permission_type">;
    }
  ) => {
    // Create role
    const { data: roleData, error: roleError } = await supabase
      .from("roles")
      .insert({ nome, descricao })
      .select()
      .single();

    if (roleError) {
      toast.error("Erro ao criar perfil: " + roleError.message);
      return null;
    }

    const roleId = roleData.id;

    // Create page permissions
    const pagePermsToInsert = Object.entries(pagePermissions).map(([pageId, perm]) => ({
      role_id: roleId,
      page_id: pageId,
      ...perm,
    }));

    if (pagePermsToInsert.length > 0) {
      const { error: pagePermsError } = await supabase
        .from("page_permissions")
        .insert(pagePermsToInsert);

      if (pagePermsError) {
        console.error("Error creating page permissions:", pagePermsError);
      }
    }

    // Create admin permissions
    const adminPermsToInsert = [
      { role_id: roleId, permission_type: "usuarios", ...adminPermissions.usuarios },
      { role_id: roleId, permission_type: "perfis", ...adminPermissions.perfis },
      { role_id: roleId, permission_type: "acesso_publico", ...adminPermissions.acesso_publico },
      { role_id: roleId, permission_type: "painel_controle", ...adminPermissions.painel_controle },
    ];

    const { error: adminPermsError } = await supabase
      .from("admin_permissions")
      .insert(adminPermsToInsert);

    if (adminPermsError) {
      console.error("Error creating admin permissions:", adminPermsError);
    }

    toast.success("Perfil criado com sucesso!");
    await fetchRoles();
    return roleData;
  }, [fetchRoles]);

  const updateRole = useCallback(async (
    roleId: string,
    nome: string,
    descricao: string | null,
    pagePermissions: Record<string, Omit<PagePermission, "id" | "role_id">>,
    adminPermissions: {
      usuarios: Omit<AdminPermission, "id" | "role_id" | "permission_type">;
      perfis: Omit<AdminPermission, "id" | "role_id" | "permission_type">;
      acesso_publico: Omit<AdminPermission, "id" | "role_id" | "permission_type">;
      painel_controle: Omit<AdminPermission, "id" | "role_id" | "permission_type">;
    }
  ) => {
    // Update role
    const { error: roleError } = await supabase
      .from("roles")
      .update({ nome, descricao })
      .eq("id", roleId);

    if (roleError) {
      toast.error("Erro ao atualizar perfil: " + roleError.message);
      return false;
    }

    // Delete existing page permissions and recreate
    await supabase.from("page_permissions").delete().eq("role_id", roleId);

    const pagePermsToInsert = Object.entries(pagePermissions).map(([pageId, perm]) => ({
      role_id: roleId,
      page_id: pageId,
      ...perm,
    }));

    if (pagePermsToInsert.length > 0) {
      await supabase.from("page_permissions").insert(pagePermsToInsert);
    }

    // Delete existing admin permissions and recreate
    await supabase.from("admin_permissions").delete().eq("role_id", roleId);

    const adminPermsToInsert = [
      { role_id: roleId, permission_type: "usuarios", ...adminPermissions.usuarios },
      { role_id: roleId, permission_type: "perfis", ...adminPermissions.perfis },
      { role_id: roleId, permission_type: "acesso_publico", ...adminPermissions.acesso_publico },
      { role_id: roleId, permission_type: "painel_controle", ...adminPermissions.painel_controle },
    ];

    await supabase.from("admin_permissions").insert(adminPermsToInsert);

    toast.success("Perfil atualizado com sucesso!");
    await fetchRoles();
    return true;
  }, [fetchRoles]);

  const deleteRole = useCallback(async (roleId: string) => {
    // Check if role has users
    const { data: userRolesData } = await supabase
      .from("user_roles")
      .select("id")
      .eq("role_id", roleId);

    if (userRolesData && userRolesData.length > 0) {
      toast.error(`Não é possível excluir: ${userRolesData.length} usuário(s) vinculado(s)`);
      return false;
    }

    const { error } = await supabase
      .from("roles")
      .delete()
      .eq("id", roleId);

    if (error) {
      toast.error("Erro ao excluir perfil: " + error.message);
      return false;
    }

    toast.success("Perfil excluído com sucesso!");
    await fetchRoles();
    return true;
  }, [fetchRoles]);

  return {
    roles,
    loading,
    fetchRoles,
    createRole,
    updateRole,
    deleteRole,
  };
};
