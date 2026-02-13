import { useState, useMemo, useCallback, useEffect } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { EntregasKPICards } from "@/components/entregas/EntregasKPICards";
import { ProgressBars } from "@/components/entregas/ProgressBars";
import { RegionalCards } from "@/components/entregas/RegionalCards";
import { EntregasTables } from "@/components/entregas/EntregasTables";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useFollowupData } from "@/hooks/useFollowupData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { X, Loader2, AlertCircle } from "lucide-react";

const Entregas = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { getCodCli, loading: settingsLoading } = useBiSettingsContext();
  const codCli = getCodCli("entregas");

  const {
    loading: dataLoading,
    error,
    fetchFollowup,
    getEntregasData,
  } = useFollowupData(codCli);

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<"Entrega" | "Reposição" | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Finalizado" | "Em Trânsito" | "Pendente" | null>(null);

  // Fetch on mount
  useEffect(() => {
    if (codCli) {
      fetchFollowup();
    }
  }, [codCli, fetchFollowup]);

  // Get real delivery data
  const deliveryData = useMemo(() => getEntregasData(), [getEntregasData]);

  const filteredDeliveryData = useMemo(() => {
    if (!selectedRegional) return deliveryData;
    return deliveryData.filter(d => d.regional === selectedRegional);
  }, [deliveryData, selectedRegional]);

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
    if (codCli) {
      fetchFollowup();
      setLastUpdate(new Date());
      toast.success("Dados atualizados!");
    }
  }, [codCli, fetchFollowup]);

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
    setSelectedMonths([currentMonth]);
    setSelectedYears([currentYear]);
    setSelectedRegions([]);
    clearAllFilters();
  }, [currentMonth, currentYear, clearAllFilters]);

  const hasActiveFilters = !!(selectedRegional || selectedTipo || selectedStatus);
  const hasGlobalFilters = selectedMonths.length !== 1 || selectedMonths[0] !== currentMonth || selectedYears.length !== 1 || selectedYears[0] !== currentYear || selectedRegions.length > 0;
  const loading = settingsLoading || dataLoading;

  if (!settingsLoading && !codCli) {
    return (
      <div className="min-h-screen bg-dashboard-dark flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Configuração necessária</h2>
          <p className="text-sm text-muted-foreground">Configure o código do cliente (cod_cli) para "entregas" em Configurar BI.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <DocumentHead pageId="entregas" />
      <SharedHeader
        pageId="entregas"
        lastUpdate={lastUpdate}
        showFilters={true}
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedRegions}
        onMonthsChange={setSelectedMonths}
        onYearsChange={setSelectedYears}
        onRegionsChange={setSelectedRegions}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
        onClearAllFilters={clearGlobalFilters}
        hasActiveFilters={hasGlobalFilters || hasActiveFilters}
      />

      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedRegional && (
            <Badge variant="outline" className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer" onClick={() => setSelectedRegional(null)}>
              Regional: {selectedRegional} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTipo && (
            <Badge variant="outline" className="border-dashboard-blue bg-dashboard-blue/10 text-dashboard-blue cursor-pointer" onClick={() => setSelectedTipo(null)}>
              Tipo: {selectedTipo} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedStatus && (
            <Badge variant="outline" className={`cursor-pointer ${selectedStatus === "Finalizado" ? "border-green-500 bg-green-500/10 text-green-500" : selectedStatus === "Em Trânsito" ? "border-blue-500 bg-blue-500/10 text-blue-500" : "border-yellow-500 bg-yellow-500/10 text-yellow-500"}`} onClick={() => setSelectedStatus(null)}>
              Status: {selectedStatus} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            Limpar todos
          </Button>
        </div>
      )}

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
        <div className="p-6 space-y-4">
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
