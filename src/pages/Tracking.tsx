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
  const [showError, setShowError] = useState(true);
  const [showRefreshProgress, setShowRefreshProgress] = useState(true);
  const [isFiltering, startFilterTransition] = useTransition();

  // B-SIDE / D-SIDE multi-select filter (empty = show all)
  const [selectedSides, setSelectedSides] = useState<string[]>([]);

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

  // Apply ALL interactive filters to orders
  const filteredOrders = useMemo(() => {
    let orders = trackingRaw.filteredOrders;

    // B-SIDE / D-SIDE filter (from followup field, e.g. ds_lado or similar)
    if (selectedSides.length > 0) {
      orders = orders.filter(o => {
        const lado = (o.ds_lado || o.ds_side || "").toUpperCase().trim();
        return selectedSides.some(s => lado.includes(s.replace("-", "").replace(" ", ""))) || 
               selectedSides.some(s => lado === s);
      });
    }

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
    if (selectedRegional) {
      // Filter by regional using city mappings
      orders = orders.filter(o => {
        const cidade = (o.ds_cidade_DES || "").trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
        const mapping = cityMappings.find(m => m.cidade.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === cidade);
        return mapping?.regional === selectedRegional;
      });
    }
    return orders;
  }, [trackingRaw, selectedPrazo, selectedTipoServico, selectedModalidade, selectedCidade, selectedEstado, selectedStatus, selectedRegional, selectedSides, cityMappings]);

  // Recalculate all chart data from filtered orders for full interactivity
  const chartData = useMemo(() => {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    let noPrazo = 0, foraPrazo = 0, finalizado = 0, transito = 0;
    const tipoServicoMap = new Map<string, number>();
    const modalidadeMap = new Map<string, number>();
    const cidadeStatusMap = new Map<string, { finalizado: number; transito: number }>();
    const estadoMap = new Map<string, { value: number; noPrazo: number; foraPrazo: number; semOcorrencia: number; comOcorrencia: number }>();
    const regionalMap = new Map<string, number>();

    filteredOrders.forEach(item => {
      const statusReal = (item.fl_status_real || "").toUpperCase();
      const isFinalizado = statusReal.includes("FINALIZADO") || statusReal.includes("ENTREGUE");
      if (isFinalizado) finalizado++; else transito++;

      const dtPrevisao = item.dt_previsao ? (() => { const s = String(item.dt_previsao).trim().split(/[\sT]/)[0]; const p = s.split(/[\/\-]/); if (p.length < 3) return null; if (p[0].length === 4) return new Date(+p[0], +p[1]-1, +p[2]); return new Date(+p[2], +p[1]-1, +p[0]); })() : null;
      const dtEntregaReal = item.dt_entrega_real ? (() => { const s = String(item.dt_entrega_real).trim().split(/[\sT]/)[0]; const p = s.split(/[\/\-]/); if (p.length < 3) return null; if (p[0].length === 4) return new Date(+p[0], +p[1]-1, +p[2]); return new Date(+p[2], +p[1]-1, +p[0]); })() : null;

      if (dtPrevisao) {
        if (dtEntregaReal) { if (dtEntregaReal <= dtPrevisao) noPrazo++; else foraPrazo++; }
        else { if (now <= dtPrevisao) noPrazo++; else foraPrazo++; }
      }

      const tipo = (item.ds_tipo_servico || "OUTROS").toUpperCase();
      tipoServicoMap.set(tipo, (tipoServicoMap.get(tipo) || 0) + 1);

      const mod = (item.ds_modalidade_transporte || "OUTROS").toUpperCase();
      modalidadeMap.set(mod, (modalidadeMap.get(mod) || 0) + 1);

      const cidade = (item.ds_cidade_DES || "").toUpperCase();
      if (cidade) {
        if (!cidadeStatusMap.has(cidade)) cidadeStatusMap.set(cidade, { finalizado: 0, transito: 0 });
        const cs = cidadeStatusMap.get(cidade)!;
        if (isFinalizado) cs.finalizado++; else cs.transito++;
      }

      const uf = (item.ds_uf_DES || "").toUpperCase();
      if (uf) {
        if (!estadoMap.has(uf)) estadoMap.set(uf, { value: 0, noPrazo: 0, foraPrazo: 0, semOcorrencia: 0, comOcorrencia: 0 });
        const es = estadoMap.get(uf)!;
        es.value++;
        if (dtPrevisao) {
          if (dtEntregaReal) { if (dtEntregaReal <= dtPrevisao) es.noPrazo++; else es.foraPrazo++; }
          else { if (now <= dtPrevisao) es.noPrazo++; else es.foraPrazo++; }
        }
        const hasOcorrencia = statusReal.includes("OCORRENCIA") || statusReal.includes("DEVOLU") || statusReal.includes("SINISTRO");
        if (hasOcorrencia) es.comOcorrencia++; else es.semOcorrencia++;
      }

      const cidadeOrig = item.ds_cidade_DES || "";
      const normalized = cidadeOrig.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();
      const found = cityMappings.find(m => m.cidade.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase() === normalized);
      const regional = found?.regional || "Sem Regional";
      regionalMap.set(regional, (regionalMap.get(regional) || 0) + 1);
    });

    const total = filteredOrders.length;
    const percNoPrazo = total > 0 ? (noPrazo / total) * 100 : 0;
    const percForaPrazo = total > 0 ? (foraPrazo / total) * 100 : 0;

    return {
      kpis: { total, noPrazo, foraPrazo, percNoPrazo, percForaPrazo, finalizado, transito },
      tipoServico: Array.from(tipoServicoMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      modalidade: Array.from(modalidadeMap.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value),
      cidade: Array.from(cidadeStatusMap.entries()).map(([name, v]) => ({ name, ...v, total: v.finalizado + v.transito })).sort((a, b) => b.total - a.total).slice(0, 15),
      estado: Array.from(estadoMap.entries()).map(([name, v]) => ({ name, ...v })).sort((a, b) => b.value - a.value),
      regional: Array.from(regionalMap.entries()).map(([name, value]) => ({ name, value })).filter(r => r.name !== "Sem Regional").sort((a, b) => b.value - a.value),
    };
  }, [filteredOrders, cityMappings]);

  // Filtered produtos for items table
  const filteredProdutos = useMemo(() => {
    if (!filteredOrders.length && !selectedPrazo && !selectedTipoServico && !selectedModalidade && !selectedCidade && !selectedEstado && !selectedStatus && !selectedRegional) return produtosData;
    const orderNumbers = new Set(filteredOrders.map(o => o.nr_pedido));
    return produtosData.filter(p => orderNumbers.has(p.nr_pedido));
  }, [produtosData, filteredOrders, selectedPrazo, selectedTipoServico, selectedModalidade, selectedCidade, selectedEstado, selectedStatus, selectedRegional]);

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
      "Nº Mov": order.cod_conhecimento || "",
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

      {/* B-SIDE / D-SIDE as toggle filter buttons */}
      <div className="px-6 pt-3 flex items-center gap-2">
        {["B-SIDE", "D-SIDE"].map(side => {
          const isActive = selectedSides.includes(side);
          return (
            <Button
              key={side}
              variant={isActive ? "default" : "outline"}
              size="sm"
              className={`text-xs ${isActive ? "bg-primary text-primary-foreground" : "border-border text-muted-foreground"}`}
              onClick={() => {
                setSelectedSides(prev =>
                  prev.includes(side) ? prev.filter(s => s !== side) : [...prev, side]
                );
              }}
            >
              {side}
            </Button>
          );
        })}
        {selectedSides.length > 0 && (
          <Button variant="ghost" size="sm" className="text-xs text-muted-foreground h-7" onClick={() => setSelectedSides([])}>
            Limpar
          </Button>
        )}
      </div>

      {showRefreshProgress && (
        <RefreshProgress stage={refreshStage} recordCount={refreshRecordCount} onDismiss={() => setShowRefreshProgress(false)} />
      )}

      {/* Interactive filters bar */}
      {hasInteractiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-border bg-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedPrazo !== null && (
            <Badge variant="outline" className={`cursor-pointer text-[10px] ${selectedPrazo ? "border-green-500 bg-green-500/10 text-green-400" : "border-red-500 bg-red-500/10 text-red-400"}`} onClick={() => setSelectedPrazo(null)}>
              {selectedPrazo ? "No Prazo" : "Fora do Prazo"} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTipoServico && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer text-[10px]" onClick={() => setSelectedTipoServico(null)}>
              {selectedTipoServico} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedModalidade && (
            <Badge variant="outline" className="border-blue-500 bg-blue-500/10 text-blue-400 cursor-pointer text-[10px]" onClick={() => setSelectedModalidade(null)}>
              {selectedModalidade} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedCidade && (
            <Badge variant="outline" className="border-orange-500 bg-orange-500/10 text-orange-400 cursor-pointer text-[10px]" onClick={() => setSelectedCidade(null)}>
              {selectedCidade} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedEstado && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer text-[10px]" onClick={() => setSelectedEstado(null)}>
              UF: {selectedEstado} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedRegional && (
            <Badge variant="outline" className="border-purple-500 bg-purple-500/10 text-purple-400 cursor-pointer text-[10px]" onClick={() => setSelectedRegional(null)}>
              {selectedRegional} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedStatus && (
            <Badge variant="outline" className="border-primary bg-primary/10 text-primary cursor-pointer text-[10px]" onClick={() => setSelectedStatus(null)}>
              {selectedStatus} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllInteractiveFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            Limpar todos
          </Button>
        </div>
      )}

      {error && showError && (
        <div className="mx-6 mt-3 p-3 rounded-md bg-destructive/10 border border-destructive/30 text-destructive text-sm flex items-center gap-2">
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

      <div className="p-4 space-y-3">
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
            {/* KPI Cards - full width row */}
            <TrackingKPICards kpis={chartData.kpis} onPrazoClick={handlePrazoClick} selectedPrazo={selectedPrazo} />

            {/* Main 3-column layout matching Power BI */}
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-3">
              {/* LEFT COLUMN: Status, Performance, Modalidade, Tipo Serviço */}
              <div className="lg:col-span-3 space-y-3">
                <TrackingStatusBars
                  finalizado={chartData.kpis.finalizado}
                  transito={chartData.kpis.transito}
                  onStatusClick={handleStatusClick}
                  selectedStatus={selectedStatus}
                />
                <TrackingGaugeChart
                  percNoPrazo={chartData.kpis.percNoPrazo}
                  noPrazo={chartData.kpis.noPrazo}
                  foraPrazo={chartData.kpis.foraPrazo}
                  onPrazoClick={handlePrazoClick}
                  selectedPrazo={selectedPrazo}
                />
                <TrackingModalidadeChart data={chartData.modalidade} onModalidadeClick={handleModalidadeClick} selectedModalidade={selectedModalidade} />
                <TrackingTipoServicoChart data={chartData.tipoServico} onTipoClick={handleTipoClick} selectedTipo={selectedTipoServico} />
              </div>

              {/* CENTER COLUMN: Região, Estado chart, Mapa, Entregas por Cidade */}
              <div className="lg:col-span-5 space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <TrackingRegionalPieChart data={chartData.regional} onRegionalClick={handleRegionalClick} selectedRegional={selectedRegional} />
                  <TrackingBrazilMap estadoData={chartData.estado} onEstadoClick={handleEstadoClick} selectedEstado={selectedEstado} />
                </div>
                <TrackingEstadoChart data={chartData.estado} onEstadoClick={handleEstadoClick} selectedEstado={selectedEstado} />
                <TrackingCidadeChart data={chartData.cidade} onCidadeClick={handleCidadeClick} selectedCidade={selectedCidade} />
              </div>

              {/* RIGHT COLUMN: Pedidos table + Itens table */}
              <div className="lg:col-span-4 space-y-3">
                <TrackingPedidosTable orders={filteredOrders} onCidadeClick={handleCidadeClick} onStatusClick={handleStatusClick} />
                <TrackingItensTable items={filteredProdutos} />
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Tracking;
