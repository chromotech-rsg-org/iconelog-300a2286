import { useState, useMemo } from "react";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { KPICards } from "@/components/dashboard/KPICards";
import { RegionalBarChart } from "@/components/dashboard/RegionalBarChart";
import { RegionalLineCharts } from "@/components/dashboard/RegionalLineCharts";
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

  // Generate mock data - in production this would come from an API
  const regionalData = useMemo(() => generateRegionalData(), [selectedMonth, selectedYear]);
  const dailyData = useMemo(() => generateAllRegionalDailyData(), [selectedMonth, selectedYear]);
  const totals = useMemo(() => calculateTotals(regionalData), [regionalData]);

  // Filter data based on selected region
  const filteredRegionalData = useMemo(() => {
    if (selectedRegion === "all") return regionalData;
    return regionalData.filter((item) => item.name === selectedRegion);
  }, [regionalData, selectedRegion]);

  const filteredDailyData = useMemo(() => {
    if (selectedRegion === "all") return dailyData;
    return dailyData.filter((item) => item.region === selectedRegion);
  }, [dailyData, selectedRegion]);

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

      {/* KPI Cards */}
      <KPICards
        totalExpedidas={totals.totalExpedidas}
        totalBaixadas={totals.totalBaixadas}
      />

      {/* Main content - Split screen layout */}
      <div className="flex gap-4 px-6 pb-6" style={{ height: "calc(100vh - 280px)" }}>
        {/* Left column - Regional bar chart (30%) */}
        <div className="w-[30%]">
          <RegionalBarChart data={filteredRegionalData} />
        </div>

        {/* Right column - Scrollable line charts (70%) */}
        <div className="w-[70%]">
          <RegionalLineCharts data={filteredDailyData} />
        </div>
      </div>
    </div>
  );
};

export default Index;
