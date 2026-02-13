import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import { Plus, Pencil, Trash2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Client {
  id: string;
  cod_cli: string;
  nome: string;
  descricao: string | null;
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

  const fetchClients = useCallback(async () => {
    const { data, error } = await supabase.from("clients").select("*").order("nome");
    if (error) { console.error(error); toast.error("Erro ao carregar clientes"); }
    else setClients(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchClients(); }, [fetchClients]);

  const handleOpen = (client?: Client) => {
    if (client) {
      setEditing(client);
      setForm({ cod_cli: client.cod_cli, nome: client.nome, descricao: client.descricao || "" });
    } else {
      setEditing(null);
      setForm({ cod_cli: "", nome: "", descricao: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.cod_cli.trim() || !form.nome.trim()) { toast.error("Código e nome são obrigatórios"); return; }
    if (editing) {
      const { error } = await supabase.from("clients").update({ cod_cli: form.cod_cli.trim(), nome: form.nome.trim(), descricao: form.descricao.trim() || null }).eq("id", editing.id);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Cliente atualizado!");
    } else {
      const { error } = await supabase.from("clients").insert({ cod_cli: form.cod_cli.trim(), nome: form.nome.trim(), descricao: form.descricao.trim() || null });
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
              <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhum cliente cadastrado</TableCell></TableRow>
            )}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border">
          <DialogHeader><DialogTitle className="text-foreground">{editing ? "Editar" : "Novo"} Cliente</DialogTitle></DialogHeader>
          <div className="space-y-4">
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
