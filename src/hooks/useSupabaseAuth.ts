import { useState, useEffect, useCallback } from "react";
import { User, Session } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export interface Profile {
  id: string;
  nome: string;
  email: string;
  ativo: boolean;
  is_developer: boolean;
}

export interface Role {
  id: string;
  nome: string;
  descricao: string | null;
}

export interface PagePermission {
  visualizar: boolean;
  exportar: boolean;
  atualizar: boolean;
  apenas_dev: boolean;
}

export interface AdminPermission {
  ver: boolean;
  editar: boolean;
  criar: boolean;
  excluir: boolean;
}

export interface PublicAccessPermission {
  ver: boolean;
  editar: boolean;
}

export interface PainelControlePermission {
  ver: boolean;
}

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [pagePermissions, setPagePermissions] = useState<Record<string, PagePermission>>({});
  const [adminPermissions, setAdminPermissions] = useState<{
    usuarios: AdminPermission;
    perfis: AdminPermission;
    acesso_publico: PublicAccessPermission;
    painel_controle: PainelControlePermission;
    cadastro_cidades: AdminPermission;
  }>({
    usuarios: { ver: false, editar: false, criar: false, excluir: false },
    perfis: { ver: false, editar: false, criar: false, excluir: false },
    acesso_publico: { ver: false, editar: false },
    painel_controle: { ver: false },
    cadastro_cidades: { ver: false, editar: false, criar: false, excluir: false },
  });
  const [publicAccess, setPublicAccessState] = useState<Record<string, boolean>>({});
  const [loading, setLoading] = useState(true);

  // Fetch user profile
  const fetchProfile = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();

    if (error) {
      console.error("Error fetching profile:", error);
      return null;
    }
    return data as Profile | null;
  }, []);

  // Fetch user roles
  const fetchUserRoles = useCallback(async (userId: string) => {
    const { data, error } = await supabase
      .from("user_roles")
      .select(`
        role_id,
        roles (id, nome, descricao)
      `)
      .eq("user_id", userId);

    if (error) {
      console.error("Error fetching user roles:", error);
      return [];
    }
    return data?.map((ur: any) => ur.roles).filter(Boolean) as Role[] || [];
  }, []);

  // Fetch page permissions for user's roles
  const fetchPagePermissions = useCallback(async (roleIds: string[]) => {
    if (roleIds.length === 0) return {};

    const { data, error } = await supabase
      .from("page_permissions")
      .select("*")
      .in("role_id", roleIds);

    if (error) {
      console.error("Error fetching page permissions:", error);
      return {};
    }

    // Aggregate permissions (OR logic - if any role has permission, user has it)
    const perms: Record<string, PagePermission> = {};
    data?.forEach((p) => {
      if (!perms[p.page_id]) {
        perms[p.page_id] = {
          visualizar: false,
          exportar: false,
          atualizar: false,
          apenas_dev: false,
        };
      }
      perms[p.page_id].visualizar = perms[p.page_id].visualizar || p.visualizar;
      perms[p.page_id].exportar = perms[p.page_id].exportar || p.exportar;
      perms[p.page_id].atualizar = perms[p.page_id].atualizar || p.atualizar;
      perms[p.page_id].apenas_dev = perms[p.page_id].apenas_dev || p.apenas_dev;
    });
    return perms;
  }, []);

  // Fetch admin permissions for user's roles
  const fetchAdminPermissions = useCallback(async (roleIds: string[]) => {
    if (roleIds.length === 0) {
      return {
        usuarios: { ver: false, editar: false, criar: false, excluir: false },
        perfis: { ver: false, editar: false, criar: false, excluir: false },
        acesso_publico: { ver: false, editar: false },
        painel_controle: { ver: false },
        cadastro_cidades: { ver: false, editar: false, criar: false, excluir: false },
      };
    }

    const { data, error } = await supabase
      .from("admin_permissions")
      .select("*")
      .in("role_id", roleIds);

    if (error) {
      console.error("Error fetching admin permissions:", error);
      return {
        usuarios: { ver: false, editar: false, criar: false, excluir: false },
        perfis: { ver: false, editar: false, criar: false, excluir: false },
        acesso_publico: { ver: false, editar: false },
        painel_controle: { ver: false },
        cadastro_cidades: { ver: false, editar: false, criar: false, excluir: false },
      };
    }

    // Aggregate permissions
    const result = {
      usuarios: { ver: false, editar: false, criar: false, excluir: false },
      perfis: { ver: false, editar: false, criar: false, excluir: false },
      acesso_publico: { ver: false, editar: false } as PublicAccessPermission,
      painel_controle: { ver: false },
      cadastro_cidades: { ver: false, editar: false, criar: false, excluir: false },
    };

    data?.forEach((p) => {
      const section = p.permission_type as keyof typeof result;
      if (section === "usuarios" || section === "perfis" || section === "cadastro_cidades") {
        result[section].ver = result[section].ver || p.ver;
        result[section].editar = result[section].editar || p.editar;
        result[section].criar = result[section].criar || p.criar;
        result[section].excluir = result[section].excluir || p.excluir;
      } else if (section === "acesso_publico") {
        result.acesso_publico.ver = result.acesso_publico.ver || p.ver;
        result.acesso_publico.editar = result.acesso_publico.editar || p.editar;
      } else if (section === "painel_controle") {
        result.painel_controle.ver = result.painel_controle.ver || p.ver;
      }
    });

    return result;
  }, []);

  // Fetch public access settings
  const fetchPublicAccess = useCallback(async () => {
    const { data, error } = await supabase
      .from("public_page_settings")
      .select("*");

    if (error) {
      console.error("Error fetching public access:", error);
      return {};
    }

    const result: Record<string, boolean> = {};
    data?.forEach((p) => {
      result[p.page_id] = p.is_public;
    });
    return result;
  }, []);

  // Load all user data
  const loadUserData = useCallback(async (userId: string) => {
    const [profileData, roles] = await Promise.all([
      fetchProfile(userId),
      fetchUserRoles(userId),
    ]);

    setProfile(profileData);
    setUserRoles(roles);

    const roleIds = roles.map((r) => r.id);
    const [pagePerm, adminPerm] = await Promise.all([
      fetchPagePermissions(roleIds),
      fetchAdminPermissions(roleIds),
    ]);

    setPagePermissions(pagePerm);
    setAdminPermissions(adminPerm);
  }, [fetchProfile, fetchUserRoles, fetchPagePermissions, fetchAdminPermissions]);

  // Initial load and auth state listener
  useEffect(() => {
    // Fetch public access on mount
    fetchPublicAccess().then(setPublicAccessState);

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setTimeout(() => {
            loadUserData(session.user.id);
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
          setPagePermissions({});
          setAdminPermissions({
            usuarios: { ver: false, editar: false, criar: false, excluir: false },
            perfis: { ver: false, editar: false, criar: false, excluir: false },
            acesso_publico: { ver: false, editar: false },
            painel_controle: { ver: false },
            cadastro_cidades: { ver: false, editar: false, criar: false, excluir: false },
          });
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserData(session.user.id).finally(() => setLoading(false));
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadUserData, fetchPublicAccess]);

  // Sign up
  const signUp = useCallback(async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;

    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectUrl,
        data: { nome },
      },
    });

    if (error) {
      return { success: false, message: error.message };
    }

    return { 
      success: true, 
      message: "Cadastro realizado! Verifique seu email para confirmar.",
      needsConfirmation: !data.session 
    };
  }, []);

  // Sign in
  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes("Invalid login credentials")) {
        return { success: false, message: "Email ou senha inválidos." };
      }
      if (error.message.includes("Email not confirmed")) {
        return { success: false, message: "Email não confirmado. Verifique sua caixa de entrada." };
      }
      return { success: false, message: error.message };
    }

    // Check if user is active
    if (data.user) {
      const profileData = await fetchProfile(data.user.id);
      if (profileData && !profileData.ativo) {
        await supabase.auth.signOut();
        return { success: false, message: "Usuário inativo. Contate o administrador." };
      }
    }

    return { success: true, message: "Login realizado com sucesso!" };
  }, [fetchProfile]);

  // Sign out
  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRoles([]);
    setPagePermissions({});
  }, []);

  // Update public access
  const updatePublicAccess = useCallback(async (pageId: string, isPublic: boolean) => {
    const { error } = await supabase
      .from("public_page_settings")
      .update({ is_public: isPublic })
      .eq("page_id", pageId);

    if (error) {
      console.error("Error updating public access:", error);
      toast.error("Erro ao atualizar acesso público");
      return;
    }

    setPublicAccessState((prev) => ({ ...prev, [pageId]: isPublic }));
    toast.success("Acesso público atualizado!");
  }, []);

  // Permission helpers
  const canView = useCallback((pageId: string) => {
    return pagePermissions[pageId]?.visualizar ?? false;
  }, [pagePermissions]);

  const canExport = useCallback((pageId: string) => {
    return pagePermissions[pageId]?.exportar ?? false;
  }, [pagePermissions]);

  const canRefresh = useCallback((pageId: string) => {
    return pagePermissions[pageId]?.atualizar ?? false;
  }, [pagePermissions]);

  const isDevOnly = useCallback((pageId: string) => {
    return pagePermissions[pageId]?.apenas_dev ?? false;
  }, [pagePermissions]);

  const isPublicAccess = useCallback((pageId: string) => {
    return publicAccess[pageId] === true;
  }, [publicAccess]);

  const canViewAdmin = useCallback((section: "usuarios" | "perfis" | "acessoPublico" | "painelControle" | "cadastroCidades") => {
    if (section === "acessoPublico") {
      return adminPermissions.acesso_publico.ver;
    }
    if (section === "painelControle") {
      return adminPermissions.painel_controle.ver;
    }
    if (section === "cadastroCidades") {
      return adminPermissions.cadastro_cidades.ver;
    }
    return adminPermissions[section]?.ver ?? false;
  }, [adminPermissions]);

  const canEditAdmin = useCallback((section: "usuarios" | "perfis" | "acessoPublico" | "painelControle" | "cadastroCidades") => {
    if (section === "acessoPublico") {
      return adminPermissions.acesso_publico.editar;
    }
    if (section === "painelControle") {
      return false;
    }
    if (section === "cadastroCidades") {
      return adminPermissions.cadastro_cidades.editar;
    }
    return adminPermissions[section]?.editar ?? false;
  }, [adminPermissions]);

  const canCreateAdmin = useCallback((section: "usuarios" | "perfis" | "cadastroCidades") => {
    if (section === "cadastroCidades") {
      return adminPermissions.cadastro_cidades.criar;
    }
    return adminPermissions[section]?.criar ?? false;
  }, [adminPermissions]);

  const canDeleteAdmin = useCallback((section: "usuarios" | "perfis" | "cadastroCidades") => {
    if (section === "cadastroCidades") {
      return adminPermissions.cadastro_cidades.excluir;
    }
    return adminPermissions[section]?.excluir ?? false;
  }, [adminPermissions]);

  return {
    user,
    session,
    profile,
    userRoles,
    pagePermissions,
    adminPermissions,
    publicAccess,
    loading,
    isAuthenticated: !!user,
    isDeveloper: profile?.is_developer ?? false,
    signUp,
    signIn,
    signOut,
    canView,
    canExport,
    canRefresh,
    isDevOnly,
    isPublicAccess,
    canViewAdmin,
    canEditAdmin,
    canCreateAdmin,
    canDeleteAdmin,
    updatePublicAccess,
    refreshUserData: () => user && loadUserData(user.id),
  };
};
