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
  // Use current month and year automatically
  const currentDate = new Date();
  const [selectedMonth, setSelectedMonth] = useState(currentDate.getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(currentDate.getFullYear());
  const [selectedRegion, setSelectedRegion] = useState("all");
  const [lastUpdate] = useState(new Date());
  
  // Interactive filter states
  const [selectedDay, setSelectedDay] = useState<number | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<"expedidas" | "baixadas" | null>(null);

  // Generate mock data - in production this would come from an API
  const regionalData = useMemo(() => generateRegionalData(), [selectedMonth, selectedYear]);
  const dailyData = useMemo(() => generateAllRegionalDailyData(), [selectedMonth, selectedYear]);

  // Filter daily data based on selected region
  const filteredDailyData = useMemo(() => {
    if (selectedRegion === "all") return dailyData;
    return dailyData.filter((item) => item.region === selectedRegion);
  }, [dailyData, selectedRegion]);

  // Calculate bar chart data - shows day-specific data when a day is selected
  const barChartData = useMemo(() => {
    let baseData = regionalData;
    
    // If a specific day is selected, recalculate from daily data for that day
    if (selectedDay !== null) {
      baseData = dailyData.map((regional) => {
        const dayData = regional.data.find(d => d.day === selectedDay);
        return {
          name: regional.region,
          expedidas: dayData?.expedidas || 0,
          baixadas: dayData?.baixadas || 0,
        };
      });
    }
    
    // Filter by region if one is selected
    if (selectedRegion !== "all") {
      return baseData.filter((item) => item.name === selectedRegion);
    }
    
    return baseData;
  }, [regionalData, dailyData, selectedDay, selectedRegion]);

  // Calculate totals based on filters
  const totals = useMemo(() => {
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
    
    return calculateTotals(barChartData);
  }, [barChartData, filteredDailyData, selectedDay]);

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

  // Handler for clicking on a specific bar (region + metric)
  const handleBarClick = useCallback((region: string, metric: "expedidas" | "baixadas") => {
    setSelectedRegion(prev => prev === region ? "all" : region);
    setSelectedMetric(prev => prev === metric ? null : metric);
  }, []);

  // Handler for clicking on a specific point in line chart (region + day + metric)
  const handleLinePointClick = useCallback((region: string, day: number, metric: "expedidas" | "baixadas") => {
    setSelectedRegion(prev => prev === region ? "all" : region);
    setSelectedDay(prev => prev === day ? null : day);
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

  // Check if any filters are active
  const hasActiveFilters = selectedDay !== null || selectedMetric !== null || selectedRegion !== "all";

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
        onClearAllFilters={clearAllFilters}
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
            selectedRegion={selectedRegion}
            onRegionClick={handleRegionClick}
            onMetricClick={handleMetricClick}
            onBarClick={handleBarClick}
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
            onLinePointClick={handleLinePointClick}
          />
        </div>
      </div>
    </div>
  );
};

export default Index;
