import { useState, useMemo, useCallback, useEffect, useTransition } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { EntregasKPICards } from "@/components/entregas/EntregasKPICards";
import { ProgressBars } from "@/components/entregas/ProgressBars";
import { RegionalCards } from "@/components/entregas/RegionalCards";
import { EntregasTables } from "@/components/entregas/EntregasTables";
import { RefreshProgress } from "@/components/dashboard/RefreshProgress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFollowupData } from "@/hooks/useFollowupData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { X, Loader2, AlertCircle, InboxIcon } from "lucide-react";

const Entregas = () => {
  const { t } = useLanguage();
  const currentYear = new Date().getFullYear();
  const allMonths = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

  const { getCodCli, loading: settingsLoading } = useBiSettingsContext();
  const codCli = getCodCli("entregas");

  const {
    followupData,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    error,
    fetchFollowup,
    getEntregasData,
    cityMappings,
    lastUpdateAt,
  } = useFollowupData(codCli, "entregas");

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedMonths, setSelectedMonths] = useState<number[]>(allMonths);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<"Entrega" | "Reposição" | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Finalizado" | "Em Trânsito" | "Pendente" | null>(null);
  const [showRefreshProgress, setShowRefreshProgress] = useState(true);
  const [showError, setShowError] = useState(true);
  const [isFiltering, startFilterTransition] = useTransition();

  // Sync lastUpdate from DB
  useEffect(() => {
    if (lastUpdateAt) setLastUpdate(lastUpdateAt);
  }, [lastUpdateAt]);

  // Get delivery data filtered by months/years
  const deliveryData = useMemo(
    () => getEntregasData(selectedMonths, selectedYears),
    [getEntregasData, selectedMonths, selectedYears]
  );

  // Filter by selected regions from header
  const regionFilteredData = useMemo(() => {
    if (selectedRegions.length === 0) return deliveryData;
    return deliveryData.filter(d => selectedRegions.includes(d.regional));
  }, [deliveryData, selectedRegions]);

  const filteredDeliveryData = useMemo(() => {
    if (!selectedRegional) return regionFilteredData;
    return regionFilteredData.filter(d => d.regional === selectedRegional);
  }, [regionFilteredData, selectedRegional]);

  const totals = useMemo(() => {
    return filteredDeliveryData.reduce(
      (acc, item) => ({
        entregaFinalizado: acc.entregaFinalizado + item.entregaFinalizado,
        entregaEmTransito: acc.entregaEmTransito + item.entregaEmTransito,
        entregaTotal: acc.entregaTotal + item.entregaTotal,
        reposicaoFinalizado: acc.reposicaoFinalizado + item.reposicaoFinalizado,
        reposicaoEmTransito: acc.reposicaoEmTransito + item.reposicaoEmTransito,
        reposicaoTotal: acc.reposicaoTotal + item.reposicaoTotal,
      }),
      { entregaFinalizado: 0, entregaEmTransito: 0, entregaTotal: 0, reposicaoFinalizado: 0, reposicaoEmTransito: 0, reposicaoTotal: 0 }
    );
  }, [filteredDeliveryData]);

  const handleRefreshData = useCallback(() => {
    if (codCli && !refreshing) {
      setShowRefreshProgress(true);
      setShowError(true);
      fetchFollowup(selectedMonths, selectedYears);
      setLastUpdate(new Date());
    }
  }, [codCli, refreshing, fetchFollowup, selectedMonths, selectedYears]);

  const handleExportExcel = useCallback(() => {
    const exportData = filteredDeliveryData.map(item => ({
      Regional: item.regional,
      "Entrega Finalizado": item.entregaFinalizado,
      "Entrega em Trânsito": item.entregaEmTransito,
      "Entrega Total": item.entregaTotal,
      "Reposição Finalizado": item.reposicaoFinalizado,
      "Reposição em Trânsito": item.reposicaoEmTransito,
      "Reposição Total": item.reposicaoTotal,
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Entregas");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `entregas_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Arquivo Excel exportado!");
  }, [filteredDeliveryData]);

  const handleRegionalClick = useCallback((regional: string) => {
    setSelectedRegional(prev => (prev === regional ? null : regional));
  }, []);

  const handleTipoClick = useCallback((tipo: "Entrega" | "Reposição") => {
    setSelectedTipo(prev => (prev === tipo ? null : tipo));
  }, []);

  const handleStatusClick = useCallback((status: "Finalizado" | "Em Trânsito" | "Pendente") => {
    setSelectedStatus(prev => (prev === status ? null : status));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedRegional(null);
    setSelectedTipo(null);
    setSelectedStatus(null);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSelectedMonths(allMonths);
    setSelectedYears([currentYear]);
    setSelectedRegions([]);
    clearAllFilters();
  }, [currentYear, clearAllFilters]);

  const hasActiveFilters = !!(selectedRegional || selectedTipo || selectedStatus);
  const isDefaultState = selectedMonths.length === 12 && selectedYears.length === 1 && selectedYears[0] === currentYear && selectedRegions.length === 0;
  const hasGlobalFilters = !isDefaultState || hasActiveFilters;

  if (!settingsLoading && !codCli) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">{t("Configuração necessária")}</h2>
          <p className="text-sm text-muted-foreground">Configure o código do cliente (cod_cli) para "entregas" em Configurar BI.</p>
        </div>
      </div>
    );
  }

  const hasData = followupData.length > 0;
  const showEmptyState = cacheLoaded && !hasData && !refreshing;

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead pageId="entregas" />
      <SharedHeader
        pageId="entregas"
        lastUpdate={lastUpdate}
        showFilters={true}
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedRegions}
        onMonthsChange={(v) => startFilterTransition(() => { setSelectedMonths(v); if (v.length > 0 && selectedYears.length === 0) setSelectedYears([currentYear]); })}
        onYearsChange={(v) => startFilterTransition(() => setSelectedYears(v))}
        onRegionsChange={(v) => startFilterTransition(() => setSelectedRegions(v))}
        onRefreshData={handleRefreshData}
        followupData={followupData}
        cityMappings={cityMappings}
        onExportExcel={handleExportExcel}
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

      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">{t("Filtros")}:</span>
          {selectedRegional && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer" onClick={() => setSelectedRegional(null)}>
              {t("Regional")}: {selectedRegional} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTipo && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer" onClick={() => setSelectedTipo(null)}>
              {t("Tipo")}: {selectedTipo} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedStatus && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer" onClick={() => setSelectedStatus(null)}>
              {t("Status")}: {selectedStatus} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            {t("Limpar todos")}
          </Button>
        </div>
      )}

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
            <h3 className="text-lg font-semibold text-foreground">{t("Carregando dados")}</h3>
            <p className="text-sm text-muted-foreground text-center">
              {t("Recuperando dados da última atualização...")}
            </p>
          </div>
        </div>
      )}

      {showEmptyState ? (
        <div className="flex items-center justify-center h-[60vh]">
          <div className="text-center space-y-3">
            <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground" />
            <h2 className="text-lg font-semibold text-foreground">{t("Nenhum dado disponível")}</h2>
            <p className="text-sm text-muted-foreground">{t("Clique no botão Atualizar no cabeçalho para buscar os dados.")}</p>
          </div>
        </div>
      ) : (
        <div className="relative p-6 space-y-4">
          {isFiltering && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-5 py-3 shadow-md">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">{t("Processando filtros...")}</span>
              </div>
            </div>
          )}
          <EntregasKPICards
            entregaFinalizado={totals.entregaFinalizado}
            entregaEmTransito={totals.entregaEmTransito}
            reposicaoFinalizado={totals.reposicaoFinalizado}
            reposicaoEmTransito={totals.reposicaoEmTransito}
            onEntregaClick={() => handleTipoClick("Entrega")}
            onReposicaoClick={() => handleTipoClick("Reposição")}
            selectedTipo={selectedTipo}
          />

          <ProgressBars
            entregaFinalizado={totals.entregaFinalizado}
            entregaEmTransito={totals.entregaEmTransito}
            entregaTotal={totals.entregaTotal}
            reposicaoFinalizado={totals.reposicaoFinalizado}
            reposicaoEmTransito={totals.reposicaoEmTransito}
            reposicaoTotal={totals.reposicaoTotal}
            onEntregaClick={() => handleTipoClick("Entrega")}
            onReposicaoClick={() => handleTipoClick("Reposição")}
            selectedTipo={selectedTipo}
          />

          <RegionalCards
            data={filteredDeliveryData}
            onRegionalClick={handleRegionalClick}
            selectedRegional={selectedRegional}
          />

          <EntregasTables
            data={filteredDeliveryData}
            onRegionalClick={handleRegionalClick}
            selectedRegional={selectedRegional}
          />
        </div>
      )}
    </div>
  );
};

export default Entregas;
