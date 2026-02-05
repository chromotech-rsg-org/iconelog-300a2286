 import { Clock, RotateCcw, Download, RefreshCw, ChevronDown } from "lucide-react";
 import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { Button } from "@/components/ui/button";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { months, years, regions } from "@/data/mockData";
import { NavigationMenu } from "./NavigationMenu";
import { useAuth } from "@/contexts/AuthContext";

 interface SharedHeaderProps {
   pageTitle?: string;
  pageId: string;
  lastUpdate: Date;
  // Filtros opcionais
  showFilters?: boolean;
  selectedMonths?: number[];
  selectedYears?: number[];
  selectedRegions?: string[];
  onMonthsChange?: (months: number[]) => void;
  onYearsChange?: (years: number[]) => void;
  onRegionsChange?: (regions: string[]) => void;
  // Ações
  onClearAllFilters?: () => void;
  onExportExcel?: () => void;
  onRefreshData?: () => void;
  hasActiveFilters?: boolean;
}

 export const SharedHeader = ({
   pageTitle: propPageTitle,
   pageId,
   lastUpdate,
   showFilters = false,
   selectedMonths = [],
   selectedYears = [],
   selectedRegions = [],
   onMonthsChange,
   onYearsChange,
   onRegionsChange,
   onClearAllFilters,
   onExportExcel,
   onRefreshData,
   hasActiveFilters = false,
 }: SharedHeaderProps) => {
  const { canExport, canRefresh, isAuthenticated } = useAuth();
   const { getPageTitle, getPageLogo } = useBiSettingsContext();
   
   // Use dynamic title from settings, fallback to prop
   const pageTitle = propPageTitle || getPageTitle(pageId);
   const pageLogo = getPageLogo(pageId);
  
  // Se não está autenticado, permite ações por padrão
  const showExport = !isAuthenticated || canExport(pageId);
  const showRefresh = !isAuthenticated || canRefresh(pageId);

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
    if (!onMonthsChange) return;
    if (selectedMonths.includes(monthValue)) {
      if (selectedMonths.length > 1) {
        onMonthsChange(selectedMonths.filter(m => m !== monthValue));
      }
    } else {
      onMonthsChange([...selectedMonths, monthValue].sort((a, b) => a - b));
    }
  };

  const toggleYear = (year: number) => {
    if (!onYearsChange) return;
    if (selectedYears.includes(year)) {
      if (selectedYears.length > 1) {
        onYearsChange(selectedYears.filter(y => y !== year));
      }
    } else {
      onYearsChange([...selectedYears, year].sort((a, b) => a - b));
    }
  };

  const toggleRegion = (region: string) => {
    if (!onRegionsChange) return;
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
     <header className="w-full border-b border-dashboard-border bg-dashboard-card sticky top-0 z-40">
      {/* Top bar with logo, page title, update time, and navigation */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo and Page Title */}
        <div className="flex items-center gap-4">
          <img 
             src={pageLogo} 
            alt="Logo" 
            className="h-12 w-12 rounded-lg object-cover border-2 border-dashboard-accent"
          />
          <div>
            <h1 className="text-lg font-semibold text-foreground">{pageTitle}</h1>
          </div>
        </div>

        {/* Last update */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Última atualização: {formatLastUpdate(lastUpdate)}</span>
          <span className="sm:hidden">{formatLastUpdate(lastUpdate)}</span>
          {showRefresh && onRefreshData && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefreshData}
              className="h-8 w-8 text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border"
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation menu */}
        <NavigationMenu />
      </div>

      {/* Filters bar - only shown if showFilters is true */}
      {showFilters && (
        <div className="flex flex-wrap items-center gap-4 px-6 py-3 border-t border-dashboard-border">
          {/* Month selection - desktop */}
          <div className="hidden md:flex flex-wrap gap-1">
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

          {/* Month dropdown for mobile */}
          <Popover>
            <PopoverTrigger asChild>
              <Button 
                variant="outline" 
                className="md:hidden w-32 justify-between border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border"
              >
                {getMonthsLabel()}
                <ChevronDown className="ml-2 h-4 w-4" />
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-64 p-3 bg-dashboard-card border-dashboard-border z-50">
              <div className="flex flex-wrap gap-2">
                {months.map((month) => (
                  <Button
                    key={month.value}
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleMonth(month.value)}
                    className={`px-3 py-1.5 text-xs font-medium transition-all duration-200 ${
                      selectedMonths.includes(month.value)
                        ? "bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent"
                        : "text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border"
                    }`}
                  >
                    {month.short}
                  </Button>
                ))}
              </div>
            </PopoverContent>
          </Popover>

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
          {showExport && onExportExcel && (
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
      )}
    </header>
  );
};
