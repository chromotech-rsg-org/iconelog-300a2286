import { Package, Truck, FileText, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { months, years, regions } from "@/data/mockData";

interface DashboardHeaderProps {
  selectedMonth: number;
  selectedYear: number;
  selectedRegion: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onRegionChange: (region: string) => void;
  lastUpdate: Date;
}

export const DashboardHeader = ({
  selectedMonth,
  selectedYear,
  selectedRegion,
  onMonthChange,
  onYearChange,
  onRegionChange,
  lastUpdate,
}: DashboardHeaderProps) => {
  const formatLastUpdate = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <header className="w-full border-b border-dashboard-border bg-dashboard-card">
      {/* Top bar with logo, update time, and navigation */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-dashboard-accent">
            <Truck className="h-6 w-6 text-dashboard-dark" />
          </div>
          <span className="text-xl font-bold text-dashboard-accent">
            ICONE LOG
          </span>
        </div>

        {/* Last update */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Última atualização: {formatLastUpdate(lastUpdate)}</span>
        </div>

        {/* Navigation buttons */}
        <div className="flex items-center gap-2">
          <Button variant="ghost" className="text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border">
            <Package className="mr-2 h-4 w-4" />
            Estoque
          </Button>
          <Button variant="ghost" className="text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border">
            <Truck className="mr-2 h-4 w-4" />
            Tracking Entrega
          </Button>
          <Button variant="ghost" className="text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border">
            <FileText className="mr-2 h-4 w-4" />
            Faturamento
          </Button>
        </div>
      </div>

      {/* Filters bar */}
      <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-t border-dashboard-border">
        {/* Month buttons */}
        <div className="flex flex-wrap gap-1">
          {months.map((month) => (
            <Button
              key={month.value}
              variant="ghost"
              size="sm"
              onClick={() => onMonthChange(month.value)}
              className={`px-3 py-1 text-xs font-medium transition-all duration-200 ${
                selectedMonth === month.value
                  ? "bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent"
                  : "text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border"
              }`}
            >
              {month.short}
            </Button>
          ))}
        </div>

        {/* Year selector */}
        <Select
          value={selectedYear.toString()}
          onValueChange={(value) => onYearChange(parseInt(value))}
        >
          <SelectTrigger className="w-24 border-dashboard-border bg-dashboard-card text-foreground">
            <SelectValue />
          </SelectTrigger>
          <SelectContent className="bg-dashboard-card border-dashboard-border">
            {years.map((year) => (
              <SelectItem key={year} value={year.toString()} className="text-foreground hover:bg-dashboard-border">
                {year}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        {/* Regional selector */}
        <Select
          value={selectedRegion}
          onValueChange={onRegionChange}
        >
          <SelectTrigger className="w-48 border-dashboard-border bg-dashboard-card text-foreground">
            <SelectValue placeholder="Todas as Regionais" />
          </SelectTrigger>
          <SelectContent className="bg-dashboard-card border-dashboard-border">
            <SelectItem value="all" className="text-foreground hover:bg-dashboard-border">
              Todas as Regionais
            </SelectItem>
            {regions.map((region) => (
              <SelectItem key={region} value={region} className="text-foreground hover:bg-dashboard-border">
                {region}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
    </header>
  );
};
