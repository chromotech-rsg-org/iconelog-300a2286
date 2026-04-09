import { useState, useEffect, useCallback, useRef } from "react";
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
  idioma: boolean;
  apenas_dev: boolean;
}

export interface AdminPermission {
  ver: boolean;
  editar: boolean;
  criar: boolean;
  excluir: boolean;
  apenas_dev: boolean;
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
  | "configurarBi" | "empresasClientes" | "integracao" | "produtosEstoque" | "testesApi" | "logsApi" | "dadosApi" | "tradutor" | "logsAtualizacao";

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
  tradutor: "tradutor",
  logsAtualizacao: "logs_atualizacao",
};

const dbTypeToSection: Record<string, string> = Object.fromEntries(
  Object.entries(adminSectionToDbType).map(([k, v]) => [v, k])
);

const allAdminSections = [
  "usuarios", "perfis", "acesso_publico", "painel_controle", "cadastro_cidades",
  "configurar_bi", "empresas_clientes", "integracao", "produtos_estoque", "testes_api", "logs_api", "dados_api", "tradutor", "logs_atualizacao",
];

type AdminPermissionsState = Record<string, AdminPermission>;

const defaultAdminPermissions = (): AdminPermissionsState => {
  const result: AdminPermissionsState = {};
  allAdminSections.forEach(section => {
    const key = dbTypeToSection[section] || section;
    result[key] = { ver: false, editar: false, criar: false, excluir: false, apenas_dev: false };
  });
  return result;
};

// LocalStorage cache helpers for resilience when DB is down
const CACHE_KEY = "auth_permissions_cache";
const savePermissionsCache = (data: { profile: Profile | null; roles: Role[]; pagePerms: Record<string, PagePermission>; adminPerms: AdminPermissionsState }) => {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ ...data, ts: Date.now() })); } catch {}
};
const loadPermissionsCache = (): { profile: Profile | null; roles: Role[]; pagePerms: Record<string, PagePermission>; adminPerms: AdminPermissionsState } | null => {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw);
    // Cache valid for 24 hours
    if (Date.now() - parsed.ts > 24 * 60 * 60 * 1000) return null;
    return parsed;
  } catch { return null; }
};
const clearPermissionsCache = () => { try { localStorage.removeItem(CACHE_KEY); } catch {} };

// Hook providing auth state, permissions, and session management
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

  // Single query with timeout wrapper to reduce connection time
  const queryWithTimeout = useCallback(async <T>(
    queryFn: () => Promise<{ data: T | null; error: any }>,
    timeoutMs: number = 8000
  ): Promise<{ data: T | null; error: any }> => {
    const timeout = new Promise<{ data: null; error: { message: string } }>((resolve) =>
      setTimeout(() => resolve({ data: null, error: { message: 'query_timeout' } }), timeoutMs)
    );
    return Promise.race([queryFn(), timeout]);
  }, []);

  const fetchProfile = useCallback(async (userId: string, retryCount = 0): Promise<Profile | null> => {
    try {
      const { data, error } = await queryWithTimeout(() =>
        supabase.from("profiles").select("*").eq("id", userId).maybeSingle(),
        5000
      );
      if (error) throw error;
      return data as Profile | null;
    } catch (error: any) {
      console.error("Error fetching profile:", error);
      if (retryCount < 2 && isRetryableError(error)) {
        await new Promise(r => setTimeout(r, 1500 * (retryCount + 1)));
        return fetchProfile(userId, retryCount + 1);
      }
      return null;
    }
  }, [queryWithTimeout]);

  const fetchUserRoles = useCallback(async (userId: string, retryCount = 0): Promise<Role[]> => {
    try {
      const { data, error } = await queryWithTimeout(() =>
        supabase.from("user_roles").select(`role_id, roles (id, nome, descricao)`).eq("user_id", userId),
        5000
      );
      if (error) throw error;
      return data?.map((ur: any) => ur.roles).filter(Boolean) as Role[] || [];
    } catch (error: any) {
      console.error("Error fetching user roles:", error);
      if (retryCount < 2 && isRetryableError(error)) {
        await new Promise(r => setTimeout(r, 1500 * (retryCount + 1)));
        return fetchUserRoles(userId, retryCount + 1);
      }
      return [];
    }
  }, [queryWithTimeout]);

  const fetchPagePermissions = useCallback(async (roleIds: string[], retryCount = 0): Promise<Record<string, PagePermission>> => {
    if (roleIds.length === 0) return {};
    try {
      const { data, error } = await queryWithTimeout(() =>
        supabase.from("page_permissions").select("*").in("role_id", roleIds),
        5000
      );
      if (error) throw error;
      const perms: Record<string, PagePermission> = {};
      data?.forEach((p) => {
        if (!perms[p.page_id]) {
          perms[p.page_id] = { visualizar: false, exportar: false, atualizar: false, idioma: false, apenas_dev: false };
        }
        perms[p.page_id].visualizar = perms[p.page_id].visualizar || p.visualizar;
        perms[p.page_id].exportar = perms[p.page_id].exportar || p.exportar;
        perms[p.page_id].atualizar = perms[p.page_id].atualizar || p.atualizar;
        perms[p.page_id].idioma = perms[p.page_id].idioma || (p as any).idioma;
        perms[p.page_id].apenas_dev = perms[p.page_id].apenas_dev || p.apenas_dev;
      });
      return perms;
    } catch (error: any) {
      console.error("Error fetching page permissions:", error);
      if (retryCount < 2 && isRetryableError(error)) {
        await new Promise(r => setTimeout(r, 1500 * (retryCount + 1)));
        return fetchPagePermissions(roleIds, retryCount + 1);
      }
      return {};
    }
  }, [queryWithTimeout]);

  const fetchAdminPermissions = useCallback(async (roleIds: string[], retryCount = 0): Promise<AdminPermissionsState> => {
    if (roleIds.length === 0) return defaultAdminPermissions();
    try {
      const { data, error } = await queryWithTimeout(() =>
        supabase.from("admin_permissions").select("*").in("role_id", roleIds),
        5000
      );
      if (error) throw error;
      const result = defaultAdminPermissions();
      data?.forEach((p) => {
        const sectionKey = dbTypeToSection[p.permission_type] || p.permission_type;
        if (result[sectionKey]) {
          result[sectionKey].ver = result[sectionKey].ver || p.ver;
          result[sectionKey].editar = result[sectionKey].editar || p.editar;
          result[sectionKey].criar = result[sectionKey].criar || p.criar;
          result[sectionKey].excluir = result[sectionKey].excluir || p.excluir;
          result[sectionKey].apenas_dev = result[sectionKey].apenas_dev || (p as any).apenas_dev;
        }
      });
      return result;
    } catch (error: any) {
      console.error("Error fetching admin permissions:", error);
      if (retryCount < 2 && isRetryableError(error)) {
        await new Promise(r => setTimeout(r, 1500 * (retryCount + 1)));
        return fetchAdminPermissions(roleIds, retryCount + 1);
      }
      return defaultAdminPermissions();
    }
  }, [queryWithTimeout]);

  const fetchPublicAccess = useCallback(async (): Promise<Record<string, { is_public: boolean; allow_export: boolean; allow_refresh: boolean }>> => {
    try {
      const { data, error } = await queryWithTimeout(() =>
        supabase.from("public_page_settings").select("*"),
        5000
      );
      if (error) throw error;
      const result: Record<string, { is_public: boolean; allow_export: boolean; allow_refresh: boolean }> = {};
      data?.forEach((p) => { result[p.page_id] = { is_public: p.is_public, allow_export: p.allow_export, allow_refresh: p.allow_refresh }; });
      return result;
    } catch (error: any) {
      console.error("Error fetching public access:", error);
      return {};
    }
  }, [queryWithTimeout]);

  const loadUserData = useCallback(async (userId: string) => {
    try {
      // SEQUENTIAL loading to minimize concurrent DB connections
      // Step 1: Profile (most critical)
      const profileData = await fetchProfile(userId);
      
      // If profile failed, try cache immediately
      if (!profileData) {
        console.warn("Profile fetch failed, trying local cache...");
        const cached = loadPermissionsCache();
        if (cached) {
          console.log("Using cached permissions (profile failed)");
          setProfile(cached.profile);
          setUserRoles(cached.roles);
          setPagePermissions(cached.pagePerms);
          setAdminPermissions(cached.adminPerms);
          return;
        }
      }
      
      setProfile(profileData);

      // Step 2: Roles (needed for permissions)
      const roles = await fetchUserRoles(userId);
      setUserRoles(roles);

      const roleIds = roles.map((r) => r.id);
      if (roleIds.length > 0) {
        // Step 3: Page permissions first
        const pagePerm = await fetchPagePermissions(roleIds);
        setPagePermissions(pagePerm);
        
        // Step 4: Admin permissions
        const adminPerm = await fetchAdminPermissions(roleIds);
        setAdminPermissions(adminPerm);
        
        // Save to cache for resilience
        savePermissionsCache({ profile: profileData, roles, pagePerms: pagePerm, adminPerms: adminPerm });
      } else {
        console.warn("No roles found for user, checking cache...");
        const cached = loadPermissionsCache();
        if (cached && cached.roles.length > 0) {
          setPagePermissions(cached.pagePerms);
          setAdminPermissions(cached.adminPerms);
        } else {
          setPagePermissions({});
          setAdminPermissions(defaultAdminPermissions());
        }
      }
    } catch (err) {
      console.error("Error loading user data, trying cache:", err);
      const cached = loadPermissionsCache();
      if (cached) {
        setProfile(cached.profile);
        setUserRoles(cached.roles);
        setPagePermissions(cached.pagePerms);
        setAdminPermissions(cached.adminPerms);
      }
    }
  }, [fetchProfile, fetchUserRoles, fetchPagePermissions, fetchAdminPermissions]);

  // Use ref to track if initial data load happened
  const initialLoadDoneRef = useRef(false);
  const loadUserDataRef = useRef(loadUserData);
  loadUserDataRef.current = loadUserData;
  // Track if public access has been fetched to avoid duplicate calls
  const publicAccessFetchedRef = useRef(false);

  useEffect(() => {
    // Safety timeout: if loading takes more than 12 seconds, force it to finish
    const loadingTimeout = setTimeout(() => {
      setLoading(prev => {
        if (prev) {
          console.warn("Auth loading timeout - forcing loading to false");
          // Try cache as last resort
          const cached = loadPermissionsCache();
          if (cached) {
            setProfile(cached.profile);
            setUserRoles(cached.roles);
            setPagePermissions(cached.pagePerms);
            setAdminPermissions(cached.adminPerms);
          }
          return false;
        }
        return prev;
      });
    }, 12000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);

        if (event === "TOKEN_REFRESHED") {
          return;
        }

        if (event === "SIGNED_OUT") {
          initialLoadDoneRef.current = false;
          publicAccessFetchedRef.current = false;
          setProfile(null);
          setUserRoles([]);
          setPagePermissions({});
          setAdminPermissions(defaultAdminPermissions());
          setLoading(false);
          return;
        }

        if ((event === "INITIAL_SESSION" || event === "SIGNED_IN") && session?.user) {
          if (!initialLoadDoneRef.current) {
            initialLoadDoneRef.current = true;
            setLoading(true);
            setTimeout(() => { 
              loadUserDataRef.current(session.user.id).finally(() => setLoading(false)); 
              // Fetch public access AFTER user data, with delay to not compete
              if (!publicAccessFetchedRef.current) {
                publicAccessFetchedRef.current = true;
                setTimeout(() => {
                  fetchPublicAccess().then(setPublicAccessState).catch(() => {});
                }, 2000);
              }
            }, 0);
          }
        } else if (event === "INITIAL_SESSION" && !session) {
          // No session - DON'T fetch public access eagerly, save DB connection
          // Only fetch when user navigates to a public page
          setLoading(false);
        }
      }
    );

    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user && !initialLoadDoneRef.current) {
        setSession(session);
        setUser(session.user);
        initialLoadDoneRef.current = true;
        loadUserDataRef.current(session.user.id).finally(() => setLoading(false));
        // Delayed public access fetch
        if (!publicAccessFetchedRef.current) {
          publicAccessFetchedRef.current = true;
          setTimeout(() => {
            fetchPublicAccess().then(setPublicAccessState).catch(() => {});
          }, 2000);
        }
      } else if (!session) {
        setLoading(false);
      }
    });

    return () => {
      clearTimeout(loadingTimeout);
      subscription.unsubscribe();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

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
    const signInPromise = supabase.auth.signInWithPassword({ email, password });
    const timeoutSignIn = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error("LOGIN_TIMEOUT")), 15000)
    );

    let data: any;
    let error: any;
    try {
      const result = await Promise.race([signInPromise, timeoutSignIn]);
      data = result.data;
      error = result.error;
    } catch (err: any) {
      if (err.message === "LOGIN_TIMEOUT") {
        return { success: false, message: "Servidor lento. Tente novamente em alguns segundos." };
      }
      return { success: false, message: "Erro de conexão. Tente novamente." };
    }

    if (error) {
      if (error.message.includes("Invalid login credentials")) return { success: false, message: "Email ou senha inválidos." };
      if (error.message.includes("Email not confirmed")) return { success: false, message: "Email não confirmado. Verifique sua caixa de entrada." };
      if (error.message.includes("Failed to fetch") || error.message.includes("timeout")) {
        return { success: false, message: "Servidor indisponível. Tente novamente em alguns segundos." };
      }
      return { success: false, message: error.message };
    }

    if (data.user) {
      try {
        const profilePromise = fetchProfile(data.user.id, 0);
        const timeoutPromise = new Promise<null>((_, reject) => 
          setTimeout(() => reject(new Error("timeout")), 5000)
        );
        const profileData = await Promise.race([profilePromise, timeoutPromise]);
        
        if (profileData && !profileData.ativo) {
          await supabase.auth.signOut();
          return { success: false, message: "Usuário inativo. Contate o administrador." };
        }
      } catch (err) {
        console.warn("Profile check timed out or failed, proceeding with login:", err);
      }
    }

    return { success: true, message: "Login realizado com sucesso!" };
  }, [fetchProfile]);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
    clearPermissionsCache();
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
  const canIdioma = useCallback((pageId: string) => pagePermissions[pageId]?.idioma ?? false, [pagePermissions]);
  const isPublicAccess = useCallback((pageId: string) => {
    // If public access hasn't been fetched yet, try to fetch it lazily
    if (Object.keys(publicAccess).length === 0 && !publicAccessFetchedRef.current) {
      publicAccessFetchedRef.current = true;
      fetchPublicAccess().then(setPublicAccessState).catch(() => {});
    }
    return publicAccess[pageId]?.is_public === true;
  }, [publicAccess, fetchPublicAccess]);
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

  const canViewAnyConfig = useCallback(() => {
    return Object.values(adminPermissions).some(p => p?.ver);
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
    canIdioma,
    isPublicAccess,
    isPublicExport,
    isPublicRefresh,
    canViewAdmin,
    canEditAdmin,
    canCreateAdmin,
    canDeleteAdmin,
    canViewAnyConfig,
    isAdminDevOnly: (section: AdminSectionType) => adminPermissions[section]?.apenas_dev ?? false,
    updatePublicAccess,
    refreshUserData: () => user && loadUserData(user.id),
  };
};
