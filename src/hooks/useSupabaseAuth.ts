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

export type AdminSectionType = 
  | "usuarios" | "perfis" | "acessoPublico" | "painelControle" | "cadastroCidades"
  | "configurarBi" | "empresasClientes" | "integracao" | "produtosEstoque" | "testesApi" | "logsApi" | "dadosApi";

// Maps camelCase keys to snake_case DB values
const adminSectionToDbType: Record<string, string> = {
  usuarios: "usuarios",
  perfis: "perfis",
  acessoPublico: "acesso_publico",
  painelControle: "painel_controle",
  cadastroCidades: "cadastro_cidades",
  configurarBi: "configurar_bi",
  empresasClientes: "empresas_clientes",
  integracao: "integracao",
  produtosEstoque: "produtos_estoque",
  testesApi: "testes_api",
  logsApi: "logs_api",
  dadosApi: "dados_api",
};

const dbTypeToSection: Record<string, string> = Object.fromEntries(
  Object.entries(adminSectionToDbType).map(([k, v]) => [v, k])
);

const allAdminSections = [
  "usuarios", "perfis", "acesso_publico", "painel_controle", "cadastro_cidades",
  "configurar_bi", "empresas_clientes", "integracao", "produtos_estoque", "testes_api", "logs_api", "dados_api",
];

type AdminPermissionsState = Record<string, AdminPermission>;

const defaultAdminPermissions = (): AdminPermissionsState => {
  const result: AdminPermissionsState = {};
  allAdminSections.forEach(section => {
    const key = dbTypeToSection[section] || section;
    result[key] = { ver: false, editar: false, criar: false, excluir: false };
  });
  return result;
};

export const useSupabaseAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [userRoles, setUserRoles] = useState<Role[]>([]);
  const [pagePermissions, setPagePermissions] = useState<Record<string, PagePermission>>({});
  const [adminPermissions, setAdminPermissions] = useState<AdminPermissionsState>(defaultAdminPermissions());
  const [publicAccess, setPublicAccessState] = useState<Record<string, { is_public: boolean; allow_export: boolean; allow_refresh: boolean }>>({});
  const [loading, setLoading] = useState(true);

  const isRetryableError = (error: any) => {
    return error?.name === 'AbortError' || 
      error?.message?.includes('Failed to fetch') ||
      error?.message?.includes('upstream request timeout') ||
      error?.message?.includes('timeout') ||
      error?.message?.includes('statement timeout') ||
      error?.code === '504' ||
      error?.code === '57014';
  };

  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<Profile | null> => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .maybeSingle();

      if (error) throw error;
      return data as Profile | null;
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      if (retryCount < 3 && isRetryableError(error)) {
        console.log(`Retrying profile fetch (attempt ${retryCount + 2}/4)...`);
        await new Promise(r => setTimeout(r, 2000 * (retryCount + 1)));
        return fetchProfile(userId, retryCount + 1);
      }
      return null;
    }
  }, []);

  const fetchUserRoles = useCallback(async (userId: string, retryCount = 0): Promise<Role[]> => {
    try {
      const { data, error } = await supabase
        .from("user_roles")
        .select(`role_id, roles (id, nome, descricao)`)
        .eq("user_id", userId);

      if (error) throw error;
      return data?.map((ur: any) => ur.roles).filter(Boolean) as Role[] || [];
    } catch (error: any) {
      console.error("Error fetching user roles:", error);
      if (retryCount < 3 && isRetryableError(error)) {
        console.log(`Retrying user roles fetch (attempt ${retryCount + 2}/4)...`);
        await new Promise(r => setTimeout(r, 2000 * (retryCount + 1)));
        return fetchUserRoles(userId, retryCount + 1);
      }
      return [];
    }
  }, []);

  const fetchPagePermissions = useCallback(async (roleIds: string[], retryCount = 0): Promise<Record<string, PagePermission>> => {
    if (roleIds.length === 0) return {};

    try {
      const { data, error } = await supabase
        .from("page_permissions")
        .select("*")
        .in("role_id", roleIds);

      if (error) throw error;

      const perms: Record<string, PagePermission> = {};
      data?.forEach((p) => {
        if (!perms[p.page_id]) {
          perms[p.page_id] = { visualizar: false, exportar: false, atualizar: false, apenas_dev: false };
        }
        perms[p.page_id].visualizar = perms[p.page_id].visualizar || p.visualizar;
        perms[p.page_id].exportar = perms[p.page_id].exportar || p.exportar;
        perms[p.page_id].atualizar = perms[p.page_id].atualizar || p.atualizar;
        perms[p.page_id].apenas_dev = perms[p.page_id].apenas_dev || p.apenas_dev;
      });
      return perms;
    } catch (error: any) {
      console.error("Error fetching page permissions:", error);
      if (retryCount < 3 && isRetryableError(error)) {
        console.log(`Retrying page permissions fetch (attempt ${retryCount + 2}/4)...`);
        await new Promise(r => setTimeout(r, 2000 * (retryCount + 1)));
        return fetchPagePermissions(roleIds, retryCount + 1);
      }
      return {};
    }
  }, []);

  const fetchAdminPermissions = useCallback(async (roleIds: string[], retryCount = 0): Promise<AdminPermissionsState> => {
    if (roleIds.length === 0) return defaultAdminPermissions();

    try {
      const { data, error } = await supabase
        .from("admin_permissions")
        .select("*")
        .in("role_id", roleIds);

      if (error) throw error;

      const result = defaultAdminPermissions();
      data?.forEach((p) => {
        const sectionKey = dbTypeToSection[p.permission_type] || p.permission_type;
        if (result[sectionKey]) {
          result[sectionKey].ver = result[sectionKey].ver || p.ver;
          result[sectionKey].editar = result[sectionKey].editar || p.editar;
          result[sectionKey].criar = result[sectionKey].criar || p.criar;
          result[sectionKey].excluir = result[sectionKey].excluir || p.excluir;
        }
      });
      return result;
    } catch (error: any) {
      console.error("Error fetching admin permissions:", error);
      if (retryCount < 3 && isRetryableError(error)) {
        console.log(`Retrying admin permissions fetch (attempt ${retryCount + 2}/4)...`);
        await new Promise(r => setTimeout(r, 2000 * (retryCount + 1)));
        return fetchAdminPermissions(roleIds, retryCount + 1);
      }
      return defaultAdminPermissions();
    }
  }, []);

  const fetchPublicAccess = useCallback(async (retryCount = 0): Promise<Record<string, { is_public: boolean; allow_export: boolean; allow_refresh: boolean }>> => {
    try {
      const { data, error } = await supabase.from("public_page_settings").select("*");
      if (error) throw error;
      const result: Record<string, { is_public: boolean; allow_export: boolean; allow_refresh: boolean }> = {};
      data?.forEach((p) => { result[p.page_id] = { is_public: p.is_public, allow_export: p.allow_export, allow_refresh: p.allow_refresh }; });
      return result;
    } catch (error: any) {
      console.error("Error fetching public access:", error);
      if (retryCount < 3 && isRetryableError(error)) {
        console.log(`Retrying public access fetch (attempt ${retryCount + 2}/4)...`);
        await new Promise(r => setTimeout(r, 2000 * (retryCount + 1)));
        return fetchPublicAccess(retryCount + 1);
      }
      return {};
    }
  }, []);

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

  useEffect(() => {
    fetchPublicAccess().then(setPublicAccessState);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (session?.user) {
          setLoading(true);
          setTimeout(() => { 
            loadUserData(session.user.id).finally(() => setLoading(false)); 
          }, 0);
        } else {
          setProfile(null);
          setUserRoles([]);
          setPagePermissions({});
          setAdminPermissions(defaultAdminPermissions());
          setLoading(false);
        }
      }
    );

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

  const signUp = useCallback(async (email: string, password: string, nome: string) => {
    const redirectUrl = `${window.location.origin}/`;
    const { data, error } = await supabase.auth.signUp({
      email, password,
      options: { emailRedirectTo: redirectUrl, data: { nome } },
    });

    if (error) return { success: false, message: error.message };
    return { 
      success: true, 
      message: "Cadastro realizado! Verifique seu email para confirmar.",
      needsConfirmation: !data.session 
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });

    if (error) {
      if (error.message.includes("Invalid login credentials")) return { success: false, message: "Email ou senha inválidos." };
      if (error.message.includes("Email not confirmed")) return { success: false, message: "Email não confirmado. Verifique sua caixa de entrada." };
      return { success: false, message: error.message };
    }

    if (data.user) {
      const profileData = await fetchProfile(data.user.id);
      if (profileData && !profileData.ativo) {
        await supabase.auth.signOut();
        return { success: false, message: "Usuário inativo. Contate o administrador." };
      }
    }

    return { success: true, message: "Login realizado com sucesso!" };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setUserRoles([]);
    setPagePermissions({});
  }, []);

  const updatePublicAccess = useCallback(async (pageId: string, field: string, value: boolean) => {
    const updateData: Record<string, boolean> = { [field]: value };
    const { error } = await supabase
      .from("public_page_settings")
      .update(updateData)
      .eq("page_id", pageId);

    if (error) {
      console.error("Error updating public access:", error);
      toast.error("Erro ao atualizar acesso público");
      return;
    }

    setPublicAccessState((prev) => ({ 
      ...prev, 
      [pageId]: { ...(prev[pageId] || { is_public: false, allow_export: false, allow_refresh: false }), [field]: value } 
    }));
    toast.success("Acesso público atualizado!");
  }, []);

  const canView = useCallback((pageId: string) => pagePermissions[pageId]?.visualizar ?? false, [pagePermissions]);
  const canExport = useCallback((pageId: string) => pagePermissions[pageId]?.exportar ?? false, [pagePermissions]);
  const canRefresh = useCallback((pageId: string) => pagePermissions[pageId]?.atualizar ?? false, [pagePermissions]);
  const isDevOnly = useCallback((pageId: string) => pagePermissions[pageId]?.apenas_dev ?? false, [pagePermissions]);
  const isPublicAccess = useCallback((pageId: string) => publicAccess[pageId]?.is_public === true, [publicAccess]);
  const isPublicExport = useCallback((pageId: string) => publicAccess[pageId]?.allow_export === true, [publicAccess]);
  const isPublicRefresh = useCallback((pageId: string) => publicAccess[pageId]?.allow_refresh === true, [publicAccess]);

  const canViewAdmin = useCallback((section: AdminSectionType) => {
    return adminPermissions[section]?.ver ?? false;
  }, [adminPermissions]);

  const canEditAdmin = useCallback((section: AdminSectionType) => {
    return adminPermissions[section]?.editar ?? false;
  }, [adminPermissions]);

  const canCreateAdmin = useCallback((section: AdminSectionType) => {
    return adminPermissions[section]?.criar ?? false;
  }, [adminPermissions]);

  const canDeleteAdmin = useCallback((section: AdminSectionType) => {
    return adminPermissions[section]?.excluir ?? false;
  }, [adminPermissions]);

  // Check if user has any config sub-permission
  const canViewAnyConfig = useCallback(() => {
    const configSections: AdminSectionType[] = ["configurarBi", "empresasClientes", "integracao", "produtosEstoque", "testesApi", "logsApi", "dadosApi"];
    return configSections.some(s => adminPermissions[s]?.ver);
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
    isPublicExport,
    isPublicRefresh,
    canViewAdmin,
    canEditAdmin,
    canCreateAdmin,
    canDeleteAdmin,
    canViewAnyConfig,
    updatePublicAccess,
    refreshUserData: () => user && loadUserData(user.id),
  };
};
