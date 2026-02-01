import { Package, Boxes, AlertTriangle, DollarSign } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/data/mockData";

interface StockKPICardsProps {
  totalSKUs: number;
  totalStock: number;
  totalKits: number;
  totalValue: number;
  lowStockItems: number;
}

export const StockKPICards = ({
  totalSKUs,
  totalStock,
  totalKits,
  totalValue,
  lowStockItems
}: StockKPICardsProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(value);
  };

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dashboard-accent/20">
              <Package className="h-5 w-5 text-dashboard-accent" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total SKUs</p>
              <p className="text-xl font-bold text-foreground">{formatNumber(totalSKUs)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-dashboard-card border-dashboard-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dashboard-blue/20">
              <Boxes className="h-5 w-5 text-dashboard-blue" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Estoque</p>
              <p className="text-xl font-bold text-foreground">{formatNumber(totalStock)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-dashboard-card border-dashboard-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-dashboard-orange/20">
              <Boxes className="h-5 w-5 text-dashboard-orange" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Total Kits</p>
              <p className="text-xl font-bold text-foreground">{formatNumber(totalKits)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-dashboard-card border-dashboard-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-green-500/20">
              <DollarSign className="h-5 w-5 text-green-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Valor Total</p>
              <p className="text-lg font-bold text-foreground">{formatCurrency(totalValue)}</p>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-dashboard-card border-dashboard-border">
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-red-500/20">
              <AlertTriangle className="h-5 w-5 text-red-500" />
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Estoque Baixo</p>
              <p className="text-xl font-bold text-red-400">{formatNumber(lowStockItems)}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
