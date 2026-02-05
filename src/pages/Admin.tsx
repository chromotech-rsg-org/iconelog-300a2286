import { useState, useEffect } from "react";
 import { DocumentHead } from "@/components/shared/DocumentHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
import { Users, Shield, Plus, Pencil, Trash2, Globe, Loader2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { NavigationMenu } from "@/components/shared/NavigationMenu";

interface PagePermissionForm {
  page_id: string;
  visualizar: boolean;
  exportar: boolean;
  atualizar: boolean;
  apenas_dev: boolean;
}

interface AdminPermissionForm {
  ver: boolean;
  editar: boolean;
  criar: boolean;
  excluir: boolean;
}

const Admin = () => {
  const [lastUpdate] = useState(new Date());
  const { 
    publicAccess,
    setPublicAccess,
    canViewAdmin,
    canEditAdmin,
    canCreateAdmin,
    canDeleteAdmin,
    loading: authLoading
  } = useAuth();

  const { getSystemLogo, getSystemName } = useBiSettingsContext();
  const systemLogo = getSystemLogo();
  const systemName = getSystemName();

  const { roles, loading: rolesLoading, createRole, updateRole, deleteRole, fetchRoles } = useRolesManagement();
  const { users, loading: usersLoading, createUser, updateUser, fetchUsers } = useUsersManagement();

  const [activeTab, setActiveTab] = useState("usuarios");
  
  // User dialog state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserWithRole | null>(null);
  const [userForm, setUserForm] = useState({ nome: "", email: "", password: "", role_id: "" });
  
  // Profile dialog state
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<RoleWithPermissions | null>(null);
  const [profileForm, setProfileForm] = useState<{ 
    nome: string;
    descricao: string;
    pagePermissions: Record<string, PagePermissionForm>;
    adminPermissions: {
      usuarios: AdminPermissionForm;
      perfis: AdminPermissionForm;
      acesso_publico: AdminPermissionForm;
      painel_controle: AdminPermissionForm;
    };
  }>({
    nome: "",
    descricao: "",
    pagePermissions: {},
    adminPermissions: {
      usuarios: { ver: false, editar: false, criar: false, excluir: false },
      perfis: { ver: false, editar: false, criar: false, excluir: false },
      acesso_publico: { ver: false, editar: false, criar: false, excluir: false },
      painel_controle: { ver: false, editar: false, criar: false, excluir: false },
    }
  });

  // Initialize page permissions for form
  const initializePagePermissions = (): Record<string, PagePermissionForm> => {
    const perms: Record<string, PagePermissionForm> = {};
    systemPages.forEach(page => {
      perms[page.id] = {
        page_id: page.id,
        visualizar: false,
        exportar: false,
        atualizar: false,
        apenas_dev: false,
      };
    });
    return perms;
  };

  // === USER HANDLERS ===
  const handleOpenNewUser = () => {
    setEditingUser(null);
    setUserForm({ nome: "", email: "", password: "", role_id: "" });
    setIsUserDialogOpen(true);
  };

  const handleEditUser = (user: UserWithRole) => {
    setEditingUser(user);
    setUserForm({ nome: user.nome, email: user.email, password: "", role_id: user.role_id || "" });
    setIsUserDialogOpen(true);
  };

  const handleSaveUser = async () => {
    if (editingUser) {
      await updateUser(editingUser.id, {
        nome: userForm.nome,
        role_id: userForm.role_id || undefined,
      });
    } else {
      // Create new user
      if (!userForm.email || !userForm.password || !userForm.nome) {
        toast.error("Nome, email e senha são obrigatórios");
        return;
      }
      await createUser(userForm.email, userForm.password, userForm.nome, userForm.role_id || undefined);
    }
    
    setIsUserDialogOpen(false);
    setEditingUser(null);
  };

  const handleDeleteUser = async (user: UserWithRole) => {
    await updateUser(user.id, { ativo: false });
  };

  // === PROFILE HANDLERS ===
  const handleOpenNewProfile = () => {
    setEditingRole(null);
    setProfileForm({ 
      nome: "", 
      descricao: "",
      pagePermissions: initializePagePermissions(),
      adminPermissions: {
        usuarios: { ver: false, editar: false, criar: false, excluir: false },
        perfis: { ver: false, editar: false, criar: false, excluir: false },
        acesso_publico: { ver: false, editar: false, criar: false, excluir: false },
        painel_controle: { ver: false, editar: false, criar: false, excluir: false },
      }
    });
    setIsProfileDialogOpen(true);
  };

  const handleEditProfile = (role: RoleWithPermissions) => {
    setEditingRole(role);
    
    // Map existing permissions
    const pagePerms = initializePagePermissions();
    Object.entries(role.pagePermissions).forEach(([pageId, perm]) => {
      if (pagePerms[pageId]) {
        pagePerms[pageId] = {
          page_id: pageId,
          visualizar: perm.visualizar,
          exportar: perm.exportar,
          atualizar: perm.atualizar,
          apenas_dev: perm.apenas_dev,
        };
      }
    });

    setProfileForm({ 
      nome: role.nome, 
      descricao: role.descricao || "",
      pagePermissions: pagePerms,
      adminPermissions: {
        usuarios: {
          ver: role.adminPermissions.usuarios.ver,
          editar: role.adminPermissions.usuarios.editar,
          criar: role.adminPermissions.usuarios.criar,
          excluir: role.adminPermissions.usuarios.excluir,
        },
        perfis: {
          ver: role.adminPermissions.perfis.ver,
          editar: role.adminPermissions.perfis.editar,
          criar: role.adminPermissions.perfis.criar,
          excluir: role.adminPermissions.perfis.excluir,
        },
        acesso_publico: {
          ver: role.adminPermissions.acesso_publico.ver,
          editar: role.adminPermissions.acesso_publico.editar,
          criar: false,
          excluir: false,
        },
      painel_controle: {
        ver: role.adminPermissions.painel_controle?.ver ?? false,
        editar: false,
        criar: false,
        excluir: false,
      },
      }
    });
    setIsProfileDialogOpen(true);
  };

  const handleSaveProfile = async () => {
    if (!profileForm.nome.trim()) {
      toast.error("Nome do perfil é obrigatório");
      return;
    }

    const pagePerms: Record<string, Omit<RolePagePermission, "id" | "role_id">> = {};
    Object.entries(profileForm.pagePermissions).forEach(([pageId, perm]) => {
      pagePerms[pageId] = {
        page_id: pageId,
        visualizar: perm.visualizar,
        exportar: perm.exportar,
        atualizar: perm.atualizar,
        apenas_dev: perm.apenas_dev,
      };
    });

    if (editingRole) {
      await updateRole(
        editingRole.id,
        profileForm.nome,
        profileForm.descricao || null,
        pagePerms,
        profileForm.adminPermissions
      );
    } else {
      await createRole(
        profileForm.nome,
        profileForm.descricao || null,
        pagePerms,
        profileForm.adminPermissions
      );
    }
    
    setIsProfileDialogOpen(false);
    setEditingRole(null);
  };

  const handleDeleteProfile = async (roleId: string) => {
    await deleteRole(roleId);
  };

  const handleTogglePagePermission = (pageId: string, key: keyof PagePermissionForm) => {
    if (key === "page_id") return;
    setProfileForm(prev => ({
      ...prev,
      pagePermissions: {
        ...prev.pagePermissions,
        [pageId]: {
          ...prev.pagePermissions[pageId],
          [key]: !prev.pagePermissions[pageId]?.[key]
        }
      }
    }));
  };

  const handleToggleAdminPermission = (section: "usuarios" | "perfis" | "acesso_publico" | "painel_controle", key: keyof AdminPermissionForm) => {
    setProfileForm(prev => ({
      ...prev,
      adminPermissions: {
        ...prev.adminPermissions,
        [section]: {
          ...prev.adminPermissions[section],
          [key]: !prev.adminPermissions[section][key]
        }
      }
    }));
  };

  const handleTogglePublicAccess = async (pageId: string) => {
    await setPublicAccess(pageId, !publicAccess[pageId]);
  };

  // Count enabled permissions for a role
  const countEnabledPermissions = (role: RoleWithPermissions) => {
    let count = 0;
    Object.values(role.pagePermissions).forEach(perm => {
      if (perm.visualizar) count++;
    });
    return count;
  };

  // Filter tabs based on permissions
  const availableTabs = [
    { id: "usuarios", label: "Usuários", icon: Users, visible: canViewAdmin("usuarios") },
    { id: "perfis", label: "Perfis", icon: Shield, visible: canViewAdmin("perfis") },
    { id: "publico", label: "Acesso Público", icon: Globe, visible: canViewAdmin("acessoPublico") },
  ].filter(tab => tab.visible);

  // Set default tab to first available
  useEffect(() => {
    if (availableTabs.length > 0 && !availableTabs.find(t => t.id === activeTab)) {
      setActiveTab(availableTabs[0].id);
    }
  }, [availableTabs, activeTab]);

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

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <DocumentHead pageId="admin" />
      
      {/* Header similar to Auth page */}
      <header className="bg-dashboard-card border-b border-dashboard-border p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={systemLogo} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-dashboard-accent" />
          <span className="text-foreground font-semibold">Painel de Administração</span>
        </div>
        <NavigationMenu />
      </header>

      <div className="p-6">
        {/* Title and subtitle */}
        <div className="mb-6">
          <h1 className="text-xl font-bold text-foreground">{systemName}</h1>
          <p className="text-sm text-muted-foreground">Gerencie usuários, perfis e acessos</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-dashboard-card border border-dashboard-border">
            {availableTabs.map(tab => (
              <TabsTrigger 
                key={tab.id}
                value={tab.id} 
                className="data-[state=active]:bg-dashboard-accent data-[state=active]:text-dashboard-dark"
              >
                <tab.icon className="h-4 w-4 mr-2" /> {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>

          {/* === USUARIOS TAB === */}
          {canViewAdmin("usuarios") && (
            <TabsContent value="usuarios" className="mt-4">
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
                              <Badge className="bg-dashboard-accent/20 text-dashboard-accent border-dashboard-accent/30">
                                {user.role_nome}
                              </Badge>
                            ) : (
                              <Badge variant="secondary" className="text-muted-foreground">
                                Sem perfil
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell className="text-center">
                            <Badge variant={user.ativo ? "default" : "secondary"} className={user.ativo ? "bg-green-500/20 text-green-400" : ""}>
                              {user.ativo ? "Ativo" : "Inativo"}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {canEditAdmin("usuarios") && (
                              <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}>
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteAdmin("usuarios") && user.ativo && (
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user)}>
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {users.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                            Nenhum usuário cadastrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* User Edit Dialog */}
              <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                <DialogContent className="bg-dashboard-card border-dashboard-border">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">{editingUser ? "Editar" : "Novo"} Usuário</DialogTitle>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div>
                      <Label className="text-foreground">Nome</Label>
                      <Input 
                        value={userForm.nome} 
                        onChange={e => setUserForm({...userForm, nome: e.target.value})} 
                        className="bg-dashboard-dark border-dashboard-border text-foreground" 
                      />
                    </div>
                    {!editingUser && (
                      <>
                        <div>
                          <Label className="text-foreground">Email</Label>
                          <Input 
                            type="email"
                            value={userForm.email} 
                            onChange={e => setUserForm({...userForm, email: e.target.value})} 
                            className="bg-dashboard-dark border-dashboard-border text-foreground" 
                            placeholder="usuario@email.com"
                          />
                        </div>
                        <div>
                          <Label className="text-foreground">Senha</Label>
                          <Input 
                            type="password"
                            value={userForm.password} 
                            onChange={e => setUserForm({...userForm, password: e.target.value})} 
                            className="bg-dashboard-dark border-dashboard-border text-foreground" 
                            placeholder="Mínimo 6 caracteres"
                          />
                        </div>
                      </>
                    )}
                    <div>
                      <Label className="text-foreground">Perfil</Label>
                      <Select value={userForm.role_id} onValueChange={v => setUserForm({...userForm, role_id: v})}>
                        <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground">
                          <SelectValue placeholder="Selecione um perfil" />
                        </SelectTrigger>
                        <SelectContent className="bg-dashboard-card border-dashboard-border">
                          {roles.map(role => (
                            <SelectItem key={role.id} value={role.id}>{role.nome}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsUserDialogOpen(false)} className="border-dashboard-border">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveUser} className="bg-dashboard-accent text-dashboard-dark">
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          )}

          {/* === PERFIS TAB === */}
          {canViewAdmin("perfis") && (
            <TabsContent value="perfis" className="mt-4">
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
                      {roles.map(role => (
                        <TableRow key={role.id} className="border-dashboard-border">
                          <TableCell className="text-foreground font-medium">{role.nome}</TableCell>
                          <TableCell className="text-center">
                            <Badge variant="secondary" className="bg-dashboard-accent/20 text-dashboard-accent">
                              {countEnabledPermissions(role)} páginas
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            {canEditAdmin("perfis") && (
                              <Button variant="ghost" size="icon" onClick={() => handleEditProfile(role)} title="Editar permissões">
                                <Pencil className="h-4 w-4" />
                              </Button>
                            )}
                            {canDeleteAdmin("perfis") && (
                              <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteProfile(role.id)} title="Excluir perfil">
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                      {roles.length === 0 && (
                        <TableRow>
                          <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                            Nenhum perfil cadastrado
                          </TableCell>
                        </TableRow>
                      )}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* Profile Dialog */}
              <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
                <DialogContent className="bg-dashboard-card border-dashboard-border max-w-5xl max-h-[90vh] overflow-hidden flex flex-col">
                  <DialogHeader>
                    <DialogTitle className="text-foreground">{editingRole ? "Editar" : "Novo"} Perfil</DialogTitle>
                  </DialogHeader>
                  <ScrollArea className="flex-1 pr-4">
                    <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label className="text-foreground">Nome do Perfil</Label>
                        <Input 
                          value={profileForm.nome} 
                          onChange={e => setProfileForm({...profileForm, nome: e.target.value})} 
                          className="bg-dashboard-dark border-dashboard-border text-foreground"
                          placeholder="Ex: Gerente, Operador..."
                        />
                      </div>
                      <div>
                        <Label className="text-foreground">Descrição</Label>
                        <Input 
                          value={profileForm.descricao} 
                          onChange={e => setProfileForm({...profileForm, descricao: e.target.value})} 
                          className="bg-dashboard-dark border-dashboard-border text-foreground"
                          placeholder="Descrição do perfil..."
                        />
                      </div>
                    </div>
                    
                    {/* Permissões de Módulos BI */}
                    <div>
                      <Label className="text-foreground mb-2 block">Permissões de Módulos</Label>
                      <ScrollArea className="h-[250px] border border-dashboard-border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-dashboard-border">
                              <TableHead className="text-muted-foreground min-w-[200px]">Módulo</TableHead>
                              <TableHead className="text-muted-foreground text-center">Visualizar</TableHead>
                              <TableHead className="text-muted-foreground text-center">Exportar</TableHead>
                              <TableHead className="text-muted-foreground text-center">Atualizar</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {systemPages.map(page => {
                              const perm = profileForm.pagePermissions[page.id];
                              return (
                                <TableRow key={page.id} className="border-dashboard-border">
                                  <TableCell className="text-foreground text-sm">{page.nome}</TableCell>
                                  <TableCell className="text-center">
                                    <Switch 
                                      checked={perm?.visualizar ?? false} 
                                      onCheckedChange={() => handleTogglePagePermission(page.id, "visualizar")} 
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Switch 
                                      checked={perm?.exportar ?? false} 
                                      onCheckedChange={() => handleTogglePagePermission(page.id, "exportar")} 
                                    />
                                  </TableCell>
                                  <TableCell className="text-center">
                                    <Switch 
                                      checked={perm?.atualizar ?? false} 
                                      onCheckedChange={() => handleTogglePagePermission(page.id, "atualizar")} 
                                    />
                                  </TableCell>
                                </TableRow>
                              );
                            })}
                          </TableBody>
                        </Table>
                      </ScrollArea>
                    </div>

                    {/* Permissões de Administração */}
                    <div>
                      <Label className="text-foreground mb-2 block">Permissões de Administração</Label>
                      <div className="border border-dashboard-border rounded-md">
                        <Table>
                          <TableHeader>
                            <TableRow className="border-dashboard-border">
                              <TableHead className="text-muted-foreground min-w-[150px]">Seção</TableHead>
                              <TableHead className="text-muted-foreground text-center">Ver</TableHead>
                              <TableHead className="text-muted-foreground text-center">Editar</TableHead>
                              <TableHead className="text-muted-foreground text-center">Criar</TableHead>
                              <TableHead className="text-muted-foreground text-center">Excluir</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            <TableRow className="border-dashboard-border">
                              <TableCell className="text-foreground text-sm">Usuários</TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.usuarios.ver} 
                                  onCheckedChange={() => handleToggleAdminPermission("usuarios", "ver")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.usuarios.editar} 
                                  onCheckedChange={() => handleToggleAdminPermission("usuarios", "editar")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.usuarios.criar} 
                                  onCheckedChange={() => handleToggleAdminPermission("usuarios", "criar")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.usuarios.excluir} 
                                  onCheckedChange={() => handleToggleAdminPermission("usuarios", "excluir")} 
                                />
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-dashboard-border">
                              <TableCell className="text-foreground text-sm">Perfis</TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.perfis.ver} 
                                  onCheckedChange={() => handleToggleAdminPermission("perfis", "ver")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.perfis.editar} 
                                  onCheckedChange={() => handleToggleAdminPermission("perfis", "editar")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.perfis.criar} 
                                  onCheckedChange={() => handleToggleAdminPermission("perfis", "criar")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.perfis.excluir} 
                                  onCheckedChange={() => handleToggleAdminPermission("perfis", "excluir")} 
                                />
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-dashboard-border">
                              <TableCell className="text-foreground text-sm">Acesso Público</TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.acesso_publico.ver} 
                                  onCheckedChange={() => handleToggleAdminPermission("acesso_publico", "ver")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.acesso_publico.editar} 
                                  onCheckedChange={() => handleToggleAdminPermission("acesso_publico", "editar")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-muted-foreground text-xs">-</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-muted-foreground text-xs">-</span>
                              </TableCell>
                            </TableRow>
                            <TableRow className="border-dashboard-border">
                              <TableCell className="text-foreground text-sm">Painel de Controle</TableCell>
                              <TableCell className="text-center">
                                <Switch 
                                  checked={profileForm.adminPermissions.painel_controle.ver} 
                                  onCheckedChange={() => handleToggleAdminPermission("painel_controle", "ver")} 
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-muted-foreground text-xs">-</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-muted-foreground text-xs">-</span>
                              </TableCell>
                              <TableCell className="text-center">
                                <span className="text-muted-foreground text-xs">-</span>
                              </TableCell>
                            </TableRow>
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                    </div>
                  </ScrollArea>
                  <DialogFooter className="gap-2">
                    <Button variant="outline" onClick={() => setIsProfileDialogOpen(false)} className="border-dashboard-border">
                      Cancelar
                    </Button>
                    <Button onClick={handleSaveProfile} className="bg-dashboard-accent text-dashboard-dark">
                      Salvar
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </TabsContent>
          )}

          {/* === ACESSO PÚBLICO TAB === */}
          {canViewAdmin("acessoPublico") && (
            <TabsContent value="publico" className="mt-4">
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader>
                  <CardTitle className="text-base text-foreground">Configurar Acesso Público</CardTitle>
                  <p className="text-sm text-muted-foreground mt-1">
                    Páginas com acesso público ficam visíveis no menu para visitantes não logados. 
                    Páginas não habilitadas ficam completamente ocultas.
                  </p>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow className="border-dashboard-border">
                        <TableHead className="text-muted-foreground">Página</TableHead>
                        <TableHead className="text-muted-foreground text-center">Acesso Público</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemPages.map(page => (
                        <TableRow key={page.id} className="border-dashboard-border">
                          <TableCell className="text-foreground">{page.nome}</TableCell>
                          <TableCell className="text-center">
                            <Switch 
                              checked={publicAccess[page.id] ?? false}
                              onCheckedChange={() => handleTogglePublicAccess(page.id)}
                              disabled={!canEditAdmin("acessoPublico")}
                            />
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </TabsContent>
          )}
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
