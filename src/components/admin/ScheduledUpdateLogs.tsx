import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight, User, Clock, Timer, Zap } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

interface LogEntry {
  id: string;
  executed_at: string;
  schedule_ids: string[];
  page_ids: string[];
  status: string;
  total_ms: number | null;
  apis_processed: number;
  results: any[];
  error_message: string | null;
  trigger_type: string;
  triggered_by: string | null;
  trigger_details: any;
}

const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary"; icon: React.ReactNode }> = {
  success: { label: "Sucesso", variant: "default", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  partial: { label: "Parcial", variant: "secondary", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  error: { label: "Erro", variant: "destructive", icon: <XCircle className="h-3.5 w-3.5" /> },
  running: { label: "Executando", variant: "outline", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
  chaining: { label: "Encadeando", variant: "outline", icon: <Loader2 className="h-3.5 w-3.5 animate-spin" /> },
};

const TriggerBadge = ({ log }: { log: LogEntry }) => {
  if (log.trigger_type === "manual") {
    return (
      <Badge variant="outline" className="text-[10px] gap-1 border-blue-500/30 text-blue-400 bg-blue-500/10">
        <User className="h-3 w-3" />
        Manual
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="text-[10px] gap-1 border-emerald-500/30 text-emerald-400 bg-emerald-500/10">
      <Zap className="h-3 w-3" />
      Automático
    </Badge>
  );
};

const ScheduleRuleDetails = ({ details }: { details: any }) => {
  if (!details) return null;

  // Manual trigger
  if (details.user_email) {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
          <User className="h-3 w-3 text-blue-400" />
          <span>{details.user_email}</span>
        </div>
        {details.page_id && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
            BI: <span className="font-medium text-foreground">{details.page_id}</span>
          </div>
        )}
        {details.apis?.length > 0 && (
          <div className="text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
            APIs: <span className="font-medium text-foreground">{details.apis.join(", ")}</span>
          </div>
        )}
      </div>
    );
  }

  // Scheduled trigger
  if (details.schedules && Array.isArray(details.schedules)) {
    return (
      <div className="flex flex-wrap gap-2 mt-2">
        {details.schedules.map((s: any, idx: number) => (
          <div key={idx} className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/30 rounded-md px-2 py-1">
            {s.schedule_type === "interval" ? (
              <>
                <Timer className="h-3 w-3 text-orange-400" />
                <span>Intervalo: <span className="font-medium text-foreground">{s.interval_minutes}min</span></span>
              </>
            ) : (
              <>
                <Clock className="h-3 w-3 text-emerald-400" />
                <span>Horário: <span className="font-medium text-foreground">{s.update_time?.substring(0, 5)}</span></span>
              </>
            )}
            <span className="text-muted-foreground/60">({s.page_id})</span>
          </div>
        ))}
      </div>
    );
  }

  return null;
};

const flattenResults = (results: any[]): any[] => {
  if (!results) return [];
  const flat: any[] = [];
  for (const item of results) {
    if (item?.results && Array.isArray(item.results)) {
      flat.push(...item.results);
    } else {
      flat.push(item);
    }
  }
  return flat;
};

export default function ScheduledUpdateLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "manual" | "scheduled">("all");

  const fetchLogs = async () => {
    setLoading(true);
    let query = supabase
      .from("scheduled_update_logs")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(50);

    if (filter !== "all") {
      query = query.eq("trigger_type", filter);
    }

    const { data, error } = await query;
    if (!error && data) {
      setLogs(data as unknown as LogEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, [filter]);

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader className="flex flex-row items-center justify-between gap-2 flex-wrap">
        <CardTitle className="text-base text-foreground">Logs de Atualização</CardTitle>
        <div className="flex items-center gap-2">
          <div className="flex rounded-md border border-dashboard-border overflow-hidden">
            {([
              { key: "all", label: "Todos" },
              { key: "scheduled", label: "Automático" },
              { key: "manual", label: "Manual" },
            ] as const).map(({ key, label }) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-3 py-1 text-xs transition-colors ${
                  filter === key
                    ? "bg-primary text-primary-foreground"
                    : "bg-transparent text-muted-foreground hover:bg-muted/30"
                }`}
              >
                {label}
              </button>
            ))}
          </div>
          <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
            Atualizar
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent" />
          </div>
        ) : logs.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-8">Nenhum log registrado ainda.</p>
        ) : (
          <div className="space-y-2">
            {logs.map((log) => {
              const cfg = statusConfig[log.status] || statusConfig.error;
              const isExpanded = expandedId === log.id;
              const allResults = flattenResults(log.results || []);
              const apiResults = allResults.filter((r: any) => r.type === "batch" || r.api);

              return (
                <Collapsible key={log.id} open={isExpanded} onOpenChange={() => setExpandedId(isExpanded ? null : log.id)}>
                  <div className={`rounded-lg border transition-colors ${
                    log.status === "error" 
                      ? "border-destructive/30 bg-destructive/5" 
                      : log.status === "partial"
                        ? "border-yellow-500/30 bg-yellow-500/5"
                        : "border-dashboard-border bg-dashboard-card"
                  }`}>
                    <CollapsibleTrigger asChild>
                      <button className="w-full flex items-center gap-2 sm:gap-3 p-3 text-left hover:bg-muted/30 transition-colors rounded-lg">
                        {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <div className="flex items-center gap-2 shrink-0">
                          {cfg.icon}
                          <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                        </div>
                        <TriggerBadge log={log} />
                        <span className="text-sm text-foreground whitespace-nowrap">
                          {format(new Date(log.executed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto whitespace-nowrap">
                          {log.apis_processed} API{log.apis_processed !== 1 ? "s" : ""} · {formatDuration(log.total_ms)}
                        </span>
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-0 border-t border-dashboard-border">
                        {/* Trigger details */}
                        <ScheduleRuleDetails details={log.trigger_details} />

                        {log.error_message && (
                          <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
                            {log.error_message}
                          </div>
                        )}

                        {/* Stage info for chained executions */}
                        {log.results && log.results.some((r: any) => r.stage) && (
                          <div className="mt-2 flex flex-wrap gap-1">
                            {log.results.filter((r: any) => r.stage).map((r: any, i: number) => (
                              <Badge key={i} variant="outline" className="text-[10px]">
                                Etapa {r.stage}: {r.processed_batches} lotes · {formatDuration(r.time_ms)}
                                {r.remaining_jobs > 0 && ` · ${r.remaining_jobs} pendentes`}
                              </Badge>
                            ))}
                          </div>
                        )}

                        {apiResults.length > 0 && (
                          <div className="mt-2 overflow-x-auto">
                            <Table>
                              <TableHeader>
                                <TableRow className="border-dashboard-border">
                                  <TableHead className="text-xs text-muted-foreground">API</TableHead>
                                  <TableHead className="text-xs text-muted-foreground">Cod. CLI</TableHead>
                                  <TableHead className="text-xs text-muted-foreground">Status</TableHead>
                                  <TableHead className="text-xs text-muted-foreground text-right">Registros</TableHead>
                                  <TableHead className="text-xs text-muted-foreground text-right">Tempo</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {apiResults.map((r: any, i: number) => (
                                  <TableRow key={i} className="border-dashboard-border">
                                    <TableCell className="text-xs font-medium">{r.api || "—"}</TableCell>
                                    <TableCell className="text-xs text-muted-foreground">{r.cod_cli || "—"}</TableCell>
                                    <TableCell>
                                      {r.status === "error" ? (
                                        <Badge variant="destructive" className="text-[10px]">Erro</Badge>
                                      ) : r.status === "skipped" ? (
                                        <Badge variant="outline" className="text-[10px]">Cache fresco</Badge>
                                      ) : (
                                        <Badge variant="default" className="text-[10px]">{r.status}</Badge>
                                      )}
                                    </TableCell>
                                    <TableCell className="text-xs text-right">{r.records?.toLocaleString() ?? "—"}</TableCell>
                                    <TableCell className="text-xs text-right">{formatDuration(r.time_ms)}</TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        )}

                        {apiResults.length === 0 && !log.error_message && (
                          <p className="text-xs text-muted-foreground mt-2">Nenhum detalhe disponível.</p>
                        )}
                      </div>
                    </CollapsibleContent>
                  </div>
                </Collapsible>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
