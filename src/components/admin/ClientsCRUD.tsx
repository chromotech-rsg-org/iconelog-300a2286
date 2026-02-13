import { useState, useEffect, useCallback, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Plus, Pencil, Trash2, Loader2, Upload, Building2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Client {
  id: string;
  cod_cli: string;
  nome: string;
  descricao: string | null;
  logo_url: string | null;
  ativo: boolean;
  created_at: string;
}

const ClientsCRUD = () => {
  const { canEditAdmin, canCreateAdmin, canDeleteAdmin } = useAuth();
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Client | null>(null);
  const [form, setForm] = useState({ cod_cli: "", nome: "", descricao: "" });
  const [uploading, setUploading] = useState(false);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase.from("clients").select("*").order("nome");
    if (error) { console.error(error); toast.error("Erro ao carregar clientes"); }
    else setClients((data as Client[]) || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleOpen = (client?: Client) => {
    if (client) {
      setEditing(client);
      setForm({ cod_cli: client.cod_cli, nome: client.nome, descricao: client.descricao || "" });
      setLogoPreview(client.logo_url || null);
    } else {
      setEditing(null);
      setForm({ cod_cli: "", nome: "", descricao: "" });
      setLogoPreview(null);
    }
    setDialogOpen(true);
  };

  const handleLogoUpload = async (file: File, clientId?: string) => {
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return null; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Máximo 2MB"); return null; }

    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const fileName = `client-${clientId || Date.now()}.${ext}`;
      const filePath = `logos/${fileName}`;

      const { error: uploadError } = await supabase.storage.from("bi-assets").upload(filePath, file, { upsert: true });
      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage.from("bi-assets").getPublicUrl(filePath);
      const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
      setLogoPreview(logoUrl);
      return logoUrl;
    } catch (err: any) {
      toast.error("Erro no upload: " + err.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!form.cod_cli.trim() || !form.nome.trim()) { toast.error("Código e nome são obrigatórios"); return; }
    const payload: any = { cod_cli: form.cod_cli.trim(), nome: form.nome.trim(), descricao: form.descricao.trim() || null, logo_url: logoPreview };
    
    if (editing) {
      const { error } = await supabase.from("clients").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Cliente atualizado!");
    } else {
      const { error } = await supabase.from("clients").insert(payload);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Cliente criado!");
    }
    setDialogOpen(false);
    fetchClients();
  };

  const handleToggleActive = async (client: Client) => {
    const { error } = await supabase.from("clients").update({ ativo: !client.ativo }).eq("id", client.id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success(client.ativo ? "Cliente desativado" : "Cliente ativado"); fetchClients(); }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("clients").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Cliente excluído!"); fetchClients(); }
  };

  if (loading) return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-dashboard-accent" /></div>;

  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base text-foreground">Empresas / Clientes</CardTitle>
        {canCreateAdmin("empresasClientes") && (
          <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={() => handleOpen()}>
            <Plus className="h-4 w-4 mr-1" /> Novo Cliente
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-dashboard-border">
              <TableHead className="text-muted-foreground">Logo</TableHead>
              <TableHead className="text-muted-foreground">Código</TableHead>
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">Descrição</TableHead>
              <TableHead className="text-muted-foreground text-center">Status</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clients.map(c => (
              <TableRow key={c.id} className="border-dashboard-border">
                <TableCell>
                  <Avatar className="h-8 w-8 rounded">
                    <AvatarImage src={c.logo_url || undefined} className="object-cover" />
                    <AvatarFallback className="rounded bg-dashboard-border text-xs"><Building2 className="h-4 w-4" /></AvatarFallback>
                  </Avatar>
                </TableCell>
                <TableCell className="text-foreground font-mono">{c.cod_cli}</TableCell>
                <TableCell className="text-foreground">{c.nome}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{c.descricao || "-"}</TableCell>
                <TableCell className="text-center">
                  <Badge className={c.ativo ? "bg-green-500/20 text-green-400" : "bg-muted text-muted-foreground"}>
                    {c.ativo ? "Ativo" : "Inativo"}
                  </Badge>
                </TableCell>
                <TableCell className="text-right space-x-1">
                  {canEditAdmin("empresasClientes") && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleOpen(c)}><Pencil className="h-4 w-4" /></Button>
                      <Button variant="ghost" size="icon" onClick={() => handleToggleActive(c)}>
                        <Switch checked={c.ativo} className="pointer-events-none" />
                      </Button>
                    </>
                  )}
                  {canDeleteAdmin("empresasClientes") && (
                    <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(c.id)}><Trash2 className="h-4 w-4" /></Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
            {clients.length === 0 && (
              <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border">
          <DialogHeader><DialogTitle className="text-foreground">{editing ? "Editar" : "Novo"} Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <div className="relative">
                <Avatar className="h-16 w-16 rounded-lg border-2 border-dashboard-border">
                  <AvatarImage src={logoPreview || undefined} className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-dashboard-border"><Building2 className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <input type="file" accept="image/*" className="hidden" ref={fileInputRef}
                  onChange={async (e) => { const f = e.target.files?.[0]; if (f) await handleLogoUpload(f, editing?.id); }} />
                <Button variant="ghost" size="icon"
                  className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/80"
                  onClick={() => fileInputRef.current?.click()} disabled={uploading}>
                  {uploading ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                </Button>
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">Logo da Empresa</p>
                <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
              </div>
            </div>
            <div><Label className="text-foreground">Código (cod_cli)</Label>
              <Input value={form.cod_cli} onChange={e => setForm({...form, cod_cli: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Ex: PAY, 099, ICO" /></div>
            <div><Label className="text-foreground">Nome</Label>
              <Input value={form.nome} onChange={e => setForm({...form, nome: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Nome da empresa" /></div>
            <div><Label className="text-foreground">Descrição</Label>
              <Input value={form.descricao} onChange={e => setForm({...form, descricao: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Descrição opcional" /></div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-dashboard-border">Cancelar</Button>
            <Button onClick={handleSave} className="bg-dashboard-accent text-dashboard-dark">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ClientsCRUD;
