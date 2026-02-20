import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { DateRange } from "react-day-picker";
import { useState, useRef } from "react";

interface CalendarFilterProps {
  selectedDateRange?: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange: (range: { from: Date | undefined; to: Date | undefined }) => void;
}

export const CalendarFilter = ({ selectedDateRange, onDateRangeChange }: CalendarFilterProps) => {
  const [open, setOpen] = useState(false);
  const clickCountRef = useRef(0);

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

  const handleRangeSelect = (range: DateRange | undefined) => {
    if (!range || !range.from) {
      // Reset click counter when clearing
      clickCountRef.current = 0;
      onDateRangeChange({ from: undefined, to: undefined });
      return;
    }

    clickCountRef.current++;

    if (clickCountRef.current === 1) {
      // First click: select single day immediately
      onDateRangeChange({ from: range.from, to: range.from });
    } else {
      // Second click: either same day or range end
      clickCountRef.current = 0;
      if (range.to) {
        onDateRangeChange({ from: range.from, to: range.to });
      } else {
        onDateRangeChange({ from: range.from, to: range.from });
      }
    }
  };

  const handleClear = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    clickCountRef.current = 0;
    onDateRangeChange({ from: undefined, to: undefined });
  };

  const calendarRange: DateRange | undefined = selectedDateRange?.from
    ? { from: selectedDateRange.from, to: selectedDateRange.to }
    : undefined;

  return (
    <Popover open={open} onOpenChange={(o) => { if (!o) clickCountRef.current = 0; setOpen(o); }}>
      <PopoverTrigger asChild>
        <Button
          variant="outline"
          className={cn(
            "w-auto justify-start border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border gap-2",
            selectedDateRange?.from && "text-dashboard-accent border-dashboard-accent/50"
          )}
        >
          <CalendarIcon className="h-4 w-4" />
          {getLabel()}
          {selectedDateRange?.from && (
            <X
              className="h-3.5 w-3.5 ml-1 opacity-60 hover:opacity-100 cursor-pointer"
              onClick={handleClear}
            />
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0 bg-dashboard-card border-dashboard-border z-50" align="start">
        <div className="p-3 pb-1 text-xs text-muted-foreground">
          Clique uma vez para um dia · Clique em outro dia para período
        </div>
        <Calendar
          mode="range"
          selected={calendarRange}
          onSelect={handleRangeSelect}
          numberOfMonths={2}
          locale={ptBR}
          defaultMonth={selectedDateRange?.from ?? new Date()}
          className={cn("p-3 pt-1 pointer-events-auto")}
        />

        {selectedDateRange?.from && (
          <div className="p-2 border-t border-dashboard-border">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleClear()}
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
