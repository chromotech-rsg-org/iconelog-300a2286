import { useState, useRef, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Upload, Save, Image as ImageIcon, Building2, LayoutGrid, Copy, Loader2, Plus, Trash2, Link, Pencil, Search, ChevronDown, ChevronRight, Eye, EyeOff, Clock, Timer, ShieldCheck, ShieldAlert } from "lucide-react";
import { useBiSettings, BiSetting } from "@/hooks/useBiSettings";
import { toast } from "sonner";
import defaultLogo from "@/assets/logo.jpg";
import { supabase } from "@/integrations/supabase/client";

const BiChartConfigManager = lazy(() => import("@/components/admin/BiChartConfigManager"));

interface Client {
  id: string;
  cod_cli: string;
  nome: string;
  logo_url: string | null;
}

interface ApiIntegration {
  id: string;
  name: string;
  base_url: string | null;
}

interface Schedule {
  id: string;
  update_time: string;
  is_active: boolean;
  schedule_type: string;
  interval_minutes: number | null;
}

const ConfigurarBI = () => {
  const { settings, loading, uploadLogo, updateSetting, updateDisplayOrder, getSystemSetting, getOrderedBiSettings, refetch } = useBiSettings();

  // Modal state
  const [editingSetting, setEditingSetting] = useState<BiSetting | null>(null);
  const [modalOpen, setModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  // Modal form state
  const [formName, setFormName] = useState("");
  const [formSlug, setFormSlug] = useState("");
  const [formOrder, setFormOrder] = useState(0);
  const [formCodCli, setFormCodCli] = useState("");
  const [formCompany, setFormCompany] = useState("");
  const [formInterval, setFormInterval] = useState(30);

  // System logo
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [editingSystemName, setEditingSystemName] = useState("");
  const systemFileInputRef = useRef<HTMLInputElement | null>(null);
  const modalFileInputRef = useRef<HTMLInputElement | null>(null);

  // External data
  const [clients, setClients] = useState<Client[]>([]);
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);
  const [biApiLinks, setBiApiLinks] = useState<Record<string, Set<string>>>({});
  const [schedules, setSchedules] = useState<Record<string, Schedule[]>>({});
  const [newScheduleTime, setNewScheduleTime] = useState("");
  const [newScheduleType, setNewScheduleType] = useState("time");
  const [newIntervalMinutes, setNewIntervalMinutes] = useState(0);
  const [expandedCharts, setExpandedCharts] = useState(false);
  const [expandedSchedules, setExpandedSchedules] = useState(false);
  const [permissionStatus, setPermissionStatus] = useState<Record<string, boolean>>({});
  const [syncingPermission, setSyncingPermission] = useState<string | null>(null);

  const systemSetting = useMemo(() => getSystemSetting(), [getSystemSetting]);
  const orderedBiSettings = useMemo(() => getOrderedBiSettings(), [getOrderedBiSettings]);

  useEffect(() => {
    if (systemSetting) setEditingSystemName(systemSetting.display_name);
  }, [systemSetting]);

  useEffect(() => {
    const fetchAll = async () => {
      const [clientsRes, intRes, linksRes, schedRes] = await Promise.all([
        supabase.from("clients").select("id, cod_cli, nome, logo_url").eq("ativo", true).order("nome"),
        supabase.from("api_integrations").select("id, name, base_url").order("name"),
        supabase.from("bi_api_integrations").select("bi_page_id, api_integration_id"),
        supabase.from("bi_scheduled_updates").select("*").order("update_time"),
      ]);
      setClients((clientsRes.data as Client[]) || []);
      setIntegrations(intRes.data || []);
      const links: Record<string, Set<string>> = {};
      (linksRes.data || []).forEach((r: any) => {
        if (!links[r.bi_page_id]) links[r.bi_page_id] = new Set();
        links[r.bi_page_id].add(r.api_integration_id);
      });
      setBiApiLinks(links);
      const grouped: Record<string, Schedule[]> = {};
      (schedRes.data || []).forEach((r: any) => {
        if (!grouped[r.page_id]) grouped[r.page_id] = [];
        grouped[r.page_id].push({ id: r.id, update_time: r.update_time, is_active: r.is_active, schedule_type: r.schedule_type || "time", interval_minutes: r.interval_minutes || null });
      });
      setSchedules(grouped);
    };
    fetchAll();
  }, []);

  const filteredSettings = useMemo(() => {
    if (!searchQuery) return orderedBiSettings;
    const q = searchQuery.toLowerCase();
    return orderedBiSettings.filter(s =>
      s.display_name.toLowerCase().includes(q) ||
      s.page_id.toLowerCase().includes(q) ||
      (s.slug || "").toLowerCase().includes(q) ||
      (s.company_name || "").toLowerCase().includes(q)
    );
  }, [orderedBiSettings, searchQuery]);

  const openEditModal = (setting: BiSetting) => {
    setEditingSetting(setting);
    setFormName(setting.display_name);
    setFormSlug(setting.slug || "");
    setFormOrder(setting.display_order);
    setFormCodCli(setting.cod_cli || "");
    setFormCompany(setting.company_name || "");
    setFormInterval(setting.refresh_interval_minutes ?? 30);
    setExpandedCharts(false);
    setExpandedSchedules(false);
    setNewScheduleTime("");
    setNewScheduleType("time");
    setNewIntervalMinutes(0);
    setModalOpen(true);
  };

  const handleModalSave = async () => {
    if (!editingSetting) return;
    setSaving(true);
    const pageId = editingSetting.page_id;
    const { error } = await supabase.from("bi_settings").update({
      display_name: formName.trim(),
      slug: formSlug.trim() || null,
      display_order: formOrder,
      cod_cli: formCodCli || null,
      company_name: formCompany || null,
      refresh_interval_minutes: formInterval,
    }).eq("page_id", pageId);
    setSaving(false);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Configuração salva!");
    setModalOpen(false);
    refetch();
  };

  const handleDelete = async (pageId: string) => {
    const { error } = await supabase.from("bi_settings").delete().eq("page_id", pageId);
    if (error) { toast.error("Erro ao deletar: " + error.message); return; }
    toast.success("BI removido!");
    setModalOpen(false);
    refetch();
  };

  const handleDuplicate = async (setting: BiSetting) => {
    const newPageId = `${setting.page_id}-copy-${Date.now()}`;
    const { error } = await supabase.from("bi_settings").insert({
      page_id: newPageId, display_name: `${setting.display_name} (Cópia)`,
      logo_url: setting.logo_url, display_order: (setting.display_order || 0) + 1,
      cod_cli: setting.cod_cli, company_name: setting.company_name,
    });
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("BI duplicado!");
    refetch();
  };

  const handleFileChange = async (pageId: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Selecione uma imagem"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("Máximo 2MB"); return; }
    setUploading(pageId);
    const result = await uploadLogo(pageId, file);
    setUploading(null);
    if (result.success) { toast.success("Logo atualizado!"); refetch(); }
    else toast.error("Erro ao enviar logo");
  };

  const handleSystemNameSave = async () => {
    if (!editingSystemName?.trim()) return;
    setSaving(true);
    await updateSetting("system", { display_name: editingSystemName.trim() });
    setSaving(false);
    toast.success("Nome atualizado!");
  };

  const handleClientSelect = (codCli: string) => {
    const client = clients.find(c => c.cod_cli === codCli);
    if (client) {
      setFormCodCli(client.cod_cli);
      setFormCompany(client.nome);
    }
  };

  const handleToggleApi = async (pageId: string, apiId: string, checked: boolean) => {
    if (checked) {
      await supabase.from("bi_api_integrations").insert({ bi_page_id: pageId, api_integration_id: apiId } as any);
    } else {
      await supabase.from("bi_api_integrations").delete().eq("bi_page_id", pageId).eq("api_integration_id", apiId);
    }
    setBiApiLinks(prev => {
      const next = { ...prev };
      if (!next[pageId]) next[pageId] = new Set();
      else next[pageId] = new Set(next[pageId]);
      if (checked) next[pageId].add(apiId); else next[pageId].delete(apiId);
      return next;
    });
  };

  const handleAddSchedule = async (pageId: string) => {
    if (newScheduleType === "time" && !newScheduleTime) { toast.error("Selecione um horário"); return; }
    if (newScheduleType === "interval" && (!newIntervalMinutes || newIntervalMinutes < 1)) { toast.error("Informe o intervalo"); return; }
    const insert = newScheduleType === "time"
      ? { page_id: pageId, update_time: newScheduleTime, schedule_type: "time" }
      : { page_id: pageId, update_time: "00:00", schedule_type: "interval", interval_minutes: newIntervalMinutes };
    const { error } = await supabase.from("bi_scheduled_updates").insert(insert as any);
    if (error) { toast.error("Erro: " + error.message); return; }
    toast.success("Agendamento adicionado!");
    setNewScheduleTime(""); setNewIntervalMinutes(0);
    const { data } = await supabase.from("bi_scheduled_updates").select("*").eq("page_id", pageId).order("update_time");
    setSchedules(prev => ({ ...prev, [pageId]: (data || []).map((r: any) => ({ id: r.id, update_time: r.update_time, is_active: r.is_active, schedule_type: r.schedule_type || "time", interval_minutes: r.interval_minutes || null })) }));
  };

  const handleRemoveSchedule = async (pageId: string, scheduleId: string) => {
    await supabase.from("bi_scheduled_updates").delete().eq("id", scheduleId);
    setSchedules(prev => ({ ...prev, [pageId]: (prev[pageId] || []).filter(s => s.id !== scheduleId) }));
    toast.success("Agendamento removido!");
  };

  const handleToggleSchedule = async (pageId: string, scheduleId: string, isActive: boolean) => {
    await supabase.from("bi_scheduled_updates").update({ is_active: isActive } as any).eq("id", scheduleId);
    setSchedules(prev => ({ ...prev, [pageId]: (prev[pageId] || []).map(s => s.id === scheduleId ? { ...s, is_active: isActive } : s) }));
  };

  const getPageLabel = (pageId: string) => {
    const labels: Record<string, string> = {
      minutas: "Minutas", estoque: "Estoque", entregas: "Entregas", tracking: "Tracking",
      "estoque-consolidado": "Est. Consolidado", faturamento: "Faturamento", analitico: "Analítico",
    };
    return labels[pageId] || pageId;
  };

  if (loading) {
    return (
      <div className="space-y-4">
        {[1, 2, 3].map(i => <Skeleton key={i} className="h-12 w-full" />)}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* System Settings */}
      <Card className="bg-dashboard-card border-dashboard-accent/30">
        <CardHeader className="pb-3">
          <div className="flex items-center gap-3">
            <Building2 className="h-5 w-5 text-dashboard-accent" />
            <div>
              <CardTitle className="text-lg text-foreground">Logo do Sistema</CardTitle>
              <CardDescription className="text-muted-foreground">Logo usado nas telas de Login e Administração</CardDescription>
            </div>
            <Badge className="ml-auto bg-dashboard-accent/20 text-dashboard-accent border-dashboard-accent/30">Global</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-6 items-start">
            <div className="flex items-center gap-4">
              <div className="relative group">
                <Avatar className="h-20 w-20 rounded-lg border-2 border-dashboard-accent/50">
                  <AvatarImage src={systemSetting?.logo_url || defaultLogo} alt="Logo" className="object-cover" />
                  <AvatarFallback className="rounded-lg bg-dashboard-border"><ImageIcon className="h-8 w-8 text-muted-foreground" /></AvatarFallback>
                </Avatar>
                <input type="file" accept="image/*" className="hidden" ref={systemFileInputRef}
                  onChange={(e) => handleFileChange("system", e.target.files?.[0] || null)} />
                <Button variant="ghost" size="icon"
                  className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/80"
                  onClick={() => systemFileInputRef.current?.click()} disabled={uploading === "system"}>
                  {uploading === "system" ? <div className="h-4 w-4 border-2 border-dashboard-dark border-t-transparent rounded-full animate-spin" /> : <Upload className="h-4 w-4" />}
                </Button>
              </div>
              <div>
                <p className="text-sm text-foreground font-medium">Logo Principal</p>
                <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
              </div>
            </div>
            <div className="flex-1 space-y-2">
              <Label className="text-sm text-muted-foreground">Nome do Sistema</Label>
              <div className="flex gap-2">
                <Input value={editingSystemName} onChange={(e) => setEditingSystemName(e.target.value)}
                  className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Nome do sistema" />
                <Button variant="outline" className="border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark"
                  onClick={handleSystemNameSave} disabled={saving || editingSystemName === systemSetting?.display_name}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BI Settings DataTable */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <LayoutGrid className="h-5 w-5 text-dashboard-accent" />
          <div>
            <h2 className="text-lg font-semibold text-foreground">Configurações dos BIs</h2>
            <p className="text-sm text-muted-foreground">Gerencie BIs em tabela com edição em modal</p>
          </div>
        </div>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Buscar BI..." className="pl-9 bg-dashboard-dark border-dashboard-border text-foreground h-9" />
        </div>
      </div>

      <Card className="bg-dashboard-card border-dashboard-border">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border">
                <TableHead className="text-muted-foreground w-16">Ordem</TableHead>
                <TableHead className="text-muted-foreground w-16">Logo</TableHead>
                <TableHead className="text-muted-foreground">Nome</TableHead>
                <TableHead className="text-muted-foreground">Slug</TableHead>
                <TableHead className="text-muted-foreground">Empresa</TableHead>
                <TableHead className="text-muted-foreground">Cód. Cliente</TableHead>
                <TableHead className="text-muted-foreground text-center">Intervalo</TableHead>
                <TableHead className="text-muted-foreground text-center">Agendamento</TableHead>
                <TableHead className="text-muted-foreground text-right">Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSettings.map((setting) => (
                <TableRow key={setting.id} className="border-dashboard-border hover:bg-dashboard-border/30">
                  <TableCell className="text-foreground font-mono text-center">{setting.display_order}</TableCell>
                  <TableCell>
                    {(() => {
                      const client = setting.cod_cli ? clients.find(c => c.cod_cli === setting.cod_cli) : null;
                      const logoSrc = setting.logo_url || client?.logo_url || defaultLogo;
                      return (
                        <Avatar className="h-8 w-8 rounded">
                          <AvatarImage src={logoSrc} alt={setting.display_name} className="object-cover" />
                          <AvatarFallback className="rounded bg-dashboard-border text-xs"><ImageIcon className="h-3 w-3" /></AvatarFallback>
                        </Avatar>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-foreground font-medium">{setting.display_name}</TableCell>
                  <TableCell className="text-muted-foreground font-mono text-xs">/{setting.slug || setting.page_id}</TableCell>
                  <TableCell className="text-muted-foreground">{setting.company_name || "-"}</TableCell>
                  <TableCell className="text-muted-foreground font-mono">{setting.cod_cli || "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-center">{setting.refresh_interval_minutes}min</TableCell>
                  <TableCell className="text-center">
                    {(() => {
                      const pageSchedules = schedules[setting.page_id] || [];
                      if (pageSchedules.length === 0) return <span className="text-muted-foreground text-xs">—</span>;
                      const activeCount = pageSchedules.filter(s => s.is_active).length;
                      return (
                        <div className="flex flex-col items-center gap-0.5">
                          {pageSchedules.filter(s => s.is_active).map((s, i) => (
                            <Badge key={i} variant="outline" className="text-[10px] px-1.5 py-0 border-dashboard-accent/40 text-dashboard-accent">
                              {s.schedule_type === "interval" ? (
                                <><Timer className="h-2.5 w-2.5 mr-0.5" />{s.interval_minutes}min</>
                              ) : (
                                <><Clock className="h-2.5 w-2.5 mr-0.5" />{s.update_time?.substring(0, 5)}</>
                              )}
                            </Badge>
                          ))}
                          {pageSchedules.some(s => !s.is_active) && (
                            <span className="text-[9px] text-muted-foreground">{pageSchedules.length - activeCount} inativo(s)</span>
                          )}
                        </div>
                      );
                    })()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Editar" onClick={() => openEditModal(setting)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicar" onClick={() => handleDuplicate(setting)}>
                        <Copy className="h-3.5 w-3.5" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" title="Deletar">
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent className="bg-dashboard-card border-dashboard-border">
                          <AlertDialogHeader>
                            <AlertDialogTitle className="text-foreground">Deletar BI</AlertDialogTitle>
                            <AlertDialogDescription>Tem certeza que deseja deletar "{setting.display_name}"? Esta ação não pode ser desfeita.</AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel className="border-dashboard-border">Cancelar</AlertDialogCancel>
                            <AlertDialogAction className="bg-destructive text-destructive-foreground" onClick={() => handleDelete(setting.page_id)}>Deletar</AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
              {filteredSettings.length === 0 && (
                <TableRow>
                  <TableCell colSpan={9} className="text-center text-muted-foreground py-8">Nenhum BI encontrado</TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Edit Modal */}
      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border max-w-2xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              <Pencil className="h-4 w-4 text-dashboard-accent" />
              Editar: {editingSetting?.display_name}
            </DialogTitle>
          </DialogHeader>

          {editingSetting && (
            <div className="space-y-4">
              {/* Logo */}
              <div className="flex items-center gap-4">
                <div className="relative">
                  <Avatar className="h-16 w-16 rounded-lg border-2 border-dashboard-border">
                    <AvatarImage src={editingSetting.logo_url || defaultLogo} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-dashboard-border"><ImageIcon className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <input type="file" accept="image/*" className="hidden" ref={modalFileInputRef}
                    onChange={(e) => handleFileChange(editingSetting.page_id, e.target.files?.[0] || null)} />
                  <Button variant="ghost" size="icon"
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-dashboard-accent text-dashboard-dark"
                    onClick={() => modalFileInputRef.current?.click()} disabled={uploading === editingSetting.page_id}>
                    {uploading === editingSetting.page_id ? <Loader2 className="h-3 w-3 animate-spin" /> : <Upload className="h-3 w-3" />}
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Logo do BI</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
                </div>
              </div>

              {/* Basic fields */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome de exibição</Label>
                  <Input value={formName} onChange={(e) => setFormName(e.target.value)}
                    className="bg-dashboard-dark border-dashboard-border text-foreground h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Ordem no menu</Label>
                  <Input type="number" min={0} value={formOrder}
                    onChange={(e) => setFormOrder(parseInt(e.target.value) || 0)}
                    className="bg-dashboard-dark border-dashboard-border text-foreground h-9" />
                </div>
              </div>

              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground flex items-center gap-1"><Link className="h-3 w-3" /> Slug (endereço)</Label>
                <Input value={formSlug}
                  onChange={(e) => setFormSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ""))}
                  className="bg-dashboard-dark border-dashboard-border text-foreground h-9" placeholder="ex: entregas" />
                <p className="text-[10px] text-muted-foreground/60">/{formSlug || editingSetting.page_id}</p>
              </div>

              {/* Empresa */}
              <div className="space-y-1">
                <Label className="text-xs text-muted-foreground">Empresa</Label>
                <Select value={formCodCli} onValueChange={handleClientSelect}>
                  <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground h-9">
                    <SelectValue placeholder="Selecione uma empresa" />
                  </SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-dashboard-border">
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.cod_cli}>
                        <div className="flex items-center gap-2">
                          {c.logo_url && <img src={c.logo_url} className="h-4 w-4 rounded object-cover" />}
                          <span>{c.nome}</span>
                          <span className="text-muted-foreground text-xs">({c.cod_cli})</span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Cód. Cliente</Label>
                  <Input value={formCodCli} onChange={(e) => setFormCodCli(e.target.value)}
                    className="bg-dashboard-dark border-dashboard-border text-foreground h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome Empresa</Label>
                  <Input value={formCompany} onChange={(e) => setFormCompany(e.target.value)}
                    className="bg-dashboard-dark border-dashboard-border text-foreground h-9" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Intervalo (min)</Label>
                  <Input type="number" min={0} value={formInterval}
                    onChange={(e) => setFormInterval(parseInt(e.target.value) || 0)}
                    className="bg-dashboard-dark border-dashboard-border text-foreground h-9" />
                </div>
              </div>

              {/* APIs */}
              <div className="space-y-2">
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setExpandedSchedules(false)}>
                  APIs Utilizadas
                </Button>
                <div className="space-y-1 max-h-[120px] overflow-y-auto">
                  {integrations.map(api => (
                    <div key={api.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-dashboard-dark/50">
                      <Checkbox id={`modal-${api.id}`}
                        checked={biApiLinks[editingSetting.page_id]?.has(api.id) || false}
                        onCheckedChange={(checked) => handleToggleApi(editingSetting.page_id, api.id, !!checked)} />
                      <label htmlFor={`modal-${api.id}`} className="text-xs text-foreground cursor-pointer flex-1">{api.name}</label>
                      <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{api.base_url || ""}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Schedules */}
              <div className="space-y-2 border-t border-dashboard-border pt-3">
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setExpandedSchedules(!expandedSchedules)}>
                  {expandedSchedules ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                  Atualizações Agendadas
                </Button>
                {expandedSchedules && (
                  <div className="space-y-2">
                    <div className="flex gap-1 mb-1">
                      <Button variant={newScheduleType === "time" ? "default" : "outline"} size="sm"
                        className="h-7 text-xs flex-1" onClick={() => setNewScheduleType("time")}>Por Horário</Button>
                      <Button variant={newScheduleType === "interval" ? "default" : "outline"} size="sm"
                        className="h-7 text-xs flex-1" onClick={() => setNewScheduleType("interval")}>Por Intervalo</Button>
                    </div>
                    <div className="flex gap-2">
                      {newScheduleType === "time" ? (
                        <Input type="time" value={newScheduleTime} onChange={(e) => setNewScheduleTime(e.target.value)}
                          className="bg-dashboard-dark border-dashboard-border text-foreground h-8 flex-1" />
                      ) : (
                        <div className="flex items-center gap-1 flex-1">
                          <Input type="number" min={1} max={1440} value={newIntervalMinutes || ""}
                            onChange={(e) => setNewIntervalMinutes(parseInt(e.target.value) || 0)}
                            className="bg-dashboard-dark border-dashboard-border text-foreground h-8 w-20" placeholder="Min" />
                          <span className="text-xs text-muted-foreground">minutos</span>
                        </div>
                      )}
                      <Button variant="outline" size="sm" className="h-8 text-xs border-dashboard-border"
                        onClick={() => handleAddSchedule(editingSetting.page_id)}>
                        <Plus className="h-3 w-3 mr-1" /> Adicionar
                      </Button>
                    </div>
                    {(schedules[editingSetting.page_id] || []).map(schedule => (
                      <div key={schedule.id} className="flex items-center gap-2 px-2 py-1 rounded bg-dashboard-dark/30">
                        <span className="text-sm text-foreground font-mono flex-1">
                          {schedule.schedule_type === "interval" ? `A cada ${schedule.interval_minutes} min` : schedule.update_time.substring(0, 5)}
                        </span>
                        <Switch checked={schedule.is_active} onCheckedChange={(checked) => handleToggleSchedule(editingSetting.page_id, schedule.id, checked)} />
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive"
                          onClick={() => handleRemoveSchedule(editingSetting.page_id, schedule.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Charts */}
              <div className="space-y-2 border-t border-dashboard-border pt-3">
                <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground hover:text-foreground"
                  onClick={() => setExpandedCharts(!expandedCharts)}>
                  {expandedCharts ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                  Configurar Gráficos
                </Button>
                {expandedCharts && (
                  <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin text-dashboard-accent mx-auto" />}>
                    <BiChartConfigManager pageId={editingSetting.page_id} pageName={editingSetting.display_name} />
                  </Suspense>
                )}
              </div>
            </div>
          )}

          <DialogFooter className="gap-2">
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button variant="destructive" size="sm"><Trash2 className="h-3.5 w-3.5 mr-1" /> Deletar</Button>
              </AlertDialogTrigger>
              <AlertDialogContent className="bg-dashboard-card border-dashboard-border">
                <AlertDialogHeader>
                  <AlertDialogTitle className="text-foreground">Deletar BI</AlertDialogTitle>
                  <AlertDialogDescription>Tem certeza? Esta ação não pode ser desfeita.</AlertDialogDescription>
                </AlertDialogHeader>
                <AlertDialogFooter>
                  <AlertDialogCancel className="border-dashboard-border">Cancelar</AlertDialogCancel>
                  <AlertDialogAction className="bg-destructive text-destructive-foreground"
                    onClick={() => editingSetting && handleDelete(editingSetting.page_id)}>Deletar</AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
            <Button variant="outline" className="border-dashboard-border" onClick={() => setModalOpen(false)}>Cancelar</Button>
            <Button className="bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/80" onClick={handleModalSave} disabled={saving}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin mr-1" /> : <Save className="h-4 w-4 mr-1" />}
              Salvar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ConfigurarBI;
