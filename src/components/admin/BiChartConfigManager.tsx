import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Pencil, Trash2, BarChart3, Loader2 } from "lucide-react";

interface ChartConfig {
  id: string;
  bi_page_id: string;
  chart_position: string;
  chart_type: string;
  api_endpoint: string | null;
  field_mappings: any;
  filters: any;
  aggregation_type: string | null;
  label: string | null;
}

interface BiChartConfigManagerProps {
  pageId: string;
  pageName: string;
}

const CHART_TYPES = [
  { value: "bar", label: "Barras" },
  { value: "line", label: "Linhas" },
  { value: "pie", label: "Pizza" },
  { value: "table", label: "Tabela" },
  { value: "kpi", label: "KPI Card" },
];

const CHART_POSITIONS = [
  { value: "left", label: "Esquerda" },
  { value: "right", label: "Direita" },
  { value: "top", label: "Topo" },
  { value: "bottom", label: "Rodapé" },
  { value: "full", label: "Largura Total" },
];

const AGGREGATION_TYPES = [
  { value: "count", label: "Contagem" },
  { value: "sum", label: "Soma" },
  { value: "avg", label: "Média" },
  { value: "min", label: "Mínimo" },
  { value: "max", label: "Máximo" },
];

const API_ENDPOINTS = [
  { value: "Followup", label: "Followup" },
  { value: "ProdutosDistribuidos", label: "Produtos Distribuídos" },
  { value: "SaldoBase", label: "Saldo Base" },
  { value: "Recebimentos", label: "Recebimentos" },
];

const BiChartConfigManager = ({ pageId, pageName }: BiChartConfigManagerProps) => {
  const [configs, setConfigs] = useState<ChartConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState<ChartConfig | null>(null);
  const [form, setForm] = useState({
    chart_position: "left",
    chart_type: "bar",
    api_endpoint: "",
    aggregation_type: "count",
    label: "",
    field_mappings: "{}",
    filters: "{}",
  });

  const fetchConfigs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bi_chart_config")
      .select("*")
      .eq("bi_page_id", pageId)
      .order("chart_position");

    if (error) {
      console.error("Error fetching chart configs:", error);
    } else {
      setConfigs(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchConfigs();
  }, [pageId]);

  const handleNew = () => {
    setEditingConfig(null);
    setForm({
      chart_position: "left",
      chart_type: "bar",
      api_endpoint: "",
      aggregation_type: "count",
      label: "",
      field_mappings: "{}",
      filters: "{}",
    });
    setDialogOpen(true);
  };

  const handleEdit = (config: ChartConfig) => {
    setEditingConfig(config);
    setForm({
      chart_position: config.chart_position,
      chart_type: config.chart_type,
      api_endpoint: config.api_endpoint || "",
      aggregation_type: config.aggregation_type || "count",
      label: config.label || "",
      field_mappings: JSON.stringify(config.field_mappings || {}, null, 2),
      filters: JSON.stringify(config.filters || {}, null, 2),
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    let fieldMappings: Record<string, any>;
    let filters: Record<string, any>;

    try {
      fieldMappings = JSON.parse(form.field_mappings);
      filters = JSON.parse(form.filters);
    } catch {
      toast.error("JSON inválido nos mapeamentos ou filtros");
      return;
    }

    const payload = {
      bi_page_id: pageId,
      chart_position: form.chart_position,
      chart_type: form.chart_type,
      api_endpoint: form.api_endpoint || null,
      aggregation_type: form.aggregation_type || null,
      label: form.label || null,
      field_mappings: fieldMappings,
      filters,
    };

    if (editingConfig) {
      const { error } = await supabase
        .from("bi_chart_config")
        .update(payload)
        .eq("id", editingConfig.id);
      if (error) {
        toast.error("Erro ao atualizar: " + error.message);
        return;
      }
      toast.success("Configuração atualizada!");
    } else {
      const { error } = await supabase.from("bi_chart_config").insert(payload);
      if (error) {
        toast.error("Erro ao criar: " + error.message);
        return;
      }
      toast.success("Configuração criada!");
    }
    setDialogOpen(false);
    fetchConfigs();
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("bi_chart_config").delete().eq("id", id);
    if (error) {
      toast.error("Erro ao excluir: " + error.message);
      return;
    }
    toast.success("Configuração excluída!");
    fetchConfigs();
  };

  if (loading) {
    return <Loader2 className="h-5 w-5 animate-spin text-dashboard-accent mx-auto" />;
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-dashboard-accent" />
          <h4 className="text-sm font-medium text-foreground">Gráficos de {pageName}</h4>
          <Badge variant="secondary" className="text-xs">{configs.length}</Badge>
        </div>
        <Button size="sm" variant="outline" onClick={handleNew} className="h-7 text-xs border-dashboard-border">
          <Plus className="h-3 w-3 mr-1" /> Adicionar
        </Button>
      </div>

      {configs.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow className="border-dashboard-border">
              <TableHead className="text-muted-foreground text-xs">Label</TableHead>
              <TableHead className="text-muted-foreground text-xs">Tipo</TableHead>
              <TableHead className="text-muted-foreground text-xs">Posição</TableHead>
              <TableHead className="text-muted-foreground text-xs">API</TableHead>
              <TableHead className="text-muted-foreground text-xs text-right">Ações</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {configs.map(config => (
              <TableRow key={config.id} className="border-dashboard-border">
                <TableCell className="text-foreground text-sm">{config.label || "-"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-xs">
                    {CHART_TYPES.find(t => t.value === config.chart_type)?.label || config.chart_type}
                  </Badge>
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">
                  {CHART_POSITIONS.find(p => p.value === config.chart_position)?.label || config.chart_position}
                </TableCell>
                <TableCell className="text-muted-foreground text-xs">{config.api_endpoint || "-"}</TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => handleEdit(config)}>
                    <Pencil className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" onClick={() => handleDelete(config.id)}>
                    <Trash2 className="h-3 w-3" />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <p className="text-xs text-muted-foreground text-center py-3">Nenhum gráfico configurado</p>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="bg-dashboard-card border-dashboard-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              {editingConfig ? "Editar" : "Novo"} Gráfico
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 max-h-[60vh] overflow-y-auto">
            <div>
              <Label className="text-xs text-muted-foreground">Label</Label>
              <Input value={form.label} onChange={e => setForm({ ...form, label: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground" placeholder="Nome do gráfico" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">Tipo</Label>
                <Select value={form.chart_type} onValueChange={v => setForm({ ...form, chart_type: v })}>
                  <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-dashboard-border">
                    {CHART_TYPES.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Posição</Label>
                <Select value={form.chart_position} onValueChange={v => setForm({ ...form, chart_position: v })}>
                  <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-dashboard-border">
                    {CHART_POSITIONS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label className="text-xs text-muted-foreground">API Endpoint</Label>
                <Select value={form.api_endpoint} onValueChange={v => setForm({ ...form, api_endpoint: v })}>
                  <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground"><SelectValue placeholder="Selecione" /></SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-dashboard-border">
                    {API_ENDPOINTS.map(e => <SelectItem key={e.value} value={e.value}>{e.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs text-muted-foreground">Agregação</Label>
                <Select value={form.aggregation_type} onValueChange={v => setForm({ ...form, aggregation_type: v })}>
                  <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground"><SelectValue /></SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-dashboard-border">
                    {AGGREGATION_TYPES.map(a => <SelectItem key={a.value} value={a.value}>{a.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Mapeamento de Campos (JSON)</Label>
              <Textarea value={form.field_mappings} onChange={e => setForm({ ...form, field_mappings: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground font-mono text-xs min-h-[80px]"
                placeholder='{"x_axis": "regional", "y_axis": "total"}' />
            </div>
            <div>
              <Label className="text-xs text-muted-foreground">Filtros (JSON)</Label>
              <Textarea value={form.filters} onChange={e => setForm({ ...form, filters: e.target.value })}
                className="bg-dashboard-dark border-dashboard-border text-foreground font-mono text-xs min-h-[80px]"
                placeholder='{"ds_tipo_servico": {"$ne": "Reentrega"}}' />
            </div>
          </div>
          <DialogFooter className="gap-2">
            <Button variant="outline" onClick={() => setDialogOpen(false)} className="border-dashboard-border">Cancelar</Button>
            <Button onClick={handleSave} className="bg-dashboard-accent text-dashboard-dark">Salvar</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default BiChartConfigManager;
