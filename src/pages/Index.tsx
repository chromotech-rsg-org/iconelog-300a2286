import { useState, useMemo, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { RegionalBarChart } from "@/components/dashboard/RegionalBarChart";
import { RegionalLineCharts } from "@/components/dashboard/RegionalLineCharts";
import { ActiveFilters } from "@/components/dashboard/ActiveFilters";
import {
  generateAllRegionalDailyData,
  calculateTotals,
  months as allMonths,
} from "@/data/mockData";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Index = () => {
  // Use current month and year automatically
  const currentDate = new Date();
  const currentMonth = currentDate.getMonth() + 1;
  const currentYear = currentDate.getFullYear();
  
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [lastUpdate] = useState(new Date());
  
  // Interactive filter states
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"expedidas" | "baixadas" | null>(null);

  // Generate mock data based on selected months and years
  const dailyData = useMemo(() => {
    return generateAllRegionalDailyData(selectedMonths, selectedYears);
  }, [selectedMonths, selectedYears]);

  // Filter daily data based on selected regions
  const filteredDailyData = useMemo(() => {
    if (selectedRegions.length === 0) return dailyData;
    return dailyData.filter((item) => selectedRegions.includes(item.region));
  }, [dailyData, selectedRegions]);

  // Aggregate daily data by region for display (combining multiple months/years)
  const aggregatedDailyData = useMemo(() => {
    const regionMap = new Map<string, { day: number; expedidas: number; baixadas: number }[]>();
    
    filteredDailyData.forEach(item => {
      if (!regionMap.has(item.region)) {
        regionMap.set(item.region, []);
      }
      const existingData = regionMap.get(item.region)!;
      
      item.data.forEach(dayData => {
        const existing = existingData.find(d => d.day === dayData.day);
        if (existing) {
          existing.expedidas += dayData.expedidas;
          existing.baixadas += dayData.baixadas;
        } else {
          existingData.push({
            day: dayData.day,
            expedidas: dayData.expedidas,
            baixadas: dayData.baixadas
          });
        }
      });
    });
    
    return Array.from(regionMap.entries()).map(([region, data]) => ({
      region,
      data: data.sort((a, b) => a.day - b.day)
    }));
  }, [filteredDailyData]);

  // Calculate bar chart data from daily data
  const barChartData = useMemo(() => {
    // Calculate totals for each region
    const regionTotals = new Map<string, { expedidas: number; baixadas: number }>();
    
    filteredDailyData.forEach(item => {
      if (!regionTotals.has(item.region)) {
        regionTotals.set(item.region, { expedidas: 0, baixadas: 0 });
      }
      const totals = regionTotals.get(item.region)!;
      
      item.data.forEach(dayData => {
        if (selectedDay === null || dayData.day === selectedDay) {
          totals.expedidas += dayData.expedidas;
          totals.baixadas += dayData.baixadas;
        }
      });
    });
    
    return Array.from(regionTotals.entries()).map(([name, totals]) => ({
      name,
      ...totals
    }));
  }, [filteredDailyData, selectedDay]);

  // Calculate totals based on filters
  const totals = useMemo(() => {
    return calculateTotals(barChartData);
  }, [barChartData]);

  // Handler for clicking on a region
  const handleRegionClick = useCallback((region: string) => {
    setSelectedRegions(prev => {
      if (prev.includes(region)) {
        return prev.filter(r => r !== region);
      }
      return [...prev, region];
    });
  }, []);

  // Handler for clicking on a day
  const handleDayClick = useCallback((day: number) => {
    setSelectedDay(prev => prev === day ? null : day);
  }, []);

  // Handler for clicking on a metric (expedidas/baixadas)
  const handleMetricClick = useCallback((metric: "expedidas" | "baixadas") => {
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  // Handler for clicking on a specific bar (region + metric)
  const handleBarClick = useCallback((region: string, metric: "expedidas" | "baixadas") => {
    setSelectedRegions(prev => {
      if (prev.includes(region)) {
        return prev.filter(r => r !== region);
      }
      return [...prev, region];
    });
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  // Handler for clicking on a specific point in line chart (region + day + metric)
  const handleLinePointClick = useCallback((region: string, day: number, metric: "expedidas" | "baixadas") => {
    setSelectedRegions(prev => {
      if (prev.includes(region)) {
        return prev.filter(r => r !== region);
      }
      return [...prev, region];
    });
    setSelectedDay(prev => prev === day ? null : day);
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  // Clear filters
  const clearDayFilter = useCallback(() => setSelectedDay(null), []);
  const clearMetricFilter = useCallback(() => setSelectedMetric(null), []);
  const clearAllFilters = useCallback(() => {
    setSelectedDay(null);
    setSelectedMetric(null);
    setSelectedRegions([]);
    setSelectedMonths([currentMonth]);
    setSelectedYears([currentYear]);
  }, [currentMonth, currentYear]);

  // Check if any filters are active (including non-default month/year)
  const isDefaultMonthYear = selectedMonths.length === 1 && selectedMonths[0] === currentMonth && 
                              selectedYears.length === 1 && selectedYears[0] === currentYear;
  const hasActiveFilters = selectedDay !== null || selectedMetric !== null || selectedRegions.length > 0 || !isDefaultMonthYear;

  // Export data to Excel
  const exportToExcel = useCallback(() => {
    const exportData: { Regional: string; Expedidas: number; Baixadas: number; Diferença: number; "% Baixadas": string }[] = [];
    
    barChartData.forEach(region => {
      exportData.push({
        Regional: region.name,
        Expedidas: region.expedidas,
        Baixadas: region.baixadas,
        Diferença: region.expedidas - region.baixadas,
        "% Baixadas": ((region.baixadas / region.expedidas) * 100).toFixed(2) + "%"
      });
    });

    // Add totals row
    exportData.push({
      Regional: "TOTAL",
      Expedidas: totals.totalExpedidas,
      Baixadas: totals.totalBaixadas,
      Diferença: totals.totalExpedidas - totals.totalBaixadas,
      "% Baixadas": ((totals.totalBaixadas / totals.totalExpedidas) * 100).toFixed(2) + "%"
    });

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    
    const monthNames = selectedMonths.map(m => allMonths.find(month => month.value === m)?.short).join("-");
    const yearNames = selectedYears.join("-");
    const fileName = `minutas_${monthNames}_${yearNames}.xlsx`;
    
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, fileName);
  }, [barChartData, totals, selectedMonths, selectedYears]);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo, navigation, and filters */}
      <DashboardHeader
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedRegions}
        onMonthsChange={setSelectedMonths}
        onYearsChange={setSelectedYears}
        onRegionsChange={setSelectedRegions}
        onClearAllFilters={clearAllFilters}
        onExportExcel={exportToExcel}
        lastUpdate={lastUpdate}
        hasActiveFilters={hasActiveFilters}
      />

      {/* Active filters display */}
      <ActiveFilters
        selectedDay={selectedDay}
        selectedMetric={selectedMetric}
        onClearDay={clearDayFilter}
        onClearMetric={clearMetricFilter}
        onClearAll={clearAllFilters}
      />

      {/* KPI Cards */}
      <KPICards
        totalExpedidas={totals.totalExpedidas}
        totalBaixadas={totals.totalBaixadas}
        selectedMetric={selectedMetric}
        onMetricClick={handleMetricClick}
      />

      {/* Main content - Split screen layout */}
      <div className="flex gap-4 px-6 pb-6" style={{ height: "calc(100vh - 320px)" }}>
        {/* Left column - Regional bar chart (30%) */}
        <div className="w-[30%]">
          <RegionalBarChart 
            data={barChartData}
            selectedMetric={selectedMetric}
            selectedRegion={selectedRegions.length === 1 ? selectedRegions[0] : "all"}
            onRegionClick={handleRegionClick}
            onMetricClick={handleMetricClick}
            onBarClick={handleBarClick}
          />
        </div>

        {/* Right column - Scrollable line charts (70%) */}
        <div className="w-[70%]">
          <RegionalLineCharts 
            data={aggregatedDailyData}
            selectedDay={selectedDay}
            selectedMetric={selectedMetric}
            selectedRegion={selectedRegions.length === 1 ? selectedRegions[0] : "all"}
            onDayClick={handleDayClick}
            onRegionClick={handleRegionClick}
            onLinePointClick={handleLinePointClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
