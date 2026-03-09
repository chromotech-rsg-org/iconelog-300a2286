import { useState, useCallback } from "react";
import { Clock, RotateCcw, Download, RefreshCw, ChevronDown, CalendarIcon, SlidersHorizontal } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { months, years, regions, allMonthValues } from "@/data/mockData";
import { NavigationMenu } from "./NavigationMenu";
import { useAuth } from "@/contexts/AuthContext";
import { useDynamicFilters } from "@/hooks/useDynamicFilters";
import { supabase } from "@/integrations/supabase/client";
import { CalendarFilter } from "./CalendarFilter";

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
  // Date range filter
  selectedDateRange?: { from: Date | undefined; to: Date | undefined };
  onDateRangeChange?: (range: { from: Date | undefined; to: Date | undefined }) => void;
  // B-SIDE / D-SIDE filter
  selectedSides?: string[];
  onSidesChange?: (sides: string[]) => void;
  // Dados para filtros dinâmicos
  followupData?: any[];
  cityMappings?: any[];
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
    selectedDateRange,
    onDateRangeChange,
    selectedSides,
    onSidesChange,
    onClearAllFilters,
    onExportExcel,
    onRefreshData,
    hasActiveFilters = false,
    followupData = [],
    cityMappings = [],
  }: SharedHeaderProps) => {
   const { canExport, canRefresh, isAuthenticated, isPublicAccess, isPublicExport, isPublicRefresh, canViewAdmin, canIdioma } = useAuth();
    const { getPageTitle, getPageLogo, getRefreshInterval } = useBiSettingsContext();
    const { language, toggleLanguage } = useLanguage();
    const showLanguageToggle = canIdioma(pageId);
    
    // Use dynamic title from settings, fallback to prop
    const pageTitle = propPageTitle || getPageTitle(pageId);
    const pageLogo = getPageLogo(pageId);
    const refreshIntervalMinutes = getRefreshInterval(pageId);

    // Get dynamic filters from data
    const { uniqueYears, uniqueRegions } = useDynamicFilters(followupData, cityMappings);
   
   // Allow actions for authenticated users with permission OR public pages with public permission
   const isPublic = isPublicAccess(pageId);
   const showExport = (isAuthenticated && canExport(pageId)) || (!isAuthenticated && isPublic && isPublicExport(pageId));
   const showRefresh = (isAuthenticated && canRefresh(pageId)) || (!isAuthenticated && isPublic && isPublicRefresh(pageId));

  // Cooldown modal state
  const [showCooldownModal, setShowCooldownModal] = useState(false);
  const [cooldownRemainingMinutes, setCooldownRemainingMinutes] = useState(0);
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);

  const checkServerCooldown = useCallback(async (): Promise<boolean> => {
    if (refreshIntervalMinutes <= 0) return true; // No cooldown configured

    // Map pageId to the correct bi_last_update page_id
    const updatePageId = pageId === "entregas" ? "minutas" : pageId;
    
    const { data } = await supabase
      .from("bi_last_update")
      .select("last_update_at")
      .eq("page_id", updatePageId)
      .maybeSingle();

    if (!data) return true; // No previous update, allow

    const lastUpdateTime = new Date(data.last_update_at).getTime();
    const now = Date.now();
    const elapsedMinutes = (now - lastUpdateTime) / (1000 * 60);
    const remaining = refreshIntervalMinutes - elapsedMinutes;

    if (remaining > 0) {
      setCooldownRemainingMinutes(Math.ceil(remaining));
      setShowCooldownModal(true);
      return false;
    }

    return true;
  }, [refreshIntervalMinutes, pageId]);

  const handleRefresh = async () => {
    if (!onRefreshData) return;
    const canRefreshNow = await checkServerCooldown();
    if (canRefreshNow) {
      onRefreshData();
    }
  };

  const formatCooldown = (minutes: number) => {
    if (minutes >= 60) {
      const h = Math.floor(minutes / 60);
      const m = minutes % 60;
      return m > 0 ? `${h}h ${m}min` : `${h}h`;
    }
    return `${minutes} min`;
  };

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

  const toggleAllMonths = () => {
    if (!onMonthsChange) return;
    if (selectedMonths.length === 12) {
      // Deselect all → keep only current month
      onMonthsChange([new Date().getMonth() + 1]);
    } else {
      onMonthsChange(allMonthValues);
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

  const { t } = useLanguage();

  const getMonthsLabel = () => {
    if (selectedMonths.length === 0) return t("Selecione");
    if (selectedMonths.length === 1) {
      const m = months.find(m => m.value === selectedMonths[0]);
      return m ? t(m.short) : "";
    }
    if (selectedMonths.length === 12) return t("Todos os meses");
    return `${selectedMonths.length} ${t("meses")}`;
  };

  const getYearsLabel = () => {
    if (selectedYears.length === 0) return t("Selecione");
    if (selectedYears.length === 1) return selectedYears[0].toString();
    return `${selectedYears.length} ${t("anos")}`;
  };

  const getRegionsLabel = () => {
    if (selectedRegions.length === 0) return t("Todas as Regionais");
    if (selectedRegions.length === 1) return selectedRegions[0];
    return `${selectedRegions.length} ${t("regionais")}`;
  };

  return (
    <>
     <header className="w-full border-b border-dashboard-border bg-dashboard-card sticky top-0 z-40">
      {/* Top bar with logo, page title, update time, and navigation */}
      <div className="flex items-center justify-between px-4 sm:px-6 py-3 sm:py-4 gap-2">
        {/* Logo and Page Title */}
        <div className="flex items-center gap-2 sm:gap-4 min-w-0 shrink">
          <img 
            src={pageLogo} 
            alt="Logo" 
            className="h-8 w-8 sm:h-12 sm:w-12 rounded-lg object-cover border-2 border-dashboard-accent shrink-0"
          />
          <h1 className="text-sm sm:text-lg font-semibold text-foreground truncate">{pageTitle}</h1>
        </div>

        {/* Last update + refresh + nav */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="hidden sm:flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            <span>{t("Última atualização")}: {formatLastUpdate(lastUpdate)}</span>
          </div>
          <span className="sm:hidden text-[10px] text-muted-foreground whitespace-nowrap">{formatLastUpdate(lastUpdate)}</span>
          {showRefresh && onRefreshData && (
            <Button
              variant="ghost"
              size="icon"
              onClick={handleRefresh}
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border"
              title={t("Atualizar dados")}
            >
              <RefreshCw className="h-3.5 w-3.5 sm:h-4 sm:w-4" />
            </Button>
          )}
          {showLanguageToggle && (
            <Button
              variant="ghost"
              size="icon"
              onClick={toggleLanguage}
              className="h-7 w-7 sm:h-8 sm:w-8 text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border"
              title={language === "pt-BR" ? "Switch to English" : "Mudar para Português"}
            >
              <span className="text-sm sm:text-base leading-none">{language === "pt-BR" ? "🇧🇷" : "🇺🇸"}</span>
            </Button>
          )}
          <NavigationMenu />
        </div>
      </div>

      {/* Filters bar - only shown if showFilters is true */}
      {showFilters && (
        <>
          {/* ===== MOBILE: single button that opens a Sheet ===== */}
          <div className="md:hidden flex items-center gap-2 px-4 py-2 border-t border-dashboard-border">
            <Sheet open={mobileFilterOpen} onOpenChange={setMobileFilterOpen}>
              <SheetTrigger asChild>
                <Button variant="outline" size="sm" className="border-dashboard-border text-foreground hover:bg-dashboard-border flex-1">
                  <SlidersHorizontal className="mr-2 h-4 w-4" />
                  {t("Filtros")}
                  {(hasActiveFilters || (selectedSides && selectedSides.length > 0)) && (
                    <span className="ml-2 h-5 w-5 rounded-full bg-dashboard-accent text-dashboard-dark text-[10px] font-bold flex items-center justify-center">!</span>
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent side="bottom" className="bg-dashboard-card border-dashboard-border max-h-[85vh] overflow-y-auto popover-dark-scroll">
                <SheetHeader>
                  <SheetTitle className="text-foreground">{t("Filtros")}</SheetTitle>
                </SheetHeader>
                <div className="space-y-5 pt-4">
                  {/* Months */}
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-2">{t("Meses")}</p>
                    <div className="flex flex-wrap gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={toggleAllMonths}
                        className={`px-3 py-1.5 text-xs font-bold border ${
                          selectedMonths.length === 12
                            ? "bg-dashboard-accent text-dashboard-dark border-dashboard-accent"
                            : "text-muted-foreground border-dashboard-border"
                        }`}
                      >
                        {selectedMonths.length === 12 ? t("Desmarcar todos") : t("Selecionar todos")}
                      </Button>
                      {months.map((month) => (
                        <Button
                          key={month.value}
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleMonth(month.value)}
                          className={`px-3 py-1.5 text-xs font-medium ${
                            selectedMonths.includes(month.value)
                              ? "bg-dashboard-accent text-dashboard-dark"
                              : "text-muted-foreground hover:text-dashboard-accent"
                          }`}
                        >
                          {t(month.short)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Years */}
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-2">{t("Ano")}</p>
                    <div className="flex flex-wrap gap-2">
                      {uniqueYears.map((year) => (
                        <Button
                          key={year}
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleYear(year)}
                          className={`px-3 py-1.5 text-xs font-medium border ${
                            selectedYears.includes(year)
                              ? "bg-dashboard-accent text-dashboard-dark border-dashboard-accent"
                              : "text-muted-foreground border-dashboard-border"
                          }`}
                        >
                          {year}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Regional */}
                  <div>
                    <p className="text-xs text-muted-foreground font-semibold mb-2">{t("Regional")}</p>
                    <div className="flex flex-col gap-1">
                      <div
                        className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-dashboard-border ${
                          selectedRegions.length === 0 ? "bg-dashboard-accent/20" : ""
                        }`}
                        onClick={() => toggleRegion("all")}
                      >
                        <span className="text-sm text-foreground">{t("Todas as Regionais")}</span>
                      </div>
                      {uniqueRegions.map((region) => (
                        <div key={region} className="flex items-center space-x-2 p-1">
                          <Checkbox
                            id={`m-region-${region}`}
                            checked={selectedRegions.includes(region)}
                            onCheckedChange={() => toggleRegion(region)}
                            className="border-dashboard-border data-[state=checked]:bg-dashboard-accent data-[state=checked]:border-dashboard-accent"
                          />
                          <label htmlFor={`m-region-${region}`} className="text-sm text-foreground cursor-pointer">
                            {region}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Calendar */}
                  {onDateRangeChange && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-2">{t("Período")}</p>
                      <CalendarFilter selectedDateRange={selectedDateRange} onDateRangeChange={onDateRangeChange} />
                    </div>
                  )}

                  {/* B-SIDE / D-SIDE */}
                  {selectedSides && onSidesChange && (
                    <div>
                      <p className="text-xs text-muted-foreground font-semibold mb-2">Lado</p>
                      <div className="flex items-center gap-2">
                        {["B-SIDE", "D-SIDE"].map(side => {
                          const isActive = selectedSides.includes(side);
                          return (
                            <Button
                              key={side}
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                onSidesChange(
                                  selectedSides.includes(side)
                                    ? selectedSides.filter(s => s !== side)
                                    : [...selectedSides, side]
                                );
                              }}
                              className={`px-4 py-2 text-sm font-medium border ${
                                isActive
                                  ? "bg-dashboard-accent text-dashboard-dark border-dashboard-accent"
                                  : "text-muted-foreground border-dashboard-border"
                              }`}
                            >
                              {side}
                            </Button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Actions */}
                  <div className="flex gap-2 pt-2 border-t border-dashboard-border">
                    {showExport && onExportExcel && (
                      <Button variant="outline" size="sm" onClick={() => { onExportExcel(); setMobileFilterOpen(false); }} className="border-dashboard-border text-foreground">
                        <Download className="mr-2 h-4 w-4" />
                        {t("Exportar Excel")}
                      </Button>
                    )}
                    {hasActiveFilters && onClearAllFilters && (
                      <Button variant="outline" size="sm" onClick={() => { onClearAllFilters(); setMobileFilterOpen(false); }} className="border-dashboard-accent/50 text-dashboard-accent">
                        <RotateCcw className="mr-2 h-4 w-4" />
                        {t("Limpar Filtros")}
                      </Button>
                    )}
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* ===== DESKTOP: inline filters (hidden on mobile) ===== */}
          <div className="hidden md:flex flex-wrap items-center gap-4 px-6 py-3 border-t border-dashboard-border">
            {/* Month selection */}
            <div className="flex flex-wrap items-center gap-1">
              <Button
                variant="ghost"
                size="sm"
                onClick={toggleAllMonths}
                className={`px-2 py-1 text-xs font-bold transition-all duration-200 border ${
                  selectedMonths.length === 12
                    ? "bg-dashboard-accent text-dashboard-dark border-dashboard-accent hover:bg-dashboard-accent/80"
                    : "text-muted-foreground border-dashboard-border hover:text-dashboard-accent hover:bg-dashboard-border"
                }`}
                title={selectedMonths.length === 12 ? t("Desmarcar todos") : t("Selecionar todos")}
              >
                {selectedMonths.length === 12 ? "✓" : "∀"}
              </Button>
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
                  {t(month.short)}
                </Button>
              ))}
            </div>

            {/* Year multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-32 justify-between border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border">
                  {getYearsLabel()}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-40 p-2 bg-dashboard-card border-dashboard-border z-50 popover-dark-scroll max-h-64 overflow-y-auto">
                <div className="flex flex-col gap-2">
                  {uniqueYears.map((year) => (
                    <div key={year} className="flex items-center space-x-2">
                      <Checkbox
                        id={`year-${year}`}
                        checked={selectedYears.includes(year)}
                        onCheckedChange={() => toggleYear(year)}
                        className="border-dashboard-border data-[state=checked]:bg-dashboard-accent data-[state=checked]:border-dashboard-accent"
                      />
                      <label htmlFor={`year-${year}`} className="text-sm text-foreground cursor-pointer">{year}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Regional multi-select */}
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" className="w-48 justify-between border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border">
                  {getRegionsLabel()}
                  <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-56 p-2 bg-dashboard-card border-dashboard-border z-50 popover-dark-scroll max-h-64 overflow-y-auto">
                <div className="flex flex-col gap-1">
                  <div
                    className={`flex items-center space-x-2 p-2 rounded cursor-pointer hover:bg-dashboard-border ${
                      selectedRegions.length === 0 ? "bg-dashboard-accent/20" : ""
                    }`}
                    onClick={() => toggleRegion("all")}
                  >
                    <span className="text-sm text-foreground">{t("Todas as Regionais")}</span>
                  </div>
                  {uniqueRegions.map((region) => (
                    <div key={region} className="flex items-center space-x-2 p-1">
                      <Checkbox
                        id={`region-${region}`}
                        checked={selectedRegions.includes(region)}
                        onCheckedChange={() => toggleRegion(region)}
                        className="border-dashboard-border data-[state=checked]:bg-dashboard-accent data-[state=checked]:border-dashboard-accent"
                      />
                      <label htmlFor={`region-${region}`} className="text-sm text-foreground cursor-pointer">{region}</label>
                    </div>
                  ))}
                </div>
              </PopoverContent>
            </Popover>

            {/* Calendar date filter */}
            {onDateRangeChange && (
              <CalendarFilter selectedDateRange={selectedDateRange} onDateRangeChange={onDateRangeChange} />
            )}

            {/* B-SIDE / D-SIDE toggle filters */}
            {selectedSides && onSidesChange && (
              <div className="flex items-center gap-1">
                {["B-SIDE", "D-SIDE"].map(side => {
                  const isActive = selectedSides.includes(side);
                  return (
                    <Button
                      key={side}
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        onSidesChange(
                          selectedSides.includes(side)
                            ? selectedSides.filter(s => s !== side)
                            : [...selectedSides, side]
                        );
                      }}
                      className={`px-3 py-1 text-xs font-medium transition-all duration-200 border ${
                        isActive
                          ? "bg-dashboard-accent text-dashboard-dark border-dashboard-accent hover:bg-dashboard-accent/80"
                          : "text-muted-foreground border-dashboard-border hover:text-dashboard-accent hover:bg-dashboard-border"
                      }`}
                    >
                      {side}
                    </Button>
                  );
                })}
              </div>
            )}

            {showExport && onExportExcel && (
              <Button variant="outline" size="sm" onClick={onExportExcel} className="border-dashboard-border text-foreground hover:bg-dashboard-accent hover:text-dashboard-dark">
                <Download className="mr-2 h-4 w-4" />
                {t("Exportar Excel")}
              </Button>
            )}

            {/* Clear all filters button */}
            {hasActiveFilters && onClearAllFilters && (
              <Button variant="outline" size="sm" onClick={onClearAllFilters} className="ml-auto border-dashboard-accent/50 text-dashboard-accent hover:bg-dashboard-accent hover:text-dashboard-dark">
                <RotateCcw className="mr-2 h-4 w-4" />
                {t("Limpar Filtros")}
              </Button>
            )}
          </div>
        </>
      )}

      {/* Export-only bar when filters are hidden */}
      {!showFilters && showExport && onExportExcel && (
        <div className="flex items-center gap-4 px-4 sm:px-6 py-2 border-t border-dashboard-border">
          <Button variant="outline" size="sm" onClick={onExportExcel} className="border-dashboard-border text-foreground hover:bg-dashboard-accent hover:text-dashboard-dark">
            <Download className="mr-2 h-4 w-4" />
             {t("Exportar Excel")}
          </Button>
        </div>
      )}
    </header>

    {/* Cooldown Modal */}
    <Dialog open={showCooldownModal} onOpenChange={setShowCooldownModal}>
      <DialogContent className="bg-dashboard-card border-dashboard-border text-foreground max-w-md">
        <DialogHeader>
          <DialogTitle className="text-dashboard-accent flex items-center gap-2">
            <Clock className="h-5 w-5" />
            {t("Atualização indisponível")}
          </DialogTitle>
          <DialogDescription className="text-muted-foreground pt-2 text-base">
            {t("Não é possível atualizar os dados agora. A última atualização foi realizada recentemente.")}
          </DialogDescription>
        </DialogHeader>
        <div className="bg-dashboard-dark rounded-lg p-4 border border-dashboard-border">
          <p className="text-sm text-muted-foreground">{t("Tempo restante para próxima atualização:")}</p>
          <p className="text-2xl font-bold text-dashboard-accent mt-1">
            {formatCooldown(cooldownRemainingMinutes)}
          </p>
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => setShowCooldownModal(false)}
            className="border-dashboard-border text-foreground hover:bg-dashboard-border"
          >
            {t("Entendido")}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
    </>
  );
};
