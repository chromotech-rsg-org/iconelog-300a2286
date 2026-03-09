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
import { Plus, Pencil, Trash2, Search, Languages, Filter } from "lucide-react";
import { translations as defaultTranslations } from "@/i18n/translations";

interface TranslationRow {
  id: string;
  language: string;
  key: string;
  value: string;
  page_id?: string;
}

const LANGUAGES = [
  { code: "pt-BR", label: "Português (Brasil)", flag: "🇧🇷" },
  { code: "en", label: "English", flag: "🇺🇸" },
];

const TranslationsManager = () => {
  const [translations, setTranslations] = useState<TranslationRow[]>([]);
  const [pages, setPages] = useState<{page_id: string, display_name: string}[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterLang, setFilterLang] = useState<string>("all");
  const [filterPage, setFilterPage] = useState<string>("all");
  const [editDialog, setEditDialog] = useState(false);
  const [editKey, setEditKey] = useState<string | null>(null);
  
  const [form, setForm] = useState({ 
    key: "", 
    value_pt: "", 
    value_en: "",
    page_id: "global"
  });

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
    
    const { data: pagesData } = await supabase
      .from("bi_settings")
      .select("page_id, display_name");
    
    if (pagesData) {
      setPages(pagesData);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => { loadTranslations(); }, [loadTranslations]);

  const handleSave = async () => {
    if (!form.key.trim()) {
      toast.error("Preencha a chave");
      return;
    }
    if (!form.value_pt.trim() && !form.value_en.trim()) {
      toast.error("Preencha pelo menos um valor (PT-BR ou EN)");
      return;
    }

    try {
      // Get existing db rows for this key if any
      const existingPt = translations.find(t => t.key === (editKey || form.key) && t.language === "pt-BR");
      const existingEn = translations.find(t => t.key === (editKey || form.key) && t.language === "en");

      // Handle PT-BR
      if (form.value_pt.trim()) {
        if (existingPt) {
          await supabase.from("translations").update({ 
            key: form.key.trim(), 
            value: form.value_pt.trim(),
            page_id: form.page_id
          }).eq("id", existingPt.id);
        } else {
          await supabase.from("translations").insert({ 
            language: "pt-BR", 
            key: form.key.trim(), 
            value: form.value_pt.trim(),
            page_id: form.page_id
          });
        }
      } else if (existingPt) {
        await supabase.from("translations").delete().eq("id", existingPt.id);
      }

      // Handle EN
      if (form.value_en.trim()) {
        if (existingEn) {
          await supabase.from("translations").update({ 
            key: form.key.trim(), 
            value: form.value_en.trim(),
            page_id: form.page_id
          }).eq("id", existingEn.id);
        } else {
          await supabase.from("translations").insert({ 
            language: "en", 
            key: form.key.trim(), 
            value: form.value_en.trim(),
            page_id: form.page_id
          });
        }
      } else if (existingEn) {
        await supabase.from("translations").delete().eq("id", existingEn.id);
      }

      toast.success("Tradução salva com sucesso");
      setEditDialog(false);
      loadTranslations();
    } catch (e) {
      toast.error("Erro ao salvar tradução");
    }
  };

  const handleDelete = async (key: string) => {
    const rowsToDelete = translations.filter(t => t.key === key);
    if (rowsToDelete.length > 0) {
      const ids = rowsToDelete.map(r => r.id);
      const { error } = await supabase.from("translations").delete().in("id", ids);
      if (error) { toast.error("Erro ao excluir"); return; }
      toast.success("Tradução excluída");
      loadTranslations();
    }
  };

  const openCreate = () => {
    setEditKey(null);
    setForm({ key: "", value_pt: "", value_en: "", page_id: filterPage !== "all" ? filterPage : "global" });
    setEditDialog(true);
  };

  const openEdit = (key: string) => {
    const tPt = getTranslation(key, "pt-BR");
    const tEn = getTranslation(key, "en");
    const dbRow = translations.find(t => t.key === key);
    
    setEditKey(key);
    setForm({ 
      key, 
      value_pt: tPt.source === "db" ? tPt.value : (tPt.source === "default" ? tPt.value : ""), 
      value_en: tEn.source === "db" ? tEn.value : (tEn.source === "default" ? tEn.value : ""), 
      page_id: dbRow?.page_id || "global"
    });
    setEditDialog(true);
  };

  // Merge default keys with DB translations for display
  const allKeys = new Set<string>();
  Object.values(defaultTranslations).forEach(dict => Object.keys(dict).forEach(k => allKeys.add(k)));
  translations.forEach(t => allKeys.add(t.key));

  const filtered = Array.from(allKeys)
    .filter(key => {
      if (search && !key.toLowerCase().includes(search.toLowerCase())) return false;
      
      const dbRow = translations.find(t => t.key === key);
      const rowPage = dbRow?.page_id || "global";
      
      if (filterPage !== "all" && rowPage !== filterPage) return false;
      
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

  const getPageName = (page_id?: string) => {
    if (!page_id || page_id === "global") return "Global";
    const page = pages.find(p => p.page_id === page_id);
    return page ? page.display_name : page_id;
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
          <div className="flex flex-col md:flex-row items-center gap-2">
            <div className="relative flex-1 w-full">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar chave..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background border-border"
              />
            </div>
            <div className="flex w-full md:w-auto gap-2">
              <Select value={filterPage} onValueChange={setFilterPage}>
                <SelectTrigger className="w-full md:w-[180px] bg-background border-border">
                  <div className="flex items-center gap-2">
                    <Filter className="h-3 w-3 text-muted-foreground" />
                    <SelectValue placeholder="Filtrar por BI" />
                  </div>
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os BIs</SelectItem>
                  <SelectItem value="global">Global</SelectItem>
                  {pages.map(p => (
                    <SelectItem key={p.page_id} value={p.page_id}>{p.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={filterLang} onValueChange={setFilterLang}>
                <SelectTrigger className="w-full md:w-[160px] bg-background border-border">
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
          </div>

          <div className="border border-border rounded-md overflow-auto max-h-[500px]">
            <Table>
              <TableHeader className="sticky top-0 bg-card z-10">
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground text-xs w-[25%]">Chave</TableHead>
                  <TableHead className="text-muted-foreground text-xs w-[15%]">Módulo / BI</TableHead>
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
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Carregando...</TableCell></TableRow>
                ) : filtered.length === 0 ? (
                  <TableRow><TableCell colSpan={5} className="text-center text-muted-foreground py-8">Nenhuma tradução encontrada</TableCell></TableRow>
                ) : filtered.map(key => {
                  const dbRow = translations.find(t => t.key === key);
                  const isCustom = !!dbRow;
                  const pageId = dbRow?.page_id || "global";
                  
                  return (
                    <TableRow key={key} className="border-border">
                      <TableCell className="font-mono text-xs text-foreground">{key}</TableCell>
                      <TableCell className="text-xs text-muted-foreground">
                        <span className="bg-secondary px-2 py-1 rounded-md">{getPageName(pageId)}</span>
                      </TableCell>
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
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => openEdit(key)}>
                            {isCustom ? <Pencil className="h-3 w-3" /> : <Plus className="h-3 w-3 text-primary" />}
                          </Button>
                          {isCustom && (
                            <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive" onClick={() => handleDelete(key)}>
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          )}
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      <Dialog open={editDialog} onOpenChange={setEditDialog}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="text-foreground">{editKey ? "Editar Tradução" : "Nova Tradução"}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">Chave (Termo original)</Label>
              <Input 
                value={form.key} 
                onChange={e => setForm(p => ({ ...p, key: e.target.value }))} 
                disabled={!!editKey}
                className="bg-background border-border font-mono text-sm" 
                placeholder="Ex: Expedidas" 
              />
            </div>
            
            <div>
              <Label className="text-muted-foreground text-xs mb-1.5 block">BI / Módulo Relacionado</Label>
              <Select value={form.page_id} onValueChange={v => setForm(p => ({ ...p, page_id: v }))}>
                <SelectTrigger className="bg-background border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="global">Global (Todos)</SelectItem>
                  {pages.map(p => (
                    <SelectItem key={p.page_id} value={p.page_id}>{p.display_name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div className="grid grid-cols-1 gap-4 pt-2 border-t border-border">
              <div>
                <Label className="text-foreground text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                  <span>🇧🇷</span> Português (Brasil)
                </Label>
                <Input 
                  value={form.value_pt} 
                  onChange={e => setForm(p => ({ ...p, value_pt: e.target.value }))} 
                  className="bg-background border-border" 
                  placeholder="Valor em português" 
                />
              </div>
              
              <div>
                <Label className="text-foreground text-xs font-semibold flex items-center gap-1.5 mb-1.5">
                  <span>🇺🇸</span> English
                </Label>
                <Input 
                  value={form.value_en} 
                  onChange={e => setForm(p => ({ ...p, value_en: e.target.value }))} 
                  className="bg-background border-border" 
                  placeholder="Value in english" 
                />
              </div>
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