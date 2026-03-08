import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, Search, Languages } from "lucide-react";
import { translations as defaultTranslations } from "@/i18n/translations";

interface TranslationRow {
  id: string;
  language: string;
  key: string;
  value: string;
}

const LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

const TranslationsManager = () => {
  const [translations, setTranslations] = useState<TranslationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState<string>("all");
  const [editDialog, setEditDialog] = useState(false);
  const [editItem, setEditItem] = useState<TranslationRow | null>(null);
  const [form, setForm] = useState({ language: "pt-BR", key: "", value: "" });

  const loadTranslations = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("translations")
      .select("*")
      .order("key", { ascending: true });
    if (error) {
      toast.error("Erro ao carregar traduções");
    } else {
      setTranslations(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => { loadTranslations(); }, [loadTranslations]);

  const handleSave = async () => {
    if (!form.key.trim() || !form.value.trim()) {
      toast.error("Preencha a chave e o valor");
      return;
    }
    if (editItem) {
      const { error } = await supabase
        .from("translations")
        .update({ language: form.language, key: form.key.trim(), value: form.value.trim() })
        .eq("id", editItem.id);
      if (error) { toast.error("Erro ao atualizar"); return; }
      toast.success("Tradução atualizada");
    } else {
      const { error } = await supabase
        .from("translations")
        .insert({ language: form.language, key: form.key.trim(), value: form.value.trim() });
      if (error) {
        if (error.code === "23505") toast.error("Chave já existe para esse idioma");
        else toast.error("Erro ao criar");
        return;
      }
      toast.success("Tradução criada");
    }
    setEditDialog(false);
    loadTranslations();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("translations").delete().eq("id", id);
    if (error) { toast.error("Erro ao excluir"); return; }
    toast.success("Tradução excluída");
    loadTranslations();
  };

  const openCreate = () => {
    setEditItem(null);
    setForm({ language: "pt-BR", key: "", value: "" });
    setEditDialog(true);
  };

  const openEdit = (item: TranslationRow) => {
    setEditItem(item);
    setForm({ language: item.language, key: item.key, value: item.value });
    setEditDialog(true);
  };

  // Merge default keys with DB translations for display
  const allKeys = new Set<string>();
  Object.values(defaultTranslations).forEach(dict => Object.keys(dict).forEach(k => allKeys.add(k)));
  translations.forEach(t => allKeys.add(t.key));

  const filtered = Array.from(allKeys)
    .filter(key => {
      if (search && !key.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    })
    .sort();

  const getTranslation = (key: string, lang: string): { value: string; source: "db" | "default" | "missing"; id?: string } => {
    const dbRow = translations.find(t => t.key === key && t.language === lang);
    if (dbRow) return { value: dbRow.value, source: "db", id: dbRow.id };
    const def = (defaultTranslations as any)[lang]?.[key];
    if (def) return { value: def, source: "default" };
    return { value: "", source: "missing" };
  };

  return (
    <div className="space-y-4">
      <Card className="bg-card border-border">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between gap-2 flex-wrap">
            <CardTitle className="text-base font-semibold text-foreground flex items-center gap-2">
              <Languages className="h-5 w-5 text-primary" />
              Gerenciar Traduções
            </CardTitle>
            <Button size="sm" onClick={openCreate} className="bg-primary text-primary-foreground">
              <Plus className="h-4 w-4 mr-1" /> Nova Tradução
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar chave..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <Select value={filterLang} onValueChange={setFilterLang}>
              <SelectTrigger className="w-[160px] bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos idiomas</SelectItem>
                {LANGUAGES.map(l => (
                  <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="border border-border rounded-md overflow-auto max-h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground text-xs w-[30%]">Chave</TableHead>
                  {LANGUAGES.filter(l => filterLang === "all" || filterLang === l.code).map(l => (
                    <TableHead key={l.code} className="text-muted-foreground text-xs">
                      {l.flag} {l.label}
                    </TableHead>
                  ))}
                  <TableHead className="text-muted-foreground text-xs w-[80px]">Ações</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={4} className="text-center text-muted-foreground py-8">Nenhuma tradução encontrada</TableCell></TableRow>
                ) : filtered.map(key => (
                  <TableRow key={key} className="border-border">
                    <TableCell className="font-mono text-xs text-foreground">{key}</TableCell>
                    {LANGUAGES.filter(l => filterLang === "all" || filterLang === l.code).map(l => {
                      const t = getTranslation(key, l.code);
                      return (
                        <TableCell key={l.code} className="text-xs">
                          <span className={t.source === "db" ? "text-primary font-medium" : t.source === "missing" ? "text-destructive italic" : "text-muted-foreground"}>
                            {t.value || "—"}
                          </span>
                          {t.source === "default" && <span className="ml-1 text-[9px] text-muted-foreground">(padrão)</span>}
                          {t.source === "db" && <span className="ml-1 text-[9px] text-primary/60">(custom)</span>}
                        </TableCell>
                      );
                    })}
                    <TableCell>
                      <div className="flex items-center gap-1">
                        {LANGUAGES.map(l => {
                          const t = getTranslation(key, l.code);
                          if (t.source === "db" && t.id) {
                            return (
                              <div key={l.code} className="flex gap-0.5">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit({ id: t.id!, language: l.code, key, value: t.value })}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(t.id!)}>
                                  <Trash2 className="h-3 w-3" />
                                </Button>
                              </div>
                            );
                          }
                          return null;
                        })}
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-primary" onClick={() => { setEditItem(null); setForm({ language: "en", key, value: "" }); setEditDialog(true); }} title="Adicionar tradução">
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-card border-border">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editItem ? "Editar Tradução" : "Nova Tradução"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div>
              <Label className="text-muted-foreground text-xs">Idioma</Label>
              <Select value={form.language} onValueChange={v => setForm(p => ({ ...p, language: v }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {LANGUAGES.map(l => (
                    <SelectItem key={l.code} value={l.code}>{l.flag} {l.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Chave</Label>
              <Input value={form.key} onChange={e => setForm(p => ({ ...p, key: e.target.value }))} className="bg-background border-border font-mono text-sm" placeholder="Ex: Expedidas" />
            </div>
            <div>
              <Label className="text-muted-foreground text-xs">Valor traduzido</Label>
              <Input value={form.value} onChange={e => setForm(p => ({ ...p, value: e.target.value }))} className="bg-background border-border" placeholder="Ex: Dispatched" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog(false)} className="border-border">Cancelar</Button>
            <Button onClick={handleSave} className="bg-primary text-primary-foreground">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TranslationsManager;
