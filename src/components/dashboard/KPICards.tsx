import { TrendingUp, TrendingDown } from "lucide-react";
import { formatNumber } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

interface KPICardsProps {
  totalExpedidas: number;
  totalBaixadas: number;
  selectedMetric: "expedidas" | "baixadas" | null;
  onMetricClick: (metric: "expedidas" | "baixadas") => void;
}

export const KPICards = ({ 
  totalExpedidas, 
  totalBaixadas,
  selectedMetric,
  onMetricClick 
}: KPICardsProps) => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {/* Total Expedidas Card */}
      <div 
        className={`relative overflow-hidden rounded-lg border bg-dashboard-card p-6 transition-all duration-300 cursor-pointer ${
          selectedMetric === "expedidas"
            ? "border-dashboard-blue shadow-lg shadow-dashboard-blue/20"
            : selectedMetric === "baixadas"
            ? "border-dashboard-border/30 opacity-50"
            : "border-dashboard-accent/30 hover:border-dashboard-accent/60"
        }`}
        onClick={() => onMetricClick("expedidas")}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Expedidas
            </p>
            <p className="mt-2 text-3xl font-bold text-dashboard-accent animate-fade-in">
              {formatNumber(totalExpedidas)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique para filtrar
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dashboard-blue/20">
            <TrendingUp className="h-6 w-6 text-dashboard-blue" />
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-dashboard-blue to-dashboard-blue/50 transition-opacity ${
          selectedMetric === "baixadas" ? "opacity-30" : "opacity-100"
        }`} />
      </div>

      {/* Total Baixadas Card */}
      <div 
        className={`relative overflow-hidden rounded-lg border bg-dashboard-card p-6 transition-all duration-300 cursor-pointer ${
          selectedMetric === "baixadas"
            ? "border-dashboard-orange shadow-lg shadow-dashboard-orange/20"
            : selectedMetric === "expedidas"
            ? "border-dashboard-border/30 opacity-50"
            : "border-dashboard-accent/30 hover:border-dashboard-accent/60"
        }`}
        onClick={() => onMetricClick("baixadas")}
      >
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">
              Total Baixadas
            </p>
            <p className="mt-2 text-3xl font-bold text-dashboard-accent animate-fade-in">
              {formatNumber(totalBaixadas)}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Clique para filtrar
            </p>
          </div>
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-dashboard-orange/20">
            <TrendingDown className="h-6 w-6 text-dashboard-orange" />
          </div>
        </div>
        <div className={`absolute bottom-0 left-0 h-1 w-full bg-gradient-to-r from-dashboard-orange to-dashboard-orange/50 transition-opacity ${
          selectedMetric === "expedidas" ? "opacity-30" : "opacity-100"
        }`} />
      </div>
    </div>
  );
};
