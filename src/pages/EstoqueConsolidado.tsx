import { useState, useMemo, useCallback } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell,
} from "recharts";
import { useEstoqueConsolidadoData, EstoqueMatrizItem, EstoqueBaseItem } from "@/hooks/useEstoqueConsolidadoData";
import { useBiSettings } from "@/hooks/useBiSettings";
import { formatNumber, formatCurrency } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DollarSign, Box, Package, X, RefreshCw } from "lucide-react";

const COLORS = ['hsl(45, 100%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)', 'hsl(340, 82%, 52%)', 'hsl(190, 80%, 50%)', 'hsl(60, 90%, 45%)'];
const TEMPO_PARADO_COLORS: Record<string, string> = {
  "Antes que 30 dias": "hsl(142, 76%, 36%)",
  "Entre 31 e 60 dias": "hsl(45, 100%, 50%)",
  "Entre 61 e 90 dias": "hsl(25, 95%, 53%)",
  "Mais que 91 dias": "hsl(340, 82%, 52%)",
};

const EstoqueConsolidado = () => {
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

  // Filtered data
  const filteredMatriz = useMemo(() => {
    let result = estoqueMatriz;
    if (selectedGrupo) result = result.filter(i => i.grupo === selectedGrupo);
    if (selectedSKU) result = result.filter(i => i.codigo === selectedSKU);
    if (selectedTempoParado) result = result.filter(i => i.tempoParado === selectedTempoParado);
    return result;
  }, [estoqueMatriz, selectedGrupo, selectedSKU, selectedTempoParado]);

  const filteredBase = useMemo(() => {
    let result = estoqueBase;
    if (selectedGrupo) result = result.filter(i => i.produto.includes(selectedGrupo)); // base doesn't have grupo directly
    if (selectedBase) result = result.filter(i => i.base === selectedBase);
    return result;
  }, [estoqueBase, selectedGrupo, selectedBase]);

  // Filtered KPIs
  const filteredMatrizTotals = useMemo(() => ({
    valor: filteredMatriz.reduce((s, i) => s + i.vlTotal, 0),
    m3: filteredMatriz.reduce((s, i) => s + i.m3Total, 0),
    qtdeSKUs: new Set(filteredMatriz.map(i => i.codigo)).size,
  }), [filteredMatriz]);

  const filteredBaseTotals = useMemo(() => ({
    valor: filteredBase.reduce((s, i) => s + i.vlTotal, 0),
    m3: filteredBase.reduce((s, i) => s + i.m3, 0),
    qtdeSKUs: new Set(filteredBase.map(i => i.codigo)).size,
  }), [filteredBase]);

  // Chart data
  const estoqueByGrupo = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredMatriz.forEach(i => grouped.set(i.grupo, (grouped.get(i.grupo) || 0) + i.estoque));
    return Array.from(grouped.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredMatriz]);

  const valorByGrupo = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredMatriz.forEach(i => grouped.set(i.grupo, (grouped.get(i.grupo) || 0) + i.vlTotal));
    return Array.from(grouped.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  }, [filteredMatriz]);

  const tempoParadoPie = useMemo(() => {
    const grouped = new Map<string, number>();
    filteredMatriz.forEach(i => grouped.set(i.tempoParado, (grouped.get(i.tempoParado) || 0) + 1));
    return Array.from(grouped.entries()).map(([name, value]) => ({ name, value }));
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
    if (!codCli) {
      toast.error("Configure o Cód. Cliente no painel Admin primeiro");
      return;
    }
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

  // Refresh progress text
  const getRefreshText = () => {
    switch (refreshStage) {
      case "requesting_mapalogistico": return "Consultando MAPALOGÍSTICO...";
      case "receiving_mapalogistico": return `Recebendo MAPALOGÍSTICO (${refreshRecordCount} registros)...`;
      case "requesting_saldobase": return "Consultando SALDOBASE...";
      case "receiving_saldobase": return `Recebendo SALDOBASE (${refreshRecordCount} registros)...`;
      case "saving": return "Salvando no cache...";
      case "done": return "Atualização concluída!";
      default: return "";
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-dark">
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

      {/* Refresh progress */}
      {refreshStage && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <RefreshCw className="h-4 w-4 text-dashboard-accent animate-spin" />
          <span className="text-sm text-dashboard-accent">{getRefreshText()}</span>
        </div>
      )}

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedGrupo && (
            <Badge variant="outline" className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer" onClick={() => setSelectedGrupo(null)}>
              Grupo: {selectedGrupo} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedSKU && (
            <Badge variant="outline" className="border-dashboard-blue bg-dashboard-blue/10 text-dashboard-blue cursor-pointer" onClick={() => setSelectedSKU(null)}>
              SKU: {selectedSKU} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedBase && (
            <Badge variant="outline" className="border-dashboard-orange bg-dashboard-orange/10 text-dashboard-orange cursor-pointer" onClick={() => setSelectedBase(null)}>
              Base: {selectedBase} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTempoParado && (
            <Badge variant="outline" className="border-destructive bg-destructive/10 text-destructive cursor-pointer" onClick={() => setSelectedTempoParado(null)}>
              Tempo: {selectedTempoParado} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            Limpar todos
          </Button>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Card className="bg-dashboard-card border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-dashboard-accent">ESTOQUE MATRIZ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(filteredMatrizTotals.valor)}</p>
                </div>
                <div className="text-center">
                  <Box className="h-5 w-5 mx-auto mb-1 text-dashboard-blue" />
                  <p className="text-xs text-muted-foreground">M³</p>
                  <p className="text-lg font-bold text-foreground">{filteredMatrizTotals.m3.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-dashboard-accent" />
                  <p className="text-xs text-muted-foreground">Qtde SKUs</p>
                  <p className="text-lg font-bold text-foreground">{formatNumber(filteredMatrizTotals.qtdeSKUs)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-dashboard-card border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-dashboard-blue">ESTOQUE BASE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(filteredBaseTotals.valor)}</p>
                </div>
                <div className="text-center">
                  <Box className="h-5 w-5 mx-auto mb-1 text-dashboard-blue" />
                  <p className="text-xs text-muted-foreground">M³</p>
                  <p className="text-lg font-bold text-foreground">{filteredBaseTotals.m3.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-dashboard-accent" />
                  <p className="text-xs text-muted-foreground">Qtde SKUs</p>
                  <p className="text-lg font-bold text-foreground">{formatNumber(filteredBaseTotals.qtdeSKUs)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts - 4 in order */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* 1. Representação do Estoque | Grupo - Pizza */}
          <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Representação do Estoque | Grupo</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={estoqueByGrupo} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" onClick={handleGrupoPieClick}>
                    {estoqueByGrupo.map((entry, index) => (
                      <Cell key={index} fill={COLORS[index % COLORS.length]}
                        opacity={selectedGrupo && selectedGrupo !== entry.name ? 0.3 : 1}
                        stroke={selectedGrupo === entry.name ? '#fff' : 'none'} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatNumber(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 2. Valor Estoque | Grupo - Barra horizontal */}
          <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Valor Estoque | Grupo</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={valorByGrupo} layout="vertical" onClick={handleGrupoBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 3. Tempo Parado | SKU - Pizza (faixas) */}
          <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedTempoParado ? 'ring-2 ring-destructive' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Tempo Parado | SKU</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={tempoParadoPie} cx="50%" cy="50%" innerRadius={40} outerRadius={70} dataKey="value" onClick={handleTempoParadoClick}>
                    {tempoParadoPie.map((entry, index) => (
                      <Cell key={index} fill={TEMPO_PARADO_COLORS[entry.name] || COLORS[index % COLORS.length]}
                        opacity={selectedTempoParado && selectedTempoParado !== entry.name ? 0.3 : 1}
                        stroke={selectedTempoParado === entry.name ? '#fff' : 'none'} strokeWidth={2} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => `${value} SKUs`} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 4. Tempo Parado Médio | Grupo - Barra horizontal */}
          <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Tempo Parado Médio | Grupo</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoParadoMedioGrupo} layout="vertical" onClick={handleGrupoBarClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => `${value} dias`} />
                  <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Tables */}
        <div className="space-y-4">
          {/* Estoque Matriz Table - Full width */}
          <Card className="bg-dashboard-card border-dashboard-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Estoque Matriz <span className="text-sm font-normal text-muted-foreground">({filteredMatriz.length} itens)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[400px] custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="border-dashboard-border">
                    <TableHead className="text-muted-foreground">Base</TableHead>
                    <TableHead className="text-muted-foreground">Código</TableHead>
                    <TableHead className="text-muted-foreground">Descrição</TableHead>
                    <TableHead className="text-muted-foreground">Grupo</TableHead>
                    <TableHead className="text-muted-foreground">SubGrupo</TableHead>
                    <TableHead className="text-muted-foreground">Categoria</TableHead>
                    <TableHead className="text-muted-foreground text-right">Qtde. Entrada</TableHead>
                    <TableHead className="text-muted-foreground text-right">Qtde. Saída</TableHead>
                    <TableHead className="text-muted-foreground text-right">Estoque</TableHead>
                    <TableHead className="text-muted-foreground text-right">Vl. Item</TableHead>
                    <TableHead className="text-muted-foreground text-right">Vl. Total</TableHead>
                    <TableHead className="text-muted-foreground text-right">M3 Unit.</TableHead>
                    <TableHead className="text-muted-foreground text-right">M3 Total</TableHead>
                    <TableHead className="text-muted-foreground">Dt. Últ. Entrada</TableHead>
                    <TableHead className="text-muted-foreground text-right">Qtde. Últ. Entrada</TableHead>
                    <TableHead className="text-muted-foreground">Dt. Últ. Saída</TableHead>
                    <TableHead className="text-muted-foreground text-right">Qtde. Últ. Saída</TableHead>
                    <TableHead className="text-muted-foreground text-right">Dias s/ Movto.</TableHead>
                    <TableHead className="text-muted-foreground">Tempo Parado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMatriz.map((item) => (
                    <TableRow key={item.id}
                      className={`border-dashboard-border hover:bg-dashboard-border/50 cursor-pointer text-xs ${selectedSKU === item.codigo ? 'bg-dashboard-accent/10' : ''}`}
                      onClick={() => setSelectedSKU(prev => prev === item.codigo ? null : item.codigo)}>
                      <TableCell className="text-foreground">{item.base}</TableCell>
                      <TableCell className="text-dashboard-accent font-medium">{item.codigo}</TableCell>
                      <TableCell className="text-foreground truncate max-w-[150px]">{item.descricao}</TableCell>
                      <TableCell className="text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setSelectedGrupo(prev => prev === item.grupo ? null : item.grupo); }}>
                        {item.grupo}
                      </TableCell>
                      <TableCell className="text-muted-foreground">{item.subGrupo}</TableCell>
                      <TableCell className="text-muted-foreground">{item.categoria}</TableCell>
                      <TableCell className="text-foreground text-right">{formatNumber(item.qtdeEntrada)}</TableCell>
                      <TableCell className="text-foreground text-right">{formatNumber(item.qtdeSaida)}</TableCell>
                      <TableCell className="text-foreground text-right font-medium">{formatNumber(item.estoque)}</TableCell>
                      <TableCell className="text-foreground text-right">{formatCurrency(item.vlItem)}</TableCell>
                      <TableCell className="text-foreground text-right">{formatCurrency(item.vlTotal)}</TableCell>
                      <TableCell className="text-foreground text-right">{item.m3Unitario.toFixed(4)}</TableCell>
                      <TableCell className="text-foreground text-right">{item.m3Total.toFixed(2)}</TableCell>
                      <TableCell className="text-foreground">{item.dtUltimaEntrada}</TableCell>
                      <TableCell className="text-foreground text-right">{formatNumber(item.qtdeUltimaEntrada)}</TableCell>
                      <TableCell className="text-foreground">{item.dtUltimaSaida}</TableCell>
                      <TableCell className="text-foreground text-right">{formatNumber(item.qtdeUltimaSaida)}</TableCell>
                      <TableCell className="text-foreground text-right">{item.diasSemMovto}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className="text-xs cursor-pointer"
                          onClick={(e) => { e.stopPropagation(); setSelectedTempoParado(prev => prev === item.tempoParado ? null : item.tempoParado); }}
                          style={{ borderColor: TEMPO_PARADO_COLORS[item.tempoParado], color: TEMPO_PARADO_COLORS[item.tempoParado] }}>
                          {item.tempoParado}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Estoque Base Table - Full width */}
          <Card className="bg-dashboard-card border-dashboard-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Estoque Base <span className="text-sm font-normal text-muted-foreground">({filteredBase.length} itens)</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[400px] custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="border-dashboard-border">
                    <TableHead className="text-muted-foreground">Base</TableHead>
                    <TableHead className="text-muted-foreground">Cidade</TableHead>
                    <TableHead className="text-muted-foreground">UF</TableHead>
                    <TableHead className="text-muted-foreground">Código</TableHead>
                    <TableHead className="text-muted-foreground text-right">M3</TableHead>
                    <TableHead className="text-muted-foreground">Produto</TableHead>
                    <TableHead className="text-muted-foreground text-right">Qtde. Entrada</TableHead>
                    <TableHead className="text-muted-foreground text-right">Qtde. Saída</TableHead>
                    <TableHead className="text-muted-foreground">Região</TableHead>
                    <TableHead className="text-muted-foreground text-right">Saldo</TableHead>
                    <TableHead className="text-muted-foreground text-right">Vl. Total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBase.map((item) => (
                    <TableRow key={item.id}
                      className={`border-dashboard-border hover:bg-dashboard-border/50 cursor-pointer text-xs ${selectedBase === item.base ? 'bg-dashboard-accent/10' : ''}`}
                      onClick={() => setSelectedBase(prev => prev === item.base ? null : item.base)}>
                      <TableCell className="text-foreground">{item.base}</TableCell>
                      <TableCell className="text-foreground">{item.cidade}</TableCell>
                      <TableCell className="text-foreground">{item.uf}</TableCell>
                      <TableCell className="text-dashboard-accent font-medium">{item.codigo}</TableCell>
                      <TableCell className="text-foreground text-right">{item.m3.toFixed(4)}</TableCell>
                      <TableCell className="text-foreground truncate max-w-[150px]">{item.produto}</TableCell>
                      <TableCell className="text-foreground text-right">{formatNumber(item.qtdeEntrada)}</TableCell>
                      <TableCell className="text-foreground text-right">{formatNumber(item.qtdeSaida)}</TableCell>
                      <TableCell className="text-foreground">{item.regiao}</TableCell>
                      <TableCell className="text-foreground text-right font-medium">{formatNumber(item.saldo)}</TableCell>
                      <TableCell className="text-foreground text-right">{formatCurrency(item.vlTotal)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
};

export default EstoqueConsolidado;
