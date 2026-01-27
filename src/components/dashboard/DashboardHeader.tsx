import { Clock, Construction, Menu, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { months, years, regions } from "@/data/mockData";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";

const navigationItems = [
  { label: "B-Side Entregas", active: false },
  { label: "B-Side Estoque", active: false },
  { label: "Tracking Consolidado", active: false },
  { label: "Estoque Consolidado", active: false },
  { label: "Faturamento", active: false },
  { label: "Analítico", active: false },
  { label: "Minutas Expedidas x Baixadas", active: true },
  { label: "Painel de Controle", active: false },
];

const handleNavClick = (item: typeof navigationItems[0]) => {
  if (!item.active) {
    toast.info(`${item.label} - Em desenvolvimento`, {
      icon: <Construction className="h-4 w-4" />,
    });
  }
};

interface DashboardHeaderProps {
  selectedMonth: number;
  selectedYear: number;
  selectedRegion: string;
  onMonthChange: (month: number) => void;
  onYearChange: (year: number) => void;
  onRegionChange: (region: string) => void;
  onClearAllFilters?: () => void;
  lastUpdate: Date;
  hasActiveFilters?: boolean;
}

export const DashboardHeader = ({
  selectedMonth,
  selectedYear,
  selectedRegion,
  onMonthChange,
  onYearChange,
  onRegionChange,
  onClearAllFilters,
  lastUpdate,
  hasActiveFilters = false,
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
          <img 
            src={logo} 
            alt="Logo" 
            className="h-12 w-12 rounded-full object-cover border-2 border-dashboard-accent"
          />
        </div>

        {/* Last update */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Última atualização: {formatLastUpdate(lastUpdate)}</span>
        </div>

        {/* Navigation dropdown - icon only */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button 
              variant="outline" 
              size="icon"
              className="border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent className="bg-dashboard-card border-dashboard-border z-50" align="end">
            {navigationItems.map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`cursor-pointer ${
                  item.active 
                    ? "bg-dashboard-accent text-dashboard-dark font-medium" 
                    : "text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
                }`}
              >
                {item.label}
                {!item.active && <Construction className="ml-2 h-3 w-3 text-muted-foreground" />}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
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
          <SelectContent className="bg-dashboard-card border-dashboard-border z-50">
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
          <SelectContent className="bg-dashboard-card border-dashboard-border z-50">
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

        {/* Clear all filters button */}
        {hasActiveFilters && onClearAllFilters && (
          <Button
            variant="outline"
            size="sm"
            onClick={onClearAllFilters}
            className="ml-auto border-dashboard-accent/50 text-dashboard-accent hover:bg-dashboard-accent hover:text-dashboard-dark"
          >
            <RotateCcw className="mr-2 h-4 w-4" />
            Limpar Filtros
          </Button>
        )}
      </div>
    </header>
  );
};
