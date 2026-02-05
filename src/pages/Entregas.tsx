import { useState, useMemo, useCallback } from "react";
 import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { EntregasKPICards } from "@/components/entregas/EntregasKPICards";
import { ProgressBars } from "@/components/entregas/ProgressBars";
import { RegionalCards } from "@/components/entregas/RegionalCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  generateDeliveryData,
  generateDeliveryItems,
  calculateDeliveryTotals,
  DeliveryItem,
} from "@/data/entregasData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { X } from "lucide-react";

const Entregas = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [deliveryData] = useState(() => generateDeliveryData());
  const [deliveryItems] = useState<DeliveryItem[]>(() => generateDeliveryItems(50));
  
  // Global filters
  const [selectedMonths, setSelectedMonths] = useState<number[]>([currentMonth]);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedRegions, setSelectedRegions] = useState<string[]>([]);

  // Filter states for BI interactivity
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [selectedTipo, setSelectedTipo] = useState<"Entrega" | "Reposição" | null>(null);
  const [selectedStatus, setSelectedStatus] = useState<"Finalizado" | "Em Trânsito" | "Pendente" | null>(null);

  // Filtered data
  const filteredDeliveryData = useMemo(() => {
    if (!selectedRegional) return deliveryData;
    return deliveryData.filter(d => d.regional === selectedRegional);
  }, [deliveryData, selectedRegional]);

  const filteredDeliveryItems = useMemo(() => {
    let result = deliveryItems;
    if (selectedRegional) result = result.filter(item => item.regional === selectedRegional);
    if (selectedTipo) result = result.filter(item => item.tipo === selectedTipo);
    if (selectedStatus) result = result.filter(item => item.status === selectedStatus);
    return result;
  }, [deliveryItems, selectedRegional, selectedTipo, selectedStatus]);
  
  const totals = useMemo(() => calculateDeliveryTotals(filteredDeliveryData), [filteredDeliveryData]);

  const handleRefreshData = () => {
    setLastUpdate(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
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
    saveAs(blob, `entregas_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  // BI Click handlers
  const handleRegionalClick = useCallback((regional: string) => {
    setSelectedRegional(prev => prev === regional ? null : regional);
  }, []);

  const handleTipoClick = useCallback((tipo: "Entrega" | "Reposição") => {
    setSelectedTipo(prev => prev === tipo ? null : tipo);
  }, []);

  const handleStatusClick = useCallback((status: "Finalizado" | "Em Trânsito" | "Pendente") => {
    setSelectedStatus(prev => prev === status ? null : status);
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
  }, []);

  const hasActiveFilters = !!(selectedRegional || selectedTipo || selectedStatus);
  const hasGlobalFilters = selectedMonths.length !== 1 || selectedMonths[0] !== currentMonth || selectedYears.length !== 1 || selectedYears[0] !== currentYear || selectedRegions.length > 0;

  const getStatusBadge = (status: DeliveryItem["status"]) => {
    switch (status) {
      case "Finalizado":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 cursor-pointer" onClick={() => handleStatusClick("Finalizado")}>Finalizado</Badge>;
      case "Em Trânsito":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30 cursor-pointer" onClick={() => handleStatusClick("Em Trânsito")}>Em Trânsito</Badge>;
      case "Pendente":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 cursor-pointer" onClick={() => handleStatusClick("Pendente")}>Pendente</Badge>;
    }
  };

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

      {/* Active Filters Bar */}
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
            <Badge variant="outline" className={`cursor-pointer ${
              selectedStatus === "Finalizado" ? "border-green-500 bg-green-500/10 text-green-500" :
              selectedStatus === "Em Trânsito" ? "border-blue-500 bg-blue-500/10 text-blue-500" :
              "border-yellow-500 bg-yellow-500/10 text-yellow-500"
            }`} onClick={() => setSelectedStatus(null)}>
              Status: {selectedStatus} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            Limpar todos
          </Button>
        </div>
      )}

      <div className="p-6 space-y-4">
        {/* KPI Cards - clickable */}
        <EntregasKPICards
          entregaFinalizado={totals.entregaFinalizado}
          entregaEmTransito={totals.entregaEmTransito}
          reposicaoFinalizado={totals.reposicaoFinalizado}
          reposicaoEmTransito={totals.reposicaoEmTransito}
          onEntregaClick={() => handleTipoClick("Entrega")}
          onReposicaoClick={() => handleTipoClick("Reposição")}
          selectedTipo={selectedTipo}
        />

        {/* Progress Bars */}
        <ProgressBars
          entregaFinalizado={totals.entregaFinalizado}
          entregaTotal={totals.entregaTotal}
          reposicaoFinalizado={totals.reposicaoFinalizado}
          reposicaoTotal={totals.reposicaoTotal}
        />

        {/* Regional Cards - clickable */}
        <RegionalCards 
          data={filteredDeliveryData} 
          onRegionalClick={handleRegionalClick}
          selectedRegional={selectedRegional}
        />

        {/* Delivery Items Table */}
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Últimas Movimentações {hasActiveFilters && <span className="text-sm font-normal text-muted-foreground">({filteredDeliveryItems.length} resultados)</span>}
            </CardTitle>
          </CardHeader>
          <CardContent className="overflow-auto max-h-[400px] custom-scrollbar">
            <Table>
              <TableHeader>
                <TableRow className="border-dashboard-border">
                  <TableHead className="text-muted-foreground">Pedido</TableHead>
                  <TableHead className="text-muted-foreground">Cliente</TableHead>
                  <TableHead className="text-muted-foreground">Regional</TableHead>
                  <TableHead className="text-muted-foreground">Tipo</TableHead>
                  <TableHead className="text-muted-foreground">Status</TableHead>
                  <TableHead className="text-muted-foreground">Kits</TableHead>
                  <TableHead className="text-muted-foreground">Itens</TableHead>
                  <TableHead className="text-muted-foreground">Data Envio</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredDeliveryItems.slice(0, 20).map((item) => (
                  <TableRow key={item.id} className="border-dashboard-border hover:bg-dashboard-border/50">
                    <TableCell className="text-dashboard-accent font-medium">{item.pedido}</TableCell>
                    <TableCell className="text-foreground">{item.cliente}</TableCell>
                    <TableCell 
                      className="text-muted-foreground cursor-pointer hover:text-foreground"
                      onClick={() => handleRegionalClick(item.regional)}
                    >
                      {item.regional}
                    </TableCell>
                    <TableCell>
                      <Badge 
                        className={`cursor-pointer ${item.tipo === "Entrega" ? "bg-dashboard-accent/20 text-dashboard-accent" : "bg-dashboard-blue/20 text-dashboard-blue"}`}
                        onClick={() => handleTipoClick(item.tipo)}
                      >
                        {item.tipo}
                      </Badge>
                    </TableCell>
                    <TableCell>{getStatusBadge(item.status)}</TableCell>
                    <TableCell className="text-foreground">{item.kits}</TableCell>
                    <TableCell className="text-foreground">{item.itens}</TableCell>
                    <TableCell className="text-muted-foreground">
                      {item.dataEnvio.toLocaleDateString('pt-BR')}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Entregas;
