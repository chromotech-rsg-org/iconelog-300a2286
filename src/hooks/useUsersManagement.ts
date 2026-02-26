import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

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
  const [isCreating, setIsCreating] = useState(false);
  const { isDeveloper } = useAuth();

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
    if (isDeveloper) {
      setUsers(usersWithRoles);
    } else {
      setUsers(usersWithRoles.filter(u => !u.is_developer));
    }
    setLoading(false);
  }, [isDeveloper]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const updateUser = useCallback(async (
    userId: string,
    data: { nome?: string; ativo?: boolean; role_id?: string; is_developer?: boolean }
  ) => {
    // Update profile
    if (data.nome !== undefined || data.ativo !== undefined || data.is_developer !== undefined) {
      const updateData: any = {};
      if (data.nome !== undefined) updateData.nome = data.nome;
      if (data.ativo !== undefined) updateData.ativo = data.ativo;
      if (data.is_developer !== undefined) updateData.is_developer = data.is_developer;

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

  const createUser = useCallback(async (
    email: string,
    password: string,
    nome: string,
    roleId?: string,
    isDeveloperUser: boolean = false
  ) => {
    setIsCreating(true);
    
    try {
      // Sign up the user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { nome, is_developer: isDeveloperUser }
        }
      });

      if (authError) {
        toast.error("Erro ao criar usuário: " + authError.message);
        setIsCreating(false);
        return false;
      }

      if (!authData.user) {
        toast.error("Erro ao criar usuário: usuário não retornado");
        setIsCreating(false);
        return false;
      }

      // If role was provided, assign it
      if (roleId) {
        const { error: roleError } = await supabase
          .from("user_roles")
          .insert({ user_id: authData.user.id, role_id: roleId });

        if (roleError) {
          console.error("Error assigning role:", roleError);
        }
      }

      // Set developer status if needed
      if (isDeveloperUser) {
        await supabase
          .from("profiles")
          .update({ is_developer: true })
          .eq("id", authData.user.id);
      }

      toast.success("Usuário criado com sucesso! Email de confirmação enviado.");
      await fetchUsers();
      setIsCreating(false);
      return true;
    } catch (error: any) {
      toast.error("Erro ao criar usuário: " + error.message);
      setIsCreating(false);
      return false;
    }
  }, [fetchUsers]);

  const deleteUser = useCallback(async (userId: string) => {
    try {
      const res = await supabase.functions.invoke("update-user-auth", {
        body: { user_id: userId, action: "delete" },
      });

      if (res.error || res.data?.error) {
        toast.error("Erro ao excluir usuário: " + (res.data?.error || res.error?.message));
        return false;
      }

      toast.success("Usuário excluído com sucesso!");
      await fetchUsers();
      return true;
    } catch (error: any) {
      toast.error("Erro ao excluir usuário: " + error.message);
      return false;
    }
  }, [fetchUsers]);

  return {
    users,
    loading,
    isCreating,
    fetchUsers,
    createUser,
    updateUser,
    assignRole,
    deleteUser,
  };
};
