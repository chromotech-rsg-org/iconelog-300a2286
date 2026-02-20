import { Card, CardContent } from "@/components/ui/card";
import { Package, CheckCircle, AlertTriangle, TrendingUp, Truck } from "lucide-react";
import { formatNumber } from "@/data/mockData";

interface TrackingKPIs {
  total: number;
  noPrazo: number;
  foraPrazo: number;
  percNoPrazo: number;
  percForaPrazo: number;
  finalizado: number;
  transito: number;
}

interface Props {
  kpis: TrackingKPIs;
  onPrazoClick: (prazo: boolean) => void;
  selectedPrazo: boolean | null;
}

export const TrackingKPICards = ({ kpis, onPrazoClick, selectedPrazo }: Props) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-3">
      {/* Quantidade de Pedidos - destaque maior */}
      <Card className="bg-card border-border col-span-2 md:col-span-1 lg:col-span-1">
        <CardContent className="p-4 flex flex-col items-center justify-center">
          <Package className="h-6 w-6 text-primary mb-1" />
          <span className="text-xs text-muted-foreground">Qtd. Pedidos</span>
          <p className="text-3xl font-bold text-primary">{formatNumber(kpis.total)}</p>
        </CardContent>
      </Card>

      <Card
        className={`bg-card border-border cursor-pointer hover:border-primary transition-colors ${selectedPrazo === true ? "ring-2 ring-green-500" : ""}`}
        onClick={() => onPrazoClick(true)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="h-4 w-4 text-green-500" />
            <span className="text-[10px] text-muted-foreground">No Prazo</span>
          </div>
          <p className="text-lg font-bold text-green-500">{formatNumber(kpis.noPrazo)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-4 w-4 text-green-500" />
            <span className="text-[10px] text-muted-foreground">% No Prazo</span>
          </div>
          <p className="text-lg font-bold text-green-500">{kpis.percNoPrazo.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card
        className={`bg-card border-border cursor-pointer hover:border-primary transition-colors ${selectedPrazo === false ? "ring-2 ring-red-500" : ""}`}
        onClick={() => onPrazoClick(false)}
      >
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <AlertTriangle className="h-4 w-4 text-red-400" />
            <span className="text-[10px] text-muted-foreground">Fora Prazo</span>
          </div>
          <p className="text-lg font-bold text-red-400">{formatNumber(kpis.foraPrazo)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="h-4 w-4 text-red-400" />
            <span className="text-[10px] text-muted-foreground">% Fora</span>
          </div>
          <p className="text-lg font-bold text-red-400">{kpis.percForaPrazo.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <CheckCircle className="h-4 w-4 text-primary" />
            <span className="text-[10px] text-muted-foreground">Finalizado</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatNumber(kpis.finalizado)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3">
          <div className="flex items-center gap-1.5 mb-1">
            <Truck className="h-4 w-4 text-blue-400" />
            <span className="text-[10px] text-muted-foreground">Trânsito</span>
          </div>
          <p className="text-lg font-bold text-foreground">{formatNumber(kpis.transito)}</p>
        </CardContent>
      </Card>
    </div>
  );
};
