import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Send, Loader2, Clock } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";

const ApiTester = () => {
  const { user } = useAuth();
  const [method, setMethod] = useState("POST");
  const [url, setUrl] = useState("");
  const [headers, setHeaders] = useState('{\n  "Content-Type": "application/json"\n}');
  const [body, setBody] = useState("{}");
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<{ status: number; body: any; headers: any; time: number } | null>(null);

  // Pre-configured templates
  const templates = [
    { label: "Followup", method: "POST", url: "https://nfe9.websiteseguro.com/api/FOLLOWUP", body: '{\n  "cod_cli": "099",\n  "dt_inicio": "01/01/2025",\n  "dt_fim": "31/01/2025"\n}' },
    { label: "Saldo Base", method: "POST", url: "https://nfe9.websiteseguro.com/api/SALDOBASE", body: '{\n  "cod_cli": "099"\n}' },
    { label: "Produtos Distribuidos", method: "POST", url: "https://nfe9.websiteseguro.com/api/PRODUTOSDISTRIBUIDOS", body: '{\n  "cod_cli": "099",\n  "dt_inicio": "01/01/2025",\n  "dt_fim": "31/01/2025"\n}' },
    { label: "Recebimentos", method: "POST", url: "https://nfe9.websiteseguro.com/api/RECEBIMENTOS", body: '{\n  "cod_cli": "099",\n  "dt_inicio": "01/01/2025",\n  "dt_fim": "31/01/2025"\n}' },
  ];

  const handleTemplate = (tpl: typeof templates[0]) => {
    setMethod(tpl.method);
    setUrl(tpl.url);
    setBody(tpl.body);
  };

  const handleSend = async () => {
    if (!url.trim()) { toast.error("URL é obrigatória"); return; }

    let parsedHeaders = {};
    let parsedBody = undefined;
    try { parsedHeaders = JSON.parse(headers); } catch { toast.error("Headers JSON inválido"); return; }
    if (["POST", "PUT", "PATCH"].includes(method)) {
      try { parsedBody = JSON.parse(body); } catch { toast.error("Body JSON inválido"); return; }
    }

    setLoading(true);
    setResponse(null);
    const startTime = Date.now();

    try {
      const { data, error } = await supabase.functions.invoke("api-proxy", {
        body: { url, method, headers: parsedHeaders, body: parsedBody },
      });

      const elapsed = Date.now() - startTime;

      if (error) throw error;

      const result = {
        status: data?.status || 0,
        body: data?.body,
        headers: data?.headers || {},
        time: elapsed,
      };
      setResponse(result);

      // Save to logs
      await supabase.from("api_test_logs").insert({
        endpoint: url,
        method,
        request_headers: parsedHeaders,
        request_body: parsedBody,
        response_status: result.status,
        response_headers: result.headers,
        response_body: typeof result.body === "string" ? { raw: result.body } : result.body,
        execution_time_ms: elapsed,
        user_id: user?.id,
      });
    } catch (err: any) {
      setResponse({ status: 0, body: { error: err.message }, headers: {}, time: Date.now() - startTime });
      toast.error("Erro na requisição: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: number) => {
    if (status >= 200 && status < 300) return "bg-green-500/20 text-green-400";
    if (status >= 400 && status < 500) return "bg-yellow-500/20 text-yellow-400";
    if (status >= 500) return "bg-red-500/20 text-red-400";
    return "bg-muted text-muted-foreground";
  };

  return (
    <div className="space-y-4">
      {/* Templates */}
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm text-foreground">Templates Rápidos</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap gap-2">
            {templates.map(tpl => (
              <Button key={tpl.label} variant="outline" size="sm" className="border-dashboard-border text-sm" onClick={() => handleTemplate(tpl)}>
                {tpl.label}
              </Button>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Request */}
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="pb-2">
          <CardTitle className="text-base text-foreground">Requisição</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex gap-2">
            <Select value={method} onValueChange={setMethod}>
              <SelectTrigger className="w-28 bg-dashboard-dark border-dashboard-border text-foreground"><SelectValue /></SelectTrigger>
              <SelectContent className="bg-dashboard-card border-dashboard-border">
                {["GET", "POST", "PUT", "DELETE", "PATCH"].map(m => <SelectItem key={m} value={m}>{m}</SelectItem>)}
              </SelectContent>
            </Select>
            <Input value={url} onChange={e => setUrl(e.target.value)} className="flex-1 bg-dashboard-dark border-dashboard-border text-foreground font-mono text-sm" placeholder="https://api.example.com/endpoint" />
            <Button onClick={handleSend} disabled={loading} className="bg-dashboard-accent text-dashboard-dark">
              {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              <span className="ml-2">Enviar</span>
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label className="text-xs text-muted-foreground mb-1 block">Headers</Label>
              <Textarea value={headers} onChange={e => setHeaders(e.target.value)} className="bg-dashboard-dark border-dashboard-border text-foreground font-mono text-xs h-28" />
            </div>
            {["POST", "PUT", "PATCH"].includes(method) && (
              <div>
                <Label className="text-xs text-muted-foreground mb-1 block">Body</Label>
                <Textarea value={body} onChange={e => setBody(e.target.value)} className="bg-dashboard-dark border-dashboard-border text-foreground font-mono text-xs h-28" />
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Response */}
      {response && (
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardHeader className="pb-2">
            <div className="flex items-center justify-between">
              <CardTitle className="text-base text-foreground">Resposta</CardTitle>
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(response.status)}>{response.status || "Erro"}</Badge>
                <Badge variant="outline" className="text-xs"><Clock className="h-3 w-3 mr-1" />{response.time}ms</Badge>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[400px] border border-dashboard-border rounded-md p-3">
              <pre className="text-xs text-foreground font-mono whitespace-pre-wrap">
                {typeof response.body === "string" ? response.body : JSON.stringify(response.body, null, 2)}
              </pre>
            </ScrollArea>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApiTester;
