import { useState, useMemo, useCallback, useEffect, useTransition } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { RegionalBarChart } from "@/components/dashboard/RegionalBarChart";
import { RegionalLineCharts } from "@/components/dashboard/RegionalLineCharts";
import { ActiveFilters } from "@/components/dashboard/ActiveFilters";
import { RefreshProgress } from "@/components/dashboard/RefreshProgress";
import { useFollowupData } from "@/hooks/useFollowupData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { months as allMonths, allMonthValues } from "@/data/mockData";
import { AlertCircle, InboxIcon, Loader2, X } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Index = () => {
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();

  const { getCodCli, loading: settingsLoading } = useBiSettingsContext();
  const codCli = getCodCli("minutas");

  const {
    followupData,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    error,
    fetchFollowup,
    getMinutasData,
    getMinutasDailyData,
    lastUpdateAt,
  } = useFollowupData(codCli, "minutas");

  const [showError, setShowError] = useState(true);
  const [showRefreshProgress, setShowRefreshProgress] = useState(true);

  const today = useMemo(() => {
    const d = new Date();
    d.setHours(0, 0, 0, 0);
    return d;
  }, []);

  // Start with today selected in calendar, no month/year filters
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [selectedYears, setSelectedYears] = useState<number[]>([]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"expedidas" | "baixadas" | null>(null);
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: today, to: today });
  const [isFiltering, startFilterTransition] = useTransition();

  // Sync lastUpdate from DB
  useEffect(() => {
    if (lastUpdateAt) setLastUpdate(lastUpdateAt);
  }, [lastUpdateAt]);

  // When date range is active, it overrides month/year filters
  const dateRangeActive = !!selectedDateRange.from;
  const barChartDataRaw = useMemo(() => getMinutasData(selectedMonths, selectedYears, dateRangeActive ? selectedDateRange as any : undefined), [getMinutasData, selectedMonths, selectedYears, selectedDateRange, dateRangeActive]);
  const aggregatedDailyData = useMemo(() => getMinutasDailyData(selectedMonths, selectedYears, dateRangeActive ? selectedDateRange as any : undefined), [getMinutasDailyData, selectedMonths, selectedYears, selectedDateRange, dateRangeActive]);

  // Filter by selected regions
  const filteredBarChartData = useMemo(() => {
    if (selectedRegions.length === 0) return barChartDataRaw;
    return barChartDataRaw.filter(item => selectedRegions.includes(item.name));
  }, [barChartDataRaw, selectedRegions]);

  const filteredDailyData = useMemo(() => {
    if (selectedRegions.length === 0) return aggregatedDailyData;
    return aggregatedDailyData.filter(item => selectedRegions.includes(item.region));
  }, [aggregatedDailyData, selectedRegions]);

  // Apply day filter to bar chart and sort by total descending
  const barChartData = useMemo(() => {
    const raw = selectedDay === null ? filteredBarChartData : filteredDailyData.map(rd => {
      const dayData = rd.data.find(d => d.day === selectedDay);
      return {
        name: rd.region,
        expedidas: dayData?.expedidas || 0,
        baixadas: dayData?.baixadas || 0,
      };
    });
    return [...raw].sort((a, b) => (b.expedidas + b.baixadas) - (a.expedidas + a.baixadas));
  }, [filteredBarChartData, filteredDailyData, selectedDay]);

  // Sort line charts in the same order as bar chart
  const sortedDailyData = useMemo(() => {
    const order = barChartData.map(d => d.name);
    return [...filteredDailyData].sort((a, b) => {
      const ai = order.indexOf(a.region);
      const bi = order.indexOf(b.region);
      return (ai === -1 ? 999 : ai) - (bi === -1 ? 999 : bi);
    });
  }, [filteredDailyData, barChartData]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalExpedidas = barChartData.reduce((sum, r) => sum + r.expedidas, 0);
    const totalBaixadas = barChartData.reduce((sum, r) => sum + r.baixadas, 0);
    return { totalExpedidas, totalBaixadas };
  }, [barChartData]);

  const handleRegionClick = useCallback((region: string) => {
    startFilterTransition(() => {
      setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
    });
  }, []);

  const handleDayClick = useCallback((day: number) => {
    startFilterTransition(() => {
      setSelectedDay(prev => prev === day ? null : day);
    });
  }, []);

  const handleMetricClick = useCallback((metric: "expedidas" | "baixadas") => {
    startFilterTransition(() => {
      setSelectedMetric(prev => prev === metric ? null : metric);
    });
  }, []);

  const handleBarClick = useCallback((region: string, metric: "expedidas" | "baixadas") => {
    startFilterTransition(() => {
      setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
      setSelectedMetric(prev => prev === metric ? null : metric);
    });
  }, []);

  const handleLinePointClick = useCallback((region: string, day: number, metric: "expedidas" | "baixadas") => {
    startFilterTransition(() => {
      setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
      setSelectedDay(prev => prev === day ? null : day);
      setSelectedMetric(prev => prev === metric ? null : metric);
    });
  }, []);

  const clearDayFilter = useCallback(() => startFilterTransition(() => setSelectedDay(null)), []);
  const clearMetricFilter = useCallback(() => startFilterTransition(() => setSelectedMetric(null)), []);
  const clearAllFilters = useCallback(() => {
    startFilterTransition(() => {
      setSelectedDay(null);
      setSelectedMetric(null);
      setSelectedRegions([]);
      setSelectedMonths([]);
      setSelectedYears([]);
      setSelectedDateRange({ from: today, to: today });
    });
  }, [today]);

  const handleRefreshData = useCallback(() => {
    if (codCli && !refreshing) {
      setShowRefreshProgress(true);
      setShowError(true);
      fetchFollowup(selectedMonths, selectedYears);
      setLastUpdate(new Date());
    }
  }, [codCli, refreshing, fetchFollowup, selectedMonths, selectedYears]);

  const isDefaultState = selectedMonths.length === 0 && selectedYears.length === 0 &&
    selectedDateRange.from?.getTime() === today.getTime() && selectedDateRange.to?.getTime() === today.getTime();
  const hasActiveFilters = selectedDay !== null || selectedMetric !== null || selectedRegions.length > 0 || !isDefaultState;

  const exportToExcel = useCallback(() => {
    const exportData = barChartData.map(region => ({
      Regional: region.name,
      Expedidas: region.expedidas,
      Baixadas: region.baixadas,
      Diferença: region.expedidas - region.baixadas,
      "% Baixadas": region.expedidas > 0 ? ((region.baixadas / region.expedidas) * 100).toFixed(2) + "%" : "0%",
    }));
    exportData.push({
      Regional: "TOTAL",
      Expedidas: totals.totalExpedidas,
      Baixadas: totals.totalBaixadas,
      Diferença: totals.totalExpedidas - totals.totalBaixadas,
      "% Baixadas": totals.totalExpedidas > 0 ? ((totals.totalBaixadas / totals.totalExpedidas) * 100).toFixed(2) + "%" : "0%",
    });
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    const monthNames = selectedMonths.map(m => allMonths.find(month => month.value === m)?.short).join("-");
    const yearNames = selectedYears.join("-");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `minutas_${monthNames}_${yearNames}.xlsx`);
  }, [barChartData, totals, selectedMonths, selectedYears]);

  // No cod_cli configured
  if (!settingsLoading && !codCli) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Configuração necessária</h2>
          <p className="text-sm text-muted-foreground">Configure o código do cliente (cod_cli) para "minutas" em Configurar BI.</p>
        </div>
      </div>
    );
  }

  const hasData = followupData.length > 0;
  const showEmptyState = cacheLoaded && !hasData && !refreshing;

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead pageId="minutas" />
      <SharedHeader
        pageTitle="Minutas Expedidas x Baixadas"
        pageId="minutas"
        lastUpdate={lastUpdate}
        showFilters={true}
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedRegions}
        onMonthsChange={(v) => startFilterTransition(() => { setSelectedMonths(v); setSelectedDateRange({ from: undefined, to: undefined }); })}
        onYearsChange={(v) => startFilterTransition(() => { setSelectedYears(v); setSelectedDateRange({ from: undefined, to: undefined }); })}
        onRegionsChange={(v) => startFilterTransition(() => setSelectedRegions(v))}
        selectedDateRange={selectedDateRange}
        onDateRangeChange={(range) => startFilterTransition(() => {
          setSelectedDateRange(range);
          if (range.from) {
            // Calendar overrides month/year
            setSelectedMonths([]);
            setSelectedYears([]);
          } else {
            // Clearing calendar restores default: today
            setSelectedMonths([]);
            setSelectedYears([]);
            setSelectedDateRange({ from: today, to: today });
          }
        })}
        onClearAllFilters={clearAllFilters}
        onExportExcel={exportToExcel}
        onRefreshData={handleRefreshData}
        hasActiveFilters={hasActiveFilters}
      />

      {showRefreshProgress && (
        <RefreshProgress
          stage={refreshStage}
          recordCount={refreshRecordCount}
          onDismiss={() => setShowRefreshProgress(false)}
        />
      )}

      <ActiveFilters
        selectedDay={selectedDay}
        selectedMetric={selectedMetric}
        onClearDay={clearDayFilter}
        onClearMetric={clearMetricFilter}
        onClearAll={clearAllFilters}
      />

      {error && showError && (
        <div className="mx-6 mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setShowError(false)} className="p-0.5 rounded hover:bg-destructive/10 transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      )}

      {/* Loading modal while cache loads */}
      {cacheLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border border-border bg-card p-8 shadow-lg flex flex-col items-center gap-4 max-w-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Carregando dados</h3>
            <p className="text-sm text-muted-foreground text-center">
              Recuperando dados da última atualização...
            </p>
          </div>
        </div>
      )}

      {showEmptyState ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">Nenhum dado disponível</h2>
            <p className="text-sm text-muted-foreground">Clique no botão <strong>Atualizar</strong> no cabeçalho para buscar os dados.</p>
          </div>
        </div>
      ) : (
        <div className="relative flex flex-col md:flex-row gap-4 px-6 pb-6 md:h-[calc(100vh-180px)]">
          {isFiltering && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-background/60 backdrop-blur-[1px] rounded-lg">
              <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-5 py-3 shadow-md">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">Processando filtros...</span>
              </div>
            </div>
          )}
          <div className="w-full md:w-[30%] flex flex-col gap-4 md:h-full">
            <KPICards
              totalExpedidas={totals.totalExpedidas}
              totalBaixadas={totals.totalBaixadas}
              selectedMetric={selectedMetric}
              onMetricClick={handleMetricClick}
            />
            <div className="h-[400px] md:flex-1 md:min-h-0">
              <RegionalBarChart
                data={barChartData}
                selectedMetric={selectedMetric}
                selectedRegion={selectedRegions.length === 1 ? selectedRegions[0] : "all"}
                onRegionClick={handleRegionClick}
                onMetricClick={handleMetricClick}
                onBarClick={handleBarClick}
              />
            </div>
          </div>
          <div className="w-full md:w-[70%] h-[500px] md:h-full">
            <RegionalLineCharts
              data={sortedDailyData}
              selectedDay={selectedDay}
              selectedMetric={selectedMetric}
              selectedMonths={selectedMonths}
              selectedRegion={selectedRegions.length === 1 ? selectedRegions[0] : "all"}
              onDayClick={handleDayClick}
              onRegionClick={handleRegionClick}
              onLinePointClick={handleLinePointClick}
            />
          </div>
        </div>
      )}
    </div>
  );
};

export default Index;
