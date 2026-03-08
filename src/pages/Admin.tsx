import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { useRolesManagement, RoleWithPermissions, PagePermission as RolePagePermission, AdminPermission as RoleAdminPermission } from "@/hooks/useRolesManagement";
import { useUsersManagement, UserWithRole } from "@/hooks/useUsersManagement";
import { systemPages } from "@/data/authData";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Globe, Loader2, CheckSquare } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationMenu } from "@/components/shared/NavigationMenu";
import { CityMappingCRUD } from "@/components/admin/CityMappingCRUD";
import { AdminSidebar, AdminSection } from "@/components/admin/AdminSidebar";
import { lazy, Suspense } from "react";

const ConfigurarBI = lazy(() => import("@/components/admin/ConfigurarBI"));
const ClientsCRUD = lazy(() => import("@/components/admin/ClientsCRUD"));
const IntegrationManager = lazy(() => import("@/components/admin/IntegrationManager"));
const ApiTester = lazy(() => import("@/components/admin/ApiTester"));
const ApiTestLogs = lazy(() => import("@/components/admin/ApiTestLogs"));
const StockProductsManager = lazy(() => import("@/components/admin/StockProductsManager"));
const ApiDataViewer = lazy(() => import("@/components/admin/ApiDataViewer"));
const HistoricalDataLoader = lazy(() => import("@/components/admin/HistoricalDataLoader"));
const TranslationsManager = lazy(() => import("@/components/admin/TranslationsManager"));

interface PagePermissionForm {
  page_id: string;
  visualizar: boolean;
  exportar: boolean;
  atualizar: boolean;
  idioma: boolean;
  apenas_dev: boolean;
}

interface AdminPermissionForm {
  ver: boolean;
  editar: boolean;
  criar: boolean;
  excluir: boolean;
  apenas_dev: boolean;
}

// All admin permission types in DB format
const ALL_ADMIN_TYPES = [
  { key: "usuarios", label: "Usuários", hasCrud: true },
  { key: "perfis", label: "Perfis", hasCrud: true },
  { key: "acesso_publico", label: "Acesso Público", hasCrud: false },
  { key: "painel_controle", label: "Painel de Controle", hasCrud: false },
  { key: "cadastro_cidades", label: "Cadastro de Regionais", hasCrud: true },
  { key: "configurar_bi", label: "Configurar BI", hasCrud: true },
  { key: "empresas_clientes", label: "Empresas / Clientes", hasCrud: true },
  { key: "integracao", label: "Integração", hasCrud: true },
  { key: "produtos_estoque", label: "Produtos & Kits", hasCrud: true },
  { key: "testes_api", label: "Testes de API", hasCrud: false },
  { key: "logs_api", label: "Logs", hasCrud: false },
  { key: "dados_api", label: "Dados das APIs", hasCrud: false },
  { key: "tradutor", label: "Tradutor / Idiomas", hasCrud: true },
];

const Admin = () => {
  const {
    publicAccess, setPublicAccess,
    canViewAdmin, canEditAdmin, canCreateAdmin, canDeleteAdmin,
    isDeveloper,
    loading: authLoading
  } = useAuth();

  const { getSystemLogo, getSystemName } = useBiSettingsContext();
  const systemLogo = getSystemLogo();
  const systemName = getSystemName();

  const { roles, loading: rolesLoading, createRole, updateRole, deleteRole } = useRolesManagement();
  const { users, loading: usersLoading, createUser, updateUser, deleteUser, fetchUsers } = useUsersManagement();

  const [searchParams, setSearchParams] = useSearchParams();
  const initialSection = (searchParams.get("tab") as AdminSection) || "usuarios";
  const [activeSection, setActiveSection] = useState<AdminSection>(initialSection);

  const handleSectionChange = (section: AdminSection) => {
    setActiveSection(section);
    setSearchParams({ tab: section }, { replace: true });
  };

  // User dialog state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [userForm, setUserForm] = useState({ nome: "", email: "", password: "", role_id: "", is_developer: false, ativo: true });

  // Profile dialog state
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [profileForm, setProfileForm] = useState<{
    nome: string;
    descricao: string;
    pagePermissions: Record<string, PagePermissionForm>;
    adminPermissions: Record<string, AdminPermissionForm>;
  }>({
    nome: "",
    descricao: "",
    pagePermissions: {},
    adminPermissions: {},
  });

  const initializePagePermissions = (): Record<string, PagePermissionForm> => {
    const perms: Record<string, PagePermissionForm> = {};
    systemPages.forEach(page => {
      perms[page.id] = { page_id: page.id, visualizar: false, exportar: false, atualizar: false, idioma: false, apenas_dev: false };
    });
    return perms;
  };

  const initializeAdminPermissions = (): Record<string, AdminPermissionForm> => {
    const perms: Record<string, AdminPermissionForm> = {};
    ALL_ADMIN_TYPES.forEach(t => {
      perms[t.key] = { ver: false, editar: false, criar: false, excluir: false, apenas_dev: false };
    });
    return perms;
  };

  // === USER HANDLERS ===
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserForm({ nome: "", email: "", password: "", role_id: "", is_developer: false, ativo: true });
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setUserForm({ nome: user.nome, email: user.email, password: "", role_id: user.role_id || "", is_developer: user.is_developer, ativo: user.ativo });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (userForm.is_developer && !isDeveloper) {
      toast.error("Apenas desenvolvedores podem criar/editar usuários desenvolvedores.");
      return;
    }
    if (editingUser) {
      // Only include role_id if it actually changed
      const updateData: { nome?: string; role_id?: string; is_developer?: boolean; ativo?: boolean } = { nome: userForm.nome, ativo: userForm.ativo };
      if (isDeveloper) updateData.is_developer = userForm.is_developer;
      
      const currentRoleId = editingUser.role_id || "";
      if (userForm.role_id !== currentRoleId) {
        updateData.role_id = userForm.role_id || undefined;
      }
      
      const profileSuccess = await updateUser(editingUser.id, updateData);
      if (!profileSuccess) {
        // Don't close modal on failure — user sees the error toast
        return;
      }

      // Update email/password via edge function if changed
      const authUpdates: Record<string, string> = {};
      if (userForm.email && userForm.email !== editingUser.email) authUpdates.email = userForm.email;
      if (userForm.password) authUpdates.password = userForm.password;

      if (Object.keys(authUpdates).length > 0) {
        try {
          const res = await supabase.functions.invoke("update-user-auth", {
            body: { user_id: editingUser.id, ...authUpdates },
          });
          if (res.error || res.data?.error) {
            toast.error("Erro ao atualizar credenciais: " + (res.data?.error || res.error?.message));
            return; // Don't close modal
          }
          if (authUpdates.email) toast.success("Email atualizado com sucesso!");
          if (authUpdates.password) toast.success("Senha atualizada com sucesso!");
          await fetchUsers();
        } catch (err: any) {
          toast.error("Erro ao atualizar credenciais: " + err.message);
          return; // Don't close modal
        }
      }
    } else {
      if (!userForm.email || !userForm.password || !userForm.nome) {
        toast.error("Nome, email e senha são obrigatórios"); return;
      }
      const created = await createUser(userForm.email, userForm.password, userForm.nome, userForm.role_id || undefined, isDeveloper ? userForm.is_developer : false);
      if (!created) return; // Don't close modal on failure
    }
    setIsUserDialogOpen(false);
  };

  const handleDeleteUser = async (user: UserWithRole) => {
    if (!confirm(`Tem certeza que deseja excluir permanentemente o usuário "${user.nome}"? Esta ação não pode ser desfeita.`)) return;
    await deleteUser(user.id);
  };

  // === PROFILE HANDLERS ===
  const handleOpenNewProfile = () => {
    setEditingRole(null);
    // Copy apenas_dev values from developer role so non-devs see the same rows as in editing
    const devRole = roles.find(r => r.id === "00000000-0000-0000-0000-000000000002");
    const pagePerms = initializePagePermissions();
    if (devRole) {
      Object.entries(devRole.pagePermissions).forEach(([pageId, perm]) => {
        if (pagePerms[pageId]) pagePerms[pageId].apenas_dev = perm.apenas_dev;
      });
    }
    const adminPerms = initializeAdminPermissions();
    if (devRole) {
      Object.entries(devRole.adminPermissions).forEach(([key, perm]) => {
        if (adminPerms[key]) adminPerms[key].apenas_dev = perm.apenas_dev;
      });
    }
    setProfileForm({
      nome: "", descricao: "",
      pagePermissions: pagePerms,
      adminPermissions: adminPerms,
    });
    setIsProfileDialogOpen(true);
  };

  const handleEditProfile = (role: RoleWithPermissions) => {
    setEditingRole(role);
    const pagePerms = initializePagePermissions();
    Object.entries(role.pagePermissions).forEach(([pageId, perm]) => {
      if (pagePerms[pageId]) {
        pagePerms[pageId] = { page_id: pageId, visualizar: perm.visualizar, exportar: perm.exportar, atualizar: perm.atualizar, idioma: perm.idioma ?? false, apenas_dev: perm.apenas_dev };
      }
    });

    const adminPerms = initializeAdminPermissions();
    Object.entries(role.adminPermissions).forEach(([key, perm]) => {
      if (adminPerms[key]) {
        adminPerms[key] = { ver: perm.ver, editar: perm.editar, criar: perm.criar, excluir: perm.excluir, apenas_dev: perm.apenas_dev };
      }
    });

    setProfileForm({ nome: role.nome, descricao: role.descricao || "", pagePermissions: pagePerms, adminPermissions: adminPerms });
    setIsProfileDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.nome.trim()) { toast.error("Nome do perfil é obrigatório"); return; }

    const pagePerms: Record<string, Omit<RolePagePermission, "id" | "role_id">> = {};
    Object.entries(profileForm.pagePermissions).forEach(([pageId, perm]) => {
      pagePerms[pageId] = { page_id: pageId, visualizar: perm.visualizar, exportar: perm.exportar, atualizar: perm.atualizar, idioma: perm.idioma, apenas_dev: perm.apenas_dev };
    });

    const adminPerms: Record<string, Omit<RoleAdminPermission, "id" | "role_id" | "permission_type">> = {};
    Object.entries(profileForm.adminPermissions).forEach(([key, perm]) => {
      adminPerms[key] = { ver: perm.ver, editar: perm.editar, criar: perm.criar, excluir: perm.excluir, apenas_dev: perm.apenas_dev };
    });

    if (editingRole) {
      await updateRole(editingRole.id, profileForm.nome, profileForm.descricao || null, pagePerms, adminPerms);
    } else {
      await createRole(profileForm.nome, profileForm.descricao || null, pagePerms, adminPerms);
    }
    setIsProfileDialogOpen(false);
  };

  const handleDeleteProfile = async (roleId: string) => { await deleteRole(roleId); };

  const handleTogglePagePermission = (pageId: string, key: keyof PagePermissionForm) => {
    if (key === "page_id") return;
    setProfileForm(prev => ({
      ...prev,
      pagePermissions: { ...prev.pagePermissions, [pageId]: { ...prev.pagePermissions[pageId], [key]: !prev.pagePermissions[pageId]?.[key] } }
    }));
  };

  const handleToggleAdminPermission = (section: string, key: keyof AdminPermissionForm) => {
    setProfileForm(prev => ({
      ...prev,
      adminPermissions: { ...prev.adminPermissions, [section]: { ...prev.adminPermissions[section], [key]: !prev.adminPermissions[section][key] } }
    }));
  };

  // Bulk toggle: all page permissions for a specific column
  const handleToggleAllPageColumn = (key: "visualizar" | "exportar" | "atualizar" | "apenas_dev") => {
    setProfileForm(prev => {
      const visiblePages = systemPages.filter(p => isDeveloper || prev.pagePermissions[p.id]?.apenas_dev);
      const allChecked = visiblePages.every(p => prev.pagePermissions[p.id]?.[key]);
      const newVal = !allChecked;
      const updated = { ...prev.pagePermissions };
      visiblePages.forEach(p => { updated[p.id] = { ...updated[p.id], [key]: newVal }; });
      return { ...prev, pagePermissions: updated };
    });
  };

  // Bulk toggle: all page permissions for a single row
  const handleTogglePageRow = (pageId: string) => {
    setProfileForm(prev => {
      const perm = prev.pagePermissions[pageId];
      const keys: (keyof PagePermissionForm)[] = ["visualizar", "exportar", "atualizar", "idioma"];
      const allChecked = keys.every(k => perm?.[k]);
      const newVal = !allChecked;
      const updated = { ...prev.pagePermissions, [pageId]: { ...perm, visualizar: newVal, exportar: newVal, atualizar: newVal, idioma: newVal } };
      return { ...prev, pagePermissions: updated };
    });
  };

  // Bulk toggle: all page permissions (all rows, all columns)
  const handleToggleAllPages = () => {
    setProfileForm(prev => {
      const visiblePages = systemPages.filter(p => isDeveloper || prev.pagePermissions[p.id]?.apenas_dev);
      const keys: (keyof PagePermissionForm)[] = ["visualizar", "exportar", "atualizar", "idioma"];
      const allChecked = visiblePages.every(p => keys.every(k => prev.pagePermissions[p.id]?.[k]));
      const newVal = !allChecked;
      const updated = { ...prev.pagePermissions };
      visiblePages.forEach(p => { keys.forEach(k => { updated[p.id] = { ...updated[p.id], [k]: newVal }; }); });
      return { ...prev, pagePermissions: updated };
    });
  };

  // Bulk toggle: all admin permissions for a specific column
  const handleToggleAllAdminColumn = (key: keyof AdminPermissionForm) => {
    setProfileForm(prev => {
      const visibleTypes = ALL_ADMIN_TYPES.filter(t => isDeveloper || prev.adminPermissions[t.key]?.apenas_dev);
      const applicable = visibleTypes.filter(t => {
        if (key === "ver" || key === "apenas_dev") return true;
        if (key === "editar") return t.hasCrud || t.key === "acesso_publico";
        return t.hasCrud;
      });
      const allChecked = applicable.every(t => prev.adminPermissions[t.key]?.[key]);
      const newVal = !allChecked;
      const updated = { ...prev.adminPermissions };
      applicable.forEach(t => { updated[t.key] = { ...updated[t.key], [key]: newVal }; });
      return { ...prev, adminPermissions: updated };
    });
  };

  // Bulk toggle: all admin permissions for a single row
  const handleToggleAdminRow = (section: string) => {
    setProfileForm(prev => {
      const perm = prev.adminPermissions[section];
      const type = ALL_ADMIN_TYPES.find(t => t.key === section);
      const keys: (keyof AdminPermissionForm)[] = ["ver"];
      if (type?.hasCrud || section === "acesso_publico") keys.push("editar");
      if (type?.hasCrud) keys.push("criar", "excluir");
      const allChecked = keys.every(k => perm?.[k]);
      const newVal = !allChecked;
      const updated = { ...prev.adminPermissions, [section]: { ...perm } };
      keys.forEach(k => { updated[section][k] = newVal; });
      return { ...prev, adminPermissions: updated };
    });
  };

  // Bulk toggle: all admin permissions (all rows, all columns)
  const handleToggleAllAdmin = () => {
    setProfileForm(prev => {
      const visibleTypes = ALL_ADMIN_TYPES.filter(t => isDeveloper || prev.adminPermissions[t.key]?.apenas_dev);
      const allChecked = visibleTypes.every(t => {
        const perm = prev.adminPermissions[t.key];
        const keys: (keyof AdminPermissionForm)[] = ["ver"];
        if (t.hasCrud || t.key === "acesso_publico") keys.push("editar");
        if (t.hasCrud) keys.push("criar", "excluir");
        return keys.every(k => perm?.[k]);
      });
      const newVal = !allChecked;
      const updated = { ...prev.adminPermissions };
      visibleTypes.forEach(t => {
        updated[t.key] = { ...updated[t.key], ver: newVal };
        if (t.hasCrud || t.key === "acesso_publico") updated[t.key].editar = newVal;
        if (t.hasCrud) { updated[t.key].criar = newVal; updated[t.key].excluir = newVal; }
      });
      return { ...prev, adminPermissions: updated };
    });
  };

  const handleTogglePublicAccess = async (pageId: string, field: string = "is_public") => { 
    const current = publicAccess[pageId]?.[field as keyof typeof publicAccess[string]] ?? false;
    await setPublicAccess(pageId, field, !current); 
  };

  const countEnabledPermissions = (role: RoleWithPermissions) => {
    let count = 0;
    Object.values(role.pagePermissions).forEach(perm => { if (perm.visualizar) count++; });
    return count;
  };

  const isLoading = authLoading || rolesLoading || usersLoading;

  if (isLoading) {
    return (
      <div className="min-h-screen bg-dashboard-dark">
        <DocumentHead pageId="admin" />
        <header className="bg-dashboard-card border-b border-dashboard-border p-4 flex justify-between items-center sticky top-0 z-50">
          <div className="flex items-center gap-3">
            <img src={systemLogo} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-dashboard-accent" />
            <span className="text-foreground font-semibold">Painel de Administração</span>
          </div>
          <NavigationMenu />
        </header>
        <div className="flex items-center justify-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
        </div>
      </div>
    );
  }

  const renderContent = () => {
    switch (activeSection) {
      case "usuarios":
        return canViewAdmin("usuarios") ? renderUsuarios() : null;
      case "perfis":
        return canViewAdmin("perfis") ? renderPerfis() : null;
      case "publico":
        return canViewAdmin("acessoPublico") ? renderPublico() : null;
      case "regionais":
        return canViewAdmin("cadastroCidades") ? (
          <CityMappingCRUD
            canEdit={canEditAdmin("cadastroCidades")}
            canCreate={canCreateAdmin("cadastroCidades")}
            canDelete={canDeleteAdmin("cadastroCidades")}
          />
        ) : null;
      case "configurar_bi":
        return canViewAdmin("configurarBi") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><ConfigurarBI /></Suspense> : null;
      case "empresas_clientes":
        return canViewAdmin("empresasClientes") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><ClientsCRUD /></Suspense> : null;
      case "integracao":
        return canViewAdmin("integracao") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><IntegrationManager /></Suspense> : null;
      case "testes_api":
        return canViewAdmin("testesApi") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><ApiTester /></Suspense> : null;
      case "logs_api":
        return canViewAdmin("logsApi") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><ApiTestLogs /></Suspense> : null;
      case "produtos_estoque":
        return canViewAdmin("produtosEstoque") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><StockProductsManager /></Suspense> : null;
      case "dados_api":
        return canViewAdmin("dadosApi") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><ApiDataViewer /></Suspense> : null;
      case "carga_historica":
        return canViewAdmin("configurarBi") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><HistoricalDataLoader /></Suspense> : null;
      case "traducoes":
        return canViewAdmin("tradutor") ? <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin text-dashboard-accent mx-auto mt-8" />}><TranslationsManager /></Suspense> : null;
      default:
        return null;
    }
  };

  const renderUsuarios = () => (
    <>
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-foreground">Gerenciar Usuários</CardTitle>
          {canCreateAdmin("usuarios") && (
            <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={handleOpenNewUser}>
              <Plus className="h-4 w-4 mr-1" /> Novo Usuário
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border">
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Email</TableHead>
                <TableHead className="text-muted-foreground">Perfil</TableHead>
                <TableHead className="text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id} className="border-dashboard-border">
                  <TableCell className="text-foreground">{user.nome}</TableCell>
                  <TableCell className="text-muted-foreground">{user.email}</TableCell>
                  <TableCell>
                    {user.role_nome ? (
                      <Badge className="bg-dashboard-accent/20 text-dashboard-accent border-dashboard-accent/30">{user.role_nome}</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-muted-foreground">Sem perfil</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-center">
                    <Badge variant={user.ativo ? "default" : "secondary"} className={user.ativo ? "bg-green-500/20 text-green-400" : ""}>
                      {user.ativo ? "Ativo" : "Inativo"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canEditAdmin("usuarios") && <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}><Pencil className="h-4 w-4" /></Button>}
                    {canDeleteAdmin("usuarios") && user.ativo && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user)}><Trash2 className="h-4 w-4" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
              {users.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum usuário cadastrado</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border">
          <DialogHeader><DialogTitle className="text-foreground">{editingUser ? "Editar" : "Novo"} Usuário</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div><Label className="text-foreground">Nome</Label>
              <Input value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" /></div>
            <div><Label className="text-foreground">Email</Label>
              <Input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" /></div>
            <div><Label className="text-foreground">{editingUser ? "Nova Senha (deixe vazio para manter)" : "Senha"}</Label>
              <Input type="password" value={userForm.password} onChange={e => setUserForm({...userForm, password: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder={editingUser ? "Deixe vazio para não alterar" : "Mínimo 6 caracteres"} /></div>
            <div><Label className="text-foreground">Perfil</Label>
              <Select value={userForm.role_id} onValueChange={v => setUserForm({...userForm, role_id: v})}>
                <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground"><SelectValue placeholder="Selecione um perfil" /></SelectTrigger>
                <SelectContent className="bg-dashboard-card border-dashboard-border">
                  {roles.filter(role => isDeveloper || role.id !== "00000000-0000-0000-0000-000000000002").map(role => <SelectItem key={role.id} value={role.id}>{role.nome}</SelectItem>)}
                </SelectContent>
              </Select></div>
            {isDeveloper && !editingUser && (
              <div className="flex items-center gap-3 p-3 rounded-md border border-dashboard-border bg-dashboard-dark">
                <Switch checked={userForm.is_developer ?? false} onCheckedChange={v => setUserForm({...userForm, is_developer: v})} />
                <div>
                  <Label className="text-foreground">Usuário Desenvolvedor</Label>
                  <p className="text-xs text-muted-foreground">Apenas desenvolvedores podem criar outros desenvolvedores</p>
                </div>
              </div>
            )}
            {isDeveloper && editingUser && (
              <div className="flex items-center gap-3 p-3 rounded-md border border-dashboard-border bg-dashboard-dark">
                <Switch checked={userForm.is_developer ?? false} onCheckedChange={v => setUserForm({...userForm, is_developer: v})} />
                <div>
                  <Label className="text-foreground">Usuário Desenvolvedor</Label>
                  <p className="text-xs text-muted-foreground">Apenas desenvolvedores podem marcar esta opção</p>
                </div>
              </div>
            )}
            {editingUser && (
              <div className="flex items-center gap-3 p-3 rounded-md border border-dashboard-border bg-dashboard-dark">
                <Switch checked={userForm.ativo} onCheckedChange={v => setUserForm({...userForm, ativo: v})} />
                <div>
                  <Label className="text-foreground">Usuário Ativo</Label>
                  <p className="text-xs text-muted-foreground">Desative para bloquear o acesso do usuário ao sistema</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} className="border-dashboard-border">Cancelar</Button>
            <Button onClick={handleSaveUser} className="bg-dashboard-accent text-dashboard-dark">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  const renderPerfis = () => (
    <>
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-base text-foreground">Gerenciar Perfis</CardTitle>
          {canCreateAdmin("perfis") && (
            <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={handleOpenNewProfile}>
              <Plus className="h-4 w-4 mr-1" /> Novo Perfil
            </Button>
          )}
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border">
                <TableHead className="text-muted-foreground">Nome do Perfil</TableHead>
                <TableHead className="text-muted-foreground text-center">Páginas Liberadas</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles
                .filter(role => isDeveloper || role.id !== "00000000-0000-0000-0000-000000000002")
                .map(role => (
                <TableRow key={role.id} className="border-dashboard-border">
                  <TableCell className="text-foreground font-medium">{role.nome}</TableCell>
                  <TableCell className="text-center">
                    <Badge variant="secondary" className="bg-dashboard-accent/20 text-dashboard-accent">{countEnabledPermissions(role)} páginas</Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    {canEditAdmin("perfis") && <Button variant="ghost" size="icon" onClick={() => handleEditProfile(role)}><Pencil className="h-4 w-4" /></Button>}
                    {canDeleteAdmin("perfis") && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProfile(role.id)}><Trash2 className="h-4 w-4" /></Button>}
                  </TableCell>
                </TableRow>
              ))}
              {roles.filter(role => isDeveloper || role.id !== "00000000-0000-0000-0000-000000000002").length === 0 && <TableRow><TableCell colSpan={3} className="text-center text-muted-foreground py-8">Nenhum perfil cadastrado</TableCell></TableRow>}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border max-w-5xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle className="text-foreground">{editingRole ? "Editar" : "Novo"} Perfil</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-foreground">Nome do Perfil</Label>
                <Input value={profileForm.nome} onChange={e => setProfileForm({...profileForm, nome: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Ex: Gerente, Operador..." /></div>
              <div><Label className="text-foreground">Descrição</Label>
                <Input value={profileForm.descricao} onChange={e => setProfileForm({...profileForm, descricao: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Descrição do perfil..." /></div>
            </div>

            {/* Page Permissions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground block">Permissões de Módulos</Label>
                <Button variant="outline" size="sm" className="border-dashboard-border text-xs h-7 gap-1" onClick={handleToggleAllPages}>
                  <CheckSquare className="h-3 w-3" /> Todos
                </Button>
              </div>
              <div className="border border-dashboard-border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="border-dashboard-border">
                      <TableHead className="text-muted-foreground min-w-[200px]">Módulo</TableHead>
                      <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllPageColumn("visualizar")}>Visualizar</TableHead>
                      <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllPageColumn("exportar")}>Exportar</TableHead>
                      <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllPageColumn("atualizar")}>Atualizar</TableHead>
                      {isDeveloper && editingRole?.id === "00000000-0000-0000-0000-000000000002" && <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllPageColumn("apenas_dev")}>Todos</TableHead>}
                      <TableHead className="text-muted-foreground text-center w-[50px]">∀</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {systemPages.map(page => {
                      const perm = profileForm.pagePermissions[page.id];
                      const isDevProfile = editingRole?.id === "00000000-0000-0000-0000-000000000002";
                      const isCreating = !editingRole;
                      if (!isDeveloper && !perm?.apenas_dev) return null;
                      return (
                        <TableRow key={page.id} className="border-dashboard-border">
                          <TableCell className="text-foreground text-sm">{page.nome}</TableCell>
                          <TableCell className="text-center"><Switch checked={perm?.visualizar ?? false} onCheckedChange={() => handleTogglePagePermission(page.id, "visualizar")} /></TableCell>
                          <TableCell className="text-center"><Switch checked={perm?.exportar ?? false} onCheckedChange={() => handleTogglePagePermission(page.id, "exportar")} /></TableCell>
                          <TableCell className="text-center"><Switch checked={perm?.atualizar ?? false} onCheckedChange={() => handleTogglePagePermission(page.id, "atualizar")} /></TableCell>
                          {isDeveloper && editingRole?.id === "00000000-0000-0000-0000-000000000002" && <TableCell className="text-center"><Switch checked={perm?.apenas_dev ?? false} onCheckedChange={() => handleTogglePagePermission(page.id, "apenas_dev")} /></TableCell>}
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleTogglePageRow(page.id)}>
                              <CheckSquare className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>

            {/* Admin Permissions */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <Label className="text-foreground block">Permissões de Administração</Label>
                <Button variant="outline" size="sm" className="border-dashboard-border text-xs h-7 gap-1" onClick={handleToggleAllAdmin}>
                  <CheckSquare className="h-3 w-3" /> Todos
                </Button>
              </div>
              <div className="border border-dashboard-border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow className="border-dashboard-border">
                      <TableHead className="text-muted-foreground min-w-[150px]">Seção</TableHead>
                      <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllAdminColumn("ver")}>Ver</TableHead>
                      <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllAdminColumn("editar")}>Editar</TableHead>
                      <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllAdminColumn("criar")}>Criar</TableHead>
                      <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllAdminColumn("excluir")}>Excluir</TableHead>
                      {isDeveloper && editingRole?.id === "00000000-0000-0000-0000-000000000002" && <TableHead className="text-muted-foreground text-center cursor-pointer hover:text-foreground" onClick={() => handleToggleAllAdminColumn("apenas_dev")}>Todos</TableHead>}
                      <TableHead className="text-muted-foreground text-center w-[50px]">∀</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {ALL_ADMIN_TYPES.map(type => {
                      const perm = profileForm.adminPermissions[type.key];
                      const isDevProfile = editingRole?.id === "00000000-0000-0000-0000-000000000002";
                      const isCreating = !editingRole;
                      if (!isDeveloper && !perm?.apenas_dev) return null;
                      return (
                        <TableRow key={type.key} className="border-dashboard-border">
                          <TableCell className="text-foreground text-sm">{type.label}</TableCell>
                          <TableCell className="text-center"><Switch checked={perm?.ver ?? false} onCheckedChange={() => handleToggleAdminPermission(type.key, "ver")} /></TableCell>
                          <TableCell className="text-center">
                            {type.hasCrud || type.key === "acesso_publico" ? <Switch checked={perm?.editar ?? false} onCheckedChange={() => handleToggleAdminPermission(type.key, "editar")} /> : <span className="text-muted-foreground text-xs">-</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {type.hasCrud ? <Switch checked={perm?.criar ?? false} onCheckedChange={() => handleToggleAdminPermission(type.key, "criar")} /> : <span className="text-muted-foreground text-xs">-</span>}
                          </TableCell>
                          <TableCell className="text-center">
                            {type.hasCrud ? <Switch checked={perm?.excluir ?? false} onCheckedChange={() => handleToggleAdminPermission(type.key, "excluir")} /> : <span className="text-muted-foreground text-xs">-</span>}
                          </TableCell>
                          {isDeveloper && editingRole?.id === "00000000-0000-0000-0000-000000000002" && <TableCell className="text-center"><Switch checked={perm?.apenas_dev ?? false} onCheckedChange={() => handleToggleAdminPermission(type.key, "apenas_dev")} /></TableCell>}
                          <TableCell className="text-center">
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-muted-foreground hover:text-foreground" onClick={() => handleToggleAdminRow(type.key)}>
                              <CheckSquare className="h-3.5 w-3.5" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)} className="border-dashboard-border">Cancelar</Button>
            <Button onClick={handleSaveProfile} className="bg-dashboard-accent text-dashboard-dark">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );

  const renderPublico = () => (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader>
        <CardTitle className="text-base text-foreground">Configurar Acesso Público</CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Páginas com acesso público ficam visíveis para visitantes não logados. Você também pode liberar exportação e atualização para visitantes.
        </p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-dashboard-border">
              <TableHead className="text-muted-foreground">Página</TableHead>
              <TableHead className="text-muted-foreground text-center">Acesso Público</TableHead>
              <TableHead className="text-muted-foreground text-center">Exportar</TableHead>
              <TableHead className="text-muted-foreground text-center">Atualizar</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {systemPages.map(page => (
              <TableRow key={page.id} className="border-dashboard-border">
                <TableCell className="text-foreground">{page.nome}</TableCell>
                <TableCell className="text-center">
                  <Switch checked={publicAccess[page.id]?.is_public ?? false} onCheckedChange={() => handleTogglePublicAccess(page.id, "is_public")} disabled={!canEditAdmin("acessoPublico")} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={publicAccess[page.id]?.allow_export ?? false} onCheckedChange={() => handleTogglePublicAccess(page.id, "allow_export")} disabled={!canEditAdmin("acessoPublico") || !(publicAccess[page.id]?.is_public)} />
                </TableCell>
                <TableCell className="text-center">
                  <Switch checked={publicAccess[page.id]?.allow_refresh ?? false} onCheckedChange={() => handleTogglePublicAccess(page.id, "allow_refresh")} disabled={!canEditAdmin("acessoPublico") || !(publicAccess[page.id]?.is_public)} />
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );

  return (
    <div className="h-screen flex flex-col bg-dashboard-dark">
      <DocumentHead pageId="admin" />

      {/* Header */}
      <header className="bg-dashboard-card border-b border-dashboard-border p-3 md:p-4 flex justify-between items-center shrink-0 z-50">
        <div className="flex items-center gap-2 md:gap-3 min-w-0">
          <img src={systemLogo} alt="Logo" className="h-8 w-8 md:h-10 md:w-10 rounded-lg object-cover border border-dashboard-accent shrink-0" />
          <span className="text-foreground font-semibold text-sm md:text-base truncate">Painel de Administração</span>
        </div>
        <NavigationMenu />
      </header>

      {/* Layout with sidebar */}
      <div className="flex flex-col md:flex-row flex-1 min-h-0">
        <AdminSidebar activeSection={activeSection} onSectionChange={handleSectionChange} />
        <main className="flex-1 p-3 md:p-6 overflow-y-auto">
          <div className="mb-4 md:mb-6">
            <h1 className="text-lg md:text-xl font-bold text-foreground">{systemName}</h1>
            <p className="text-xs md:text-sm text-muted-foreground">Gerencie usuários, perfis, acessos e configurações</p>
          </div>
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default Admin;
