import { useState, useMemo, useCallback, useEffect } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { RegionalBarChart } from "@/components/dashboard/RegionalBarChart";
import { RegionalLineCharts } from "@/components/dashboard/RegionalLineCharts";
import { ActiveFilters } from "@/components/dashboard/ActiveFilters";
import { useFollowupData } from "@/hooks/useFollowupData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { months as allMonths } from "@/data/mockData";
import { Loader2, AlertCircle } from "lucide-react";
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
    loading: dataLoading,
    error,
    fetchFollowup,
    fetchProdutosDistribuidos,
    getMinutasData,
    getMinutasDailyData,
    getTotalValue,
  } = useFollowupData(codCli);

  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"expedidas" | "baixadas" | null>(null);

  // Fetch data on mount when codCli is available
  useEffect(() => {
    if (codCli) {
      fetchFollowup();
      fetchProdutosDistribuidos();
    }
  }, [codCli, fetchFollowup, fetchProdutosDistribuidos]);

  // Get real data from hooks
  const barChartDataRaw = useMemo(() => getMinutasData(), [getMinutasData]);
  const aggregatedDailyData = useMemo(() => getMinutasDailyData(), [getMinutasDailyData]);

  // Filter by selected regions
  const filteredBarChartData = useMemo(() => {
    if (selectedRegions.length === 0) return barChartDataRaw;
    return barChartDataRaw.filter(item => selectedRegions.includes(item.name));
  }, [barChartDataRaw, selectedRegions]);

  const filteredDailyData = useMemo(() => {
    if (selectedRegions.length === 0) return aggregatedDailyData;
    return aggregatedDailyData.filter(item => selectedRegions.includes(item.region));
  }, [aggregatedDailyData, selectedRegions]);

  // Apply day filter to bar chart
  const barChartData = useMemo(() => {
    if (selectedDay === null) return filteredBarChartData;
    // Recalculate from daily data with day filter
    return filteredDailyData.map(rd => {
      const dayData = rd.data.find(d => d.day === selectedDay);
      return {
        name: rd.region,
        expedidas: dayData?.expedidas || 0,
        baixadas: dayData?.baixadas || 0,
      };
    });
  }, [filteredBarChartData, filteredDailyData, selectedDay]);

  // Calculate totals
  const totals = useMemo(() => {
    const totalExpedidas = barChartData.reduce((sum, r) => sum + r.expedidas, 0);
    const totalBaixadas = barChartData.reduce((sum, r) => sum + r.baixadas, 0);
    return { totalExpedidas, totalBaixadas };
  }, [barChartData]);

  const handleRegionClick = useCallback((region: string) => {
    setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
  }, []);

  const handleDayClick = useCallback((day: number) => {
    setSelectedDay(prev => prev === day ? null : day);
  }, []);

  const handleMetricClick = useCallback((metric: "expedidas" | "baixadas") => {
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  const handleBarClick = useCallback((region: string, metric: "expedidas" | "baixadas") => {
    setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  const handleLinePointClick = useCallback((region: string, day: number, metric: "expedidas" | "baixadas") => {
    setSelectedRegions(prev => prev.includes(region) ? prev.filter(r => r !== region) : [...prev, region]);
    setSelectedDay(prev => prev === day ? null : day);
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  const clearDayFilter = useCallback(() => setSelectedDay(null), []);
  const clearMetricFilter = useCallback(() => setSelectedMetric(null), []);
  const clearAllFilters = useCallback(() => {
    setSelectedDay(null);
    setSelectedMetric(null);
    setSelectedRegions([]);
    setSelectedMonths([currentMonth]);
    setSelectedYears([currentYear]);
  }, [currentMonth, currentYear]);

  const handleRefreshData = useCallback(() => {
    if (codCli) {
      fetchFollowup();
      fetchProdutosDistribuidos();
      setLastUpdate(new Date());
      toast.success("Dados atualizados!");
    }
  }, [codCli, fetchFollowup, fetchProdutosDistribuidos]);

  const isDefaultMonthYear = selectedMonths.length === 1 && selectedMonths[0] === currentMonth &&
    selectedYears.length === 1 && selectedYears[0] === currentYear;
  const hasActiveFilters = selectedDay !== null || selectedMetric !== null || selectedRegions.length > 0 || !isDefaultMonthYear;

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

  const loading = settingsLoading || dataLoading;

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
        onMonthsChange={setSelectedMonths}
        onYearsChange={setSelectedYears}
        onRegionsChange={setSelectedRegions}
        onClearAllFilters={clearAllFilters}
        onExportExcel={exportToExcel}
        onRefreshData={handleRefreshData}
        hasActiveFilters={hasActiveFilters}
      />

      <ActiveFilters
        selectedDay={selectedDay}
        selectedMetric={selectedMetric}
        onClearDay={clearDayFilter}
        onClearMetric={clearMetricFilter}
        onClearAll={clearAllFilters}
      />

      {error && (
        <div className="mx-6 mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4" />
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="flex flex-col md:flex-row gap-4 px-6 pb-6 md:h-[calc(100vh-180px)]">
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
              data={filteredDailyData}
              selectedDay={selectedDay}
              selectedMetric={selectedMetric}
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
