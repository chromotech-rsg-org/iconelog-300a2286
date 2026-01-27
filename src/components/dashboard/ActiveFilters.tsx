import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface ActiveFiltersProps {
  selectedDay: number | null;
  selectedMetric: "expedidas" | "baixadas" | null;
  onClearDay: () => void;
  onClearMetric: () => void;
  onClearAll: () => void;
}

export const ActiveFilters = ({
  selectedDay,
  selectedMetric,
  onClearDay,
  onClearMetric,
  onClearAll,
}: ActiveFiltersProps) => {
  const hasFilters = selectedDay !== null || selectedMetric !== null;

  if (!hasFilters) return null;

  return (
    <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
      <span className="text-xs text-muted-foreground">Filtros ativos:</span>
      
      {selectedDay !== null && (
        <Badge 
          variant="outline" 
          className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer hover:bg-dashboard-accent/20"
          onClick={onClearDay}
        >
          Dia {selectedDay}
          <X className="ml-1 h-3 w-3" />
        </Badge>
      )}
      
      {selectedMetric !== null && (
        <Badge 
          variant="outline" 
          className={`cursor-pointer hover:opacity-80 ${
            selectedMetric === "expedidas" 
              ? "border-dashboard-blue bg-dashboard-blue/10 text-dashboard-blue" 
              : "border-dashboard-orange bg-dashboard-orange/10 text-dashboard-orange"
          }`}
          onClick={onClearMetric}
        >
          {selectedMetric === "expedidas" ? "Expedidas" : "Baixadas"}
          <X className="ml-1 h-3 w-3" />
        </Badge>
      )}
      
      <Button
        variant="ghost"
        size="sm"
        onClick={onClearAll}
        className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground"
      >
        Limpar todos
      </Button>
    </div>
  );
};
