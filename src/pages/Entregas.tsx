import { useState, useMemo } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { EntregasKPICards } from "@/components/entregas/EntregasKPICards";
import { ProgressBars } from "@/components/entregas/ProgressBars";
import { RegionalCards } from "@/components/entregas/RegionalCards";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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

const Entregas = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [deliveryData] = useState(() => generateDeliveryData());
  const [deliveryItems] = useState<DeliveryItem[]>(() => generateDeliveryItems(50));
  
  const totals = useMemo(() => calculateDeliveryTotals(deliveryData), [deliveryData]);

  const handleRefreshData = () => {
    setLastUpdate(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const exportData = deliveryData.map(item => ({
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

  const getStatusBadge = (status: DeliveryItem["status"]) => {
    switch (status) {
      case "Finalizado":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Finalizado</Badge>;
      case "Em Trânsito":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Em Trânsito</Badge>;
      case "Pendente":
        return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30">Pendente</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader
        pageTitle="B-Side Entregas"
        pageId="entregas"
        lastUpdate={lastUpdate}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
      />

      <div className="p-6 space-y-4">
        {/* KPI Cards */}
        <EntregasKPICards
          entregaFinalizado={totals.entregaFinalizado}
          entregaEmTransito={totals.entregaEmTransito}
          reposicaoFinalizado={totals.reposicaoFinalizado}
          reposicaoEmTransito={totals.reposicaoEmTransito}
        />

        {/* Progress Bars */}
        <ProgressBars
          entregaFinalizado={totals.entregaFinalizado}
          entregaTotal={totals.entregaTotal}
          reposicaoFinalizado={totals.reposicaoFinalizado}
          reposicaoTotal={totals.reposicaoTotal}
        />

        {/* Regional Cards */}
        <RegionalCards data={deliveryData} />

        {/* Delivery Items Table */}
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardHeader>
            <CardTitle className="text-base font-semibold text-foreground">
              Últimas Movimentações
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
                {deliveryItems.slice(0, 20).map((item) => (
                  <TableRow key={item.id} className="border-dashboard-border hover:bg-dashboard-border/50">
                    <TableCell className="text-dashboard-accent font-medium">{item.pedido}</TableCell>
                    <TableCell className="text-foreground">{item.cliente}</TableCell>
                    <TableCell className="text-muted-foreground">{item.regional}</TableCell>
                    <TableCell className="text-foreground">{item.tipo}</TableCell>
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
