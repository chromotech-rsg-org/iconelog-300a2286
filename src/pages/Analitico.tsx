import { useState, useEffect, useCallback } from "react";
import { allMonthValues } from "@/data/mockData";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { AnaliticoCityView } from "@/components/analitico/AnaliticoCityView";
import { RefreshProgress } from "@/components/dashboard/RefreshProgress";
import { useFollowupData } from "@/hooks/useFollowupData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { toast } from "sonner";
import { AlertCircle, InboxIcon, Loader2 } from "lucide-react";

const Analitico = () => {
  const currentYear = new Date().getFullYear();
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const { getCodCli, loading: settingsLoading } = useBiSettingsContext();
  const codCli = getCodCli("analitico");

  const {
    followupData,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    error,
    fetchFollowup,
    cityMappings,
    lastUpdateAt,
  } = useFollowupData(codCli, "analitico");

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(allMonths);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedGlobalRegions, setSelectedGlobalRegions] = useState<string[]>([]);
  const [showRefreshProgress, setShowRefreshProgress] = useState(true);

  useEffect(() => {
    if (lastUpdateAt) setLastUpdate(lastUpdateAt);
  }, [lastUpdateAt]);

  const handleRefreshData = useCallback(() => {
    if (codCli && !refreshing) {
      setShowRefreshProgress(true);
      fetchFollowup(selectedMonths, selectedYears);
      setLastUpdate(new Date());
    }
  }, [codCli, refreshing, fetchFollowup, selectedMonths, selectedYears]);

  const clearGlobalFilters = () => {
    setSelectedMonths(allMonths);
    setSelectedYears([currentYear]);
    setSelectedGlobalRegions([]);
  };

  const hasGlobalFilters =
    selectedMonths.length !== 12 ||
    selectedYears.length !== 1 ||
    selectedYears[0] !== currentYear ||
    selectedGlobalRegions.length > 0;

  if (!settingsLoading && !codCli) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Configuração necessária</h2>
          <p className="text-sm text-muted-foreground">
            Configure o código do cliente (cod_cli) para "analitico" em Configurar BI.
          </p>
        </div>
      </div>
    );
  }

  const hasData = followupData.length > 0;
  const showEmptyState = cacheLoaded && !hasData && !refreshing;

  return (
    <div className="min-h-screen bg-background">
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
        followupData={followupData}
        cityMappings={cityMappings}
        onClearAllFilters={clearGlobalFilters}
        hasActiveFilters={hasGlobalFilters}
      />

      {showRefreshProgress && (
        <RefreshProgress
          stage={refreshStage}
          recordCount={refreshRecordCount}
          onDismiss={() => setShowRefreshProgress(false)}
        />
      )}

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
            <p className="text-sm text-muted-foreground">
              Clique no botão <strong>Atualizar</strong> no cabeçalho para buscar os dados da API.
            </p>
          </div>
        </div>
      ) : (
        <div className="p-6">
          <AnaliticoCityView
            followupData={followupData}
            cityMappings={cityMappings}
            selectedMonths={selectedMonths}
            selectedYears={selectedYears}
          />
        </div>
      )}
    </div>
  );
};

export default Analitico;
