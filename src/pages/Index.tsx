import { useState, useMemo, useCallback } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { RegionalBarChart } from "@/components/dashboard/RegionalBarChart";
import { RegionalLineCharts } from "@/components/dashboard/RegionalLineCharts";
import { ActiveFilters } from "@/components/dashboard/ActiveFilters";
import {
  generateRegionalData,
  generateAllRegionalDailyData,
  calculateTotals,
} from "@/data/mockData";

const Index = () => {
  const [selectedMonth, setSelectedMonth] = useState(1);
  const [selectedYear, setSelectedYear] = useState(2025);
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [lastUpdate] = useState(new Date());
  
  // Interactive filter states
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"expedidas" | "baixadas" | null>(null);

  // Generate mock data - in production this would come from an API
  const regionalData = useMemo(() => generateRegionalData(), [selectedMonth, selectedYear]);
  const dailyData = useMemo(() => generateAllRegionalDailyData(), [selectedMonth, selectedYear]);

  // Filter data based on selected region
  const filteredRegionalData = useMemo(() => {
    if (selectedRegion === "all") return regionalData;
    return regionalData.filter((item) => item.name === selectedRegion);
  }, [regionalData, selectedRegion]);

  const filteredDailyData = useMemo(() => {
    if (selectedRegion === "all") return dailyData;
    return dailyData.filter((item) => item.region === selectedRegion);
  }, [dailyData, selectedRegion]);

  // Calculate totals based on filters
  const totals = useMemo(() => {
    let data = filteredRegionalData;
    
    // If a specific day is selected, recalculate from daily data
    if (selectedDay !== null) {
      const dayTotals = filteredDailyData.reduce(
        (acc, regional) => {
          const dayData = regional.data.find(d => d.day === selectedDay);
          if (dayData) {
            acc.expedidas += dayData.expedidas;
            acc.baixadas += dayData.baixadas;
          }
          return acc;
        },
        { expedidas: 0, baixadas: 0 }
      );
      return { totalExpedidas: dayTotals.expedidas, totalBaixadas: dayTotals.baixadas };
    }
    
    return calculateTotals(data);
  }, [filteredRegionalData, filteredDailyData, selectedDay]);

  // Handler for clicking on a region
  const handleRegionClick = useCallback((region: string) => {
    setSelectedRegion(prev => prev === region ? "all" : region);
  }, []);

  // Handler for clicking on a day
  const handleDayClick = useCallback((day: number) => {
    setSelectedDay(prev => prev === day ? null : day);
  }, []);

  // Handler for clicking on a metric (expedidas/baixadas)
  const handleMetricClick = useCallback((metric: "expedidas" | "baixadas") => {
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  // Clear filters
  const clearDayFilter = useCallback(() => setSelectedDay(null), []);
  const clearMetricFilter = useCallback(() => setSelectedMetric(null), []);
  const clearAllFilters = useCallback(() => {
    setSelectedDay(null);
    setSelectedMetric(null);
    setSelectedRegion("all");
  }, []);

  return (
    <div className="min-h-screen bg-background">
      {/* Header with logo, navigation, and filters */}
      <DashboardHeader
        selectedMonth={selectedMonth}
        selectedYear={selectedYear}
        selectedRegion={selectedRegion}
        onMonthChange={setSelectedMonth}
        onYearChange={setSelectedYear}
        onRegionChange={setSelectedRegion}
        lastUpdate={lastUpdate}
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
            data={filteredRegionalData}
            selectedMetric={selectedMetric}
            onRegionClick={handleRegionClick}
            onMetricClick={handleMetricClick}
          />
        </div>

        {/* Right column - Scrollable line charts (70%) */}
        <div className="w-[70%]">
          <RegionalLineCharts 
            data={filteredDailyData}
            selectedDay={selectedDay}
            selectedMetric={selectedMetric}
            selectedRegion={selectedRegion}
            onDayClick={handleDayClick}
            onRegionClick={handleRegionClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
