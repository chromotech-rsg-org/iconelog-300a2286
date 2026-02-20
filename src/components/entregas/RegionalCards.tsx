import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNumber } from "@/data/mockData";

interface DeliveryData {
  id: string;
  regional: string;
  entregaFinalizado: number;
  entregaEmTransito: number;
  entregaTotal: number;
  reposicaoFinalizado: number;
  reposicaoEmTransito: number;
  reposicaoTotal: number;
}

interface RegionalCardsProps {
  data: DeliveryData[];
  onRegionalClick?: (regional: string) => void;
  selectedRegional?: string | null;
}

export const RegionalCards = ({ data, onRegionalClick, selectedRegional }: RegionalCardsProps) => {
  // Sort by total (entrega + reposição) descending
  const sortedData = [...data].sort((a, b) => (b.entregaTotal + b.reposicaoTotal) - (a.entregaTotal + a.reposicaoTotal));
  
  // Calculate total geral
  const totalGeral = data.reduce((sum, item) => sum + item.entregaTotal + item.reposicaoTotal, 0);
  
  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-bold text-dashboard-accent uppercase tracking-wide">
          TOTAL DE PEDIDOS POR REGIÃO
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <ScrollArea className="h-[320px] px-4 pt-2">
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 pb-2">
            {sortedData.map((item) => {
              const total = item.entregaTotal + item.reposicaoTotal;
              const finalizados = item.entregaFinalizado + item.reposicaoFinalizado;
              const emTransito = item.entregaEmTransito + item.reposicaoEmTransito;
              const percentFinalizado = total > 0 ? (finalizados / total) * 100 : 0;
              const isSelected = selectedRegional === item.regional;
              
              return (
                <div 
                  key={item.id} 
                  className={`p-3 rounded-md cursor-pointer transition-all hover:bg-dashboard-border/50 ${isSelected ? 'bg-dashboard-accent/10 ring-1 ring-dashboard-accent' : ''}`}
                  onClick={() => onRegionalClick?.(item.regional)}
                >
                  <div className={`text-sm font-bold uppercase mb-1 ${isSelected ? 'text-dashboard-accent' : 'text-foreground'}`}>
                    {item.regional}
                  </div>
                  <div className="flex items-baseline gap-1.5 mb-2">
                    <span className="text-3xl font-bold text-dashboard-accent">{formatNumber(total)}</span>
                    <span className="text-sm text-muted-foreground">pedidos</span>
                  </div>
                  
                  <div className="h-1.5 bg-dashboard-border rounded-full overflow-hidden mb-2">
                    <div 
                      className="h-full bg-dashboard-accent rounded-full transition-all"
                      style={{ width: `${percentFinalizado}%` }}
                    />
                  </div>
                  
                  <div className="text-xs text-muted-foreground">
                    Finalizados: {formatNumber(finalizados)} • Em trânsito: {formatNumber(emTransito)}
                  </div>
                </div>
              );
            })}
          </div>
        </ScrollArea>
        
        {/* Total Geral - fixed at bottom */}
        <div className="flex justify-between items-center px-4 py-3 border-t border-dashboard-border">
          <span className="text-sm text-muted-foreground">Total Geral</span>
          <span className="text-xl font-bold text-dashboard-accent">{formatNumber(totalGeral)}</span>
        </div>
      </CardContent>
    </Card>
  );
};
