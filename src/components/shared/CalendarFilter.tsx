import { useState } from "react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Switch } from "@/components/ui/switch";

interface CalendarFilterProps {
  selectedDateRange?: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export const CalendarFilter = ({ selectedDateRange, onDateRangeChange }: CalendarFilterProps) => {
  const [rangeMode, setRangeMode] = useState(false);

  const isRange = selectedDateRange?.from && selectedDateRange?.to &&
    selectedDateRange.from.toDateString() !== selectedDateRange.to.toDateString();

  const getLabel = () => {
    if (!selectedDateRange?.from) return <span className="text-muted-foreground">Período</span>;
    if (isRange) {
      return (
        <>
          {format(selectedDateRange.from!, "dd/MM", { locale: ptBR })} - {format(selectedDateRange.to!, "dd/MM", { locale: ptBR })}
        </>
      );
    }
    return format(selectedDateRange.from, "dd/MM/yyyy", { locale: ptBR });
  };

  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto justify-start border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border",
            selectedDateRange?.from && "text-dashboard-accent border-dashboard-accent/50"
          )}
        >
          <CalendarIcon className="mr-2 h-4 w-4" />
          {getLabel()}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-dashboard-card border-dashboard-border z-50" align="start">
        {/* Mode toggle */}
        <div className="flex items-center justify-between px-4 pt-3 pb-1">
          <span className="text-xs text-muted-foreground">
            {rangeMode ? "Selecionar período" : "Selecionar dia"}
          </span>
          <div className="flex items-center gap-2">
            <span className="text-xs text-muted-foreground">Período</span>
            <Switch
              checked={rangeMode}
              onCheckedChange={(checked) => {
                setRangeMode(checked);
                // Reset selection when toggling mode
                onDateRangeChange({ from: undefined, to: undefined });
              }}
              className="data-[state=checked]:bg-dashboard-accent"
            />
          </div>
        </div>

        {rangeMode ? (
          <Calendar
            mode="range"
            selected={selectedDateRange?.from ? { from: selectedDateRange.from, to: selectedDateRange.to } : undefined}
            onSelect={(range) => {
              if (!range) {
                onDateRangeChange({ from: undefined, to: undefined });
              } else if (range.from && range.to) {
                onDateRangeChange({ from: range.from, to: range.to });
              } else if (range.from) {
                // First click in range mode - wait for second click
                onDateRangeChange({ from: range.from, to: undefined });
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
            defaultMonth={new Date()}
            className={cn("p-3 pointer-events-auto")}
          />
        ) : (
          <Calendar
            mode="single"
            selected={selectedDateRange?.from}
            onSelect={(day) => {
              if (day) {
                onDateRangeChange({ from: day, to: day });
              } else {
                onDateRangeChange({ from: undefined, to: undefined });
              }
            }}
            numberOfMonths={2}
            locale={ptBR}
            defaultMonth={new Date()}
            className={cn("p-3 pointer-events-auto")}
          />
        )}

        {selectedDateRange?.from && (
          <div className="p-2 border-t border-dashboard-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onDateRangeChange({ from: undefined, to: undefined })}
              className="w-full text-xs text-muted-foreground hover:text-dashboard-accent"
            >
              Limpar seleção
            </Button>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
};
