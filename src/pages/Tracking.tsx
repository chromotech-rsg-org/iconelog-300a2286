import { useState, useMemo, useCallback, useEffect, useTransition } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { RefreshProgress } from "@/components/dashboard/RefreshProgress";
import { useFollowupData } from "@/hooks/useFollowupData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { allMonthValues } from "@/data/mockData";
import { AlertCircle, InboxIcon, Loader2, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent } from "@/components/ui/card";
import { Clock } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

import { TrackingKPICards } from "@/components/tracking/TrackingKPICards";
import { TrackingGaugeChart } from "@/components/tracking/TrackingGaugeChart";
import { TrackingStatusBars } from "@/components/tracking/TrackingStatusBars";
import { TrackingTipoServicoChart } from "@/components/tracking/TrackingTipoServicoChart";
import { TrackingModalidadeChart } from "@/components/tracking/TrackingModalidadeChart";
import { TrackingCidadeChart } from "@/components/tracking/TrackingCidadeChart";
import { TrackingRegionalPieChart } from "@/components/tracking/TrackingRegionalPieChart";
import { TrackingEstadoChart } from "@/components/tracking/TrackingEstadoChart";
import { TrackingBrazilMap } from "@/components/tracking/TrackingBrazilMap";
import { TrackingPedidosTable } from "@/components/tracking/TrackingPedidosTable";
import { TrackingItensTable } from "@/components/tracking/TrackingItensTable";

const Tracking = () => {
  const currentYear = new Date().getFullYear();
  const { getCodCli, loading: settingsLoading } = useBiSettingsContext();
  const codCli = getCodCli("tracking");

  const {
    followupData,
    produtosData,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    error,
    fetchFollowup,
    getTrackingData,
    cityMappings,
    lastUpdateAt,
  } = useFollowupData(codCli, "tracking");

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("bside");
  const [showError, setShowError] = useState(true);
  const [showRefreshProgress, setShowRefreshProgress] = useState(true);
  const [isFiltering, startFilterTransition] = useTransition();

  // Global filters
  const [selectedMonths, setSelectedMonths] = useState<number[]>(allMonthValues);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedDateRange, setSelectedDateRange] = useState<{ from: Date | undefined; to: Date | undefined }>({ from: undefined, to: undefined });

  // Interactive filters
  const [selectedPrazo, setSelectedPrazo] = useState<boolean | null>(null);
  const [selectedTipoServico, setSelectedTipoServico] = useState<string | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<string | null>(null);
  const [selectedCidade, setSelectedCidade] = useState<string | null>(null);
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [selectedEstado, setSelectedEstado] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  useEffect(() => {
    if (lastUpdateAt) setLastUpdate(lastUpdateAt);
  }, [lastUpdateAt]);

  const dateRangeActive = !!selectedDateRange.from;

  // Get tracking data from API
  const trackingRaw = useMemo(
    () => getTrackingData(selectedMonths, selectedYears, dateRangeActive ? selectedDateRange as any : undefined),
    [getTrackingData, selectedMonths, selectedYears, selectedDateRange, dateRangeActive]
  );

  // Apply interactive filters on top
  const filteredOrders = useMemo(() => {
    let orders = trackingRaw.filteredOrders;
    if (selectedPrazo !== null) {
      const now = new Date();
      now.setHours(0, 0, 0, 0);
      orders = orders.filter(o => {
        const dtPrev = o.dt_previsao ? new Date(String(o.dt_previsao).trim().split(/[\sT]/)[0].replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")) : null;
        const dtReal = o.dt_entrega_real ? new Date(String(o.dt_entrega_real).trim().split(/[\sT]/)[0].replace(/(\d{2})\/(\d{2})\/(\d{4})/, "$3-$2-$1")) : null;
        if (!dtPrev) return false;
        const isOnTime = dtReal ? dtReal <= dtPrev : now <= dtPrev;
        return selectedPrazo ? isOnTime : !isOnTime;
      });
    }
    if (selectedTipoServico) orders = orders.filter(o => (o.ds_tipo_servico || "").toUpperCase() === selectedTipoServico);
    if (selectedModalidade) orders = orders.filter(o => (o.ds_modalidade_transporte || "").toUpperCase() === selectedModalidade);
    if (selectedCidade) orders = orders.filter(o => (o.ds_cidade_DES || "").toUpperCase() === selectedCidade);
    if (selectedEstado) orders = orders.filter(o => (o.ds_uf_DES || "").toUpperCase() === selectedEstado);
    if (selectedStatus) {
      orders = orders.filter(o => {
        const st = (o.fl_status_real || "").toUpperCase();
        if (selectedStatus === "FINALIZADO") return st.includes("FINALIZADO") || st.includes("ENTREGUE");
        return !st.includes("FINALIZADO") && !st.includes("ENTREGUE");
      });
    }
    if (selectedRegions.length > 0) {
      // Will need city mappings to filter by regional
    }
    return orders;
  }, [trackingRaw, selectedPrazo, selectedTipoServico, selectedModalidade, selectedCidade, selectedEstado, selectedStatus, selectedRegions]);

  // Recalculate KPIs from filtered orders
  const kpis = useMemo(() => {
    if (!selectedPrazo && !selectedTipoServico && !selectedModalidade && !selectedCidade && !selectedEstado && !selectedStatus) {
      return trackingRaw.kpis;
    }
    return trackingRaw.kpis; // Use raw KPIs always, filters only affect tables/details
  }, [trackingRaw]);

  // Filtered produtos for items table
  const filteredProdutos = useMemo(() => {
    if (!filteredOrders.length) return produtosData;
    const orderNumbers = new Set(filteredOrders.map(o => o.nr_pedido));
    return produtosData.filter(p => orderNumbers.has(p.nr_pedido));
  }, [produtosData, filteredOrders]);

  const handlePrazoClick = useCallback((prazo: boolean) => {
    startFilterTransition(() => setSelectedPrazo(prev => prev === prazo ? null : prazo));
  }, []);

  const handleTipoClick = useCallback((tipo: string) => {
    startFilterTransition(() => setSelectedTipoServico(prev => prev === tipo ? null : tipo));
  }, []);

  const handleModalidadeClick = useCallback((mod: string) => {
    startFilterTransition(() => setSelectedModalidade(prev => prev === mod ? null : mod));
  }, []);

  const handleCidadeClick = useCallback((cidade: string) => {
    startFilterTransition(() => setSelectedCidade(prev => prev === cidade.toUpperCase() ? null : cidade.toUpperCase()));
  }, []);

  const handleRegionalClick = useCallback((regional: string) => {
    startFilterTransition(() => setSelectedRegional(prev => prev === regional ? null : regional));
  }, []);

  const handleEstadoClick = useCallback((uf: string) => {
    startFilterTransition(() => setSelectedEstado(prev => prev === uf ? null : uf));
  }, []);

  const handleStatusClick = useCallback((status: string) => {
    startFilterTransition(() => setSelectedStatus(prev => prev === status ? null : status));
  }, []);

  const clearAllInteractiveFilters = useCallback(() => {
    setSelectedPrazo(null);
    setSelectedTipoServico(null);
    setSelectedModalidade(null);
    setSelectedCidade(null);
    setSelectedRegional(null);
    setSelectedEstado(null);
    setSelectedStatus(null);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSelectedMonths(allMonthValues);
    setSelectedYears([currentYear]);
    setSelectedRegions([]);
    setSelectedDateRange({ from: undefined, to: undefined });
    clearAllInteractiveFilters();
  }, [currentYear, clearAllInteractiveFilters]);

  const handleRefreshData = useCallback(() => {
    if (codCli && !refreshing) {
      setShowRefreshProgress(true);
      setShowError(true);
      fetchFollowup();
      setLastUpdate(new Date());
    }
  }, [codCli, refreshing, fetchFollowup]);

  const handleExportExcel = useCallback(() => {
    const exportData = filteredOrders.map(order => ({
      "N Mov": order.cod_conhecimento || "",
      "Pedido": order.nr_pedido || "",
      "Tipo Serviço": order.ds_tipo_servico || "",
      "Modalidade": order.ds_modalidade_transporte || "",
      "Campanha": order.nm_campanha || "",
      "Qtde SKU": order.nr_qtde_SKU || "",
      "Vl. Total": order.vl_total || "",
      "Prev. Entrega": order.dt_previsao || "",
      "Entrega Real": order.dt_entrega_real || "",
      "Status": order.fl_status_real || "",
      "Cidade": order.ds_cidade_DES || "",
      "UF": order.ds_uf_DES || "",
      "Solicitante": order.nm_solicitante || "",
    }));
    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracking");
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `tracking_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Excel exportado!");
  }, [filteredOrders]);

  const hasInteractiveFilters = !!(selectedPrazo !== null || selectedTipoServico || selectedModalidade || selectedCidade || selectedRegional || selectedEstado || selectedStatus);
  const hasActiveFilters = hasInteractiveFilters || selectedMonths.length !== 12 || selectedYears.length !== 1 || selectedYears[0] !== currentYear || selectedRegions.length > 0 || dateRangeActive;

  if (!settingsLoading && !codCli) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Configuração necessária</h2>
          <p className="text-sm text-muted-foreground">Configure o código do cliente (cod_cli) para "tracking" em Configurar BI.</p>
        </div>
      </div>
    );
  }

  const hasData = followupData.length > 0;
  const showEmptyState = cacheLoaded && !hasData && !refreshing;

  return (
    <div className="min-h-screen bg-background">
      <DocumentHead pageId="tracking" />
      <SharedHeader
        pageId="tracking"
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
          if (range.from) { setSelectedMonths([]); setSelectedYears([]); }
        })}
        onClearAllFilters={clearGlobalFilters}
        onExportExcel={handleExportExcel}
        onRefreshData={handleRefreshData}
        hasActiveFilters={hasActiveFilters}
        followupData={followupData}
        cityMappings={cityMappings}
      />

      {showRefreshProgress && (
        <RefreshProgress stage={refreshStage} recordCount={refreshRecordCount} onDismiss={() => setShowRefreshProgress(false)} />
      )}

      {/* Interactive filters bar */}
      {hasInteractiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedPrazo !== null && (
            <Badge variant="outline" className={`cursor-pointer ${selectedPrazo ? "border-green-500 bg-green-500/10 text-green-400" : "border-red-500 bg-red-500/10 text-red-400"}`} onClick={() => setSelectedPrazo(null)}>
              {selectedPrazo ? "No Prazo" : "Fora do Prazo"} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTipoServico && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer" onClick={() => setSelectedTipoServico(null)}>
              Tipo: {selectedTipoServico} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedModalidade && (
            <Badge variant="outline" className="border-blue-500 bg-blue-500/10 text-blue-400 cursor-pointer" onClick={() => setSelectedModalidade(null)}>
              Mod: {selectedModalidade} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedCidade && (
            <Badge variant="outline" className="border-orange-500 bg-orange-500/10 text-orange-400 cursor-pointer" onClick={() => setSelectedCidade(null)}>
              Cidade: {selectedCidade} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedEstado && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer" onClick={() => setSelectedEstado(null)}>
              UF: {selectedEstado} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedStatus && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer" onClick={() => setSelectedStatus(null)}>
              Status: {selectedStatus} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllInteractiveFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            Limpar todos
          </Button>
        </div>
      )}

      {error && showError && (
        <div className="mx-6 mt-4 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span className="flex-1">{error}</span>
          <button onClick={() => setShowError(false)} className="p-0.5 rounded hover:bg-destructive/10 transition-colors"><X className="h-4 w-4" /></button>
        </div>
      )}

      {cacheLoading && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
          <div className="rounded-lg border border-border bg-card p-8 shadow-lg flex flex-col items-center gap-4 max-w-sm">
            <Loader2 className="h-10 w-10 animate-spin text-primary" />
            <h3 className="text-lg font-semibold text-foreground">Carregando dados</h3>
            <p className="text-sm text-muted-foreground text-center">Recuperando dados da última atualização...</p>
          </div>
        </div>
      )}

      <div className="p-6 space-y-4">
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-card border border-border">
            <TabsTrigger value="bside" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">B-SIDE</TabsTrigger>
            <TabsTrigger value="dside" className="data-[state=active]:bg-primary data-[state=active]:text-primary-foreground">D-SIDE</TabsTrigger>
          </TabsList>

          <TabsContent value="bside" className="space-y-4 mt-4">
            {showEmptyState ? (
              <div className="flex items-center justify-center h-[60vh]">
                <div className="text-center space-y-3">
                  <InboxIcon className="h-12 w-12 mx-auto text-muted-foreground" />
                  <h2 className="text-lg font-semibold text-foreground">Nenhum dado disponível</h2>
                  <p className="text-sm text-muted-foreground">Clique no botão <strong>Atualizar</strong> no cabeçalho para buscar os dados.</p>
                </div>
              </div>
            ) : (
              <>
                {/* KPI Cards */}
                <TrackingKPICards kpis={kpis} onPrazoClick={handlePrazoClick} selectedPrazo={selectedPrazo} />

                {/* Main grid */}
                <div className="grid grid-cols-1 lg:grid-cols-12 gap-4">
                  {/* Left column */}
                  <div className="lg:col-span-3 space-y-4">
                    <TrackingGaugeChart
                      percNoPrazo={kpis.percNoPrazo}
                      noPrazo={kpis.noPrazo}
                      foraPrazo={kpis.foraPrazo}
                      onPrazoClick={handlePrazoClick}
                      selectedPrazo={selectedPrazo}
                    />
                    <TrackingStatusBars
                      finalizado={kpis.finalizado}
                      transito={kpis.transito}
                      onStatusClick={handleStatusClick}
                      selectedStatus={selectedStatus}
                    />
                    <TrackingTipoServicoChart data={trackingRaw.tipoServico} onTipoClick={handleTipoClick} selectedTipo={selectedTipoServico} />
                  </div>

                  {/* Center column */}
                  <div className="lg:col-span-5 space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <TrackingModalidadeChart data={trackingRaw.modalidade} onModalidadeClick={handleModalidadeClick} selectedModalidade={selectedModalidade} />
                      <TrackingRegionalPieChart data={trackingRaw.regional} onRegionalClick={handleRegionalClick} selectedRegional={selectedRegional} />
                    </div>
                    <TrackingEstadoChart data={trackingRaw.estado} onEstadoClick={handleEstadoClick} selectedEstado={selectedEstado} />
                    <TrackingCidadeChart data={trackingRaw.cidade} onCidadeClick={handleCidadeClick} selectedCidade={selectedCidade} />
                  </div>

                  {/* Right column */}
                  <div className="lg:col-span-4 space-y-4">
                    <TrackingBrazilMap estadoData={trackingRaw.estado} onEstadoClick={handleEstadoClick} selectedEstado={selectedEstado} />
                    <TrackingPedidosTable orders={filteredOrders} onCidadeClick={handleCidadeClick} onStatusClick={handleStatusClick} />
                    <TrackingItensTable items={filteredProdutos} />
                  </div>
                </div>
              </>
            )}
          </TabsContent>

          <TabsContent value="dside" className="mt-4">
            <Card className="bg-card border-border">
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">D-SIDE em Desenvolvimento</h3>
                <p className="text-muted-foreground">Esta funcionalidade estará disponível em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tracking;
