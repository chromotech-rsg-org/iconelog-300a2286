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
  apenas_dev: boolean;
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
  apenas_dev: false,
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

    // Upsert page permissions (update existing, insert new)
    const { data: existingPagePerms } = await supabase
      .from("page_permissions")
      .select("id, page_id")
      .eq("role_id", roleId);

    const existingByPageId = new Map(
      (existingPagePerms || []).map((p: any) => [p.page_id, p.id])
    );

    for (const [pageId, perm] of Object.entries(pagePermissions)) {
      const existingId = existingByPageId.get(pageId);

      if (existingId) {
        await supabase
          .from("page_permissions")
          .update({
            visualizar: perm.visualizar,
            exportar: perm.exportar,
            atualizar: perm.atualizar,
            apenas_dev: perm.apenas_dev,
          })
          .eq("id", existingId);
      } else {
        await supabase
          .from("page_permissions")
          .insert({
            role_id: roleId,
            page_id: pageId,
            ...perm,
          });
      }
    }

    const adminPermsToSave = Object.entries(adminPermissions).map(([permType, perm]) => ({
      permission_type: permType,
      ...perm,
    }));

    const { data: existingAdminPerms, error: existingAdminPermsError } = await supabase
      .from("admin_permissions")
      .select("id, permission_type")
      .eq("role_id", roleId);

    if (existingAdminPermsError) {
      toast.error("Erro ao carregar permissões administrativas: " + existingAdminPermsError.message);
      return false;
    }

    const existingByType = new Map(
      (existingAdminPerms || []).map((p: any) => [p.permission_type, p.id])
    );

    // Atualiza 'perfis' por último para evitar perder autorização durante a operação
    const orderedAdminPerms = [
      ...adminPermsToSave.filter(p => p.permission_type !== "perfis"),
      ...adminPermsToSave.filter(p => p.permission_type === "perfis"),
    ];

    for (const perm of orderedAdminPerms) {
      const existingId = existingByType.get(perm.permission_type);

      if (existingId) {
        const { error: updateAdminError } = await supabase
          .from("admin_permissions")
          .update({
            ver: perm.ver,
            editar: perm.editar,
            criar: perm.criar,
            excluir: perm.excluir,
            apenas_dev: perm.apenas_dev,
          })
          .eq("id", existingId);

        if (updateAdminError) {
          toast.error("Erro ao atualizar permissões administrativas: " + updateAdminError.message);
          return false;
        }
      } else {
        const { error: insertAdminError } = await supabase
          .from("admin_permissions")
          .insert({
            role_id: roleId,
            permission_type: perm.permission_type,
            ver: perm.ver,
            editar: perm.editar,
            criar: perm.criar,
            excluir: perm.excluir,
            apenas_dev: perm.apenas_dev,
          });

        if (insertAdminError) {
          toast.error("Erro ao inserir permissões administrativas: " + insertAdminError.message);
          return false;
        }
      }
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
