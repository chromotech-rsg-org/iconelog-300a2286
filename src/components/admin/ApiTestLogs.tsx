import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Download, Eye, Loader2, Search, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { format } from "date-fns";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

interface LogEntry {
  id: string;
  endpoint: string;
  method: string;
  request_headers: any;
  request_body: any;
  response_status: number | null;
  response_headers: any;
  response_body: any;
  execution_time_ms: number | null;
  user_id: string | null;
  created_at: string;
}

const ApiTestLogs = () => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);

  const fetchLogs = useCallback(async () => {
    const { data, error } = await supabase
      .from("api_test_logs")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(200);
    if (error) { console.error(error); toast.error("Erro ao carregar logs"); }
    else setLogs(data || []);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  const filteredLogs = logs.filter(l =>
    l.endpoint.toLowerCase().includes(search.toLowerCase()) ||
    l.method.toLowerCase().includes(search.toLowerCase())
  );

  const getStatusColor = (status: number | null) => {
    if (!status) return "bg-muted text-muted-foreground";
    if (status >= 200 && status < 300) return "bg-green-500/20 text-green-400";
    if (status >= 400 && status < 500) return "bg-yellow-500/20 text-yellow-400";
    return "bg-red-500/20 text-red-400";
  };

  const exportData = (fmt: "json" | "csv" | "xlsx" | "txt") => {
    const data = filteredLogs.map(l => ({
      data: format(new Date(l.created_at), "dd/MM/yyyy HH:mm:ss"),
      metodo: l.method,
      endpoint: l.endpoint,
      status: l.response_status,
      tempo_ms: l.execution_time_ms,
      request_body: JSON.stringify(l.request_body),
      response_body: JSON.stringify(l.response_body),
    }));

    if (fmt === "json") {
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: "application/json" });
      saveAs(blob, "api-logs.json");
    } else if (fmt === "csv") {
      const headers = Object.keys(data[0] || {}).join(",");
      const rows = data.map(d => Object.values(d).map(v => `"${v}"`).join(","));
      const blob = new Blob([headers + "\n" + rows.join("\n")], { type: "text/csv" });
      saveAs(blob, "api-logs.csv");
    } else if (fmt === "xlsx") {
      const ws = XLSX.utils.json_to_sheet(data);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Logs");
      XLSX.writeFile(wb, "api-logs.xlsx");
    } else {
      const text = data.map(d => `[${d.data}] ${d.metodo} ${d.endpoint} → ${d.status} (${d.tempo_ms}ms)\nRequest: ${d.request_body}\nResponse: ${d.response_body}`).join("\n\n---\n\n");
      const blob = new Blob([text], { type: "text/plain" });
      saveAs(blob, "api-logs.txt");
    }
    toast.success("Exportado!");
  };

  const handleClearLogs = async () => {
    const { error } = await supabase.from("api_test_logs").delete().neq("id", "00000000-0000-0000-0000-000000000000");
    if (error) toast.error("Erro ao limpar logs");
    else { toast.success("Logs limpos!"); fetchLogs(); }
  };

  if (loading) return <div className="flex items-center justify-center h-32"><Loader2 className="h-6 w-6 animate-spin text-dashboard-accent" /></div>;

  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-base text-foreground">Logs de Testes de API</CardTitle>
          <div className="flex items-center gap-2">
            <div className="flex gap-1">
              {(["json", "csv", "xlsx", "txt"] as const).map(fmt => (
                <Button key={fmt} variant="outline" size="sm" className="border-dashboard-border text-xs" onClick={() => exportData(fmt)} disabled={filteredLogs.length === 0}>
                  <Download className="h-3 w-3 mr-1" />{fmt.toUpperCase()}
                </Button>
              ))}
            </div>
            <Button variant="outline" size="sm" className="border-destructive text-destructive" onClick={handleClearLogs}>
              <Trash2 className="h-3 w-3 mr-1" />Limpar
            </Button>
          </div>
        </div>
        <div className="flex items-center gap-2 mt-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Buscar por endpoint ou método..."
            className="bg-dashboard-dark border-dashboard-border text-foreground text-sm" />
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-[500px]">
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border">
                <TableHead className="text-muted-foreground">Data</TableHead>
                <TableHead className="text-muted-foreground">Método</TableHead>
                <TableHead className="text-muted-foreground">Endpoint</TableHead>
                <TableHead className="text-muted-foreground text-center">Status</TableHead>
                <TableHead className="text-muted-foreground text-center">Tempo</TableHead>
                <TableHead className="text-muted-foreground text-right">Ação</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredLogs.map(log => (
                <TableRow key={log.id} className="border-dashboard-border">
                  <TableCell className="text-muted-foreground text-xs">{format(new Date(log.created_at), "dd/MM HH:mm:ss")}</TableCell>
                  <TableCell><Badge variant="outline" className="text-xs">{log.method}</Badge></TableCell>
                  <TableCell className="text-foreground text-xs font-mono max-w-[250px] truncate">{log.endpoint}</TableCell>
                  <TableCell className="text-center"><Badge className={getStatusColor(log.response_status)}>{log.response_status || "Err"}</Badge></TableCell>
                  <TableCell className="text-center text-xs text-muted-foreground">{log.execution_time_ms}ms</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => setSelectedLog(log)}><Eye className="h-4 w-4" /></Button>
                  </TableCell>
                </TableRow>
              ))}
              {filteredLogs.length === 0 && (
                <TableRow><TableCell colSpan={6} className="text-center text-muted-foreground py-8">Nenhum log encontrado</TableCell></TableRow>
              )}
            </TableBody>
          </Table>
        </ScrollArea>
      </CardContent>

      <Dialog open={!!selectedLog} onOpenChange={() => setSelectedLog(null)}>
        <DialogContent className="bg-dashboard-card border-dashboard-border max-w-3xl max-h-[80vh] overflow-hidden flex flex-col">
          <DialogHeader><DialogTitle className="text-foreground">Detalhes do Log</DialogTitle></DialogHeader>
          {selectedLog && (
            <ScrollArea className="flex-1 pr-4">
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Badge variant="outline">{selectedLog.method}</Badge>
                  <Badge className={getStatusColor(selectedLog.response_status)}>{selectedLog.response_status}</Badge>
                  <span className="text-xs text-muted-foreground">{selectedLog.execution_time_ms}ms</span>
                  <span className="text-xs text-muted-foreground ml-auto">{format(new Date(selectedLog.created_at), "dd/MM/yyyy HH:mm:ss")}</span>
                </div>
                <p className="text-sm text-foreground font-mono break-all">{selectedLog.endpoint}</p>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Request Body:</p>
                  <pre className="text-xs bg-dashboard-dark p-3 rounded border border-dashboard-border text-foreground overflow-auto max-h-[200px]">
                    {JSON.stringify(selectedLog.request_body, null, 2)}
                  </pre>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1">Response Body:</p>
                  <pre className="text-xs bg-dashboard-dark p-3 rounded border border-dashboard-border text-foreground overflow-auto max-h-[300px]">
                    {JSON.stringify(selectedLog.response_body, null, 2)}
                  </pre>
                </div>
              </div>
            </ScrollArea>
          )}
        </DialogContent>
      </Dialog>
    </Card>
  );
};

export default ApiTestLogs;
