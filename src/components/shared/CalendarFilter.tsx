import { useRef } from "react";
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

interface CalendarFilterProps {
  selectedDateRange?: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export const CalendarFilter = ({ selectedDateRange, onDateRangeChange }: CalendarFilterProps) => {
  // Track click count: 0 = nothing selected, 1 = single day selected, 2 = range selected
  const clickState = useRef<"none" | "single" | "range">("none");

  // Sync clickState with external state
  const isSingleDay = selectedDateRange?.from && selectedDateRange?.to &&
    selectedDateRange.from.toDateString() === selectedDateRange.to.toDateString();
  const isRange = selectedDateRange?.from && selectedDateRange?.to &&
    selectedDateRange.from.toDateString() !== selectedDateRange.to.toDateString();

  if (!selectedDateRange?.from) clickState.current = "none";
  else if (isSingleDay) clickState.current = "single";
  else if (isRange) clickState.current = "range";

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

  const handleDayClick = (day: Date) => {
    if (!day) return;

    const state = clickState.current;

    if (state === "none") {
      // First click: select single day
      onDateRangeChange({ from: day, to: day });
      clickState.current = "single";
    } else if (state === "single") {
      // Check if clicking the same day
      if (selectedDateRange?.from && day.toDateString() === selectedDateRange.from.toDateString()) {
        // Same day: clear selection
        onDateRangeChange({ from: undefined, to: undefined });
        clickState.current = "none";
      } else {
        // Different day: create range
        const from = selectedDateRange!.from!;
        const sortedFrom = day < from ? day : from;
        const sortedTo = day < from ? from : day;
        onDateRangeChange({ from: sortedFrom, to: sortedTo });
        clickState.current = "range";
      }
    } else {
      // Already a range: reset to single day
      onDateRangeChange({ from: day, to: day });
      clickState.current = "single";
    }
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
        <div className="px-4 pt-3 pb-1">
          <span className="text-xs text-muted-foreground">
            {isRange ? "Período selecionado" : isSingleDay ? "Dia selecionado — clique outro dia para período" : "Clique em um dia para filtrar"}
          </span>
        </div>

        <Calendar
          mode="single"
          selected={selectedDateRange?.from}
          onSelect={(day) => {
            if (day) handleDayClick(day);
          }}
          numberOfMonths={2}
          locale={ptBR}
          defaultMonth={new Date()}
          className={cn("p-3 pointer-events-auto")}
          modifiers={{
            range_start: selectedDateRange?.from ? [selectedDateRange.from] : [],
            range_end: selectedDateRange?.to && isRange ? [selectedDateRange.to] : [],
            in_range: isRange && selectedDateRange?.from && selectedDateRange?.to
              ? { after: selectedDateRange.from, before: selectedDateRange.to }
              : undefined,
          }}
          modifiersStyles={{
            range_start: { backgroundColor: "hsl(var(--dashboard-accent))", color: "white", borderRadius: "50%" },
            range_end: { backgroundColor: "hsl(var(--dashboard-accent))", color: "white", borderRadius: "50%" },
            in_range: { backgroundColor: "hsl(var(--dashboard-accent) / 0.15)", borderRadius: 0 },
          }}
        />

        {selectedDateRange?.from && (
          <div className="p-2 border-t border-dashboard-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                onDateRangeChange({ from: undefined, to: undefined });
                clickState.current = "none";
              }}
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
