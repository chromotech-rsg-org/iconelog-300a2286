import { Clock, Construction, Menu, RotateCcw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { months, years, regions } from "@/data/mockData";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { ChevronDown } from "lucide-react";

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
  selectedMonths: number[];
  selectedYears: number[];
  selectedRegions: string[];
  onMonthsChange: (months: number[]) => void;
  onYearsChange: (years: number[]) => void;
  onRegionsChange: (regions: string[]) => void;
  onClearAllFilters?: () => void;
  onExportExcel?: () => void;
  lastUpdate: Date;
  hasActiveFilters?: boolean;
}

export const DashboardHeader = ({
  selectedMonths,
  selectedYears,
  selectedRegions,
  onMonthsChange,
  onYearsChange,
  onRegionsChange,
  onClearAllFilters,
  onExportExcel,
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

  const toggleMonth = (monthValue: number) => {
    if (selectedMonths.includes(monthValue)) {
      if (selectedMonths.length > 1) {
        onMonthsChange(selectedMonths.filter(m => m !== monthValue));
      }
    } else {
      onMonthsChange([...selectedMonths, monthValue].sort((a, b) => a - b));
    }
  };

  const toggleYear = (year: number) => {
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        onYearsChange(selectedYears.filter(y => y !== year));
      }
    } else {
      onYearsChange([...selectedYears, year].sort((a, b) => a - b));
    }
  };

  const toggleRegion = (region: string) => {
    if (region === "all") {
      onRegionsChange([]);
      return;
    }
    if (selectedRegions.includes(region)) {
      onRegionsChange(selectedRegions.filter(r => r !== region));
    } else {
      onRegionsChange([...selectedRegions, region]);
    }
  };

  const getMonthsLabel = () => {
    if (selectedMonths.length === 0) return "Selecione";
    if (selectedMonths.length === 1) {
      return months.find(m => m.value === selectedMonths[0])?.short || "";
    }
    if (selectedMonths.length === 12) return "Todos os meses";
    return `${selectedMonths.length} meses`;
  };

  const getYearsLabel = () => {
    if (selectedYears.length === 0) return "Selecione";
    if (selectedYears.length === 1) return selectedYears[0].toString();
    return `${selectedYears.length} anos`;
  };

  const getRegionsLabel = () => {
    if (selectedRegions.length === 0) return "Todas as Regionais";
    if (selectedRegions.length === 1) return selectedRegions[0];
    return `${selectedRegions.length} regionais`;
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
            className="h-12 w-12 rounded-lg object-cover border-2 border-dashboard-accent"
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
        {/* Month selection - inline */}
        <div className="flex flex-wrap gap-1">
          {months.map((month) => (
            <Button
              key={month.value}
              variant="ghost"
              size="sm"
              onClick={() => toggleMonth(month.value)}
              className={`px-2 py-1 text-xs font-medium transition-all duration-200 ${
                selectedMonths.includes(month.value)
                  ? "bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent"
                  : "text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border"
              }`}
            >
              {month.short}
            </Button>
          ))}
        </div>

        {/* Year multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-32 justify-between border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border"
            >
              {getYearsLabel()}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-40 p-2 bg-dashboard-card border-dashboard-border z-50">
            <div className="flex flex-col gap-2">
              {years.map((year) => (
                <div key={year} className="flex items-center space-x-2">
                  <Checkbox
                    id={`year-${year}`}
                    checked={selectedYears.includes(year)}
                    onCheckedChange={() => toggleYear(year)}
                    className="border-dashboard-border data-[state=checked]:bg-dashboard-accent data-[state=checked]:border-dashboard-accent"
                  />
                  <label 
                    htmlFor={`year-${year}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {year}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Regional multi-select */}
        <Popover>
          <PopoverTrigger asChild>
            <Button 
              variant="outline" 
              className="w-48 justify-between border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border"
            >
              {getRegionsLabel()}
              <ChevronDown className="ml-2 h-4 w-4" />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-56 p-2 bg-dashboard-card border-dashboard-border z-50 max-h-64 overflow-y-auto">
            <div className="flex flex-col gap-1">
              <div 
                className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-dashboard-border ${
                  selectedRegions.length === 0 ? "bg-dashboard-accent/20" : ""
                }`}
                onClick={() => toggleRegion("all")}
              >
                <span className="text-sm text-foreground">Todas as Regionais</span>
              </div>
              {regions.map((region) => (
                <div key={region} className="flex items-center space-x-2 p-1">
                  <Checkbox
                    id={`region-${region}`}
                    checked={selectedRegions.includes(region)}
                    onCheckedChange={() => toggleRegion(region)}
                    className="border-dashboard-border data-[state=checked]:bg-dashboard-accent data-[state=checked]:border-dashboard-accent"
                  />
                  <label 
                    htmlFor={`region-${region}`}
                    className="text-sm text-foreground cursor-pointer"
                  >
                    {region}
                  </label>
                </div>
              ))}
            </div>
          </PopoverContent>
        </Popover>

        {/* Export Excel button */}
        {onExportExcel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            className="border-dashboard-border text-foreground hover:bg-dashboard-accent hover:text-dashboard-dark"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        )}

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
