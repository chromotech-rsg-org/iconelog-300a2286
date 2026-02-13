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

interface CalendarFilterProps {
  selectedDateRange?: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export const CalendarFilter = ({ selectedDateRange, onDateRangeChange }: CalendarFilterProps) => {
  // "waiting" means user clicked same day twice and is now picking the end of a range
  const [waitingForRangeEnd, setWaitingForRangeEnd] = useState(false);

  const isSingleDay = selectedDateRange?.from && selectedDateRange?.to &&
    selectedDateRange.from.toDateString() === selectedDateRange.to.toDateString();
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

  const getHint = () => {
    if (waitingForRangeEnd) return "Clique em outro dia para definir o período";
    if (isRange) return "Período selecionado";
    if (isSingleDay) return "Clique no mesmo dia para selecionar período";
    return "Clique em um dia para filtrar";
  };

  const handleDayClick = (day: Date) => {
    if (!day) return;

    if (waitingForRangeEnd && selectedDateRange?.from) {
      // User is picking the end of a range
      const from = selectedDateRange.from;
      if (day.toDateString() === from.toDateString()) {
        // Clicked same day again: cancel period mode, clear selection
        setWaitingForRangeEnd(false);
        onDateRangeChange({ from: undefined, to: undefined });
      } else {
        const sortedFrom = day < from ? day : from;
        const sortedTo = day < from ? from : day;
        onDateRangeChange({ from: sortedFrom, to: sortedTo });
        setWaitingForRangeEnd(false);
      }
      return;
    }

    if (!selectedDateRange?.from) {
      // Nothing selected: select single day
      onDateRangeChange({ from: day, to: day });
    } else if (isSingleDay && day.toDateString() === selectedDateRange.from!.toDateString()) {
      // Clicking same selected day: enter period mode
      setWaitingForRangeEnd(true);
    } else {
      // Clicking different day or when range is active: select new single day
      setWaitingForRangeEnd(false);
      onDateRangeChange({ from: day, to: day });
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
          <span className={cn("text-xs text-muted-foreground", waitingForRangeEnd && "text-dashboard-accent font-medium")}>
            {getHint()}
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
            range_start: { backgroundColor: "hsl(var(--dashboard-accent))", color: "hsl(var(--primary-foreground))", borderRadius: "50%" },
            range_end: { backgroundColor: "hsl(var(--dashboard-accent))", color: "hsl(var(--primary-foreground))", borderRadius: "50%" },
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
                setWaitingForRangeEnd(false);
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
