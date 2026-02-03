import { useState } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { systemPages, PagePermission, createEmptyPermissions } from "@/data/authData";
import { toast } from "sonner";
import { Users, Shield, Plus, Pencil, Trash2 } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";

const Admin = () => {
  const [lastUpdate] = useState(new Date());
  const { users, profiles, addUser, updateUser, deleteUser, addProfile, updateProfile, deleteProfile, isDeveloper } = useAuth();
  const [activeTab, setActiveTab] = useState("usuarios");
  
  // User dialog state
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ nome: "", email: "", senha: "", perfilId: "" });
  
  // Profile dialog state
  const [isProfileDialogOpen, setIsProfileDialogOpen] = useState(false);
  const [editingProfile, setEditingProfile] = useState<string | null>(null);
  const [profileForm, setProfileForm] = useState<{ nome: string; permissoes: Record<string, PagePermission> }>({
    nome: "",
    permissoes: createEmptyPermissions()
  });

  // === USER HANDLERS ===
  const handleSaveUser = () => {
    if (!userForm.nome || !userForm.email || !userForm.perfilId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (editingUser) {
      const updateData: any = { nome: userForm.nome, email: userForm.email, perfilId: userForm.perfilId };
      if (userForm.senha) updateData.senha = userForm.senha;
      updateUser(editingUser, updateData);
      toast.success("Usuário atualizado!");
    } else {
      if (!userForm.senha) {
        toast.error("Senha é obrigatória para novo usuário");
        return;
      }
      addUser({ ...userForm, isDeveloper: false, ativo: true });
      toast.success("Usuário criado!");
    }
    setUserForm({ nome: "", email: "", senha: "", perfilId: "" });
    setEditingUser(null);
    setIsUserDialogOpen(false);
  };

  const handleEditUser = (user: typeof users[0]) => {
    setUserForm({ nome: user.nome, email: user.email, senha: "", perfilId: user.perfilId });
    setEditingUser(user.id);
    setIsUserDialogOpen(true);
  };

  const handleDeleteUser = (id: string) => {
    deleteUser(id);
    toast.success("Usuário removido!");
  };

  // === PROFILE HANDLERS ===
  const handleOpenNewProfile = () => {
    setEditingProfile(null);
    setProfileForm({ nome: "", permissoes: createEmptyPermissions() });
    setIsProfileDialogOpen(true);
  };

  const handleEditProfile = (profile: typeof profiles[0]) => {
    setEditingProfile(profile.id);
    setProfileForm({ nome: profile.nome, permissoes: { ...profile.permissoes } });
    setIsProfileDialogOpen(true);
  };

  const handleSaveProfile = () => {
    if (!profileForm.nome.trim()) {
      toast.error("Nome do perfil é obrigatório");
      return;
    }
    if (editingProfile) {
      updateProfile(editingProfile, { nome: profileForm.nome, permissoes: profileForm.permissoes });
      toast.success("Perfil atualizado!");
    } else {
      addProfile({ nome: profileForm.nome, permissoes: profileForm.permissoes });
      toast.success("Perfil criado!");
    }
    setIsProfileDialogOpen(false);
    setEditingProfile(null);
  };

  const handleDeleteProfile = (profileId: string) => {
    // Proteção: não pode excluir dev-profile ou admin-profile
    if (profileId === "dev-profile" || profileId === "admin-profile") {
      toast.error("Este perfil não pode ser excluído");
      return;
    }
    // Verificar se há usuários vinculados
    const usersWithProfile = users.filter(u => u.perfilId === profileId);
    if (usersWithProfile.length > 0) {
      toast.error(`Não é possível excluir: ${usersWithProfile.length} usuário(s) vinculado(s)`);
      return;
    }
    deleteProfile(profileId);
    toast.success("Perfil removido!");
  };

  const handleToggleProfileFormPermission = (pageId: string, key: keyof PagePermission) => {
    setProfileForm(prev => ({
      ...prev,
      permissoes: {
        ...prev.permissoes,
        [pageId]: {
          ...prev.permissoes[pageId],
          [key]: !prev.permissoes[pageId]?.[key]
        }
      }
    }));
  };

  const handleTogglePermission = (profileId: string, pageId: string, key: keyof PagePermission) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    const newPerms = { ...profile.permissoes };
    newPerms[pageId] = { ...newPerms[pageId], [key]: !newPerms[pageId][key] };
    updateProfile(profileId, { permissoes: newPerms });
  };

  const isProtectedProfile = (profileId: string) => profileId === "dev-profile" || profileId === "admin-profile";

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader pageTitle="Painel de Administração" pageId="admin" lastUpdate={lastUpdate} />

      <div className="p-6">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-dashboard-card border border-dashboard-border">
            <TabsTrigger value="usuarios" className="data-[state=active]:bg-dashboard-accent data-[state=active]:text-dashboard-dark">
              <Users className="h-4 w-4 mr-2" /> Usuários
            </TabsTrigger>
            <TabsTrigger value="perfis" className="data-[state=active]:bg-dashboard-accent data-[state=active]:text-dashboard-dark">
              <Shield className="h-4 w-4 mr-2" /> Perfis e Permissões
            </TabsTrigger>
          </TabsList>

          {/* === USUARIOS TAB === */}
          <TabsContent value="usuarios" className="mt-4">
            <Card className="bg-dashboard-card border-dashboard-border">
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="text-base text-foreground">Gerenciar Usuários</CardTitle>
                <Dialog open={isUserDialogOpen} onOpenChange={setIsUserDialogOpen}>
                  <DialogTrigger asChild>
                    <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={() => { setEditingUser(null); setUserForm({ nome: "", email: "", senha: "", perfilId: "" }); }}>
                      <Plus className="h-4 w-4 mr-1" /> Novo Usuário
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="bg-dashboard-card border-dashboard-border">
                    <DialogHeader><DialogTitle className="text-foreground">{editingUser ? "Editar" : "Novo"} Usuário</DialogTitle></DialogHeader>
                    <div className="space-y-4">
                      <div><Label className="text-foreground">Nome</Label><Input value={userForm.nome} onChange={e => setUserForm({...userForm, nome: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" /></div>
                      <div><Label className="text-foreground">Email</Label><Input type="email" value={userForm.email} onChange={e => setUserForm({...userForm, email: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" /></div>
                      <div><Label className="text-foreground">Senha {editingUser && "(deixe vazio para manter)"}</Label><Input type="password" value={userForm.senha} onChange={e => setUserForm({...userForm, senha: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" /></div>
                      <div><Label className="text-foreground">Perfil</Label>
                        <Select value={userForm.perfilId} onValueChange={v => setUserForm({...userForm, perfilId: v})}>
                          <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                          <SelectContent className="bg-dashboard-card border-dashboard-border">{profiles.map(p => <SelectItem key={p.id} value={p.id}>{p.nome}</SelectItem>)}</SelectContent>
                        </Select>
                      </div>
                      <Button onClick={handleSaveUser} className="w-full bg-dashboard-accent text-dashboard-dark">Salvar</Button>
                    </div>
                  </DialogContent>
                </Dialog>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader><TableRow className="border-dashboard-border"><TableHead className="text-muted-foreground">Nome</TableHead><TableHead className="text-muted-foreground">Email</TableHead><TableHead className="text-muted-foreground">Perfil</TableHead><TableHead className="text-muted-foreground text-right">Ações</TableHead></TableRow></TableHeader>
                  <TableBody>
                    {users.map(user => (
                      <TableRow key={user.id} className="border-dashboard-border">
                        <TableCell className="text-foreground">{user.nome}</TableCell>
                        <TableCell className="text-muted-foreground">{user.email}</TableCell>
                        <TableCell><Badge className="bg-dashboard-accent/20 text-dashboard-accent border-dashboard-accent/30">{profiles.find(p => p.id === user.perfilId)?.nome}</Badge></TableCell>
                        <TableCell className="text-right">
                          <Button variant="ghost" size="icon" onClick={() => handleEditUser(user)}><Pencil className="h-4 w-4" /></Button>
                          <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDeleteUser(user.id)}><Trash2 className="h-4 w-4" /></Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          {/* === PERFIS TAB === */}
          <TabsContent value="perfis" className="mt-4 space-y-4">
            {/* Botão Novo Perfil */}
            <div className="flex justify-end">
              <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={handleOpenNewProfile}>
                <Plus className="h-4 w-4 mr-1" /> Novo Perfil
              </Button>
            </div>

            {/* Profile Dialog */}
            <Dialog open={isProfileDialogOpen} onOpenChange={setIsProfileDialogOpen}>
              <DialogContent className="bg-dashboard-card border-dashboard-border max-w-2xl max-h-[90vh]">
                <DialogHeader>
                  <DialogTitle className="text-foreground">{editingProfile ? "Editar" : "Novo"} Perfil</DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
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
                    <Label className="text-foreground mb-2 block">Permissões</Label>
                    <ScrollArea className="h-[300px] border border-dashboard-border rounded-md">
                      <Table>
                        <TableHeader>
                          <TableRow className="border-dashboard-border">
                            <TableHead className="text-muted-foreground">Página</TableHead>
                            <TableHead className="text-muted-foreground text-center">Ver</TableHead>
                            <TableHead className="text-muted-foreground text-center">Exportar</TableHead>
                            <TableHead className="text-muted-foreground text-center">Atualizar</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {systemPages.map(page => {
                            const perm = profileForm.permissoes[page.id];
                            return (
                              <TableRow key={page.id} className="border-dashboard-border">
                                <TableCell className="text-foreground text-sm">{page.nome}</TableCell>
                                <TableCell className="text-center">
                                  <Switch 
                                    checked={perm?.visualizar ?? false} 
                                    onCheckedChange={() => handleToggleProfileFormPermission(page.id, "visualizar")} 
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Switch 
                                    checked={perm?.exportar ?? false} 
                                    onCheckedChange={() => handleToggleProfileFormPermission(page.id, "exportar")} 
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Switch 
                                    checked={perm?.atualizar ?? false} 
                                    onCheckedChange={() => handleToggleProfileFormPermission(page.id, "atualizar")} 
                                  />
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </ScrollArea>
                  </div>
                </div>
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

            {/* Lista de Perfis */}
            {profiles.map(profile => (
              <Card key={profile.id} className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="flex flex-row items-center justify-between">
                  <CardTitle className="text-base text-foreground">{profile.nome}</CardTitle>
                  <div className="flex gap-2">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => handleEditProfile(profile)}
                      title="Editar perfil"
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    {!isProtectedProfile(profile.id) && (
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        className="text-destructive" 
                        onClick={() => handleDeleteProfile(profile.id)}
                        title="Excluir perfil"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-dashboard-border">
                        <TableHead className="text-muted-foreground">Página</TableHead>
                        <TableHead className="text-muted-foreground text-center">Ver</TableHead>
                        <TableHead className="text-muted-foreground text-center">Exportar</TableHead>
                        <TableHead className="text-muted-foreground text-center">Atualizar</TableHead>
                        {isDeveloper && <TableHead className="text-muted-foreground text-center">Dev Only</TableHead>}
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {systemPages.filter(p => p.id !== "admin" || profile.id !== "dev-profile").map(page => {
                        const perm = profile.permissoes[page.id];
                        return (
                          <TableRow key={page.id} className="border-dashboard-border">
                            <TableCell className="text-foreground">{page.nome}</TableCell>
                            <TableCell className="text-center">
                              <Switch checked={perm?.visualizar} onCheckedChange={() => handleTogglePermission(profile.id, page.id, "visualizar")} />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch checked={perm?.exportar} onCheckedChange={() => handleTogglePermission(profile.id, page.id, "exportar")} />
                            </TableCell>
                            <TableCell className="text-center">
                              <Switch checked={perm?.atualizar} onCheckedChange={() => handleTogglePermission(profile.id, page.id, "atualizar")} />
                            </TableCell>
                            {isDeveloper && (
                              <TableCell className="text-center">
                                <Switch checked={perm?.apenasDev} onCheckedChange={() => handleTogglePermission(profile.id, page.id, "apenasDev")} />
                              </TableCell>
                            )}
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            ))}
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Admin;
