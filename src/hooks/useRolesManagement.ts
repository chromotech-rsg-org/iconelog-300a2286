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

// All admin permission types in DB snake_case
const ALL_ADMIN_TYPES = [
  "usuarios", "perfis", "acesso_publico", "painel_controle", "cadastro_cidades",
  "configurar_bi", "empresas_clientes", "integracao", "produtos_estoque", "testes_api", "logs_api", "dados_api",
];

export interface RoleWithPermissions extends Role {
  pagePermissions: Record<string, PagePermission>;
  adminPermissions: Record<string, AdminPermission>;
}

const defaultAdminPerm = (roleId: string, permType: string): AdminPermission => ({
  id: undefined,
  role_id: roleId,
  permission_type: permType,
  ver: false,
  editar: false,
  criar: false,
  excluir: false,
});

export const useRolesManagement = () => {
  const [roles, setRoles] = useState<RoleWithPermissions[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchRoles = useCallback(async () => {
    setLoading(true);
    
    const { data: rolesData, error: rolesError } = await supabase
      .from("roles")
      .select("*")
      .order("nome");

    if (rolesError) {
      console.error("Error fetching roles:", rolesError);
      setLoading(false);
      return;
    }

    const { data: pagePermsData } = await supabase.from("page_permissions").select("*");
    const { data: adminPermsData } = await supabase.from("admin_permissions").select("*");

    const rolesWithPerms: RoleWithPermissions[] = (rolesData || []).map((role) => {
      const rolePagePerms = (pagePermsData || []).filter((p) => p.role_id === role.id);
      const roleAdminPerms = (adminPermsData || []).filter((p) => p.role_id === role.id);

      const pagePermissions: Record<string, PagePermission> = {};
      rolePagePerms.forEach((p) => { pagePermissions[p.page_id] = p; });

      const adminPermissions: Record<string, AdminPermission> = {};
      ALL_ADMIN_TYPES.forEach(type => {
        adminPermissions[type] = roleAdminPerms.find((p) => p.permission_type === type) 
          || defaultAdminPerm(role.id, type);
      });

      return { ...role, pagePermissions, adminPermissions };
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
    adminPermissions: Record<string, Omit<AdminPermission, "id" | "role_id" | "permission_type">>
  ) => {
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

    const pagePermsToInsert = Object.entries(pagePermissions).map(([pageId, perm]) => ({
      role_id: roleId,
      page_id: pageId,
      ...perm,
    }));

    if (pagePermsToInsert.length > 0) {
      await supabase.from("page_permissions").insert(pagePermsToInsert);
    }

    const adminPermsToInsert = Object.entries(adminPermissions).map(([permType, perm]) => ({
      role_id: roleId,
      permission_type: permType,
      ...perm,
    }));

    if (adminPermsToInsert.length > 0) {
      await supabase.from("admin_permissions").insert(adminPermsToInsert);
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
    adminPermissions: Record<string, Omit<AdminPermission, "id" | "role_id" | "permission_type">>
  ) => {
    const { error: roleError } = await supabase
      .from("roles")
      .update({ nome, descricao })
      .eq("id", roleId);

    if (roleError) {
      toast.error("Erro ao atualizar perfil: " + roleError.message);
      return false;
    }

    await supabase.from("page_permissions").delete().eq("role_id", roleId);

    const pagePermsToInsert = Object.entries(pagePermissions).map(([pageId, perm]) => ({
      role_id: roleId,
      page_id: pageId,
      ...perm,
    }));

    if (pagePermsToInsert.length > 0) {
      await supabase.from("page_permissions").insert(pagePermsToInsert);
    }

    await supabase.from("admin_permissions").delete().eq("role_id", roleId);

    const adminPermsToInsert = Object.entries(adminPermissions).map(([permType, perm]) => ({
      role_id: roleId,
      permission_type: permType,
      ...perm,
    }));

    if (adminPermsToInsert.length > 0) {
      await supabase.from("admin_permissions").insert(adminPermsToInsert);
    }

    toast.success("Perfil atualizado com sucesso!");
    await fetchRoles();
    return true;
  }, [fetchRoles]);

  const deleteRole = useCallback(async (roleId: string) => {
    const { data: userRolesData } = await supabase
      .from("user_roles")
      .select("id")
      .eq("role_id", roleId);

    if (userRolesData && userRolesData.length > 0) {
      toast.error(`Não é possível excluir: ${userRolesData.length} usuário(s) vinculado(s)`);
      return false;
    }

    const { error } = await supabase.from("roles").delete().eq("id", roleId);

    if (error) {
      toast.error("Erro ao excluir perfil: " + error.message);
      return false;
    }

    toast.success("Perfil excluído com sucesso!");
    await fetchRoles();
    return true;
  }, [fetchRoles]);

  return { roles, loading, fetchRoles, createRole, updateRole, deleteRole };
};
