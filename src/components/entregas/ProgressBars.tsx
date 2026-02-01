import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";

interface ProgressBarsProps {
  entregaFinalizado: number;
  entregaTotal: number;
  reposicaoFinalizado: number;
  reposicaoTotal: number;
}

export const ProgressBars = ({
  entregaFinalizado,
  entregaTotal,
  reposicaoFinalizado,
  reposicaoTotal,
}: ProgressBarsProps) => {
  const entregaPercent = (entregaFinalizado / entregaTotal) * 100;
  const reposicaoPercent = (reposicaoFinalizado / reposicaoTotal) * 100;

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Progresso Entregas
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Finalizados</span>
              <span className="text-foreground font-medium">{entregaPercent.toFixed(1)}%</span>
            </div>
            <Progress value={entregaPercent} className="h-3 bg-dashboard-border" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{entregaFinalizado.toLocaleString('pt-BR')} finalizados</span>
              <span>{entregaTotal.toLocaleString('pt-BR')} total</span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Progresso Reposição
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Finalizados</span>
              <span className="text-foreground font-medium">{reposicaoPercent.toFixed(1)}%</span>
            </div>
            <Progress value={reposicaoPercent} className="h-3 bg-dashboard-border" />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{reposicaoFinalizado.toLocaleString('pt-BR')} finalizados</span>
              <span>{reposicaoTotal.toLocaleString('pt-BR')} total</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
