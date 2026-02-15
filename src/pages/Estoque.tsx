import { useState, useMemo, useCallback } from "react";
import { allMonthValues } from "@/data/mockData";
import { Expand } from "lucide-react";
import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { StockDualKPICards } from "@/components/stock/StockDualKPICards";
import { StockLocationTables } from "@/components/stock/StockLocationTables";
import { ProductDetailPanel } from "@/components/stock/ProductDetailPanel";
import { ProductDetailModal } from "@/components/stock/ProductDetailModal";
import { RefreshProgress } from "@/components/dashboard/RefreshProgress";
import { Badge } from "@/components/ui/badge";
import { useEstoqueData } from "@/hooks/useEstoqueData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { X, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { RefreshStage } from "@/components/dashboard/RefreshProgress";

const Estoque = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const { getCodCli, loading: settingsLoading } = useBiSettingsContext();
  const codCli = getCodCli("estoque");

  const {
    stockItems,
    totals,
    loading: dataLoading,
    error,
    cacheLoaded,
    cacheLoading,
    refreshing,
    refreshStage,
    refreshRecordCount,
    lastUpdateAt,
    refreshData,
  } = useEstoqueData(codCli);

  const [selectedMonths, setSelectedMonths] = useState<number[]>(allMonthValues);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [selectedSKU, setSelectedSKU] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Find selected product
  const currentProduct = useMemo(() => {
    if (!selectedSKU) return null;
    return stockItems.find(item => item.sku === selectedSKU) || null;
  }, [selectedSKU, stockItems]);

  const handleRefreshData = useCallback(() => {
    if (codCli) {
      refreshData();
      setSelectedSKU(null);
    }
  }, [codCli, refreshData]);

  const handleExportExcel = useCallback(() => {
    const exportData = stockItems.map(item => ({
      SKU: item.sku,
      Nome: item.name,
      Descrição: item.description,
      Estoque: item.stockQuantity,
      Kits: item.kitsQuantity,
      "Preço Unitário": item.unitPrice,
      "M³": item.m3,
      "Ult. Entrada Qtd": item.lastEntryQty || "-",
      "Ult. Entrada Data": item.lastEntryDate || "-",
    }));
    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque");
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(data, `estoque_${new Date().toISOString().split("T")[0]}.xlsx`);
    toast.success("Arquivo Excel exportado!");
  }, [stockItems]);

  const handleSKUClick = useCallback((sku: string) => {
    setSelectedSKU(prev => (prev === sku ? null : sku));
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedSKU(null);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSelectedMonths(allMonthValues);
    setSelectedYears([currentYear]);
    setSelectedRegions([]);
    clearAllFilters();
  }, [currentYear, clearAllFilters]);

  const hasActiveFilters = selectedSKU !== null;
  const hasGlobalFilters = selectedMonths.length !== 1 || selectedMonths[0] !== currentMonth || selectedYears.length !== 1 || selectedYears[0] !== currentYear || selectedRegions.length > 0;
  const loading = settingsLoading || dataLoading;

  // Connection status
  const hasData = stockItems.length > 0;
  const dataFromCache = cacheLoaded && hasData && !refreshing;

  if (!settingsLoading && !codCli) {
    return (
      <div className="min-h-screen bg-dashboard-dark flex items-center justify-center">
        <div className="text-center space-y-2">
          <AlertCircle className="h-12 w-12 mx-auto text-muted-foreground" />
          <h2 className="text-lg font-semibold text-foreground">Configuração necessária</h2>
          <p className="text-sm text-muted-foreground">Configure o código do cliente (cod_cli) para "estoque" em Configurar BI.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <DocumentHead pageId="estoque" />
      <SharedHeader
        pageId="estoque"
        lastUpdate={lastUpdateAt || new Date()}
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

      {/* Connection status indicator */}
      {cacheLoaded && (
        <div className="flex items-center gap-2 px-6 py-1.5 text-xs text-muted-foreground">
          {hasData ? (
            <>
              <Wifi className="h-3 w-3 text-green-500" />
              <span>Dados carregados do banco</span>
            </>
          ) : (
            <>
              <WifiOff className="h-3 w-3 text-yellow-500" />
              <span>Sem dados no cache — clique em atualizar para buscar da API</span>
            </>
          )}
        </div>
      )}

      {/* Refresh progress */}
      <RefreshProgress
        stage={refreshStage as RefreshStage}
        recordCount={refreshRecordCount}
      />

      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedSKU && (
            <Badge
              variant="outline"
              className="border-dashboard-blue bg-dashboard-blue/10 text-dashboard-blue cursor-pointer hover:bg-dashboard-blue/20"
              onClick={() => setSelectedSKU(null)}
            >
              SKU: {selectedSKU}
              <X className="ml-1 h-3 w-3" />
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

      {loading && !hasData ? (
        <div className="flex items-center justify-center h-[60vh]">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <div className="p-6 space-y-4">
          <StockDualKPICards
            matrizValor={totals.valor}
            matrizM3={totals.m3}
            matrizQtdeSKUs={totals.qtdeSKUs}
            matrizKits={totals.kits}
          />

          <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
            <div className="lg:col-span-3">
              <StockLocationTables
                matrizItems={stockItems}
                selectedSKU={selectedSKU}
                onSKUClick={handleSKUClick}
              />
            </div>

            <div className="lg:col-span-1 relative">
              <ProductDetailPanel product={currentProduct as any} />
              {currentProduct && (
                <Button
                  variant="outline"
                  size="sm"
                  className="absolute top-4 right-4 border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark"
                  onClick={() => setIsModalOpen(true)}
                >
                  <Expand className="h-4 w-4 mr-1" />
                  Expandir
                </Button>
              )}
            </div>
          </div>

          <ProductDetailModal
            product={currentProduct as any}
            open={isModalOpen}
            onOpenChange={setIsModalOpen}
          />
        </div>
      )}
    </div>
  );
};

export default Estoque;
