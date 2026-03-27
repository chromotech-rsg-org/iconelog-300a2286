import { useState, useMemo, useCallback } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { useEstoqueConsolidadoData, EstoqueMatrizItem, EstoqueBaseItem } from "@/hooks/useEstoqueConsolidadoData";
import { useBiSettings } from "@/hooks/useBiSettings";
import { formatNumber, formatCurrency } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DollarSign, Box, Package, X, RefreshCw, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { EstoqueMatrizHoverCard, EstoqueBaseHoverCard } from "@/components/stock/EstoqueProductHoverCard";
import { useLanguage } from "@/contexts/LanguageContext";

// Yellow tones for Matriz charts (swapped)
const MATRIZ_COLORS = [
  'hsl(45, 100%, 50%)', 'hsl(40, 90%, 45%)', 'hsl(50, 95%, 55%)',
  'hsl(35, 85%, 50%)', 'hsl(55, 80%, 45%)', 'hsl(30, 90%, 50%)',
];

// Blue tones for Base charts (swapped)
const BASE_COLORS = [
  'hsl(217, 91%, 60%)', 'hsl(217, 80%, 50%)', 'hsl(200, 85%, 55%)',
  'hsl(230, 70%, 55%)', 'hsl(190, 75%, 50%)', 'hsl(210, 65%, 45%)',
  'hsl(240, 60%, 60%)', 'hsl(205, 90%, 65%)',
];

// Darker blue for B-Side in Representação
const GRUPO_PIE_COLORS: Record<string, string> = {
  "FOCO B SIDE": "hsl(217, 80%, 35%)",
  "FOCO D SIDE": "hsl(217, 91%, 60%)",
  "B SIDE": "hsl(217, 80%, 35%)",
  "D SIDE": "hsl(217, 91%, 60%)",
  "B-SIDE": "hsl(217, 80%, 35%)",
  "D-SIDE": "hsl(217, 91%, 60%)",
};

const TEMPO_PARADO_COLORS: Record<string, string> = {
  "Antes que 30 dias": "hsl(142, 60%, 45%)",
  "Entre 31 e 60 dias": "hsl(45, 100%, 50%)",
  "Entre 61 e 90 dias": "hsl(25, 95%, 53%)",
  "Mais que 91 dias": "hsl(0, 55%, 50%)",
};

// Use a custom label that avoids conflict with data's own fields
const renderPercentLabel = (props: any) => {
  // Recharts passes percent as 0-1, but if data has 'percent' field it overwrites
  // So we calculate from the Pie's total instead
  const { cx, cy, midAngle, innerRadius, outerRadius, value, name, payload } = props;
  // Use payload.pct which we calculate ourselves
  return `${(payload.pct || 0).toFixed(1)}%`;
};

const EstoqueConsolidado = () => {
  const { t } = useLanguage();
  const { getSettingByPageId } = useBiSettings();
  const setting = getSettingByPageId("estoque-consolidado");
  const codCli = setting?.cod_cli || "";

  const {
    estoqueMatriz, estoqueBase, matrizTotals, baseTotals,
    refreshing, refreshStage, refreshRecordCount, lastUpdateAt, refreshData,
    cacheLoaded,
  } = useEstoqueConsolidadoData(codCli);

  // Filter states
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [selectedSKU, setSelectedSKU] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);
  const [selectedTempoParado, setSelectedTempoParado] = useState<string | null>(null);

  // Table pagination states - Matriz
  const [matrizSearch, setMatrizSearch] = useState("");
  const [matrizPage, setMatrizPage] = useState(0);
  const [matrizPerPage, setMatrizPerPage] = useState(10);

  // Table pagination states - Base
  const [baseSearch, setBaseSearch] = useState("");
  const [basePage, setBasePage] = useState(0);
  const [basePerPage, setBasePerPage] = useState(10);

  // Filtered data
  const filteredMatriz = useMemo(() => {
    let result = estoqueMatriz;
    if (selectedGrupo) result = result.filter(i => i.grupo === selectedGrupo);
    if (selectedSKU) result = result.filter(i => i.codigo === selectedSKU);
    if (selectedTempoParado) result = result.filter(i => i.tempoParado === selectedTempoParado);
    return result;
  }, [estoqueMatriz, selectedGrupo, selectedSKU, selectedTempoParado]);

  const filteredBase = useMemo(() => {
    let result = estoqueBase.filter(i => i.base.toUpperCase() !== "BARUERI");
    if (selectedGrupo) result = result.filter(i => i.produto.includes(selectedGrupo));
    if (selectedBase) result = result.filter(i => i.base === selectedBase);
    return result;
  }, [estoqueBase, selectedGrupo, selectedBase]);

  // Search filtered for tables
  const searchedMatriz = useMemo(() => {
    if (!matrizSearch.trim()) return filteredMatriz;
    const s = matrizSearch.toLowerCase();
    return filteredMatriz.filter(i =>
      i.codigo.toLowerCase().includes(s) || i.descricao.toLowerCase().includes(s) ||
      i.grupo.toLowerCase().includes(s) || i.base.toLowerCase().includes(s)
    );
  }, [filteredMatriz, matrizSearch]);

  const searchedBase = useMemo(() => {
    if (!baseSearch.trim()) return filteredBase;
    const s = baseSearch.toLowerCase();
    return filteredBase.filter(i =>
      i.codigo.toLowerCase().includes(s) || i.produto.toLowerCase().includes(s) ||
      i.base.toLowerCase().includes(s) || i.cidade.toLowerCase().includes(s)
    );
  }, [filteredBase, baseSearch]);

  // Paginated data
  const matrizTotalPages = Math.ceil(searchedMatriz.length / matrizPerPage);
  const pagedMatriz = searchedMatriz.slice(matrizPage * matrizPerPage, (matrizPage + 1) * matrizPerPage);

  const baseTotalPages = Math.ceil(searchedBase.length / basePerPage);
  const pagedBase = searchedBase.slice(basePage * basePerPage, (basePage + 1) * basePerPage);

  // Filtered KPIs
  const filteredMatrizTotals = useMemo(() => ({
    valor: filteredMatriz.reduce((s, i) => s + i.vlTotal, 0),
    m3: filteredMatriz.reduce((s, i) => s + i.m3Total, 0),
    qtdeSKUs: new Set(filteredMatriz.map(i => i.codigo)).size,
  }), [filteredMatriz]);

  const filteredBaseTotals = useMemo(() => ({
    valor: filteredBase.reduce((s, i) => s + i.vlTotal, 0),
    m3: filteredBase.reduce((s, i) => s + (i.m3 * i.saldo), 0),
    qtdeSKUs: new Set(filteredBase.map(i => i.codigo)).size,
  }), [filteredBase]);

  // Chart data
  const estoqueByGrupo = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredMatriz.forEach(i => {
      // Use grupo field (e.g. "FOCO B SIDE", "FOCO D SIDE")
      const grupo = i.grupo || "Outros";
      grouped.set(grupo, (grouped.get(grupo) || 0) + i.vlTotal);
    });
    const total = Array.from(grouped.values()).reduce((s, v) => s + v, 0);
    return Array.from(grouped.entries()).map(([name, value]) => ({
      name, value, pct: total > 0 ? (value / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [filteredMatriz]);

  // valorByGrupo reuses estoqueByGrupo data (same grouping by vlTotal)
  const valorByGrupo = estoqueByGrupo;

  // Tempo Parado with fixed order matching the reference
  const TEMPO_PARADO_ORDER = ["Antes que 30 dias", "Entre 31 e 60 dias", "Entre 61 e 90 dias", "Mais que 91 dias"];

  const tempoParadoPie = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredMatriz.forEach(i => grouped.set(i.tempoParado, (grouped.get(i.tempoParado) || 0) + 1));
    const total = filteredMatriz.length;
    // Return in fixed order
    return TEMPO_PARADO_ORDER
      .map(name => {
        const value = grouped.get(name) || 0;
        return { name, value, pct: total > 0 ? (value / total) * 100 : 0 };
      })
      .filter(d => d.value > 0);
  }, [filteredMatriz]);

  const tempoParadoMedioGrupo = useMemo(() => {
    const grouped = new Map<string, { total: number; count: number }>();
    filteredMatriz.forEach(i => {
      const cur = grouped.get(i.grupo) || { total: 0, count: 0 };
      grouped.set(i.grupo, { total: cur.total + i.diasSemMovto, count: cur.count + 1 });
    });
    return Array.from(grouped.entries()).map(([name, { total, count }]) => ({
      name, value: Math.round(total / count),
    })).sort((a, b) => b.value - a.value);
  }, [filteredMatriz]);

  const hasActiveFilters = !!(selectedGrupo || selectedSKU || selectedBase || selectedTempoParado);

  const clearAllFilters = useCallback(() => {
    setSelectedGrupo(null);
    setSelectedSKU(null);
    setSelectedBase(null);
    setSelectedTempoParado(null);
  }, []);

  const handleRefreshData = useCallback(() => {
    if (!codCli) { toast.error("Configure o Cód. Cliente no painel Admin primeiro"); return; }
    refreshData();
  }, [codCli, refreshData]);

  const handleExportExcel = useCallback(() => {
    const matrizSheet = filteredMatriz.map(i => ({
      Base: i.base, Código: i.codigo, Descrição: i.descricao, Grupo: i.grupo,
      SubGrupo: i.subGrupo, Categoria: i.categoria,
      "Qtde. Entrada": i.qtdeEntrada, "Qtde. Saída": i.qtdeSaida, Estoque: i.estoque,
      "Vl. Item": i.vlItem, "Vl. Total": i.vlTotal,
      "M3 Unitário": i.m3Unitario, "M3 Total": i.m3Total,
      "Data Última Entrada": i.dtUltimaEntrada, "Qtde. Última Entrada": i.qtdeUltimaEntrada,
      "Data Última Saída": i.dtUltimaSaida, "Qtde. Última Saída": i.qtdeUltimaSaida,
      "Dias s/ Movto.": i.diasSemMovto, "Tempo Parado": i.tempoParado,
    }));
    const baseSheet = filteredBase.map(i => ({
      Base: i.base, Cidade: i.cidade, UF: i.uf, Código: i.codigo,
      M3: i.m3, Produto: i.produto,
      "Qtde. Entrada": i.qtdeEntrada, "Qtde. Saída": i.qtdeSaida,
      Região: i.regiao, Saldo: i.saldo, "Vl. Total": i.vlTotal,
    }));
    const biSheet = [
      { Indicador: "Estoque Matriz - Valor", Valor: filteredMatrizTotals.valor },
      { Indicador: "Estoque Matriz - M³", Valor: filteredMatrizTotals.m3 },
      { Indicador: "Estoque Matriz - SKUs", Valor: filteredMatrizTotals.qtdeSKUs },
      { Indicador: "Estoque Base - Valor", Valor: filteredBaseTotals.valor },
      { Indicador: "Estoque Base - M³", Valor: filteredBaseTotals.m3 },
      { Indicador: "Estoque Base - SKUs", Valor: filteredBaseTotals.qtdeSKUs },
    ];
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matrizSheet), "Estoque Matriz");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(baseSheet), "Estoque Base");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(biSheet), "BI Consolidado");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }),
      `estoque_consolidado_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Arquivo Excel exportado com sucesso!");
  }, [filteredMatriz, filteredBase, filteredMatrizTotals, filteredBaseTotals]);

  // Chart click handlers
  const handleGrupoPieClick = useCallback((data: any) => {
    if (data?.name) setSelectedGrupo(prev => prev === data.name ? null : data.name);
  }, []);
  const handleGrupoBarClick = useCallback((data: any) => {
    if (data?.activePayload?.[0]) {
      const g = data.activePayload[0].payload.name;
      setSelectedGrupo(prev => prev === g ? null : g);
    }
  }, []);
  const handleTempoParadoClick = useCallback((data: any) => {
    if (data?.name) setSelectedTempoParado(prev => prev === data.name ? null : data.name);
  }, []);

  const getRefreshText = () => {
    switch (refreshStage) {
      case "requesting_mapalogistico": return t("Consultando MAPALOGÍSTICO...");
      case "receiving_mapalogistico": return `${t("Recebendo MAPALOGÍSTICO")} (${refreshRecordCount} ${t("registros")})...`;
      case "requesting_saldobase": return t("Consultando SALDOBASE...");
      case "receiving_saldobase": return `${t("Recebendo SALDOBASE")} (${refreshRecordCount} ${t("registros")})...`;
      case "saving": return t("Salvando no cache...");
      case "done": return t("Atualização concluída!");
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead pageId="estoque-consolidado" />
      <SharedHeader
        pageId="estoque-consolidado"
        lastUpdate={lastUpdateAt || new Date()}
        showFilters={false}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
        onClearAllFilters={clearAllFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {refreshStage && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 animate-fade-in">
          <RefreshCw className="h-4 w-4 text-primary animate-spin" />
          <span className="text-sm text-primary">{getRefreshText()}</span>
        </div>
      )}

      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">{t("Filtros")}:</span>
          {selectedGrupo && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer" onClick={() => setSelectedGrupo(null)}>
              {t("Grupo:")} {selectedGrupo} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedSKU && (
            <Badge variant="outline" className="border-blue-500 bg-blue-500/10 text-blue-400 cursor-pointer" onClick={() => setSelectedSKU(null)}>
              {t("SKU:")} {selectedSKU} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedBase && (
            <Badge variant="outline" className="border-orange-500 bg-orange-500/10 text-orange-400 cursor-pointer" onClick={() => setSelectedBase(null)}>
              {t("Base:")} {selectedBase} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTempoParado && (
            <Badge variant="outline" className="border-destructive bg-destructive/10 text-destructive cursor-pointer" onClick={() => setSelectedTempoParado(null)}>
              {t("Tempo:")} {selectedTempoParado} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            {t("Limpar todos")}
          </Button>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-card border-yellow-500/60 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-yellow-400">{t("ESTOQUE MATRIZ")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <DollarSign className="h-7 w-7 mx-auto mb-1 text-green-500" />
                  <p className="text-sm font-medium text-muted-foreground">{t("Valor")}</p>
                  <p className="text-xl sm:text-3xl font-black text-foreground break-all">{formatCurrency(filteredMatrizTotals.valor)}</p>
                </div>
                <div className="text-center">
                  <Box className="h-7 w-7 mx-auto mb-1 text-blue-500" />
                  <p className="text-sm font-medium text-muted-foreground">{t("M³")}</p>
                  <p className="text-xl sm:text-3xl font-black text-foreground">{<p className="text-xl sm:text-3xl font-black text-foreground">{filteredMatrizTotals.m3.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })}</p>}</p>
                </div>
                <div className="text-center">
                  <Package className="h-7 w-7 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">{t("Qtde SKUs")}</p>
                  <p className="text-xl sm:text-3xl font-black text-foreground">{formatNumber(filteredMatrizTotals.qtdeSKUs)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-card border-blue-500/60 border-2">
            <CardHeader className="pb-2">
              <CardTitle className="text-lg font-bold text-blue-400">{t("ESTOQUE BASE")}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="text-center">
                  <DollarSign className="h-7 w-7 mx-auto mb-1 text-green-500" />
                  <p className="text-sm font-medium text-muted-foreground">{t("Valor")}</p>
                  <p className="text-xl sm:text-3xl font-black text-foreground break-all">{formatCurrency(filteredBaseTotals.valor)}</p>
                </div>
                <div className="text-center">
                  <Box className="h-7 w-7 mx-auto mb-1 text-blue-500" />
                  <p className="text-sm font-medium text-muted-foreground">{t("M³")}</p>
                  <p className="text-xl sm:text-3xl font-black text-foreground">{filteredBaseTotals.m3.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</p>
                </div>
                <div className="text-center">
                  <Package className="h-7 w-7 mx-auto mb-1 text-primary" />
                  <p className="text-sm font-medium text-muted-foreground">{t("Qtde SKUs")}</p>
                  <p className="text-xl sm:text-3xl font-black text-foreground">{formatNumber(filteredBaseTotals.qtdeSKUs)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Representação do Estoque | Grupo - Blue Pie */}
          <Card className={`bg-card border-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-foreground">{t("Representação do Estoque | Grupo")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estoqueByGrupo} cx="50%" cy="45%" innerRadius={35} outerRadius={65} dataKey="value" onClick={handleGrupoPieClick}
                    label={renderPercentLabel} labelLine={false}>
                    {estoqueByGrupo.map((entry, index) => (
                      <Cell key={index} fill={GRUPO_PIE_COLORS[entry.name.toUpperCase()] || MATRIZ_COLORS[index % MATRIZ_COLORS.length]}
                        opacity={selectedGrupo && selectedGrupo !== entry.name ? 0.3 : 1}
                        stroke={selectedGrupo === entry.name ? '#fff' : 'none'} strokeWidth={2} />
                    ))}
                  </Pie>
                   <Tooltip formatter={(value: number, name: string, props: any) => `${props.payload.pct?.toFixed(1)}%`} />
                  <Legend wrapperStyle={{ fontSize: 10 }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 2. Valor Estoque | Grupo - Blue Bar */}
          <Card className={`bg-card border-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-foreground">{t("Valor do Estoque | Grupo")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valorByGrupo} layout="vertical" onClick={handleGrupoBarClick}
                  margin={{ right: 120 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10}
                    tickFormatter={(v) => `R$ ${Math.round(v).toLocaleString('pt-BR')}`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }}
                    formatter={(value: number) => `R$ ${Math.round(value).toLocaleString('pt-BR')}`} />
                  <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]}
                    label={{ position: "right", fill: "hsl(45, 100%, 60%)", fontSize: 11, fontWeight: 700,
                      formatter: (v: number) => `R$ ${Math.round(v).toLocaleString('pt-BR')}` }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3. Tempo Parado | SKU - Yellow/Red Pie */}
          <Card className={`bg-card border-border cursor-pointer transition-all ${selectedTempoParado ? 'ring-2 ring-destructive' : ''}`}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-foreground">{t("Tempo Parado")} | SKU</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tempoParadoPie} cx="60%" cy="50%" innerRadius={35} outerRadius={65} dataKey="value" onClick={handleTempoParadoClick}
                    label={renderPercentLabel} labelLine={false}>
                    {tempoParadoPie.map((entry, index) => (
                      <Cell key={index} fill={TEMPO_PARADO_COLORS[entry.name] || MATRIZ_COLORS[index % MATRIZ_COLORS.length]}
                        opacity={selectedTempoParado && selectedTempoParado !== entry.name ? 0.3 : 1}
                        stroke={selectedTempoParado === entry.name ? '#fff' : 'none'} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number, name: string, props: any) => `${props.payload.pct?.toFixed(1)}%`} />
                  <Legend layout="vertical" align="left" verticalAlign="middle"
                    wrapperStyle={{ fontSize: 9, paddingRight: 4 }}
                    formatter={(value: string) => {
                      const item = tempoParadoPie.find(d => d.name === value);
                      return <span className="text-muted-foreground text-[9px]">{value}</span>;
                    }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 4. Tempo Parado Médio | Grupo - Yellow Bar */}
          <Card className={`bg-card border-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-primary' : ''}`}>
            <CardHeader className="pb-1">
              <CardTitle className="text-sm font-medium text-foreground">{t("Tempo Parado Médio | Grupo")}</CardTitle>
            </CardHeader>
            <CardContent className="h-[260px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoParadoMedioGrupo} layout="vertical" onClick={handleGrupoBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }}
                    formatter={(value: number) => `${value} dias`} />
                  <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]}
                    label={{ position: "right", fill: "hsl(217, 91%, 70%)", fontSize: 11, fontWeight: 700,
                      formatter: (v: number) => `${v} dias` }} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="space-y-4">
          {/* Estoque Matriz Table */}
          <Card className="bg-card border-border flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  {t("Estoque Matriz")} <span className="text-sm font-normal text-muted-foreground">({searchedMatriz.length} {t("itens")})</span>
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder={t("Pesquisar código, descrição, grupo...")} value={matrizSearch}
                    onChange={e => { setMatrizSearch(e.target.value); setMatrizPage(0); }}
                    className="h-7 text-xs pl-7 bg-muted/20 border-border" />
                </div>
                <Select value={String(matrizPerPage)} onValueChange={v => { setMatrizPerPage(Number(v)); setMatrizPage(0); }}>
                  <SelectTrigger className="h-7 w-20 text-xs bg-muted/20 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <style>{`
                .estoque-matriz-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
                .estoque-matriz-scroll::-webkit-scrollbar-track { background: hsl(0, 0%, 14%); border-radius: 3px; }
                .estoque-matriz-scroll::-webkit-scrollbar-thumb { background: hsl(0, 0%, 35%); border-radius: 3px; }
                .estoque-matriz-scroll::-webkit-scrollbar-thumb:hover { background: hsl(0, 0%, 50%); }
                .estoque-matriz-scroll { overflow: scroll !important; }
              `}</style>
              <div className="estoque-matriz-scroll flex-1" style={{ overflow: "scroll", maxHeight: 400 }}>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="border-border bg-muted/20 sticky top-0 z-10">
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">{t("Código")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">{t("Produto")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">{t("Grupo")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">{t("Stock")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">{t("Vl. Item")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">{t("Vl. Total")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">{t("Unit M³")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">{t("M³ Total")}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedMatriz.map((item) => (
                      <TableRow key={item.id} className="border-border hover:bg-muted/50 text-xs">
                        <TableCell className="text-primary font-medium text-[11px] px-2 py-1 whitespace-nowrap">
                          <EstoqueMatrizHoverCard product={item}>
                            <span className="cursor-help underline decoration-dotted">{item.codigo}</span>
                          </EstoqueMatrizHoverCard>
                        </TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap truncate max-w-[200px]">
                          <EstoqueMatrizHoverCard product={item}>
                            <span className="cursor-help">{item.descricao}</span>
                          </EstoqueMatrizHoverCard>
                        </TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap">{item.grupo}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap font-medium">{formatNumber(item.estoque)}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{item.vlItem.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{formatCurrency(item.vlTotal)}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{item.m3Unitario.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{item.m3Total.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <tfoot>
                    <TableRow className="border-border bg-muted/40 font-bold text-xs sticky bottom-0 z-10">
                      <TableCell className="text-primary text-[11px] px-2 py-1.5 whitespace-nowrap" colSpan={3}>{t("Total")} ({searchedMatriz.length})</TableCell>
                      <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right whitespace-nowrap">{formatNumber(searchedMatriz.reduce((s, i) => s + i.estoque, 0))}</TableCell>
                      <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right whitespace-nowrap">{searchedMatriz.reduce((s, i) => s + (i.estoque > 0 ? i.vlTotal / i.estoque : 0), 0).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}</TableCell>
                      <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right whitespace-nowrap">{formatCurrency(searchedMatriz.reduce((s, i) => s + i.vlTotal, 0))}</TableCell>
                      <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right whitespace-nowrap">{searchedMatriz.reduce((s, i) => s + i.m3Unitario, 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                      <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right whitespace-nowrap">{searchedMatriz.reduce((s, i) => s + i.m3Total, 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30 sticky bottom-0 z-10">
                <span className="text-[10px] text-muted-foreground">
                  {searchedMatriz.length > 0 ? `${matrizPage * matrizPerPage + 1}–${Math.min((matrizPage + 1) * matrizPerPage, searchedMatriz.length)} ${t("de")} ${searchedMatriz.length}` : `0 ${t("registros")}`}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={matrizPage === 0} onClick={() => setMatrizPage(p => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[10px] text-muted-foreground min-w-[60px] text-center">
                    {matrizTotalPages > 0 ? `${matrizPage + 1} / ${matrizTotalPages}` : "—"}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={matrizPage >= matrizTotalPages - 1} onClick={() => setMatrizPage(p => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estoque Base Table */}
          <Card className="bg-card border-border flex flex-col">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between gap-2">
                <CardTitle className="text-base font-semibold text-foreground">
                  {t("Estoque Base")} <span className="text-sm font-normal text-muted-foreground">({searchedBase.length} {t("itens")})</span>
                </CardTitle>
              </div>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                  <Input placeholder={t("Pesquisar base, cidade, código...")} value={baseSearch}
                    onChange={e => { setBaseSearch(e.target.value); setBasePage(0); }}
                    className="h-7 text-xs pl-7 bg-muted/20 border-border" />
                </div>
                <Select value={String(basePerPage)} onValueChange={v => { setBasePerPage(Number(v)); setBasePage(0); }}>
                  <SelectTrigger className="h-7 w-20 text-xs bg-muted/20 border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent className="p-0 flex-1 flex flex-col">
              <style>{`
                .estoque-base-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
                .estoque-base-scroll::-webkit-scrollbar-track { background: hsl(0, 0%, 14%); border-radius: 3px; }
                .estoque-base-scroll::-webkit-scrollbar-thumb { background: hsl(0, 0%, 35%); border-radius: 3px; }
                .estoque-base-scroll::-webkit-scrollbar-thumb:hover { background: hsl(0, 0%, 50%); }
                .estoque-base-scroll { overflow: scroll !important; }
              `}</style>
              <div className="estoque-base-scroll flex-1" style={{ overflow: "scroll", maxHeight: 400 }}>
                <Table className="min-w-[900px]">
                  <TableHeader>
                    <TableRow className="border-border bg-muted/20 sticky top-0 z-10">
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">{t("Base")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">{t("Cidade")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">{t("UF")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">{t("Código")}</TableHead>
                      
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">{t("Produto")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">Stock</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">{t("Vl. Item")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">{t("Vl. Total")}</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">Unit M³</TableHead>
                      <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">M³ Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pagedBase.map((item) => {
                      const vlItem = item.saldo > 0 ? item.vlTotal / item.saldo : 0;
                      const m3Total = item.m3 * item.saldo;
                      return (
                      <TableRow key={item.id}
                        className={`border-border hover:bg-muted/50 cursor-pointer text-xs ${selectedBase === item.base ? 'bg-primary/10' : ''}`}
                        onClick={() => setSelectedBase(prev => prev === item.base ? null : item.base)}>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap">{item.base}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap">{item.cidade}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap">{item.uf}</TableCell>
                        <TableCell className="text-primary font-medium text-[11px] px-2 py-1 whitespace-nowrap">
                          <EstoqueBaseHoverCard product={item}>
                            <span className="cursor-help underline decoration-dotted">{item.codigo}</span>
                          </EstoqueBaseHoverCard>
                        </TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap truncate max-w-[150px]">
                          <EstoqueBaseHoverCard product={item}>
                            <span className="cursor-help">{item.produto}</span>
                          </EstoqueBaseHoverCard>
                        </TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap font-medium">{formatNumber(item.saldo)}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{vlItem.toFixed(2).replace('.', ',')}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{formatCurrency(item.vlTotal)}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{item.m3.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                        <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{m3Total.toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                      </TableRow>
                      );
                    })}
                  </TableBody>
                  <tfoot>
                    <TableRow className="border-border bg-muted/40 font-bold text-xs sticky bottom-0 z-10">
                      <TableCell className="text-primary text-[11px] px-2 py-1.5 whitespace-nowrap" colSpan={5}>{t("Total")} ({searchedBase.length})</TableCell>
                      <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right whitespace-nowrap">{formatNumber(searchedBase.reduce((s, i) => s + i.saldo, 0))}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5"></TableCell>
                      <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right whitespace-nowrap">{formatCurrency(searchedBase.reduce((s, i) => s + i.vlTotal, 0))}</TableCell>
                      <TableCell className="text-[11px] px-2 py-1.5"></TableCell>
                      <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right whitespace-nowrap">{searchedBase.reduce((s, i) => s + (i.m3 * i.saldo), 0).toLocaleString('pt-BR', { minimumFractionDigits: 4, maximumFractionDigits: 4 })}</TableCell>
                    </TableRow>
                  </tfoot>
                </Table>
              </div>
              <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30 sticky bottom-0 z-10">
                <span className="text-[10px] text-muted-foreground">
                  {searchedBase.length > 0 ? `${basePage * basePerPage + 1}–${Math.min((basePage + 1) * basePerPage, searchedBase.length)} ${t("de")} ${searchedBase.length}` : `0 ${t("registros")}`}
                </span>
                <div className="flex items-center gap-1">
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={basePage === 0} onClick={() => setBasePage(p => p - 1)}>
                    <ChevronLeft className="h-3.5 w-3.5" />
                  </Button>
                  <span className="text-[10px] text-muted-foreground min-w-[60px] text-center">
                    {baseTotalPages > 0 ? `${basePage + 1} / ${baseTotalPages}` : "—"}
                  </span>
                  <Button variant="ghost" size="icon" className="h-6 w-6" disabled={basePage >= baseTotalPages - 1} onClick={() => setBasePage(p => p + 1)}>
                    <ChevronRight className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EstoqueConsolidado;
