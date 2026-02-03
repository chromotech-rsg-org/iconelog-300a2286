// Sistema de autenticação mock com usuários, perfis e permissões

export interface PagePermission {
  visualizar: boolean;
  exportar: boolean;
  atualizar: boolean;
  apenasDev: boolean;
}

// Permissões granulares para admin (usuários, perfis, acesso público)
export interface AdminPermission {
  ver: boolean;
  editar: boolean;
  criar: boolean;
  excluir: boolean;
}

// Permissões para acesso público (apenas ver e editar)
export interface PublicAccessPermission {
  ver: boolean;
  editar: boolean;
}

export interface Profile {
  id: string;
  nome: string;
  permissoes: Record<string, PagePermission>;
  adminPermissoes: {
    usuarios: AdminPermission;
    perfis: AdminPermission;
    acessoPublico: PublicAccessPermission;
  };
}

export interface User {
  id: string;
  nome: string;
  email: string;
  senha: string; // Em produção seria hash
  perfilId: string;
  isDeveloper: boolean; // Oculto de todos
  ativo: boolean;
}

// Páginas do sistema (módulos de BI)
export const systemPages = [
  { id: "minutas", nome: "Minutas Expedidas x Baixadas", path: "/" },
  { id: "estoque", nome: "B-Side Estoque", path: "/estoque" },
  { id: "entregas", nome: "B-Side Entregas", path: "/entregas" },
  { id: "tracking", nome: "Tracking Consolidado", path: "/tracking" },
  { id: "estoque-consolidado", nome: "Estoque Consolidado", path: "/estoque-consolidado" },
  { id: "faturamento", nome: "Faturamento", path: "/faturamento" },
  { id: "analitico", nome: "Analítico", path: "/analitico" },
];

// Permissão padrão (sem acesso)
const noPermission: PagePermission = {
  visualizar: false,
  exportar: false,
  atualizar: false,
  apenasDev: false,
};

// Permissão completa
const fullPermission: PagePermission = {
  visualizar: true,
  exportar: true,
  atualizar: true,
  apenasDev: false,
};

// Admin permission completa
const fullAdminPermission: AdminPermission = {
  ver: true,
  editar: true,
  criar: true,
  excluir: true,
};

// Admin permission sem acesso
const noAdminPermission: AdminPermission = {
  ver: false,
  editar: false,
  criar: false,
  excluir: false,
};

// Public access permission completa
const fullPublicAccessPermission: PublicAccessPermission = {
  ver: true,
  editar: true,
};

// Public access permission sem acesso
const noPublicAccessPermission: PublicAccessPermission = {
  ver: false,
  editar: false,
};

// Criar permissões iniciais para todas as páginas
const createDefaultPermissions = (defaultPerm: PagePermission): Record<string, PagePermission> => {
  const perms: Record<string, PagePermission> = {};
  systemPages.forEach(page => {
    perms[page.id] = { ...defaultPerm };
  });
  return perms;
};

// Criar permissões admin padrão
const createDefaultAdminPermissions = (full: boolean) => ({
  usuarios: full ? { ...fullAdminPermission } : { ...noAdminPermission },
  perfis: full ? { ...fullAdminPermission } : { ...noAdminPermission },
  acessoPublico: full ? { ...fullPublicAccessPermission } : { ...noPublicAccessPermission },
});

// Perfis mock - apenas Desenvolvedor e Administrador
export const mockProfiles: Profile[] = [
  {
    id: "dev-profile",
    nome: "Desenvolvedor",
    permissoes: (() => {
      const perms = createDefaultPermissions(fullPermission);
      // Desenvolvedor tem acesso a tudo, incluindo features apenasDev
      Object.keys(perms).forEach(key => {
        perms[key] = { ...perms[key], apenasDev: true };
      });
      return perms;
    })(),
    adminPermissoes: createDefaultAdminPermissions(true),
  },
  {
    id: "admin-profile",
    nome: "Administrador",
    permissoes: createDefaultPermissions(fullPermission),
    adminPermissoes: createDefaultAdminPermissions(true),
  },
];

// Usuários mock - apenas Desenvolvedor e Administrador
export const mockUsers: User[] = [
  {
    id: "dev-user",
    nome: "Desenvolvedor",
    email: "dev@iconelog.com",
    senha: "dev123",
    perfilId: "dev-profile",
    isDeveloper: true,
    ativo: true,
  },
  {
    id: "admin-user",
    nome: "Administrador Sistema",
    email: "admin@iconelog.com",
    senha: "admin123",
    perfilId: "admin-profile",
    isDeveloper: false,
    ativo: true,
  },
];

// Helper para criar permissões padrão vazias (para novos perfis)
export const createEmptyPermissions = (): Record<string, PagePermission> => {
  return createDefaultPermissions(noPermission);
};

// Helper para criar permissões admin vazias (para novos perfis)
export const createEmptyAdminPermissions = () => ({
  usuarios: { ...noAdminPermission },
  perfis: { ...noAdminPermission },
  acessoPublico: { ...noPublicAccessPermission },
});

// Funções auxiliares
export const getUserById = (id: string): User | undefined => {
  return mockUsers.find(u => u.id === id);
};

export const getUserByEmail = (email: string): User | undefined => {
  return mockUsers.find(u => u.email.toLowerCase() === email.toLowerCase());
};

export const getProfileById = (id: string): Profile | undefined => {
  return mockProfiles.find(p => p.id === id);
};

export const validateLogin = (email: string, senha: string): User | null => {
  const user = getUserByEmail(email);
  if (user && user.senha === senha && user.ativo) {
    return user;
  }
  return null;
};

export const getUserPermissions = (userId: string): Record<string, PagePermission> | null => {
  const user = getUserById(userId);
  if (!user) return null;
  
  const profile = getProfileById(user.perfilId);
  if (!profile) return null;
  
  return profile.permissoes;
};

export const canUserAccessPage = (userId: string, pageId: string): boolean => {
  const permissions = getUserPermissions(userId);
  if (!permissions) return false;
  
  const pagePerms = permissions[pageId];
  if (!pagePerms) return false;
  
  return pagePerms.visualizar;
};

export const canUserExport = (userId: string, pageId: string): boolean => {
  const permissions = getUserPermissions(userId);
  if (!permissions) return false;
  
  const pagePerms = permissions[pageId];
  if (!pagePerms) return false;
  
  return pagePerms.exportar;
};

export const canUserRefresh = (userId: string, pageId: string): boolean => {
  const permissions = getUserPermissions(userId);
  if (!permissions) return false;
  
  const pagePerms = permissions[pageId];
  if (!pagePerms) return false;
  
  return pagePerms.atualizar;
};

// Retorna usuários visíveis (exclui desenvolvedores)
export const getVisibleUsers = (): User[] => {
  return mockUsers.filter(u => !u.isDeveloper);
};

// Retorna perfis visíveis (exclui perfil de desenvolvedor)
export const getVisibleProfiles = (): Profile[] => {
  return mockProfiles.filter(p => p.id !== "dev-profile");
};
