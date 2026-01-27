import { TrendingUp, TrendingDown } from "lucide-react";
import { formatCurrency } from "@/data/mockData";

interface KPICardsProps {
  totalExpedidas: number;
  totalBaixadas: number;
}

export const KPICards = ({ totalExpedidas, totalBaixadas }: KPICardsProps) => {
  return (
    <div className="grid grid-cols-2 gap-4 px-6 py-4">
      {/* Total Expedidas Card */}
      <div className="relative overflow-hidden rounded-lg border border-dashboard-accent/30 bg-dashboard-card p-6 transition-all duration-300 hover:border-dashboard-accent/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Expedidas
            </p>
            <p className="mt-2 text-3xl font-bold text-dashboard-accent animate-fade-in">
              {formatCurrency(totalExpedidas)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dashboard-blue/20">
            <TrendingUp className="h-6 w-6 text-dashboard-blue" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-dashboard-blue to-dashboard-blue/50" />
      </div>

      {/* Total Baixadas Card */}
      <div className="relative overflow-hidden rounded-lg border border-dashboard-accent/30 bg-dashboard-card p-6 transition-all duration-300 hover:border-dashboard-accent/60">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Baixadas
            </p>
            <p className="mt-2 text-3xl font-bold text-dashboard-accent animate-fade-in">
              {formatCurrency(totalBaixadas)}
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dashboard-orange/20">
            <TrendingDown className="h-6 w-6 text-dashboard-orange" />
          </div>
        </div>
        <div className="absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-dashboard-orange to-dashboard-orange/50" />
      </div>
    </div>
  );
};
