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
    <div className="flex gap-2 items-stretch">
      {/* Quantidade de Pedidos - big card */}
      <Card className="bg-card border-primary/60 border-2 flex-shrink-0">
        <CardContent className="p-4 flex flex-col items-center justify-center h-full">
          <span className="text-[10px] text-muted-foreground uppercase tracking-wider font-medium">Quantidade de Pedidos</span>
          <p className="text-5xl font-black text-primary leading-tight mt-1">{formatNumber(kpis.total)}</p>
        </CardContent>
      </Card>

      {/* 2x2 grid: No Prazo / % No Prazo / Fora Prazo / % Fora Prazo */}
      <div className="grid grid-cols-2 grid-rows-2 gap-1.5 flex-shrink-0">
        <Card
          className={`bg-card border-border cursor-pointer hover:border-green-500 transition-colors ${selectedPrazo === true ? "ring-2 ring-green-500 border-green-500" : ""}`}
          onClick={() => onPrazoClick(true)}
        >
          <CardContent className="p-2.5 text-center flex flex-col justify-center h-full">
            <span className="text-[9px] text-muted-foreground leading-tight">Qtde no Prazo</span>
            <p className="text-lg font-bold text-green-400 leading-tight">{formatNumber(kpis.noPrazo)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-2.5 text-center flex flex-col justify-center h-full">
            <span className="text-[9px] text-muted-foreground leading-tight">% no Prazo</span>
            <p className="text-lg font-bold text-green-400 leading-tight">{kpis.percNoPrazo.toFixed(2)}%</p>
          </CardContent>
        </Card>

        <Card
          className={`bg-card border-border cursor-pointer hover:border-red-500 transition-colors ${selectedPrazo === false ? "ring-2 ring-red-500 border-red-500" : ""}`}
          onClick={() => onPrazoClick(false)}
        >
          <CardContent className="p-2.5 text-center flex flex-col justify-center h-full">
            <span className="text-[9px] text-muted-foreground leading-tight">Qtde fora do Prazo</span>
            <p className="text-lg font-bold text-red-400 leading-tight">{formatNumber(kpis.foraPrazo)}</p>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardContent className="p-2.5 text-center flex flex-col justify-center h-full">
            <span className="text-[9px] text-muted-foreground leading-tight">% fora do Prazo</span>
            <p className="text-lg font-bold text-red-400 leading-tight">{kpis.percForaPrazo.toFixed(2)}%</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
