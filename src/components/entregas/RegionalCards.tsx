import { Card, CardContent } from "@/components/ui/card";
import { DeliveryData } from "@/data/entregasData";
import { formatNumber } from "@/data/mockData";
import { MapPin } from "lucide-react";

interface RegionalCardsProps {
  data: DeliveryData[];
  onRegionalClick?: (regional: string) => void;
  selectedRegional?: string | null;
}

export const RegionalCards = ({ data, onRegionalClick, selectedRegional }: RegionalCardsProps) => {
  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
      {data.map((item) => {
        const entregaPercent = (item.entregaFinalizado / item.entregaTotal) * 100;
        const reposicaoPercent = (item.reposicaoFinalizado / item.reposicaoTotal) * 100;
        const isSelected = selectedRegional === item.regional;
        
        return (
          <Card 
            key={item.id} 
            className={`bg-dashboard-card border-dashboard-border hover:border-dashboard-accent/50 transition-all cursor-pointer ${isSelected ? 'ring-2 ring-dashboard-accent border-dashboard-accent' : ''}`}
            onClick={() => onRegionalClick?.(item.regional)}
          >
            <CardContent className="p-3">
              <div className="flex items-center gap-2 mb-3">
                <MapPin className={`h-4 w-4 ${isSelected ? 'text-dashboard-accent' : 'text-muted-foreground'}`} />
                <span className={`text-sm font-medium truncate ${isSelected ? 'text-dashboard-accent' : 'text-foreground'}`}>{item.regional}</span>
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Entrega</span>
                  <span className="text-xs font-medium text-green-500">{entregaPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-dashboard-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full transition-all"
                    style={{ width: `${entregaPercent}%` }}
                  />
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Reposição</span>
                  <span className="text-xs font-medium text-dashboard-accent">{reposicaoPercent.toFixed(0)}%</span>
                </div>
                <div className="h-1.5 bg-dashboard-border rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-dashboard-accent rounded-full transition-all"
                    style={{ width: `${reposicaoPercent}%` }}
                  />
                </div>
                
                <div className="pt-2 border-t border-dashboard-border">
                  <div className="flex justify-between text-xs">
                    <span className="text-muted-foreground">Total</span>
                    <span className="text-foreground font-medium">
                      {formatNumber(item.entregaTotal + item.reposicaoTotal)}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
};
