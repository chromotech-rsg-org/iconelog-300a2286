import { useState, useMemo, useCallback } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { StockKPICards } from "@/components/stock/StockKPICards";
import { StockCategoryChart } from "@/components/stock/StockCategoryChart";
import { StockTable } from "@/components/stock/StockTable";
import { ProductSimplePreview } from "@/components/stock/ProductSimplePreview";
import { ProductDetailModal } from "@/components/stock/ProductDetailModal";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { 
  generateStockData, 
  calculateStockTotals, 
  getStockByCategory,
  SKUItem 
} from "@/data/stockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

const Estoque = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [stockData, setStockData] = useState<SKUItem[]>(() => generateStockData());
  const [selectedProduct, setSelectedProduct] = useState<SKUItem | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  
  // Filter states for BI interactivity
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<string | null>(null);

  // Get item status
  const getItemStatus = (item: SKUItem) => {
    const ratio = item.stockQuantity / item.minStock;
    if (ratio <= 1) return "Crítico";
    if (ratio <= 1.5) return "Baixo";
    return "Normal";
  };

  // Filtered data based on selections
  const filteredStockData = useMemo(() => {
    return stockData.filter(item => {
      const matchesCategory = !selectedCategory || item.category === selectedCategory;
      const matchesStatus = !selectedStatus || getItemStatus(item) === selectedStatus;
      return matchesCategory && matchesStatus;
    });
  }, [stockData, selectedCategory, selectedStatus]);

  const totals = useMemo(() => calculateStockTotals(filteredStockData), [filteredStockData]);
  const categoryData = useMemo(() => getStockByCategory(stockData), [stockData]); // Keep original for chart

  const handleRefreshData = () => {
    setStockData(generateStockData());
    setLastUpdate(new Date());
    setSelectedProduct(null);
    setSelectedCategory(null);
    setSelectedStatus(null);
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const exportData = filteredStockData.map(item => ({
      SKU: item.sku,
      Nome: item.name,
      Descrição: item.description,
      Categoria: item.category,
      Estoque: item.stockQuantity,
      Kits: item.kitsQuantity,
      "Estoque Mínimo": item.minStock,
      "Estoque Máximo": item.maxStock,
      "Preço Unitário": item.unitPrice,
      Localização: item.location,
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

  const handleSelectProduct = (product: SKUItem) => {
    setSelectedProduct(product);
  };

  const handleOpenDetails = () => {
    if (selectedProduct) {
      setIsDetailModalOpen(true);
    }
  };

  // Filter handlers
  const handleCategoryClick = useCallback((category: string) => {
    setSelectedCategory(prev => prev === category ? null : category);
  }, []);

  const handleStatusClick = useCallback((status: string) => {
    setSelectedStatus(prev => prev === status ? null : status);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedCategory(null);
    setSelectedStatus(null);
  }, []);

  const hasActiveFilters = selectedCategory !== null || selectedStatus !== null;

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader 
        pageTitle="B-Side Estoque"
        pageId="estoque"
        lastUpdate={lastUpdate}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
      />

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedCategory && (
            <Badge 
              variant="outline" 
              className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer hover:bg-dashboard-accent/20"
              onClick={() => setSelectedCategory(null)}
            >
              Categoria: {selectedCategory}
              <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedStatus && (
            <Badge 
              variant="outline" 
              className={`cursor-pointer hover:opacity-80 ${
                selectedStatus === "Crítico" 
                  ? "border-destructive bg-destructive/10 text-destructive" 
                  : selectedStatus === "Baixo"
                    ? "border-yellow-500 bg-yellow-500/10 text-yellow-500"
                    : "border-green-500 bg-green-500/10 text-green-500"
              }`}
              onClick={() => setSelectedStatus(null)}
            >
              Status: {selectedStatus}
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
        {/* KPI Cards */}
        <StockKPICards 
          totalSKUs={totals.totalSKUs}
          totalStock={totals.totalStock}
          totalKits={totals.totalKits}
          totalValue={totals.totalValue}
          lowStockItems={totals.lowStockItems}
        />

        {/* Main Content */}
        <div className="flex flex-col lg:flex-row gap-4 h-[calc(100vh-280px)]">
          {/* Left side - Table (reduced width) */}
          <div className="flex-1 lg:w-[70%] min-w-0">
            <StockTable 
              items={filteredStockData}
              onSelectProduct={handleSelectProduct}
              selectedProduct={selectedProduct}
              selectedCategory={selectedCategory}
              selectedStatus={selectedStatus}
              onCategoryClick={handleCategoryClick}
              onStatusClick={handleStatusClick}
            />
          </div>

          {/* Right side - Category Chart and Product Preview */}
          <div className="w-full lg:w-[30%] flex flex-col gap-4">
            {/* Category Chart */}
            <StockCategoryChart 
              data={categoryData} 
              selectedCategory={selectedCategory}
              onCategoryClick={handleCategoryClick}
            />
            
            {/* Product Simple Preview */}
            <div className="flex-1 min-h-[200px]">
              <ProductSimplePreview 
                product={selectedProduct} 
                onOpenDetails={handleOpenDetails}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Product Detail Modal */}
      <ProductDetailModal 
        product={selectedProduct}
        open={isDetailModalOpen}
        onOpenChange={setIsDetailModalOpen}
      />
    </div>
  );
};

export default Estoque;
