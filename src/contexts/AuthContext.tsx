import React, { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { 
  User, 
  Profile, 
  validateLogin, 
  getProfileById, 
  getUserPermissions,
  PagePermission,
  mockUsers,
  mockProfiles,
  getVisibleUsers,
  getVisibleProfiles
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
  // Gerenciamento de usuários e perfis (para admin)
  users: User[];
  profiles: Profile[];
  addUser: (user: Omit<User, "id">) => void;
  updateUser: (id: string, data: Partial<User>) => void;
  deleteUser: (id: string) => void;
  addProfile: (profile: Omit<Profile, "id">) => void;
  updateProfile: (id: string, data: Partial<Profile>) => void;
  deleteProfile: (id: string) => void;
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

  const profile = user ? getProfileById(user.perfilId) : null;
  const isAuthenticated = !!user;
  const isDeveloper = user?.isDeveloper ?? false;

  const login = useCallback((email: string, senha: string) => {
    const validUser = validateLogin(email, senha);
    if (validUser) {
      setUser(validUser);
      localStorage.setItem("auth_user", JSON.stringify(validUser));
      return { success: true, message: "Login realizado com sucesso!" };
    }
    return { success: false, message: "Email ou senha inválidos." };
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("auth_user");
  }, []);

  const getPermission = useCallback((pageId: string): PagePermission | null => {
    if (!user) return null;
    const permissions = getUserPermissions(user.id);
    if (!permissions) return null;
    return permissions[pageId] || null;
  }, [user]);

  const canView = useCallback((pageId: string): boolean => {
    if (!user) return false;
    const perm = getPermission(pageId);
    return perm?.visualizar ?? false;
  }, [user, getPermission]);

  const canExport = useCallback((pageId: string): boolean => {
    if (!user) return false;
    const perm = getPermission(pageId);
    return perm?.exportar ?? false;
  }, [user, getPermission]);

  const canRefresh = useCallback((pageId: string): boolean => {
    if (!user) return false;
    const perm = getPermission(pageId);
    return perm?.atualizar ?? false;
  }, [user, getPermission]);

  const isDevOnly = useCallback((pageId: string): boolean => {
    const perm = getPermission(pageId);
    return perm?.apenasDev ?? false;
  }, [getPermission]);

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
  const visibleUsers = isDeveloper ? users : getVisibleUsers();
  const visibleProfiles = isDeveloper ? profiles : getVisibleProfiles();

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
        users: visibleUsers,
        profiles: visibleProfiles,
        addUser,
        updateUser,
        deleteUser,
        addProfile,
        updateProfile,
        deleteProfile,
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
