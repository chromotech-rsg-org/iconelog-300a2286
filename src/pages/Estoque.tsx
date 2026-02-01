import { useState, useMemo } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { StockKPICards } from "@/components/stock/StockKPICards";
import { StockCategoryChart } from "@/components/stock/StockCategoryChart";
import { StockTable } from "@/components/stock/StockTable";
import { ProductSimplePreview } from "@/components/stock/ProductSimplePreview";
import { ProductDetailModal } from "@/components/stock/ProductDetailModal";
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

  const totals = useMemo(() => calculateStockTotals(stockData), [stockData]);
  const categoryData = useMemo(() => getStockByCategory(stockData), [stockData]);

  const handleRefreshData = () => {
    setStockData(generateStockData());
    setLastUpdate(new Date());
    setSelectedProduct(null);
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const exportData = stockData.map(item => ({
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

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader 
        pageTitle="B-Side Estoque"
        pageId="estoque"
        lastUpdate={lastUpdate}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
      />

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
              items={stockData}
              onSelectProduct={handleSelectProduct}
              selectedProduct={selectedProduct}
            />
          </div>

          {/* Right side - Category Chart and Product Preview */}
          <div className="w-full lg:w-[30%] flex flex-col gap-4">
            {/* Category Chart */}
            <StockCategoryChart data={categoryData} />
            
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
