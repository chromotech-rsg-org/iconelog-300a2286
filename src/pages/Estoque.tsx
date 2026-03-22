import { useState, useMemo, useCallback, useTransition } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { allMonthValues } from "@/data/mockData";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { StockDualKPICards } from "@/components/stock/StockDualKPICards";
import { StockLocationTables } from "@/components/stock/StockLocationTables";
import { RefreshProgress } from "@/components/dashboard/RefreshProgress";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useEstoqueData } from "@/hooks/useEstoqueData";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { X, Loader2, AlertCircle, Wifi, WifiOff } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import type { RefreshStage } from "@/components/dashboard/RefreshProgress";

const Estoque = () => {
  const { t } = useLanguage();
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
    whitelist,
  } = useEstoqueData(codCli);

  const [selectedMonths, setSelectedMonths] = useState<number[]>(allMonthValues);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);
  const [isFiltering, startFilterTransition] = useTransition();
  const [selectedSKU, setSelectedSKU] = useState<string | null>(null);
  const [filterByName, setFilterByName] = useState<string | null>(null);
  const [filterByDate, setFilterByDate] = useState<string | null>(null);
  const [filterByCategory, setFilterByCategory] = useState<string | null>(null);

  // Filtered items based on active filters (month/year filter by lastEntryDate)
  const displayItems = useMemo(() => {
    let items = stockItems;

    // Apply month/year filters using lastEntryDate field
    const hasMonthFilter = selectedMonths.length > 0 && selectedMonths.length < 12;
    const hasYearFilter = selectedYears.length > 0;
    if (hasMonthFilter || hasYearFilter) {
      items = items.filter(item => {
        if (!item.lastEntryDate) return false;
        const normalized = String(item.lastEntryDate).replace(/\//g, "-");
        const d = new Date(normalized);
        if (isNaN(d.getTime())) return false;
        const month = d.getMonth() + 1;
        const year = d.getFullYear();
        const monthOk = !hasMonthFilter || selectedMonths.includes(month);
        const yearOk = !hasYearFilter || selectedYears.includes(year);
        return monthOk && yearOk;
      });
    }

    if (selectedSKU) items = items.filter(i => i.sku === selectedSKU);
    if (filterByName) items = items.filter(i => i.name === filterByName);
    if (filterByDate) items = items.filter(i => i.lastEntryDate === filterByDate);
    if (filterByCategory) items = items.filter(i => i.category === filterByCategory);
    return items;
  }, [stockItems, selectedMonths, selectedYears, selectedSKU, filterByName, filterByDate, filterByCategory]);

  const handleRefreshData = useCallback(() => {
    if (codCli) {
      refreshData();
      clearAllFilters();
    }
  }, [codCli, refreshData]);

  const handleExportExcel = useCallback(() => {
    const exportData = displayItems.map(item => ({
      Código: item.sku,
      Nome: item.name,
      Fornecedor: item.category,
      Estoque: item.stockQuantity,
      Kits: item.kitsQuantity,
      "M³": item.m3Total,
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
  }, [displayItems]);

  const handleSKUClick = useCallback((sku: string) => {
    setSelectedSKU(prev => (prev === sku ? null : sku));
    setFilterByName(null);
    setFilterByDate(null);
    setFilterByCategory(null);
  }, []);

  const handleNameClick = useCallback((name: string) => {
    setFilterByName(prev => (prev === name ? null : name));
    setSelectedSKU(null);
    setFilterByDate(null);
    setFilterByCategory(null);
  }, []);

  const handleDateClick = useCallback((date: string) => {
    setFilterByDate(prev => (prev === date ? null : date));
    setSelectedSKU(null);
    setFilterByName(null);
    setFilterByCategory(null);
  }, []);

  const handleCategoryClick = useCallback((category: string) => {
    setFilterByCategory(prev => (prev === category ? null : category));
    setSelectedSKU(null);
    setFilterByName(null);
    setFilterByDate(null);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedSKU(null);
    setFilterByName(null);
    setFilterByDate(null);
    setFilterByCategory(null);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSelectedMonths(allMonthValues);
    setSelectedYears([currentYear]);
    setSelectedRegions([]);
    clearAllFilters();
  }, [currentYear, clearAllFilters]);

  // Recalculate totals based on filtered/displayed items
  const filteredTotals = useMemo(() => {
    const valor = displayItems.reduce((sum, i) => sum + i.totalValue, 0);
    const m3 = displayItems.reduce((sum, i) => sum + i.m3Total, 0);
    const kits = displayItems.reduce((sum, i) => sum + i.kitsQuantity, 0);

    // Build unified_code map from whitelist
    const unifiedMap = new Map<string, string>();
    whitelist.forEach(w => {
      if (w.unified_code) unifiedMap.set(w.product_code, w.unified_code);
    });

    // Helper to calc kit min by unified grouping, filtered by kit type flag
    const calcKitMin = (items: typeof displayItems, flagKey: 'kitCompleto' | 'kitBasico') => {
      const filtered = items.filter(i => i[flagKey]);
      if (filtered.length === 0) return 0;

      const groupedKits = new Map<string, number>();
      const standaloneKits: number[] = [];

      filtered.forEach(item => {
        const uCode = unifiedMap.get(item.sku);
        if (uCode) {
          groupedKits.set(uCode, (groupedKits.get(uCode) || 0) + item.kitsQuantity);
        } else {
          standaloneKits.push(item.kitsQuantity);
        }
      });

      const allKitValues = [...groupedKits.values(), ...standaloneKits];
      return allKitValues.length > 0 ? Math.min(...allKitValues) : 0;
    };

    const kitsCompleto = calcKitMin(displayItems, 'kitCompleto');
    const kitsBasico = calcKitMin(displayItems, 'kitBasico');

    return { valor, m3, qtdeSKUs: displayItems.length, kits, kitsCompleto, kitsBasico };
  }, [displayItems, whitelist]);

  const hasActiveFilters = selectedSKU !== null || filterByName !== null || filterByDate !== null || filterByCategory !== null;
  const loading = settingsLoading || dataLoading;
  const hasData = displayItems.length > 0 || stockItems.length > 0;

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
        showFilters={false}
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedRegions}
        onMonthsChange={(v) => startFilterTransition(() => setSelectedMonths(v))}
        onYearsChange={(v) => startFilterTransition(() => setSelectedYears(v))}
        onRegionsChange={(v) => startFilterTransition(() => setSelectedRegions(v))}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
        onClearAllFilters={clearGlobalFilters}
        hasActiveFilters={hasActiveFilters}
      />

      {cacheLoaded && (
        <div className="flex items-center gap-2 px-6 py-1.5 text-xs text-muted-foreground">
          {stockItems.length > 0 ? (
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

      <RefreshProgress
        stage={refreshStage as RefreshStage}
        recordCount={refreshRecordCount}
      />

      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">{t("Filtros")}:</span>
          {selectedSKU && (
            <Badge variant="outline" className="border-dashboard-blue bg-dashboard-blue/10 text-dashboard-blue cursor-pointer hover:bg-dashboard-blue/20" onClick={() => setSelectedSKU(null)}>
              Código: {selectedSKU} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {filterByName && (
            <Badge variant="outline" className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer hover:bg-dashboard-accent/20" onClick={() => setFilterByName(null)}>
              Nome: {filterByName} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {filterByDate && (
            <Badge variant="outline" className="border-dashboard-orange bg-dashboard-orange/10 text-dashboard-orange cursor-pointer hover:bg-dashboard-orange/20" onClick={() => setFilterByDate(null)}>
              Data: {filterByDate} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {filterByCategory && (
            <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-500 cursor-pointer hover:bg-green-500/20" onClick={() => setFilterByCategory(null)}>
              Fornecedor: {filterByCategory} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            {t("Limpar todos")}
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
        <div className="relative p-6 space-y-4">
          {isFiltering && (
            <div className="absolute inset-0 z-30 flex items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-lg">
              <div className="flex items-center gap-3 bg-card border border-border rounded-lg px-5 py-3 shadow-md">
                <Loader2 className="h-5 w-5 animate-spin text-primary" />
                <span className="text-sm font-medium text-foreground">Processando filtros...</span>
              </div>
            </div>
          )}
          <StockDualKPICards
            matrizValor={filteredTotals.valor}
            matrizM3={filteredTotals.m3}
            matrizQtdeSKUs={filteredTotals.qtdeSKUs}
            matrizKits={filteredTotals.kits}
            matrizKitsCompleto={filteredTotals.kitsCompleto}
          />

          <StockLocationTables
            matrizItems={displayItems}
            selectedSKU={selectedSKU}
            onSKUClick={handleSKUClick}
            onNameClick={handleNameClick}
            onDateClick={handleDateClick}
            onCategoryClick={handleCategoryClick}
          />
        </div>
      )}
    </div>
  );
};

export default Estoque;
