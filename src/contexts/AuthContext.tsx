import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { 
  User, 
  Profile, 
  PagePermission,
  AdminPermission,
  PublicAccessPermission,
  mockUsers,
  mockProfiles,
  getVisibleUsers,
  getVisibleProfiles,
  createEmptyAdminPermissions
} from "@/data/authData";

interface AuthContextType {
  user: User | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isDeveloper: boolean;
  login: (email: string, senha: string) => { success: boolean; message: string };
  logout: () => void;
  getPermission: (pageId: string) => PagePermission | null;
  canView: (pageId: string) => boolean;
  canExport: (pageId: string) => boolean;
  canRefresh: (pageId: string) => boolean;
  isDevOnly: (pageId: string) => boolean;
  isPublicAccess: (pageId: string) => boolean;
  // Permissões admin granulares
  getAdminPermission: (section: "usuarios" | "perfis") => AdminPermission | null;
  getPublicAccessPermission: () => PublicAccessPermission | null;
  canViewAdmin: (section: "usuarios" | "perfis" | "acessoPublico") => boolean;
  canEditAdmin: (section: "usuarios" | "perfis" | "acessoPublico") => boolean;
  canCreateAdmin: (section: "usuarios" | "perfis") => boolean;
  canDeleteAdmin: (section: "usuarios" | "perfis") => boolean;
  // Gerenciamento de usuários e perfis (para admin)
  users: User[];
  profiles: Profile[];
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addProfile: (profile: Omit<Profile, "id">) => void;
  updateProfile: (id: string, data: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
  // Acesso público global (separado dos perfis)
  publicAccess: Record<string, boolean>;
  setPublicAccess: (pageId: string, enabled: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    // Recuperar usuário do localStorage
    const saved = localStorage.getItem("auth_user");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return null;
      }
    }
    return null;
  });

  const [users, setUsers] = useState<User[]>(mockUsers);
  const [profiles, setProfiles] = useState<Profile[]>(mockProfiles);
  
  // Estado global de acesso público (separado dos perfis)
  const [publicAccess, setPublicAccessState] = useState<Record<string, boolean>>(() => {
    const saved = localStorage.getItem("public_access");
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch {
        return {};
      }
    }
    return {};
  });

  // Calcular profile a partir do state interno (não do mock estático)
  const profile = user ? profiles.find(p => p.id === user.perfilId) : null;
  const isAuthenticated = !!user;
  const isDeveloper = user?.isDeveloper ?? false;

  const login = useCallback((email: string, senha: string) => {
    // Buscar usuário do state interno
    const foundUser = users.find(u => u.email.toLowerCase() === email.toLowerCase());
    if (foundUser && foundUser.senha === senha && foundUser.ativo) {
      setUser(foundUser);
      localStorage.setItem("auth_user", JSON.stringify(foundUser));
      return { success: true, message: "Login realizado com sucesso!" };
    }
    return { success: false, message: "Email ou senha inválidos." };
  }, [users]);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
  }, []);

  // Buscar permissões do state interno de profiles
  const getPermission = useCallback((pageId: string): PagePermission | null => {
    if (!user) return null;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile) return null;
    return userProfile.permissoes[pageId] || null;
  }, [user, profiles]);

  const canView = useCallback((pageId: string): boolean => {
    if (!user) return false;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile) return false;
    const perm = userProfile.permissoes[pageId];
    return perm?.visualizar ?? false;
  }, [user, profiles]);

  const canExport = useCallback((pageId: string): boolean => {
    if (!user) return false;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile) return false;
    const perm = userProfile.permissoes[pageId];
    return perm?.exportar ?? false;
  }, [user, profiles]);

  const canRefresh = useCallback((pageId: string): boolean => {
    if (!user) return false;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile) return false;
    const perm = userProfile.permissoes[pageId];
    return perm?.atualizar ?? false;
  }, [user, profiles]);

  const isDevOnly = useCallback((pageId: string): boolean => {
    if (!user) return false;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile) return false;
    const perm = userProfile.permissoes[pageId];
    return perm?.apenasDev ?? false;
  }, [user, profiles]);

  // Verificar se uma página tem acesso público (usando estado global)
  const isPublicAccess = useCallback((pageId: string): boolean => {
    return publicAccess[pageId] === true;
  }, [publicAccess]);

  // === PERMISSÕES ADMIN GRANULARES ===
  const getAdminPermission = useCallback((section: "usuarios" | "perfis"): AdminPermission | null => {
    if (!user) return null;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile) return null;
    return userProfile.adminPermissoes?.[section] || null;
  }, [user, profiles]);

  const getPublicAccessPermission = useCallback((): PublicAccessPermission | null => {
    if (!user) return null;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile) return null;
    return userProfile.adminPermissoes?.acessoPublico || null;
  }, [user, profiles]);

  const canViewAdmin = useCallback((section: "usuarios" | "perfis" | "acessoPublico"): boolean => {
    if (!user) return false;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile || !userProfile.adminPermissoes) return false;
    return userProfile.adminPermissoes[section]?.ver ?? false;
  }, [user, profiles]);

  const canEditAdmin = useCallback((section: "usuarios" | "perfis" | "acessoPublico"): boolean => {
    if (!user) return false;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile || !userProfile.adminPermissoes) return false;
    return userProfile.adminPermissoes[section]?.editar ?? false;
  }, [user, profiles]);

  const canCreateAdmin = useCallback((section: "usuarios" | "perfis"): boolean => {
    if (!user) return false;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile || !userProfile.adminPermissoes) return false;
    const perm = userProfile.adminPermissoes[section] as AdminPermission;
    return perm?.criar ?? false;
  }, [user, profiles]);

  const canDeleteAdmin = useCallback((section: "usuarios" | "perfis"): boolean => {
    if (!user) return false;
    const userProfile = profiles.find(p => p.id === user.perfilId);
    if (!userProfile || !userProfile.adminPermissoes) return false;
    const perm = userProfile.adminPermissoes[section] as AdminPermission;
    return perm?.excluir ?? false;
  }, [user, profiles]);

  // Atualizar acesso público de uma página
  const setPublicAccess = useCallback((pageId: string, enabled: boolean) => {
    setPublicAccessState(prev => {
      const newState = { ...prev, [pageId]: enabled };
      localStorage.setItem("public_access", JSON.stringify(newState));
      return newState;
    });
  }, []);

  // Gerenciamento de usuários
  const addUser = useCallback((userData: Omit<User, "id">) => {
    const newUser: User = {
      ...userData,
      id: `user-${Date.now()}`,
    };
    setUsers(prev => [...prev, newUser]);
  }, []);

  const updateUser = useCallback((id: string, data: Partial<User>) => {
    setUsers(prev => prev.map(u => u.id === id ? { ...u, ...data } : u));
  }, []);

  const deleteUser = useCallback((id: string) => {
    setUsers(prev => prev.filter(u => u.id !== id));
  }, []);

  // Gerenciamento de perfis
  const addProfile = useCallback((profileData: Omit<Profile, "id">) => {
    const newProfile: Profile = {
      ...profileData,
      id: `profile-${Date.now()}`,
    };
    setProfiles(prev => [...prev, newProfile]);
  }, []);

  const updateProfile = useCallback((id: string, data: Partial<Profile>) => {
    setProfiles(prev => prev.map(p => p.id === id ? { ...p, ...data } : p));
  }, []);

  const deleteProfile = useCallback((id: string) => {
    setProfiles(prev => prev.filter(p => p.id !== id));
  }, []);

  // Filtrar usuários e perfis visíveis (ocultar desenvolvedor)
  const visibleUsers = isDeveloper ? users : users.filter(u => !u.isDeveloper);
  const visibleProfiles = isDeveloper ? profiles : profiles.filter(p => p.id !== "dev-profile");

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isDeveloper,
        login,
        logout,
        getPermission,
        canView,
        canExport,
        canRefresh,
        isDevOnly,
        isPublicAccess,
        getAdminPermission,
        getPublicAccessPermission,
        canViewAdmin,
        canEditAdmin,
        canCreateAdmin,
        canDeleteAdmin,
        users: visibleUsers,
        profiles: visibleProfiles,
        addUser,
        updateUser,
        deleteUser,
        addProfile,
        updateProfile,
        deleteProfile,
        publicAccess,
        setPublicAccess,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
