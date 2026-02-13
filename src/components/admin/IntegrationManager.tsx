import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Plus, Pencil, Trash2, Loader2, Eye, EyeOff } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/contexts/AuthContext";

interface Integration {
  id: string;
  name: string;
  base_url: string | null;
  auth_type: string;
  auth_token: string | null;
  headers_json: any;
  description: string | null;
  created_at: string;
}

const IntegrationManager = () => {
  const { canEditAdmin, canCreateAdmin, canDeleteAdmin } = useAuth();
  const [items, setItems] = useState<Integration[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editing, setEditing] = useState<Integration | null>(null);
  const [showToken, setShowToken] = useState(false);
  const [form, setForm] = useState({ name: "", base_url: "", auth_type: "bearer", auth_token: "", headers_json: "{}", description: "" });

  const fetchItems = useCallback(async () => {
    const { data, error } = await supabase.from("api_integrations").select("*").order("name");
    if (error) { console.error(error); toast.error("Erro ao carregar integrações"); }
    else setItems(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchItems(); }, [fetchItems]);

  const handleOpen = (item?: Integration) => {
    setShowToken(false);
    if (item) {
      setEditing(item);
      setForm({ name: item.name, base_url: item.base_url || "", auth_type: item.auth_type, auth_token: item.auth_token || "", headers_json: JSON.stringify(item.headers_json || {}, null, 2), description: item.description || "" });
    } else {
      setEditing(null);
      setForm({ name: "", base_url: "", auth_type: "bearer", auth_token: "", headers_json: "{}", description: "" });
    }
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { toast.error("Nome é obrigatório"); return; }
    let headersJson = {};
    try { headersJson = JSON.parse(form.headers_json); } catch { toast.error("Headers JSON inválido"); return; }

    const payload = { name: form.name.trim(), base_url: form.base_url.trim() || null, auth_type: form.auth_type, auth_token: form.auth_token.trim() || null, headers_json: headersJson, description: form.description.trim() || null };

    if (editing) {
      const { error } = await supabase.from("api_integrations").update(payload).eq("id", editing.id);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Integração atualizada!");
    } else {
      const { error } = await supabase.from("api_integrations").insert(payload);
      if (error) { toast.error("Erro: " + error.message); return; }
      toast.success("Integração criada!");
    }
    setDialogOpen(false);
    fetchItems();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("api_integrations").delete().eq("id", id);
    if (error) toast.error("Erro: " + error.message);
    else { toast.success("Integração excluída!"); fetchItems(); }
  };

  if (loading) return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-dashboard-accent" /></div>;

  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base text-foreground">Integrações de API</CardTitle>
        {canCreateAdmin("integracao") && (
          <Button size="sm" className="bg-dashboard-accent text-dashboard-dark" onClick={() => handleOpen()}>
            <Plus className="h-4 w-4 mr-1" /> Nova Integração
          </Button>
        )}
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow className="border-dashboard-border">
              <TableHead className="text-muted-foreground">Nome</TableHead>
              <TableHead className="text-muted-foreground">URL Base</TableHead>
              <TableHead className="text-muted-foreground">Tipo Auth</TableHead>
              <TableHead className="text-muted-foreground">Descrição</TableHead>
              <TableHead className="text-muted-foreground text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.map(item => (
              <TableRow key={item.id} className="border-dashboard-border">
                <TableCell className="text-foreground font-medium">{item.name}</TableCell>
                <TableCell className="text-muted-foreground text-sm font-mono max-w-[200px] truncate">{item.base_url || "-"}</TableCell>
                <TableCell className="text-muted-foreground">{item.auth_type}</TableCell>
                <TableCell className="text-muted-foreground text-sm">{item.description || "-"}</TableCell>
                <TableCell className="text-right space-x-1">
                  {canEditAdmin("integracao") && <Button variant="ghost" size="icon" onClick={() => handleOpen(item)}><Pencil className="h-4 w-4" /></Button>}
                  {canDeleteAdmin("integracao") && <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(item.id)}><Trash2 className="h-4 w-4" /></Button>}
                </TableCell>
              </TableRow>
            ))}
            {items.length === 0 && <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma integração cadastrada</TableCell></TableRow>}
          </TableBody>
        </Table>
      </CardContent>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border max-w-2xl">
          <DialogHeader><DialogTitle className="text-foreground">{editing ? "Editar" : "Nova"} Integração</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div><Label className="text-foreground">Nome</Label>
                <Input value={form.name} onChange={e => setForm({...form, name: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Ex: API Principal" /></div>
              <div><Label className="text-foreground">Tipo de Auth</Label>
                <Select value={form.auth_type} onValueChange={v => setForm({...form, auth_type: v})}>
                  <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-dashboard-border">
                    <SelectItem value="bearer">Bearer Token</SelectItem>
                    <SelectItem value="basic">Basic Auth</SelectItem>
                    <SelectItem value="api_key">API Key</SelectItem>
                    <SelectItem value="none">Sem Auth</SelectItem>
                  </SelectContent>
                </Select></div>
            </div>
            <div><Label className="text-foreground">URL Base</Label>
              <Input value={form.base_url} onChange={e => setForm({...form, base_url: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground font-mono text-sm" placeholder="https://api.example.com" /></div>
            <div><Label className="text-foreground">Token / Senha</Label>
              <div className="flex gap-2">
                <Input type={showToken ? "text" : "password"} value={form.auth_token} onChange={e => setForm({...form, auth_token: e.target.value})}
                  className="bg-dashboard-dark border-dashboard-border text-foreground font-mono text-sm" placeholder="Token de autenticação" />
                <Button variant="outline" size="icon" onClick={() => setShowToken(!showToken)} className="border-dashboard-border shrink-0">
                  {showToken ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div></div>
            <div><Label className="text-foreground">Headers Adicionais (JSON)</Label>
              <Textarea value={form.headers_json} onChange={e => setForm({...form, headers_json: e.target.value})}
                className="bg-dashboard-dark border-dashboard-border text-foreground font-mono text-sm h-20" placeholder='{"Content-Type": "application/json"}' /></div>
            <div><Label className="text-foreground">Descrição</Label>
              <Input value={form.description} onChange={e => setForm({...form, description: e.target.value})} className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Descrição opcional" /></div>
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

export default IntegrationManager;
