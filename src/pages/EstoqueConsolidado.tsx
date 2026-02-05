import { useState, useMemo, useCallback } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  generateEstoqueMatriz,
  generateEstoqueBase,
  calculateMatrizTotals,
  calculateBaseTotals,
  getEstoqueByGrupo,
  getTempoParadoByGrupo,
  getTopTempoParado,
} from "@/data/estoqueConsolidadoData";
import { formatNumber, formatCurrency } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DollarSign, Box, Package, X } from "lucide-react";

const COLORS = ['hsl(45, 100%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)', 'hsl(340, 82%, 52%)'];

const EstoqueConsolidado = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [estoqueMatriz] = useState(() => generateEstoqueMatriz(50));
  const [estoqueBase] = useState(() => generateEstoqueBase(80));

  // Global filters
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // Filter states for BI interactivity
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [selectedSKU, setSelectedSKU] = useState<string | null>(null);
  const [selectedBase, setSelectedBase] = useState<string | null>(null);

  // Filtered data
  const filteredEstoqueMatriz = useMemo(() => {
    let result = estoqueMatriz;
    if (selectedGrupo) result = result.filter(item => item.grupo === selectedGrupo);
    if (selectedSKU) result = result.filter(item => item.sku === selectedSKU);
    return result;
  }, [estoqueMatriz, selectedGrupo, selectedSKU]);

  const filteredEstoqueBase = useMemo(() => {
    let result = estoqueBase;
    if (selectedGrupo) result = result.filter(item => item.grupo === selectedGrupo);
    if (selectedBase) result = result.filter(item => item.base === selectedBase);
    return result;
  }, [estoqueBase, selectedGrupo, selectedBase]);

  const matrizTotals = useMemo(() => calculateMatrizTotals(filteredEstoqueMatriz), [filteredEstoqueMatriz]);
  const baseTotals = useMemo(() => calculateBaseTotals(filteredEstoqueBase), [filteredEstoqueBase]);
  const estoqueByGrupo = useMemo(() => getEstoqueByGrupo(filteredEstoqueMatriz), [filteredEstoqueMatriz]);
  const tempoParadoByGrupo = useMemo(() => getTempoParadoByGrupo(filteredEstoqueMatriz), [filteredEstoqueMatriz]);
  const topTempoParado = useMemo(() => getTopTempoParado(filteredEstoqueMatriz, 8), [filteredEstoqueMatriz]);

  const handleRefreshData = () => {
    setLastUpdate(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const matrizData = filteredEstoqueMatriz.map(item => ({
      SKU: item.sku,
      Nome: item.nome,
      Grupo: item.grupo,
      Quantidade: item.quantidade,
      "Valor Unitário": item.valorUnitario,
      "Valor Total": item.valorTotal,
      M3: item.m3,
      "Tempo Parado (dias)": item.tempoParado,
    }));

    const baseData = filteredEstoqueBase.map(item => ({
      Base: item.base,
      SKU: item.sku,
      Nome: item.nome,
      Grupo: item.grupo,
      Quantidade: item.quantidade,
      "Valor Total": item.valorTotal,
      M3: item.m3,
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(matrizData), "Estoque Matriz");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(baseData), "Estoque Base");
    
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `estoque_consolidado_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  // BI Click handlers
  const handleGrupoClick = useCallback((data: any) => {
    if (data && data.name) {
      setSelectedGrupo(prev => prev === data.name ? null : data.name);
    }
  }, []);

  const handleGrupoChartClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const grupo = data.activePayload[0].payload.name;
      setSelectedGrupo(prev => prev === grupo ? null : grupo);
    }
  }, []);

  const handleSKUClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const sku = data.activePayload[0].payload.name;
      setSelectedSKU(prev => prev === sku ? null : sku);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedGrupo(null);
    setSelectedSKU(null);
    setSelectedBase(null);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSelectedMonths([currentMonth]);
    setSelectedYears([currentYear]);
    setSelectedRegions([]);
    clearAllFilters();
  }, []);

  const hasActiveFilters = !!(selectedGrupo || selectedSKU || selectedBase);
  const hasGlobalFilters = selectedMonths.length !== 1 || selectedMonths[0] !== currentMonth || selectedYears.length !== 1 || selectedYears[0] !== currentYear || selectedRegions.length > 0;

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader
        pageId="estoque-consolidado"
        lastUpdate={lastUpdate}
        showFilters={true}
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedRegions}
        onMonthsChange={setSelectedMonths}
        onYearsChange={setSelectedYears}
        onRegionsChange={setSelectedRegions}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
        onClearAllFilters={clearGlobalFilters}
        hasActiveFilters={hasGlobalFilters || hasActiveFilters}
      />

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
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            Limpar todos
          </Button>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* KPI Cards - Matriz e Base */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Estoque Matriz */}
          <Card className="bg-dashboard-card border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-dashboard-accent">ESTOQUE MATRIZ</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(matrizTotals.valor)}</p>
                </div>
                <div className="text-center">
                  <Box className="h-5 w-5 mx-auto mb-1 text-dashboard-blue" />
                  <p className="text-xs text-muted-foreground">M³</p>
                  <p className="text-lg font-bold text-foreground">{matrizTotals.m3.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-dashboard-accent" />
                  <p className="text-xs text-muted-foreground">Qtde SKUs</p>
                  <p className="text-lg font-bold text-foreground">{formatNumber(matrizTotals.qtdeSKUs)}</p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Estoque Base */}
          <Card className="bg-dashboard-card border-dashboard-border">
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-dashboard-blue">ESTOQUE BASE</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
                  <p className="text-xs text-muted-foreground">Valor</p>
                  <p className="text-lg font-bold text-foreground">{formatCurrency(baseTotals.valor)}</p>
                </div>
                <div className="text-center">
                  <Box className="h-5 w-5 mx-auto mb-1 text-dashboard-blue" />
                  <p className="text-xs text-muted-foreground">M³</p>
                  <p className="text-lg font-bold text-foreground">{baseTotals.m3.toFixed(1)}</p>
                </div>
                <div className="text-center">
                  <Package className="h-5 w-5 mx-auto mb-1 text-dashboard-accent" />
                  <p className="text-xs text-muted-foreground">Qtde SKUs</p>
                  <p className="text-lg font-bold text-foreground">{formatNumber(baseTotals.qtdeSKUs)}</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts - all clickable */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Representação do Estoque por Grupo - clickable */}
          <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Representação do Estoque | Grupo</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={estoqueByGrupo}
                    cx="50%"
                    cy="50%"
                    innerRadius={40}
                    outerRadius={70}
                    dataKey="value"
                    onClick={handleGrupoClick}
                  >
                    {estoqueByGrupo.map((entry, index) => (
                      <Cell 
                        key={`cell-${index}`} 
                        fill={COLORS[index % COLORS.length]} 
                        opacity={selectedGrupo && selectedGrupo !== entry.name ? 0.3 : 1}
                        stroke={selectedGrupo === entry.name ? '#fff' : 'none'}
                        strokeWidth={2}
                      />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tempo Parado por SKU - clickable */}
          <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedSKU ? 'ring-2 ring-dashboard-blue' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Tempo Parado | SKU</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={topTempoParado} layout="vertical" onClick={handleSKUClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} />
                  <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} />
                  <Bar dataKey="value" fill="hsl(25, 95%, 53%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Valor Estoque por Grupo - clickable */}
          <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Valor Estoque | Grupo</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={estoqueByGrupo} layout="vertical" onClick={handleGrupoChartClick}>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                  <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                  <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={70} />
                  <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                  <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Tempo Parado Médio por Grupo - clickable */}
          <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-foreground">Tempo Parado Médio | Grupo</CardTitle>
            </CardHeader>
            <CardContent className="h-[200px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={tempoParadoByGrupo} layout="vertical" onClick={handleGrupoChartClick}>
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

        {/* Tables - clickable rows */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {/* Estoque Matriz Table */}
          <Card className="bg-dashboard-card border-dashboard-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Estoque Matriz {hasActiveFilters && <span className="text-sm font-normal text-muted-foreground">({filteredEstoqueMatriz.length} itens)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[350px] custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="border-dashboard-border">
                    <TableHead className="text-muted-foreground">SKU</TableHead>
                    <TableHead className="text-muted-foreground">Nome</TableHead>
                    <TableHead className="text-muted-foreground">Grupo</TableHead>
                    <TableHead className="text-muted-foreground text-right">Qtde</TableHead>
                    <TableHead className="text-muted-foreground text-right">Valor</TableHead>
                    <TableHead className="text-muted-foreground text-right">Dias</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstoqueMatriz.slice(0, 15).map((item) => (
                    <TableRow 
                      key={item.id} 
                      className={`border-dashboard-border hover:bg-dashboard-border/50 cursor-pointer ${selectedSKU === item.sku ? 'bg-dashboard-accent/10' : ''}`}
                      onClick={() => setSelectedSKU(prev => prev === item.sku ? null : item.sku)}
                    >
                      <TableCell className="text-dashboard-accent font-medium">{item.sku}</TableCell>
                      <TableCell className="text-foreground truncate max-w-[120px]">{item.nome}</TableCell>
                      <TableCell 
                        className="text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={(e) => { e.stopPropagation(); setSelectedGrupo(prev => prev === item.grupo ? null : item.grupo); }}
                      >
                        {item.grupo}
                      </TableCell>
                      <TableCell className="text-foreground text-right">{formatNumber(item.quantidade)}</TableCell>
                      <TableCell className="text-foreground text-right">{formatCurrency(item.valorTotal)}</TableCell>
                      <TableCell className="text-foreground text-right">{item.tempoParado}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          {/* Estoque Base Table */}
          <Card className="bg-dashboard-card border-dashboard-border">
            <CardHeader>
              <CardTitle className="text-base font-semibold text-foreground">
                Estoque Base {hasActiveFilters && <span className="text-sm font-normal text-muted-foreground">({filteredEstoqueBase.length} itens)</span>}
              </CardTitle>
            </CardHeader>
            <CardContent className="overflow-auto max-h-[350px] custom-scrollbar">
              <Table>
                <TableHeader>
                  <TableRow className="border-dashboard-border">
                    <TableHead className="text-muted-foreground">Base</TableHead>
                    <TableHead className="text-muted-foreground">SKU</TableHead>
                    <TableHead className="text-muted-foreground">Grupo</TableHead>
                    <TableHead className="text-muted-foreground text-right">Qtde</TableHead>
                    <TableHead className="text-muted-foreground text-right">Valor</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredEstoqueBase.slice(0, 15).map((item) => (
                    <TableRow 
                      key={item.id} 
                      className={`border-dashboard-border hover:bg-dashboard-border/50 cursor-pointer ${selectedBase === item.base ? 'bg-dashboard-accent/10' : ''}`}
                    >
                      <TableCell 
                        className="text-foreground cursor-pointer hover:text-dashboard-accent"
                        onClick={() => setSelectedBase(prev => prev === item.base ? null : item.base)}
                      >
                        {item.base}
                      </TableCell>
                      <TableCell className="text-dashboard-accent font-medium">{item.sku}</TableCell>
                      <TableCell 
                        className="text-muted-foreground cursor-pointer hover:text-foreground"
                        onClick={() => setSelectedGrupo(prev => prev === item.grupo ? null : item.grupo)}
                      >
                        {item.grupo}
                      </TableCell>
                      <TableCell className="text-foreground text-right">{formatNumber(item.quantidade)}</TableCell>
                      <TableCell className="text-foreground text-right">{formatCurrency(item.valorTotal)}</TableCell>
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
