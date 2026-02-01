import { useState, useMemo } from "react";
import { StockHeader } from "@/components/stock/StockHeader";
import { StockKPICards } from "@/components/stock/StockKPICards";
import { StockCategoryChart } from "@/components/stock/StockCategoryChart";
import { StockTable } from "@/components/stock/StockTable";
import { ProductDetailPanel } from "@/components/stock/ProductDetailPanel";
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

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <StockHeader 
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
          {/* Left side - Table and Chart */}
          <div className="flex-1 flex flex-col gap-4 min-w-0">
            {/* Stock Table */}
            <div className="flex-1 min-h-0">
              <StockTable 
                items={stockData}
                onSelectProduct={handleSelectProduct}
                selectedProduct={selectedProduct}
              />
            </div>
          </div>

          {/* Right side - Category Chart and Product Detail */}
          <div className="w-full lg:w-80 flex flex-col gap-4">
            {/* Category Chart */}
            <StockCategoryChart data={categoryData} />
            
            {/* Product Detail Panel */}
            <div className="flex-1 min-h-0">
              <ProductDetailPanel product={selectedProduct} />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Estoque;
