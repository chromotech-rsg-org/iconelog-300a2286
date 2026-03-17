import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, CheckCircle2, XCircle, AlertTriangle, ChevronDown, ChevronRight } from "lucide-react";
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
}

const statusConfig: Record<string, { label: string; variant: "default" | "destructive" | "outline" | "secondary"; icon: React.ReactNode }> = {
  success: { label: "Sucesso", variant: "default", icon: <CheckCircle2 className="h-3.5 w-3.5" /> },
  partial: { label: "Parcial", variant: "secondary", icon: <AlertTriangle className="h-3.5 w-3.5" /> },
  error: { label: "Erro", variant: "destructive", icon: <XCircle className="h-3.5 w-3.5" /> },
};

export default function ScheduledUpdateLogs() {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("scheduled_update_logs")
      .select("*")
      .order("executed_at", { ascending: false })
      .limit(50);

    if (!error && data) {
      setLogs(data as unknown as LogEntry[]);
    }
    setLoading(false);
  };

  useEffect(() => { fetchLogs(); }, []);

  const formatDuration = (ms: number | null) => {
    if (!ms) return "—";
    if (ms < 1000) return `${ms}ms`;
    return `${(ms / 1000).toFixed(1)}s`;
  };

  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-base text-foreground">Logs de Atualização Automática</CardTitle>
        <Button variant="outline" size="sm" onClick={fetchLogs} disabled={loading}>
          <RefreshCw className={`h-4 w-4 mr-1 ${loading ? "animate-spin" : ""}`} />
          Atualizar
        </Button>
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
                      <button className="w-full flex items-center gap-3 p-3 text-left hover:bg-muted/30 transition-colors rounded-lg">
                        {isExpanded ? <ChevronDown className="h-4 w-4 shrink-0 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <div className="flex items-center gap-2">
                          {cfg.icon}
                          <Badge variant={cfg.variant} className="text-xs">{cfg.label}</Badge>
                        </div>
                        <span className="text-sm text-foreground">
                          {format(new Date(log.executed_at), "dd/MM/yyyy HH:mm:ss", { locale: ptBR })}
                        </span>
                        <span className="text-xs text-muted-foreground ml-auto">
                          {log.apis_processed} API{log.apis_processed !== 1 ? "s" : ""} · {formatDuration(log.total_ms)}
                        </span>
                        {log.page_ids?.length > 0 && (
                          <span className="text-xs text-muted-foreground hidden sm:inline">
                            {log.page_ids.join(", ")}
                          </span>
                        )}
                      </button>
                    </CollapsibleTrigger>

                    <CollapsibleContent>
                      <div className="px-3 pb-3 pt-0 border-t border-dashboard-border">
                        {log.error_message && (
                          <div className="mt-2 p-2 rounded bg-destructive/10 border border-destructive/20 text-destructive text-xs font-mono">
                            {log.error_message}
                          </div>
                        )}

                        {log.results && log.results.length > 0 && (
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
                                {log.results.map((r: any, i: number) => (
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

                        {(!log.results || log.results.length === 0) && !log.error_message && (
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
