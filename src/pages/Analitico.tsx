import { useState } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { AnaliticoCityView } from "@/components/analitico/AnaliticoCityView";
import { toast } from "sonner";

const Analitico = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedGlobalRegions, setSelectedGlobalRegions] = useState<string[]>([]);

  const handleRefreshData = () => {
    setLastUpdate(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const clearGlobalFilters = () => {
    setSelectedMonths([currentMonth]);
    setSelectedYears([currentYear]);
    setSelectedGlobalRegions([]);
  };

  const hasGlobalFilters = selectedMonths.length !== 1 || selectedMonths[0] !== currentMonth || selectedYears.length !== 1 || selectedYears[0] !== currentYear || selectedGlobalRegions.length > 0;

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <DocumentHead pageId="analitico" />
      <SharedHeader
        pageId="analitico"
        lastUpdate={lastUpdate}
        showFilters={true}
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedGlobalRegions}
        onMonthsChange={setSelectedMonths}
        onYearsChange={setSelectedYears}
        onRegionsChange={setSelectedGlobalRegions}
        onRefreshData={handleRefreshData}
        onClearAllFilters={clearGlobalFilters}
        hasActiveFilters={hasGlobalFilters}
      />

      <div className="p-6">
        <AnaliticoCityView />
      </div>
    </div>
  );
};

export default Analitico;
