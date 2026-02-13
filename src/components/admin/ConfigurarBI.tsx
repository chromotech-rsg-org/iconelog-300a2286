import { useState, useRef, useEffect, useMemo, lazy, Suspense, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Switch } from "@/components/ui/switch";
import { Upload, Save, Image as ImageIcon, Building2, LayoutGrid, Copy, ChevronDown, ChevronRight, Loader2, Plus, Trash2 } from "lucide-react";
import { useBiSettings } from "@/hooks/useBiSettings";
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

const ConfigurarBI = () => {
  const { settings, loading, uploadLogo, updateSetting, updateDisplayOrder, getSystemSetting, getOrderedBiSettings, refetch } = useBiSettings();
  const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [editingOrders, setEditingOrders] = useState<Record<string, number>>({});
  const [editingCodCli, setEditingCodCli] = useState<Record<string, string>>({});
  const [editingCompany, setEditingCompany] = useState<Record<string, string>>({});
  const [editingRefreshInterval, setEditingRefreshInterval] = useState<Record<string, number>>({});
  const [uploading, setUploading] = useState<string | null>(null);
  const [saving, setSaving] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState<string | null>(null);
  const [duplicating, setDuplicating] = useState<string | null>(null);
  const [expandedCharts, setExpandedCharts] = useState<Record<string, boolean>>({});
  const [expandedSchedules, setExpandedSchedules] = useState<Record<string, boolean>>({});
  const [schedules, setSchedules] = useState<Record<string, { id: string; update_time: string; is_active: boolean }[]>>({});
  const [newScheduleTime, setNewScheduleTime] = useState<Record<string, string>>({});
  const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const systemFileInputRef = useRef<HTMLInputElement | null>(null);

  // API integrations linked to BIs
  const [biApiLinks, setBiApiLinks] = useState<Record<string, Set<string>>>({});

  // Clients and integrations for selects
  const [clients, setClients] = useState<Client[]>([]);
  const [integrations, setIntegrations] = useState<ApiIntegration[]>([]);

  const systemSetting = useMemo(() => getSystemSetting(), [getSystemSetting]);
  const orderedBiSettings = useMemo(() => getOrderedBiSettings(), [getOrderedBiSettings]);

  useEffect(() => {
    const fetchClients = async () => {
      const { data } = await supabase.from("clients").select("id, cod_cli, nome, logo_url").eq("ativo", true).order("nome");
      setClients((data as Client[]) || []);
    };
    const fetchIntegrations = async () => {
      const { data } = await supabase.from("api_integrations").select("id, name, base_url").order("name");
      setIntegrations(data || []);
    };
    const fetchBiApiLinks = async () => {
      const { data } = await supabase.from("bi_api_integrations").select("bi_page_id, api_integration_id");
      const links: Record<string, Set<string>> = {};
      (data || []).forEach((row: any) => {
        if (!links[row.bi_page_id]) links[row.bi_page_id] = new Set();
        links[row.bi_page_id].add(row.api_integration_id);
      });
      setBiApiLinks(links);
    };
    const fetchSchedules = async () => {
      const { data } = await supabase.from("bi_scheduled_updates").select("*").order("update_time");
      const grouped: Record<string, { id: string; update_time: string; is_active: boolean }[]> = {};
      (data || []).forEach((row: any) => {
        if (!grouped[row.page_id]) grouped[row.page_id] = [];
        grouped[row.page_id].push({ id: row.id, update_time: row.update_time, is_active: row.is_active });
      });
      setSchedules(grouped);
    };
    fetchClients();
    fetchIntegrations();
    fetchBiApiLinks();
    fetchSchedules();
  }, []);

  useEffect(() => {
    const names: Record<string, string> = {};
    const orders: Record<string, number> = {};
    const codClis: Record<string, string> = {};
    const companies: Record<string, string> = {};
    const intervals: Record<string, number> = {};
    settings.forEach((s: any) => {
      names[s.page_id] = s.display_name;
      orders[s.page_id] = s.display_order;
      codClis[s.page_id] = s.cod_cli || "";
      companies[s.page_id] = s.company_name || "";
      intervals[s.page_id] = s.refresh_interval_minutes ?? 30;
    });
    setEditingNames(names);
    setEditingOrders(orders);
    setEditingCodCli(codClis);
    setEditingCompany(companies);
    setEditingRefreshInterval(intervals);
  }, [settings]);

  const handleFileChange = async (pageId: string, file: File | null) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) { toast.error("Por favor, selecione uma imagem"); return; }
    if (file.size > 2 * 1024 * 1024) { toast.error("A imagem deve ter no máximo 2MB"); return; }
    setUploading(pageId);
    const result = await uploadLogo(pageId, file);
    setUploading(null);
    if (result.success) toast.success("Logo atualizado com sucesso!");
    else toast.error("Erro ao enviar logo");
  };

  const handleNameSave = async (pageId: string) => {
    const newName = editingNames[pageId];
    if (!newName?.trim()) { toast.error("O nome não pode ser vazio"); return; }
    setSaving(pageId);
    const result = await updateSetting(pageId, { display_name: newName.trim() });
    setSaving(null);
    if (result.success) toast.success("Nome atualizado!");
    else toast.error("Erro ao atualizar nome");
  };

  const handleOrderSave = async (pageId: string) => {
    const order = editingOrders[pageId];
    if (order === undefined || order < 0) { toast.error("A ordem deve ser um número positivo"); return; }
    setSavingOrder(pageId);
    const result = await updateDisplayOrder(pageId, order);
    setSavingOrder(null);
    if (result.success) toast.success("Ordem atualizada!");
    else toast.error("Erro ao atualizar ordem");
  };

  const handleClientSelect = (pageId: string, codCli: string) => {
    const client = clients.find(c => c.cod_cli === codCli);
    if (client) {
      setEditingCodCli(prev => ({ ...prev, [pageId]: client.cod_cli }));
      setEditingCompany(prev => ({ ...prev, [pageId]: client.nome }));
      // Auto-fill logo if client has one
      if (client.logo_url) {
        handleAutoLogo(pageId, client.logo_url);
      }
    }
  };

  const handleAutoLogo = async (pageId: string, logoUrl: string) => {
    const { error } = await supabase.from("bi_settings").update({ logo_url: logoUrl }).eq("page_id", pageId);
    if (!error) {
      refetch();
    }
  };

  const handleExtraSave = async (pageId: string) => {
    setSaving(pageId);
    const { error } = await supabase.from("bi_settings").update({
      cod_cli: editingCodCli[pageId] || null,
      company_name: editingCompany[pageId] || null,
      refresh_interval_minutes: editingRefreshInterval[pageId] ?? 30,
    }).eq("page_id", pageId);
    setSaving(null);
    if (error) toast.error("Erro ao salvar: " + error.message);
    else { toast.success("Dados atualizados!"); refetch(); }
  };

  const handleAddSchedule = async (pageId: string) => {
    const time = newScheduleTime[pageId];
    if (!time) { toast.error("Selecione um horário"); return; }
    const { error } = await supabase.from("bi_scheduled_updates").insert({ page_id: pageId, update_time: time } as any);
    if (error) {
      if (error.message.includes("unique")) toast.error("Horário já cadastrado");
      else toast.error("Erro: " + error.message);
      return;
    }
    toast.success("Agendamento adicionado!");
    setNewScheduleTime(prev => ({ ...prev, [pageId]: "" }));
    // Refresh schedules
    const { data } = await supabase.from("bi_scheduled_updates").select("*").eq("page_id", pageId).order("update_time");
    setSchedules(prev => ({ ...prev, [pageId]: (data || []).map((r: any) => ({ id: r.id, update_time: r.update_time, is_active: r.is_active })) }));
  };

  const handleRemoveSchedule = async (pageId: string, scheduleId: string) => {
    await supabase.from("bi_scheduled_updates").delete().eq("id", scheduleId);
    setSchedules(prev => ({ ...prev, [pageId]: (prev[pageId] || []).filter(s => s.id !== scheduleId) }));
    toast.success("Agendamento removido!");
  };

  const handleToggleSchedule = async (pageId: string, scheduleId: string, isActive: boolean) => {
    await supabase.from("bi_scheduled_updates").update({ is_active: isActive } as any).eq("id", scheduleId);
    setSchedules(prev => ({
      ...prev,
      [pageId]: (prev[pageId] || []).map(s => s.id === scheduleId ? { ...s, is_active: isActive } : s),
    }));
  };

  const handleDuplicate = async (setting: any) => {
    setDuplicating(setting.page_id);
    try {
      const newPageId = `${setting.page_id}-copy-${Date.now()}`;
      const { error } = await supabase.from("bi_settings").insert({
        page_id: newPageId,
        display_name: `${setting.display_name} (Cópia)`,
        logo_url: setting.logo_url,
        display_order: (setting.display_order || 0) + 1,
        cod_cli: setting.cod_cli,
        company_name: setting.company_name,
      });
      if (error) throw error;
      toast.success("BI duplicado com sucesso!");
      await refetch();
    } catch (err: any) {
      toast.error("Erro ao duplicar: " + err.message);
    } finally {
      setDuplicating(null);
    }
  };

  const getPageLabel = (pageId: string) => {
    const labels: Record<string, string> = {
      minutas: "Minutas", estoque: "Estoque", entregas: "Entregas", tracking: "Tracking",
      "estoque-consolidado": "Est. Consolidado", faturamento: "Faturamento", analitico: "Analítico", system: "Sistema",
    };
    return labels[pageId] || pageId;
  };

  const getCurrentSetting = (pageId: string) => settings.find(s => s.page_id === pageId);

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="bg-dashboard-card border-dashboard-border">
            <CardContent className="p-4">
              <Skeleton className="h-12 w-12 rounded-lg mb-4" />
              <Skeleton className="h-4 w-3/4 mb-2" />
              <Skeleton className="h-10 w-full" />
            </CardContent>
          </Card>
        ))}
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
                <Input value={editingNames["system"] || ""} onChange={(e) => setEditingNames((prev) => ({ ...prev, system: e.target.value }))}
                  className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Nome do sistema" />
                <Button variant="outline" className="border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark"
                  onClick={() => handleNameSave("system")} disabled={saving === "system" || editingNames["system"] === systemSetting?.display_name}>
                  {saving === "system" ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* BI Settings */}
      <div className="flex items-center gap-3">
        <LayoutGrid className="h-5 w-5 text-dashboard-accent" />
        <div>
          <h2 className="text-lg font-semibold text-foreground">Configurações dos BIs</h2>
          <p className="text-sm text-muted-foreground">Configure logos, nomes, empresa, APIs e gráficos</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {orderedBiSettings.map((setting) => (
          <Card key={setting.id} className="bg-dashboard-card border-dashboard-border hover:border-dashboard-accent/50 transition-colors">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <Badge variant="outline" className="text-xs">{getPageLabel(setting.page_id)}</Badge>
                <div className="flex items-center gap-1">
                  <Badge variant="secondary" className="text-xs bg-dashboard-border">Ordem: {setting.display_order}</Badge>
                  <Button variant="ghost" size="icon" className="h-7 w-7" title="Duplicar BI"
                    onClick={() => handleDuplicate(setting)} disabled={duplicating === setting.page_id}>
                    {duplicating === setting.page_id ? <div className="h-3 w-3 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Copy className="h-3 w-3" />}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="relative group">
                  <Avatar className="h-14 w-14 rounded-lg border-2 border-dashboard-border">
                    <AvatarImage src={setting.logo_url || defaultLogo} alt={setting.display_name} className="object-cover" />
                    <AvatarFallback className="rounded-lg bg-dashboard-border"><ImageIcon className="h-6 w-6 text-muted-foreground" /></AvatarFallback>
                  </Avatar>
                  <input type="file" accept="image/*" className="hidden" ref={(el) => (fileInputRefs.current[setting.page_id] = el)}
                    onChange={(e) => handleFileChange(setting.page_id, e.target.files?.[0] || null)} />
                  <Button variant="ghost" size="icon"
                    className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/80"
                    onClick={() => fileInputRefs.current[setting.page_id]?.click()} disabled={uploading === setting.page_id}>
                    {uploading === setting.page_id ? <div className="h-3 w-3 border-2 border-dashboard-dark border-t-transparent rounded-full animate-spin" /> : <Upload className="h-3 w-3" />}
                  </Button>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-muted-foreground mb-1">Logo do BI</p>
                  <p className="text-xs text-muted-foreground/60">PNG, JPG até 2MB</p>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Nome de exibição</Label>
                <div className="flex gap-2">
                  <Input value={editingNames[setting.page_id] || ""} onChange={(e) => setEditingNames((prev) => ({ ...prev, [setting.page_id]: e.target.value }))}
                    className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-9" placeholder="Nome do BI" />
                  <Button variant="outline" size="icon" className="h-9 w-9 border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark"
                    onClick={() => handleNameSave(setting.page_id)} disabled={saving === setting.page_id || editingNames[setting.page_id] === getCurrentSetting(setting.page_id)?.display_name}>
                    {saving === setting.page_id ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Ordem no menu</Label>
                <div className="flex gap-2">
                  <Input type="number" min={0} value={editingOrders[setting.page_id] ?? 0}
                    onChange={(e) => setEditingOrders((prev) => ({ ...prev, [setting.page_id]: parseInt(e.target.value) || 0 }))}
                    className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-9 w-20" />
                  <Button variant="outline" size="icon" className="h-9 w-9 border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark"
                    onClick={() => handleOrderSave(setting.page_id)} disabled={savingOrder === setting.page_id || editingOrders[setting.page_id] === getCurrentSetting(setting.page_id)?.display_order}>
                    {savingOrder === setting.page_id ? <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="h-4 w-4" />}
                  </Button>
                </div>
              </div>

              {/* Empresa - Select from clients */}
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground">Empresa</Label>
                <Select value={editingCodCli[setting.page_id] || ""} onValueChange={(v) => handleClientSelect(setting.page_id, v)}>
                  <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-9">
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
                  <Input value={editingCodCli[setting.page_id] || ""} onChange={(e) => setEditingCodCli(prev => ({ ...prev, [setting.page_id]: e.target.value }))}
                    className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-9" placeholder="Ex: PAY" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Nome Empresa</Label>
                  <Input value={editingCompany[setting.page_id] || ""} onChange={(e) => setEditingCompany(prev => ({ ...prev, [setting.page_id]: e.target.value }))}
                    className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-9" placeholder="Nome da empresa" />
                </div>
                <div className="space-y-1">
                  <Label className="text-xs text-muted-foreground">Intervalo (min)</Label>
                  <Input type="number" min={0} value={editingRefreshInterval[setting.page_id] ?? 30}
                    onChange={(e) => setEditingRefreshInterval(prev => ({ ...prev, [setting.page_id]: parseInt(e.target.value) || 0 }))}
                    className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-9" placeholder="30" title="Intervalo mínimo entre atualizações manuais (minutos). 0 = sem limite." />
                </div>
              </div>

              <Button variant="outline" size="sm" className="w-full h-7 text-xs border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark"
                onClick={() => handleExtraSave(setting.page_id)}>
                <Save className="h-3 w-3 mr-1" /> Salvar Empresa/Cód/Intervalo
              </Button>

              {/* APIs usadas - multi-select via checkboxes */}
              <Collapsible>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground hover:text-foreground">
                    <ChevronRight className="h-3 w-3 mr-1" />
                    APIs Utilizadas
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-1">
                  {integrations.length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center">Cadastre integrações primeiro</p>
                  ) : (
                    integrations.map(api => {
                      const isChecked = biApiLinks[setting.page_id]?.has(api.id) || false;
                      const handleToggle = async (checked: boolean) => {
                        if (checked) {
                          await supabase.from("bi_api_integrations").insert({ bi_page_id: setting.page_id, api_integration_id: api.id } as any);
                        } else {
                          await supabase.from("bi_api_integrations").delete().eq("bi_page_id", setting.page_id).eq("api_integration_id", api.id);
                        }
                        setBiApiLinks(prev => {
                          const next = { ...prev };
                          if (!next[setting.page_id]) next[setting.page_id] = new Set();
                          else next[setting.page_id] = new Set(next[setting.page_id]);
                          if (checked) next[setting.page_id].add(api.id);
                          else next[setting.page_id].delete(api.id);
                          return next;
                        });
                      };
                      return (
                        <div key={api.id} className="flex items-center gap-2 px-2 py-1 rounded hover:bg-dashboard-dark/50">
                          <Checkbox id={`${setting.page_id}-${api.id}`} checked={isChecked} onCheckedChange={handleToggle} />
                          <label htmlFor={`${setting.page_id}-${api.id}`} className="text-xs text-foreground cursor-pointer flex-1">
                            {api.name}
                          </label>
                          <span className="text-xs text-muted-foreground font-mono truncate max-w-[120px]">{api.base_url || ""}</span>
                        </div>
                      );
                    })
                  )}
                </CollapsibleContent>
              </Collapsible>

              {/* Scheduled Updates */}
              <Collapsible open={expandedSchedules[setting.page_id]} onOpenChange={(open) => setExpandedSchedules(prev => ({ ...prev, [setting.page_id]: open }))}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground hover:text-foreground">
                    {expandedSchedules[setting.page_id] ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                    Atualizações Agendadas
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2 space-y-2">
                  <div className="flex gap-2">
                    <Input type="time" value={newScheduleTime[setting.page_id] || ""}
                      onChange={(e) => setNewScheduleTime(prev => ({ ...prev, [setting.page_id]: e.target.value }))}
                      className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-8 flex-1" />
                    <Button variant="outline" size="sm" className="h-8 text-xs border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark"
                      onClick={() => handleAddSchedule(setting.page_id)}>
                      <Plus className="h-3 w-3 mr-1" /> Adicionar
                    </Button>
                  </div>
                  {(schedules[setting.page_id] || []).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-1">Nenhum agendamento</p>
                  ) : (
                    (schedules[setting.page_id] || []).map(schedule => (
                      <div key={schedule.id} className="flex items-center gap-2 px-2 py-1 rounded bg-dashboard-dark/30">
                        <span className="text-sm text-foreground font-mono flex-1">{schedule.update_time.substring(0, 5)}</span>
                        <Switch checked={schedule.is_active} onCheckedChange={(checked) => handleToggleSchedule(setting.page_id, schedule.id, checked)} />
                        <Button variant="ghost" size="icon" className="h-6 w-6 text-destructive hover:text-destructive"
                          onClick={() => handleRemoveSchedule(setting.page_id, schedule.id)}>
                          <Trash2 className="h-3 w-3" />
                        </Button>
                      </div>
                    ))
                  )}
                </CollapsibleContent>
              </Collapsible>

              <Collapsible open={expandedCharts[setting.page_id]} onOpenChange={(open) => setExpandedCharts(prev => ({ ...prev, [setting.page_id]: open }))}>
                <CollapsibleTrigger asChild>
                  <Button variant="ghost" size="sm" className="w-full h-7 text-xs text-muted-foreground hover:text-foreground">
                    {expandedCharts[setting.page_id] ? <ChevronDown className="h-3 w-3 mr-1" /> : <ChevronRight className="h-3 w-3 mr-1" />}
                    Configurar Gráficos
                  </Button>
                </CollapsibleTrigger>
                <CollapsibleContent className="pt-2">
                  <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin text-dashboard-accent mx-auto" />}>
                    <BiChartConfigManager pageId={setting.page_id} pageName={setting.display_name} />
                  </Suspense>
                </CollapsibleContent>
              </Collapsible>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default ConfigurarBI;
