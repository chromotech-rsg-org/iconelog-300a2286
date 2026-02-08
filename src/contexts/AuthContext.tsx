import React, { createContext, useContext, ReactNode } from "react";
import { useSupabaseAuth, Profile, Role, PagePermission as SupabasePagePermission, AdminPermission, PublicAccessPermission } from "@/hooks/useSupabaseAuth";

// Re-export types for backwards compatibility
export type { Profile, Role, AdminPermission, PublicAccessPermission };

export interface PagePermission {
  visualizar: boolean;
  exportar: boolean;
  atualizar: boolean;
  apenasDev: boolean;
}

interface AuthContextType {
  user: any;
  profile: Profile | null;
  isAuthenticated: boolean;
  isDeveloper: boolean;
  loading: boolean;
  login: (email: string, senha: string) => Promise<{ success: boolean; message: string }>;
  logout: () => Promise<void>;
  signUp: (email: string, password: string, nome: string) => Promise<{ success: boolean; message: string; needsConfirmation?: boolean }>;
  getPermission: (pageId: string) => PagePermission | null;
  canView: (pageId: string) => boolean;
  canExport: (pageId: string) => boolean;
  canRefresh: (pageId: string) => boolean;
  isDevOnly: (pageId: string) => boolean;
  isPublicAccess: (pageId: string) => boolean;
  canViewAdmin: (section: "usuarios" | "perfis" | "acessoPublico" | "painelControle" | "cadastroCidades") => boolean;
  canEditAdmin: (section: "usuarios" | "perfis" | "acessoPublico" | "painelControle" | "cadastroCidades") => boolean;
  canCreateAdmin: (section: "usuarios" | "perfis" | "cadastroCidades") => boolean;
  canDeleteAdmin: (section: "usuarios" | "perfis" | "cadastroCidades") => boolean;
  publicAccess: Record<string, boolean>;
  setPublicAccess: (pageId: string, enabled: boolean) => Promise<void>;
  refreshUserData: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const {
    user,
    profile,
    pagePermissions,
    publicAccess,
    loading,
    isAuthenticated,
    isDeveloper,
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
    refreshUserData,
  } = useSupabaseAuth();

  const getPermission = (pageId: string): PagePermission | null => {
    const perm = pagePermissions[pageId];
    if (!perm) return null;
    return {
      visualizar: perm.visualizar,
      exportar: perm.exportar,
      atualizar: perm.atualizar,
      apenasDev: perm.apenas_dev,
    };
  };

  const login = async (email: string, senha: string) => {
    return signIn(email, senha);
  };

  const logout = async () => {
    await signOut();
  };

  const setPublicAccess = async (pageId: string, enabled: boolean) => {
    await updatePublicAccess(pageId, enabled);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        profile,
        isAuthenticated,
        isDeveloper,
        loading,
        login,
        logout,
        signUp,
        getPermission,
        canView,
        canExport,
        canRefresh,
        isDevOnly,
        isPublicAccess,
        canViewAdmin,
        canEditAdmin,
        canCreateAdmin,
        canDeleteAdmin,
        publicAccess,
        setPublicAccess,
        refreshUserData,
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
