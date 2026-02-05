 import { useState, useMemo, useCallback } from "react";
 import { Expand } from "lucide-react";
 import { Button } from "@/components/ui/button";
import { SharedHeader } from "@/components/shared/SharedHeader";
 import { DocumentHead } from "@/components/shared/DocumentHead";
import { StockDualKPICards } from "@/components/stock/StockDualKPICards";
import { StockGroupPieChart } from "@/components/stock/StockGroupPieChart";
import { StockValueBarChart } from "@/components/stock/StockValueBarChart";
import { StockTimePieChart } from "@/components/stock/StockTimePieChart";
import { StockTimeBarChart } from "@/components/stock/StockTimeBarChart";
import { StockLocationTables } from "@/components/stock/StockLocationTables";
 import { ProductDetailPanel } from "@/components/stock/ProductDetailPanel";
 import { ProductDetailModal } from "@/components/stock/ProductDetailModal";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";
import { 
  generateStockData, 
  calculateMatrizTotals, 
  calculateBaseTotals,
  getStockByGrupo,
  getTempoParadoDistribution,
  getTempoParadoMedioByGrupo,
  getMatrizItems,
  getBaseItems,
  getTempoParadoCategory,
  SKUItem 
} from "@/data/stockData";
import { months, years, regions } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Estoque = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [stockData, setStockData] = useState<SKUItem[]>(() => generateStockData());
  
  // Global filters
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // Filter states for BI interactivity
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedGrupo, setSelectedGrupo] = useState<string | null>(null);
  const [selectedTempo, setSelectedTempo] = useState<string | null>(null);
  const [selectedSKU, setSelectedSKU] = useState<string | null>(null);
 
   // Product detail state
   const [selectedProduct, setSelectedProduct] = useState<SKUItem | null>(null);
   const [isModalOpen, setIsModalOpen] = useState(false);

  // Filtered data based on selections
  const filteredStockData = useMemo(() => {
    return stockData.filter(item => {
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesGrupo = !selectedGrupo || item.grupo === selectedGrupo;
      const matchesTempo = !selectedTempo || getTempoParadoCategory(item.tempoParado) === selectedTempo;
      const matchesSKU = !selectedSKU || item.sku === selectedSKU;
      return matchesCategory && matchesGrupo && matchesTempo && matchesSKU;
    });
  }, [stockData, selectedCategory, selectedGrupo, selectedTempo, selectedSKU]);

  // Calculated data
  const matrizTotals = useMemo(() => calculateMatrizTotals(filteredStockData), [filteredStockData]);
  const baseTotals = useMemo(() => calculateBaseTotals(filteredStockData), [filteredStockData]);
  const grupoData = useMemo(() => getStockByGrupo(filteredStockData), [filteredStockData]);
  const tempoDistribution = useMemo(() => getTempoParadoDistribution(filteredStockData), [filteredStockData]);
  const tempoMedioByGrupo = useMemo(() => getTempoParadoMedioByGrupo(filteredStockData), [filteredStockData]);
  const matrizItems = useMemo(() => getMatrizItems(filteredStockData), [filteredStockData]);
  const baseItems = useMemo(() => getBaseItems(filteredStockData), [filteredStockData]);

   // Find selected product from SKU
   const currentProduct = useMemo(() => {
     if (selectedProduct) return selectedProduct;
     if (selectedSKU) {
       return filteredStockData.find(item => item.sku === selectedSKU) || null;
     }
     return null;
   }, [selectedSKU, selectedProduct, filteredStockData]);
 
  const handleRefreshData = () => {
    setStockData(generateStockData());
    setLastUpdate(new Date());
    setSelectedCategory(null);
    setSelectedGrupo(null);
    setSelectedTempo(null);
    setSelectedSKU(null);
     setSelectedProduct(null);
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const exportData = filteredStockData.map(item => ({
      SKU: item.sku,
      Nome: item.name,
      Descrição: item.description,
      Categoria: item.category,
      Grupo: item.grupo,
      Estoque: item.stockQuantity,
      Kits: item.kitsQuantity,
      "Estoque Mínimo": item.minStock,
      "Estoque Máximo": item.maxStock,
      "Preço Unitário": item.unitPrice,
      "M³": item.m3,
      "Tempo Parado (dias)": item.tempoParado,
      Localização: item.location,
      "Tipo Local": item.locationType,
      Base: item.base || "-",
      Fornecedor: item.supplier,
      "Última Atualização": item.lastUpdate.toLocaleDateString('pt-BR')
    }));

    const worksheet = XLSX.utils.json_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Estoque");
    
    const excelBuffer = XLSX.write(workbook, { bookType: "xlsx", type: "array" });
    const data = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    
    const date = new Date().toISOString().split('T')[0];
    saveAs(data, `estoque_${date}.xlsx`);
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  // Filter handlers
  const handleGrupoClick = useCallback((grupo: string) => {
    setSelectedGrupo(prev => prev === grupo ? null : grupo);
  }, []);

  const handleTempoClick = useCallback((tempo: string) => {
    setSelectedTempo(prev => prev === tempo ? null : tempo);
  }, []);

  const handleSKUClick = useCallback((sku: string) => {
     const product = stockData.find(item => item.sku === sku);
     if (selectedSKU === sku) {
       setSelectedSKU(null);
       setSelectedProduct(null);
     } else {
       setSelectedSKU(sku);
       setSelectedProduct(product || null);
     }
   }, [stockData, selectedSKU]);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedGrupo(null);
    setSelectedTempo(null);
    setSelectedSKU(null);
     setSelectedProduct(null);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSelectedMonths([currentMonth]);
    setSelectedYears([currentYear]);
    setSelectedRegions([]);
    clearAllFilters();
  }, []);

  const hasActiveFilters = selectedCategory !== null || selectedGrupo !== null || selectedTempo !== null || selectedSKU !== null;
  const hasGlobalFilters = selectedMonths.length !== 1 || selectedMonths[0] !== currentMonth || selectedYears.length !== 1 || selectedYears[0] !== currentYear || selectedRegions.length > 0;

  return (
    <div className="min-h-screen bg-dashboard-dark">
       <DocumentHead pageId="estoque" />
      <SharedHeader 
        pageId="estoque"
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

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedGrupo && (
            <Badge 
              variant="outline" 
              className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer hover:bg-dashboard-accent/20"
              onClick={() => setSelectedGrupo(null)}
            >
              Grupo: {selectedGrupo}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTempo && (
            <Badge 
              variant="outline" 
              className="border-dashboard-orange bg-dashboard-orange/10 text-dashboard-orange cursor-pointer hover:bg-dashboard-orange/20"
              onClick={() => setSelectedTempo(null)}
            >
              Tempo: {selectedTempo}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
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
          <Button
            variant="ghost"
            size="sm"
            onClick={clearAllFilters}
            className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground"
          >
            Limpar todos
          </Button>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* Dual KPI Cards - Matriz e Base */}
        <StockDualKPICards 
          matrizValor={matrizTotals.valor}
          matrizM3={matrizTotals.m3}
          matrizQtdeSKUs={matrizTotals.qtdeSKUs}
           matrizKits={matrizTotals.kits}
          baseValor={baseTotals.valor}
          baseM3={baseTotals.m3}
          baseQtdeSKUs={baseTotals.qtdeSKUs}
           baseKits={baseTotals.kits}
        />

        {/* Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <StockGroupPieChart 
            data={grupoData}
            selectedGrupo={selectedGrupo}
            onGrupoClick={handleGrupoClick}
          />
          <StockValueBarChart 
            data={grupoData}
            selectedGrupo={selectedGrupo}
            onGrupoClick={handleGrupoClick}
          />
          <StockTimePieChart 
            data={tempoDistribution}
            selectedTempo={selectedTempo}
            onTempoClick={handleTempoClick}
          />
          <StockTimeBarChart 
            data={tempoMedioByGrupo}
            selectedGrupo={selectedGrupo}
            onGrupoClick={handleGrupoClick}
          />
        </div>

       {/* Tables with Detail Panel */}
       <div className="grid grid-cols-1 lg:grid-cols-4 gap-4">
         {/* Tables Column */}
         <div className="lg:col-span-3">
           <StockLocationTables 
             matrizItems={matrizItems}
             baseItems={baseItems}
             selectedSKU={selectedSKU}
             selectedGrupo={selectedGrupo}
             onSKUClick={handleSKUClick}
             onGrupoClick={handleGrupoClick}
           />
         </div>
 
         {/* Product Detail Panel */}
         <div className="lg:col-span-1 relative">
           <ProductDetailPanel product={currentProduct} />
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
       
       {/* Product Detail Modal */}
       <ProductDetailModal 
         product={currentProduct}
         open={isModalOpen}
         onOpenChange={setIsModalOpen}
       />
      </div>
    </div>
  );
};

export default Estoque;
