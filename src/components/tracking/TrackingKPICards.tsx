import { Card, CardContent } from "@/components/ui/card";
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
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2">
      {/* Quantidade de Pedidos - bigger emphasis */}
      <Card className="bg-card border-primary/50 border-2">
        <CardContent className="p-3 flex flex-col items-center justify-center">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider">Quantidade de Pedidos</span>
          <p className="text-4xl font-black text-primary leading-tight">{formatNumber(kpis.total)}</p>
        </CardContent>
      </Card>

      <Card
        className={`bg-card border-border cursor-pointer hover:border-green-500 transition-colors ${selectedPrazo === true ? "ring-2 ring-green-500 border-green-500" : ""}`}
        onClick={() => onPrazoClick(true)}
      >
        <CardContent className="p-3 text-center">
          <span className="text-[10px] text-muted-foreground">Qtde no Prazo</span>
          <p className="text-xl font-bold text-green-400">{formatNumber(kpis.noPrazo)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3 text-center">
          <span className="text-[10px] text-muted-foreground">% no Prazo</span>
          <p className="text-xl font-bold text-green-400">{kpis.percNoPrazo.toFixed(2)}%</p>
        </CardContent>
      </Card>

      <Card
        className={`bg-card border-border cursor-pointer hover:border-red-500 transition-colors ${selectedPrazo === false ? "ring-2 ring-red-500 border-red-500" : ""}`}
        onClick={() => onPrazoClick(false)}
      >
        <CardContent className="p-3 text-center">
          <span className="text-[10px] text-muted-foreground">Qtde Fora do Prazo</span>
          <p className="text-xl font-bold text-red-400">{formatNumber(kpis.foraPrazo)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3 text-center">
          <span className="text-[10px] text-muted-foreground">% Fora do Prazo</span>
          <p className="text-xl font-bold text-red-400">{kpis.percForaPrazo.toFixed(2)}%</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3 text-center">
          <span className="text-[10px] text-muted-foreground">Finalizado</span>
          <p className="text-xl font-bold text-foreground">{formatNumber(kpis.finalizado)}</p>
        </CardContent>
      </Card>

      <Card className="bg-card border-border">
        <CardContent className="p-3 text-center">
          <span className="text-[10px] text-muted-foreground">Trânsito</span>
          <p className="text-xl font-bold text-foreground">{formatNumber(kpis.transito)}</p>
        </CardContent>
      </Card>
    </div>
  );
};
