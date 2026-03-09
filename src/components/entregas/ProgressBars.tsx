import { Card, CardContent } from "@/components/ui/card";
import { formatNumber } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

interface ProgressBarsProps {
  entregaFinalizado: number;
  entregaEmTransito: number;
  entregaTotal: number;
  reposicaoFinalizado: number;
  reposicaoEmTransito: number;
  reposicaoTotal: number;
  onEntregaClick?: () => void;
  onReposicaoClick?: () => void;
  selectedTipo?: "Entrega" | "Reposição" | null;
}

export const ProgressBars = ({
  entregaFinalizado,
  entregaEmTransito,
  entregaTotal,
  reposicaoFinalizado,
  reposicaoEmTransito,
  reposicaoTotal,
  onEntregaClick,
  onReposicaoClick,
  selectedTipo,
}: ProgressBarsProps) => {
  const entregaPercent = entregaTotal > 0 ? (entregaFinalizado / entregaTotal) * 100 : 0;
  const reposicaoPercent = reposicaoTotal > 0 ? (reposicaoFinalizado / reposicaoTotal) * 100 : 0;
  const entregaEmTransitoPercent = entregaTotal > 0 ? (entregaEmTransito / entregaTotal) * 100 : 0;
  const reposicaoEmTransitoPercent = reposicaoTotal > 0 ? (reposicaoEmTransito / reposicaoTotal) * 100 : 0;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* ENTREGA - PROGRESSO */}
      <Card 
        className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all hover:border-dashboard-accent/50 ${selectedTipo === "Entrega" ? 'ring-2 ring-dashboard-accent' : ''}`}
        onClick={onEntregaClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-dashboard-accent uppercase tracking-wide">
              ENTREGA - PROGRESSO
            </h3>
          </div>
          
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-dashboard-accent" />
              <span className="text-sm text-muted-foreground">Finalizados:</span>
              <span className="text-base font-bold text-foreground">{formatNumber(entregaFinalizado)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-sm text-muted-foreground">Em Trânsito:</span>
              <span className="text-base font-bold text-foreground">{formatNumber(entregaEmTransito)}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-4 bg-dashboard-border rounded-sm overflow-hidden flex">
            <div 
              className="h-full bg-dashboard-accent transition-all flex items-center justify-center"
              style={{ width: `${entregaPercent}%` }}
            >
              {entregaPercent > 10 && (
                <span className="text-[10px] font-bold text-dashboard-dark">{entregaPercent.toFixed(1)}%</span>
              )}
            </div>
            <div 
              className="h-full bg-muted transition-all flex items-center justify-center"
              style={{ width: `${entregaEmTransitoPercent}%` }}
            >
              {entregaEmTransitoPercent > 10 && (
                <span className="text-[10px] font-bold text-foreground">{entregaEmTransitoPercent.toFixed(1)}%</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* REPOSIÇÃO - PROGRESSO */}
      <Card 
        className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all hover:border-dashboard-accent/50 ${selectedTipo === "Reposição" ? 'ring-2 ring-dashboard-accent' : ''}`}
        onClick={onReposicaoClick}
      >
        <CardContent className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold text-dashboard-accent uppercase tracking-wide">
              REPOSIÇÃO - PROGRESSO
            </h3>
          </div>
          
          <div className="flex items-center gap-6 mb-3">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-dashboard-accent" />
              <span className="text-sm text-muted-foreground">Finalizados:</span>
              <span className="text-base font-bold text-foreground">{formatNumber(reposicaoFinalizado)}</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-muted-foreground" />
              <span className="text-sm text-muted-foreground">Em Trânsito:</span>
              <span className="text-base font-bold text-foreground">{formatNumber(reposicaoEmTransito)}</span>
            </div>
          </div>
          
          {/* Progress bar */}
          <div className="h-4 bg-dashboard-border rounded-sm overflow-hidden flex">
            <div 
              className="h-full bg-dashboard-accent transition-all flex items-center justify-center"
              style={{ width: `${reposicaoPercent}%` }}
            >
              {reposicaoPercent > 10 && (
                <span className="text-[10px] font-bold text-dashboard-dark">{reposicaoPercent.toFixed(1)}%</span>
              )}
            </div>
            <div 
              className="h-full bg-muted transition-all flex items-center justify-center"
              style={{ width: `${reposicaoEmTransitoPercent}%` }}
            >
              {reposicaoEmTransitoPercent > 10 && (
                <span className="text-[10px] font-bold text-foreground">{reposicaoEmTransitoPercent.toFixed(1)}%</span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
