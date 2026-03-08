import { useState, useMemo, useCallback, useEffect, useTransition } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { RefreshProgress } from "@/components/dashboard/RefreshProgress";
import { useFollowupData } from "@/hooks/useFollowupData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useCityMapping } from "@/hooks/useCityMapping";
import { Badge } from "@/components/ui/badge";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend,
  LabelList,
} from "recharts";
import { formatCurrency, allMonthValues } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Clock, X, AlertCircle, InboxIcon, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ['hsl(45, 100%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)', 'hsl(340, 82%, 52%)', 'hsl(180, 70%, 45%)'];

const Faturamento = () => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;
  // Default: all months from Jan to current month
  const defaultMonths = Array.from({ length: currentMonth }, (_, i) => i + 1);
  const { getCodCli, loading: settingsLoading } = useBiSettingsContext();
  const codCli = getCodCli("faturamento");

  const {
    followupData,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    error,
    fetchFollowup,
    getFaturamentoData,
    lastUpdateAt,
  } = useFollowupData(codCli, "faturamento");

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [showError, setShowError] = useState(true);
  const [showRefreshProgress, setShowRefreshProgress] = useState(true);
  const [isFiltering, startFilterTransition] = useTransition();
  // B-SIDE / D-SIDE multi-select filter (empty = show all)
  const [selectedSides, setSelectedSides] = useState<string[]>([]);

  // Global filters
  const [selectedMonths, setSelectedMonths] = useState<number[]>(defaultMonths);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedGlobalRegions, setSelectedGlobalRegions] = useState<string[]>([]);

  // BI interactivity filters
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<string | null>(null);
  const [selectedTipoServico, setSelectedTipoServico] = useState<string | null>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<string | null>(null);

  // Interactive filters for cross-filtering
  const interactiveFilters = useMemo(() => ({
    selectedMonth,
    selectedRegional,
    selectedModalidade,
    selectedTipoServico,
    selectedCampanha,
  }), [selectedMonth, selectedRegional, selectedModalidade, selectedTipoServico, selectedCampanha]);

  // Filters WITHOUT selectedMonth - for the monthly line chart (so all months remain visible/clickable)
  const chartInteractiveFilters = useMemo(() => ({
    selectedMonth: null,
    selectedRegional,
    selectedModalidade,
    selectedTipoServico,
    selectedCampanha,
  }), [selectedRegional, selectedModalidade, selectedTipoServico, selectedCampanha]);

  // Full cross-filtered result (KPIs + breakdown charts)
  const faturamentoResult = useMemo(() => {
    return getFaturamentoData(selectedMonths, selectedYears, selectedSides, interactiveFilters);
  }, [getFaturamentoData, selectedMonths, selectedYears, selectedSides, interactiveFilters]);

  // Chart-specific result without month filter (for monthly line/bar charts)
  const chartResult = useMemo(() => {
    return getFaturamentoData(selectedMonths, selectedYears, selectedSides, chartInteractiveFilters);
  }, [getFaturamentoData, selectedMonths, selectedYears, selectedSides, chartInteractiveFilters]);

  const { totals: displayTotals, tipoServico: tipoServicoData, modalidade: modalidadeData, campanha: campanhaData, regional: regionalData } = faturamentoResult;
  const { mensal } = chartResult;

  useEffect(() => {
    if (lastUpdateAt) setLastUpdate(lastUpdateAt);
  }, [lastUpdateAt]);

  const handleRefreshData = useCallback(() => {
    fetchFollowup();
    toast.success("Atualizando dados do faturamento...");
  }, [fetchFollowup]);

  const handleExportExcel = useCallback(() => {
    const exportData = mensal.map(item => ({
      Mês: item.mes,
      Ano: item.ano,
      Faturamento: item.faturamento,
      Armazenagem: item.armazenagem,
      Transporte: item.transporte,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faturamento");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `faturamento_${new Date().toISOString().split('T')[0]}.xlsx`);
    toast.success("Arquivo Excel exportado com sucesso!");
  }, [mensal]);

  // Click handlers for BI interactivity
  const handleMonthClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const month = data.activePayload[0].payload.mes;
      setSelectedMonth(prev => prev === month ? null : month);
    }
  }, []);

  const handleRegionalClick = useCallback((data: any) => {
    if (data && data.name) {
      setSelectedRegional(prev => prev === data.name ? null : data.name);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedMonth(null);
    setSelectedRegional(null);
    setSelectedModalidade(null);
    setSelectedTipoServico(null);
    setSelectedCampanha(null);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSelectedMonths(defaultMonths);
    setSelectedYears([currentYear]);
    setSelectedGlobalRegions([]);
    setSelectedSides([]);
    clearAllFilters();
  }, [clearAllFilters, defaultMonths, currentYear]);

  const hasActiveFilters = !!(selectedMonth || selectedRegional || selectedModalidade || selectedTipoServico || selectedCampanha);
  const hasGlobalFilters = selectedMonths.length > 0 || selectedYears.length > 0 || selectedGlobalRegions.length > 0;
  const hasData = followupData.length > 0;
  const isLoading = settingsLoading || cacheLoading;

  // Transporte mensal horizontal bar chart data
  const transporteMensalData = useMemo(() =>
    mensal.map(m => ({ mes: m.mes, value: m.transporte })),
  [mensal]);

  // Armazenagem mensal horizontal bar chart data
  const armazenagemMensalData = useMemo(() =>
    mensal.map(m => ({ mes: m.mes, value: m.armazenagem })),
  [mensal]);

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <DocumentHead pageId="faturamento" />
      <SharedHeader
        pageId="faturamento"
        lastUpdate={lastUpdate}
        showFilters={true}
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedGlobalRegions}
        onMonthsChange={setSelectedMonths}
        onYearsChange={setSelectedYears}
        onRegionsChange={setSelectedGlobalRegions}
        selectedSides={selectedSides}
        onSidesChange={setSelectedSides}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
        onClearAllFilters={clearGlobalFilters}
        hasActiveFilters={hasGlobalFilters || hasActiveFilters || selectedSides.length > 0}
      />

      {/* Refresh Progress */}
      {refreshing && showRefreshProgress && (
        <RefreshProgress
          stage={refreshStage}
          recordCount={refreshRecordCount}
        />
      )}

      {/* Error Banner */}
      {error && showError && (
        <div className="mx-6 mt-4 p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 animate-fade-in">
          <AlertCircle className="h-4 w-4 text-red-400 shrink-0" />
          <span className="text-sm text-red-300 flex-1">{error}</span>
          <Button variant="ghost" size="sm" onClick={() => setShowError(false)} className="h-6 w-6 p-0">
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedMonth && (
            <Badge variant="outline" className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer" onClick={() => setSelectedMonth(null)}>
              Mês: {selectedMonth} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedRegional && (
            <Badge variant="outline" className="border-dashboard-blue bg-dashboard-blue/10 text-dashboard-blue cursor-pointer" onClick={() => setSelectedRegional(null)}>
              Regional: {selectedRegional} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedModalidade && (
            <Badge variant="outline" className="border-dashboard-orange bg-dashboard-orange/10 text-dashboard-orange cursor-pointer" onClick={() => setSelectedModalidade(null)}>
              Modalidade: {selectedModalidade} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTipoServico && (
            <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-500 cursor-pointer" onClick={() => setSelectedTipoServico(null)}>
              Tipo: {selectedTipoServico} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedCampanha && (
            <Badge variant="outline" className="border-purple-500 bg-purple-500/10 text-purple-500 cursor-pointer" onClick={() => setSelectedCampanha(null)}>
              Campanha: {selectedCampanha} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            Limpar todos
          </Button>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Loading State */}
        {isLoading && !hasData && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent mb-4" />
            <p className="text-muted-foreground">Carregando dados do faturamento...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && cacheLoaded && !hasData && (
          <div className="flex flex-col items-center justify-center py-20 animate-fade-in">
            <InboxIcon className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-medium text-foreground mb-2">Nenhum dado disponível</h3>
            <p className="text-muted-foreground mb-4">Clique em atualizar para buscar os dados da API.</p>
            <Button onClick={handleRefreshData} className="bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/90">
              Atualizar Dados
            </Button>
          </div>
        )}

        {/* Main Content */}
        {hasData && (
          <div className="space-y-4">
              {/* Row 1: [KPI Cards + Faturamento Mensal] + Transporte Mensal */}
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
                {/* Left block: KPIs above + Faturamento Mensal below — 3/4 width */}
                <div className="lg:col-span-3 flex flex-col gap-4">
                  {/* KPI Cards: 1 big left + 2x2 grid right (same as Tracking) */}
                  <div className="flex flex-col sm:flex-row gap-2 h-full items-stretch">
                    {/* Big Faturamento card */}
                    <Card className="bg-card border-primary/60 border-2 flex-1 min-w-0">
                      <CardContent className="p-3 flex flex-col items-center justify-center h-full">
                        <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">Faturamento</span>
                        <p className="text-4xl sm:text-5xl lg:text-6xl font-black text-primary leading-tight mt-1 break-all">{formatCurrency(displayTotals.faturamento)}</p>
                      </CardContent>
                    </Card>

                    {/* 2x2 grid: Armazenagem / Transporte */}
                    <div className="grid grid-cols-2 grid-rows-2 gap-1.5 flex-1 min-w-0">
                      <Card className="bg-card border-border">
                        <CardContent className="p-2 text-center flex flex-col justify-center h-full">
                          <span className="text-xs text-muted-foreground leading-tight">R$ Armazenagem</span>
                          <p className="text-lg sm:text-2xl font-bold text-dashboard-blue leading-tight">{formatCurrency(displayTotals.armazenagem)}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-border">
                        <CardContent className="p-2 text-center flex flex-col justify-center h-full">
                          <span className="text-xs text-muted-foreground leading-tight">% Armazenagem</span>
                          <p className="text-lg sm:text-2xl font-bold text-dashboard-blue leading-tight">{displayTotals.percentArmazenagem.toFixed(1)}%</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-border">
                        <CardContent className="p-2 text-center flex flex-col justify-center h-full">
                          <span className="text-xs text-muted-foreground leading-tight">R$ Transporte</span>
                          <p className="text-lg sm:text-2xl font-bold text-dashboard-orange leading-tight">{formatCurrency(displayTotals.transporte)}</p>
                        </CardContent>
                      </Card>

                      <Card className="bg-card border-border">
                        <CardContent className="p-2 text-center flex flex-col justify-center h-full">
                          <span className="text-xs text-muted-foreground leading-tight">% Transporte</span>
                          <p className="text-lg sm:text-2xl font-bold text-dashboard-orange leading-tight">{displayTotals.percentTransporte.toFixed(1)}%</p>
                        </CardContent>
                      </Card>
                    </div>
                  </div>

                  {/* Faturamento Mensal line chart */}
                  <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all flex-1 ${selectedMonth ? 'ring-2 ring-dashboard-accent' : ''}`}>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm font-medium text-foreground">Faturamento Mensal</CardTitle>
                    </CardHeader>
                    <CardContent className="h-[250px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={mensal} onClick={handleMonthClick}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                          <XAxis dataKey="mes" stroke="hsl(0, 0%, 60%)" fontSize={11} />
                          <YAxis stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => formatCurrency(v)} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                          <Line
                            type="monotone"
                            dataKey="faturamento"
                            stroke="hsl(45, 100%, 50%)"
                            strokeWidth={2}
                            dot={({ cx, cy, payload }: any) => (
                              <circle
                                key={payload.mes}
                                cx={cx}
                                cy={cy}
                                r={selectedMonth === payload.mes ? 8 : 4}
                                fill={selectedMonth === payload.mes ? 'hsl(45, 100%, 60%)' : 'hsl(45, 100%, 50%)'}
                                stroke={selectedMonth === payload.mes ? 'hsl(45, 100%, 70%)' : 'none'}
                                strokeWidth={2}
                              />
                            )}
                          >
                            <LabelList dataKey="faturamento" position="top" formatter={(v: number) => formatCurrency(v)} style={{ fill: 'hsl(0, 0%, 70%)', fontSize: 10 }} />
                          </Line>
                        </LineChart>
                      </ResponsiveContainer>
                    </CardContent>
                  </Card>
                </div>

                {/* Right: Transporte Mensal — 1/4 width, full height */}
                <Card className="bg-dashboard-card border-dashboard-border lg:col-span-1 flex flex-col">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Transporte Mensal</CardTitle>
                  </CardHeader>
                  <CardContent className="flex-1 min-h-[350px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={transporteMensalData} layout="vertical" margin={{ right: 80 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="mes" stroke="hsl(0, 0%, 60%)" fontSize={11} width={65} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="value" position="right" formatter={(v: number) => formatCurrency(v)} style={{ fill: 'hsl(0, 0%, 80%)', fontSize: 11 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Row 3: Região, Modalidade, Tipo Serviço */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Por Regional */}
                <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedRegional ? 'ring-2 ring-dashboard-blue' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Faturamento | Região</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={regionalData.slice(0, 6).map(r => ({ name: r.name, value: r.value }))}
                          cx="60%"
                          cy="50%"
                          innerRadius={35}
                          outerRadius={70}
                          dataKey="value"
                          onClick={handleRegionalClick}
                          label={({ percent }) => `${(percent * 100).toFixed(1)}%`}
                          labelLine={false}
                        >
                          {regionalData.slice(0, 6).map((entry, index) => (
                            <Cell
                              key={`cell-${index}`}
                              fill={COLORS[index % COLORS.length]}
                              opacity={selectedRegional && selectedRegional !== entry.name ? 0.3 : 1}
                              stroke={selectedRegional === entry.name ? '#fff' : 'none'}
                              strokeWidth={2}
                            />
                          ))}
                        </Pie>
                        <Legend layout="vertical" align="left" verticalAlign="middle" iconSize={8} wrapperStyle={{ fontSize: 11 }} />
                        <Tooltip formatter={(value: number) => formatCurrency(value)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Por Modalidade */}
                <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedModalidade ? 'ring-2 ring-dashboard-orange' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Faturamento | Modalidade</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={modalidadeData} layout="vertical" margin={{ right: 80 }} onClick={(data) => {
                        if (data && data.activePayload && data.activePayload[0]) {
                          const mod = data.activePayload[0].payload.name;
                          setSelectedModalidade(prev => prev === mod ? null : mod);
                        }
                      }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={10} width={80} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="value" position="right" formatter={(v: number) => formatCurrency(v)} style={{ fill: 'hsl(0, 0%, 80%)', fontSize: 11 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {/* Por Tipo de Serviço */}
                <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedTipoServico ? 'ring-2 ring-green-500' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Faturamento | Tipo de Serviço</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[220px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={tipoServicoData} layout="vertical" margin={{ right: 80 }} onClick={(data) => {
                        if (data && data.activePayload && data.activePayload[0]) {
                          const tipo = data.activePayload[0].payload.name;
                          setSelectedTipoServico(prev => prev === tipo ? null : tipo);
                        }
                      }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={90} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="value" position="right" formatter={(v: number) => formatCurrency(v)} style={{ fill: 'hsl(0, 0%, 80%)', fontSize: 10 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>

              {/* Row 4: Campanha + Armazenagem Mensal */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedCampanha ? 'ring-2 ring-purple-500' : ''}`}>
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Faturamento | Campanha</CardTitle>
                  </CardHeader>
                  <CardContent className="max-h-[300px] overflow-y-auto popover-dark-scroll">
                    <div style={{ height: Math.max(220, campanhaData.length * 30) }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={campanhaData} layout="vertical" margin={{ right: 80 }} onClick={(data) => {
                          if (data && data.activePayload && data.activePayload[0]) {
                            const campanha = data.activePayload[0].payload.name;
                            setSelectedCampanha(prev => prev === campanha ? null : campanha);
                          }
                        }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                          <XAxis type="number" hide />
                          <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={200} />
                          <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                          <Bar dataKey="value" fill="hsl(25, 95%, 53%)" radius={[0, 4, 4, 0]}>
                            <LabelList dataKey="value" position="right" formatter={(v: number) => formatCurrency(v)} style={{ fill: 'hsl(0, 0%, 80%)', fontSize: 11 }} />
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                {/* Armazenagem Mensal */}
                <Card className="bg-dashboard-card border-dashboard-border">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium text-foreground">Armazenagem Mensal</CardTitle>
                  </CardHeader>
                  <CardContent className="h-[250px]">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={armazenagemMensalData} layout="vertical" margin={{ right: 80 }}>
                        <XAxis type="number" hide />
                        <YAxis type="category" dataKey="mes" stroke="hsl(0, 0%, 60%)" fontSize={11} width={65} />
                        <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                        <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]}>
                          <LabelList dataKey="value" position="right" formatter={(v: number) => formatCurrency(v)} style={{ fill: 'hsl(0, 0%, 80%)', fontSize: 11 }} />
                        </Bar>
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Faturamento;
