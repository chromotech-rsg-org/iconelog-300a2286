import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useApiProxy } from "@/hooks/useApiProxy";
import { toast } from "sonner";
import { Calendar, Download, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

interface FollowupItem {
  [key: string]: any;
}

const MONTHS = [
  { value: 1, label: "Jan" }, { value: 2, label: "Fev" }, { value: 3, label: "Mar" },
  { value: 4, label: "Abr" }, { value: 5, label: "Mai" }, { value: 6, label: "Jun" },
  { value: 7, label: "Jul" }, { value: 8, label: "Ago" }, { value: 9, label: "Set" },
  { value: 10, label: "Out" }, { value: 11, label: "Nov" }, { value: 12, label: "Dez" },
];

const HistoricalDataLoader = () => {
  const { callMainApi } = useApiProxy();
  const [codCli, setCodCli] = useState<string>("");
  const [selectedYear, setSelectedYear] = useState<number>(2025);
  const [selectedMonths, setSelectedMonths] = useState<number[]>([]);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState("");
  const [recordCount, setRecordCount] = useState(0);
  const [apis, setApis] = useState<string[]>(["FOLLOWUP", "PRODUTOSDISTRIBUIDOS"]);

  const currentYear = new Date().getFullYear();
  const availableYears = Array.from({ length: 3 }, (_, i) => currentYear - 1 - i + 1).filter(y => y < currentYear).sort((a, b) => b - a);

  // Load cod_cli from bi_settings
  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from("bi_settings")
        .select("cod_cli")
        .not("cod_cli", "is", null)
        .limit(1)
        .maybeSingle();
      if (data?.cod_cli) setCodCli(data.cod_cli);
    };
    load();
  }, []);

  const toggleMonth = (m: number) => {
    setSelectedMonths(prev =>
      prev.includes(m) ? prev.filter(v => v !== m) : [...prev, m].sort((a, b) => a - b)
    );
  };

  const selectAllMonths = () => {
    setSelectedMonths(prev => prev.length === 12 ? [] : MONTHS.map(m => m.value));
  };

  const handleLoad = useCallback(async () => {
    if (!codCli) {
      toast.error("Nenhum cod_cli configurado no BI Settings.");
      return;
    }
    if (selectedMonths.length === 0) {
      toast.error("Selecione pelo menos um mês.");
      return;
    }

    setLoading(true);
    setProgress(0);
    setRecordCount(0);

    const fmt = (d: Date) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;

    const totalSteps = selectedMonths.length * apis.length;
    let completedSteps = 0;
    let totalRecords = 0;

    for (const apiName of apis) {
      for (const month of selectedMonths) {
        const monthStr = String(month).padStart(2, "0");
        const monthCacheKey = `${apiName.toLowerCase()}_${codCli}_${selectedYear}_${monthStr}`;

        setStatusMessage(`Buscando ${apiName} — ${selectedYear}/${monthStr}...`);

        const firstDay = new Date(selectedYear, month - 1, 1);
        const lastDay = new Date(selectedYear, month, 0);

        const result = await callMainApi(apiName, codCli, {
          data_inicial: `${fmt(firstDay)} 00:00`,
          data_final: `${fmt(lastDay)} 23:59`,
        });

        if (result && result.length > 0) {
          const tagged = result.map((item: FollowupItem) => ({
            ...item,
            _fetch_month: month,
            _fetch_year: selectedYear,
          }));

          setStatusMessage(`Salvando ${apiName} ${selectedYear}/${monthStr} (${tagged.length} registros)...`);

          await supabase
            .from("bi_data_cache")
            .upsert(
              {
                page_id: "_shared",
                cache_key: monthCacheKey,
                data: tagged as any,
                cached_at: new Date().toISOString(),
              },
              { onConflict: "page_id,cache_key" }
            );

          totalRecords += tagged.length;
        } else {
          // No data for this month — save empty to mark as loaded
          await supabase
            .from("bi_data_cache")
            .upsert(
              {
                page_id: "_shared",
                cache_key: monthCacheKey,
                data: [] as any,
                cached_at: new Date().toISOString(),
              },
              { onConflict: "page_id,cache_key" }
            );
        }

        completedSteps++;
        setProgress(Math.round((completedSteps / totalSteps) * 100));
        setRecordCount(totalRecords);
      }

      // Clean up old yearly aggregate key if it exists (migration)
      const oldYearlyKey = `${apiName.toLowerCase()}_${codCli}_${selectedYear}`;
      await supabase
        .from("bi_data_cache")
        .delete()
        .eq("page_id", "_shared")
        .eq("cache_key", oldYearlyKey);
    }

    setStatusMessage("Carga histórica concluída!");
    setLoading(false);
    toast.success(`Carga histórica de ${selectedYear} concluída! ${totalRecords} registros carregados.`);
  }, [codCli, selectedYear, selectedMonths, apis, callMainApi]);

  return (
    <div className="space-y-6">
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader>
          <div className="flex items-center gap-3">
            <Calendar className="h-5 w-5 text-dashboard-accent" />
            <div>
              <CardTitle className="text-base text-foreground">Carga de Dados Históricos</CardTitle>
              <CardDescription className="text-muted-foreground">
                Carregue dados de anos e meses anteriores sob demanda. Dados existentes do mesmo período serão substituídos (sem duplicação).
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* cod_cli info */}
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted-foreground">Código do cliente:</span>
            {codCli ? (
              <Badge className="bg-dashboard-accent/20 text-dashboard-accent border-dashboard-accent/30">{codCli}</Badge>
            ) : (
              <Badge variant="secondary" className="text-destructive">Não configurado</Badge>
            )}
          </div>

          {/* Year selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">Ano</label>
            <div className="flex gap-2">
              {availableYears.map(year => (
                <Button
                  key={year}
                  variant={selectedYear === year ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedYear(year)}
                  className={
                    selectedYear === year
                      ? "bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/90"
                      : "border-dashboard-border text-foreground hover:bg-dashboard-border"
                  }
                  disabled={loading}
                >
                  {year}
                </Button>
              ))}
            </div>
          </div>

          {/* Month selection */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-foreground">Meses</label>
              <Button
                variant="ghost"
                size="sm"
                onClick={selectAllMonths}
                className="text-xs text-dashboard-accent hover:text-dashboard-accent/80"
                disabled={loading}
              >
                {selectedMonths.length === 12 ? "Desmarcar Todos" : "Selecionar Todos"}
              </Button>
            </div>
            <div className="grid grid-cols-6 sm:grid-cols-12 gap-2">
              {MONTHS.map(month => (
                <Button
                  key={month.value}
                  variant="ghost"
                  size="sm"
                  onClick={() => toggleMonth(month.value)}
                  className={`px-2 py-1 text-xs font-medium transition-all ${
                    selectedMonths.includes(month.value)
                      ? "bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent"
                      : "text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border"
                  }`}
                  disabled={loading}
                >
                  {month.label}
                </Button>
              ))}
            </div>
          </div>

          {/* API selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">APIs para carregar</label>
            <div className="flex flex-wrap gap-4">
              {["FOLLOWUP", "PRODUTOSDISTRIBUIDOS"].map(api => (
                <div key={api} className="flex items-center gap-2">
                  <Checkbox
                    id={`api-${api}`}
                    checked={apis.includes(api)}
                    onCheckedChange={(checked) => {
                      setApis(prev =>
                        checked ? [...prev, api] : prev.filter(a => a !== api)
                      );
                    }}
                    className="border-dashboard-border data-[state=checked]:bg-dashboard-accent data-[state=checked]:border-dashboard-accent"
                    disabled={loading}
                  />
                  <label htmlFor={`api-${api}`} className="text-sm text-foreground cursor-pointer">
                    {api}
                  </label>
                </div>
              ))}
            </div>
          </div>

          {/* Progress */}
          {loading && (
            <div className="space-y-3 p-4 rounded-lg bg-dashboard-dark border border-dashboard-border">
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin text-dashboard-accent" />
                <span className="text-sm text-foreground">{statusMessage}</span>
              </div>
              <Progress value={progress} className="h-2" />
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{progress}%</span>
                <span>{recordCount} registros</span>
              </div>
            </div>
          )}

          {/* Done message */}
          {!loading && statusMessage.includes("concluída") && (
            <div className="flex items-center gap-2 p-3 rounded-lg bg-green-500/10 border border-green-500/20">
              <CheckCircle2 className="h-4 w-4 text-green-400" />
              <span className="text-sm text-green-400">{statusMessage}</span>
            </div>
          )}

          {/* Action button */}
          <Button
            onClick={handleLoad}
            disabled={loading || !codCli || selectedMonths.length === 0 || apis.length === 0}
            className="w-full bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/90"
          >
            {loading ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-2" />
                Carregando...
              </>
            ) : (
              <>
                <Download className="h-4 w-4 mr-2" />
                Carregar Dados de {selectedYear}
              </>
            )}
          </Button>

          {/* Info */}
          <div className="flex items-start gap-2 p-3 rounded-lg bg-muted/30 border border-dashboard-border">
            <AlertCircle className="h-4 w-4 text-muted-foreground mt-0.5 shrink-0" />
            <p className="text-xs text-muted-foreground">
              Os dados carregados serão mesclados com o cache existente. Se já existirem dados do mesmo ano/mês, 
              eles serão substituídos pelos novos. Dados do ano atual ({currentYear}) não são afetados.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default HistoricalDataLoader;
