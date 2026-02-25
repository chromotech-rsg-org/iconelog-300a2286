import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Box, Package, Boxes } from "lucide-react";
import { formatCurrency, formatNumber } from "@/data/mockData";

interface StockDualKPICardsProps {
  matrizValor: number;
  matrizM3: number;
  matrizQtdeSKUs: number;
  matrizKits: number;
  matrizKitsCompleto: number;
}

export const StockDualKPICards = ({
  matrizValor,
  matrizM3,
  matrizQtdeSKUs,
  matrizKits,
  matrizKitsCompleto,
}: StockDualKPICardsProps) => {
  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-dashboard-accent">ESTOQUE MATRIZ (BARUERI)</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-4 gap-4">
          <div className="text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-xs text-muted-foreground">Valor</p>
            <p className="text-lg font-bold text-foreground">{formatCurrency(matrizValor)}</p>
          </div>
          <div className="text-center">
            <Box className="h-5 w-5 mx-auto mb-1 text-dashboard-blue" />
            <p className="text-xs text-muted-foreground">M³</p>
            <p className="text-lg font-bold text-foreground">{matrizM3.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-dashboard-accent" />
            <p className="text-xs text-muted-foreground">Qtde SKUs</p>
            <p className="text-lg font-bold text-foreground">{formatNumber(matrizQtdeSKUs)}</p>
          </div>
          <div className="text-center">
           <Boxes className="h-5 w-5 mx-auto mb-1 text-dashboard-orange" />
            <p className="text-xs text-muted-foreground">Kits Completo</p>
            <p className="text-lg font-bold text-foreground">{formatNumber(matrizKitsCompleto)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
