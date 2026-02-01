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
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useAuth } from "@/contexts/AuthContext";
import { systemPages, PagePermission } from "@/data/authData";
import { toast } from "sonner";
import { Users, Shield, Plus, Pencil, Trash2 } from "lucide-react";

const Admin = () => {
  const [lastUpdate] = useState(new Date());
  const { users, profiles, addUser, updateUser, deleteUser, addProfile, updateProfile, deleteProfile, isDeveloper } = useAuth();
  const [activeTab, setActiveTab] = useState("usuarios");
  const [isUserDialogOpen, setIsUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [userForm, setUserForm] = useState({ nome: "", email: "", senha: "", perfilId: "" });

  const handleSaveUser = () => {
    if (!userForm.nome || !userForm.email || !userForm.perfilId) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }
    if (editingUser) {
      updateUser(editingUser, { ...userForm, isDeveloper: false, ativo: true });
      toast.success("Usuário atualizado!");
    } else {
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

  const handleTogglePermission = (profileId: string, pageId: string, key: keyof PagePermission) => {
    const profile = profiles.find(p => p.id === profileId);
    if (!profile) return;
    const newPerms = { ...profile.permissoes };
    newPerms[pageId] = { ...newPerms[pageId], [key]: !newPerms[pageId][key] };
    updateProfile(profileId, { permissoes: newPerms });
  };

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

          <TabsContent value="perfis" className="mt-4 space-y-4">
            {profiles.map(profile => (
              <Card key={profile.id} className="bg-dashboard-card border-dashboard-border">
                <CardHeader><CardTitle className="text-base text-foreground">{profile.nome}</CardTitle></CardHeader>
                <CardContent className="overflow-auto">
                  <Table>
                    <TableHeader><TableRow className="border-dashboard-border"><TableHead className="text-muted-foreground">Página</TableHead><TableHead className="text-muted-foreground text-center">Ver</TableHead><TableHead className="text-muted-foreground text-center">Exportar</TableHead><TableHead className="text-muted-foreground text-center">Atualizar</TableHead>{isDeveloper && <TableHead className="text-muted-foreground text-center">Dev Only</TableHead>}</TableRow></TableHeader>
                    <TableBody>
                      {systemPages.filter(p => p.id !== "admin" || profile.id !== "dev-profile").map(page => {
                        const perm = profile.permissoes[page.id];
                        return (
                          <TableRow key={page.id} className="border-dashboard-border">
                            <TableCell className="text-foreground">{page.nome}</TableCell>
                            <TableCell className="text-center"><Switch checked={perm?.visualizar} onCheckedChange={() => handleTogglePermission(profile.id, page.id, "visualizar")} /></TableCell>
                            <TableCell className="text-center"><Switch checked={perm?.exportar} onCheckedChange={() => handleTogglePermission(profile.id, page.id, "exportar")} /></TableCell>
                            <TableCell className="text-center"><Switch checked={perm?.atualizar} onCheckedChange={() => handleTogglePermission(profile.id, page.id, "atualizar")} /></TableCell>
                            {isDeveloper && <TableCell className="text-center"><Switch checked={perm?.apenasDev} onCheckedChange={() => handleTogglePermission(profile.id, page.id, "apenasDev")} /></TableCell>}
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
