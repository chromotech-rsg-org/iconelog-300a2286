import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface UserWithRole {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  is_developer: boolean;
  role_id: string | null;
  role_nome: string | null;
}

export const useUsersManagement = () => {
  const [users, setUsers] = useState<UserWithRole[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = useCallback(async () => {
    setLoading(true);

    // Fetch profiles
    const { data: profilesData, error: profilesError } = await supabase
      .from("profiles")
      .select("*")
      .order("nome");

    if (profilesError) {
      console.error("Error fetching profiles:", profilesError);
      setLoading(false);
      return;
    }

    // Fetch user roles
    const { data: userRolesData } = await supabase
      .from("user_roles")
      .select(`
        user_id,
        role_id,
        roles (nome)
      `);

    // Map profiles with their roles
    const usersWithRoles: UserWithRole[] = (profilesData || []).map((profile) => {
      const userRole = (userRolesData || []).find((ur: any) => ur.user_id === profile.id);
      return {
        id: profile.id,
        nome: profile.nome,
        email: profile.email,
        ativo: profile.ativo,
        is_developer: profile.is_developer,
        role_id: userRole?.role_id || null,
        role_nome: (userRole?.roles as any)?.nome || null,
      };
    });

    // Filter out developers if current user is not a developer
    setUsers(usersWithRoles.filter(u => !u.is_developer));
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = useCallback(async (
    userId: string,
    data: { nome?: string; ativo?: boolean; role_id?: string }
  ) => {
    // Update profile
    if (data.nome !== undefined || data.ativo !== undefined) {
      const updateData: any = {};
      if (data.nome !== undefined) updateData.nome = data.nome;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;

      const { error: profileError } = await supabase
        .from("profiles")
        .update(updateData)
        .eq("id", userId);

      if (profileError) {
        toast.error("Erro ao atualizar usuário: " + profileError.message);
        return false;
      }
    }

    // Update role
    if (data.role_id !== undefined) {
      // Delete existing role assignment
      await supabase
        .from("user_roles")
        .delete()
        .eq("user_id", userId);

      // Insert new role assignment
      if (data.role_id) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: userId, role_id: data.role_id });

        if (roleError) {
          toast.error("Erro ao atribuir perfil: " + roleError.message);
          return false;
        }
      }
    }

    toast.success("Usuário atualizado com sucesso!");
    await fetchUsers();
    return true;
  }, [fetchUsers]);

  const assignRole = useCallback(async (userId: string, roleId: string) => {
    // Delete existing role assignment
    await supabase
      .from("user_roles")
      .delete()
      .eq("user_id", userId);

    // Insert new role assignment
    const { error } = await supabase
      .from("user_roles")
      .insert({ user_id: userId, role_id: roleId });

    if (error) {
      toast.error("Erro ao atribuir perfil: " + error.message);
      return false;
    }

    toast.success("Perfil atribuído com sucesso!");
    await fetchUsers();
    return true;
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    // Note: This only marks user as inactive, doesn't delete from auth
    const { error } = await supabase
      .from("profiles")
      .update({ ativo: false })
      .eq("id", userId);

    if (error) {
      toast.error("Erro ao desativar usuário: " + error.message);
      return false;
    }

    toast.success("Usuário desativado com sucesso!");
    await fetchUsers();
    return true;
  }, [fetchUsers]);

  return {
    users,
    loading,
    fetchUsers,
    updateUser,
    assignRole,
    deleteUser,
  };
};
