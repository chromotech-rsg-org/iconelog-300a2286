import { useState, useMemo } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  generateMetricas,
  generateComparativo,
  generateAnaliticoRegional,
  subAbas,
} from "@/data/analiticoData";
import { formatNumber, formatCurrency } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { TrendingUp, TrendingDown, Minus } from "lucide-react";

const Analitico = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("visao-geral");

  const metricas = useMemo(() => generateMetricas(), []);
  const comparativo = useMemo(() => generateComparativo(), []);
  const regionalData = useMemo(() => generateAnaliticoRegional(), []);

  const handleRefreshData = () => {
    setLastUpdate(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const metricasData = metricas.map(m => ({
      Métrica: m.nome,
      Valor: m.valor,
      "Variação (%)": m.variacao,
      Tendência: m.tendencia === "up" ? "Subindo" : m.tendencia === "down" ? "Descendo" : "Estável",
    }));

    const regionalExport = regionalData.map(r => ({
      Regional: r.regional,
      Entregas: r.entregas,
      Devoluções: r.devolucoes,
      "% No Prazo": r.noPrazo.toFixed(1),
      Faturamento: r.faturamento,
      Satisfação: r.satisfacao.toFixed(1),
    }));

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(metricasData), "Métricas");
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(regionalExport), "Por Regional");
    
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `analitico_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  const getTrendIcon = (tendencia: "up" | "down" | "stable") => {
    switch (tendencia) {
      case "up":
        return <TrendingUp className="h-4 w-4 text-green-500" />;
      case "down":
        return <TrendingDown className="h-4 w-4 text-red-500" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  const formatMetricValue = (nome: string, valor: number) => {
    if (nome.includes("Taxa") || nome.includes("Devoluções")) return `${valor}%`;
    if (nome.includes("Custo")) return formatCurrency(valor);
    if (nome.includes("Satisfação")) return `${valor}/5`;
    if (nome.includes("Tempo")) return `${valor} dias`;
    return formatNumber(valor);
  };

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader
        pageTitle="Analítico"
        pageId="analitico"
        lastUpdate={lastUpdate}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
      />

      <div className="p-6 space-y-4">
        {/* Sub-Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-dashboard-card border border-dashboard-border flex-wrap h-auto gap-1 p-1">
            {subAbas.map((aba) => (
              <TabsTrigger 
                key={aba.id} 
                value={aba.id}
                className="data-[state=active]:bg-dashboard-accent data-[state=active]:text-dashboard-dark"
              >
                {aba.nome}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="visao-geral" className="space-y-4 mt-4">
            {/* Métricas Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {metricas.map((metrica) => (
                <Card key={metrica.nome} className="bg-dashboard-card border-dashboard-border">
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs text-muted-foreground truncate">{metrica.nome}</span>
                      {getTrendIcon(metrica.tendencia)}
                    </div>
                    <p className="text-xl font-bold text-foreground">
                      {formatMetricValue(metrica.nome, metrica.valor)}
                    </p>
                    <p className={`text-xs ${metrica.variacao > 0 ? 'text-green-500' : metrica.variacao < 0 ? 'text-red-500' : 'text-muted-foreground'}`}>
                      {metrica.variacao > 0 ? '+' : ''}{metrica.variacao}%
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Comparativo Chart */}
            <Card className="bg-dashboard-card border-dashboard-border">
              <CardHeader className="pb-2">
                <CardTitle className="text-base font-medium text-foreground">Comparativo Mensal: Atual vs Anterior vs Meta</CardTitle>
              </CardHeader>
              <CardContent className="h-[300px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={comparativo}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                    <XAxis dataKey="periodo" stroke="hsl(0, 0%, 60%)" fontSize={11} />
                    <YAxis stroke="hsl(0, 0%, 60%)" fontSize={10} />
                    <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} />
                    <Legend />
                    <Line type="monotone" dataKey="atual" name="Atual" stroke="hsl(45, 100%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(45, 100%, 50%)' }} />
                    <Line type="monotone" dataKey="anterior" name="Anterior" stroke="hsl(217, 91%, 60%)" strokeWidth={2} dot={{ fill: 'hsl(217, 91%, 60%)' }} />
                    <Line type="monotone" dataKey="meta" name="Meta" stroke="hsl(142, 76%, 36%)" strokeWidth={2} strokeDasharray="5 5" dot={{ fill: 'hsl(142, 76%, 36%)' }} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Regional Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              {/* Chart */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Performance por Regional</CardTitle>
                </CardHeader>
                <CardContent className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={regionalData.slice(0, 8)}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis dataKey="regional" stroke="hsl(0, 0%, 60%)" fontSize={9} angle={-45} textAnchor="end" height={60} />
                      <YAxis stroke="hsl(0, 0%, 60%)" fontSize={10} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} />
                      <Legend />
                      <Bar dataKey="entregas" name="Entregas" fill="hsl(45, 100%, 50%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="devolucoes" name="Devoluções" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Table */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Detalhes por Regional</CardTitle>
                </CardHeader>
                <CardContent className="overflow-auto max-h-[300px] custom-scrollbar">
                  <Table>
                    <TableHeader>
                      <TableRow className="border-dashboard-border">
                        <TableHead className="text-muted-foreground">Regional</TableHead>
                        <TableHead className="text-muted-foreground text-right">Entregas</TableHead>
                        <TableHead className="text-muted-foreground text-right">% Prazo</TableHead>
                        <TableHead className="text-muted-foreground text-right">Satisfação</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {regionalData.map((item) => (
                        <TableRow key={item.regional} className="border-dashboard-border hover:bg-dashboard-border/50">
                          <TableCell className="text-foreground font-medium">{item.regional}</TableCell>
                          <TableCell className="text-foreground text-right">{formatNumber(item.entregas)}</TableCell>
                          <TableCell className={`text-right ${item.noPrazo >= 90 ? 'text-green-500' : item.noPrazo >= 80 ? 'text-yellow-500' : 'text-red-500'}`}>
                            {item.noPrazo.toFixed(1)}%
                          </TableCell>
                          <TableCell className="text-foreground text-right">{item.satisfacao.toFixed(1)}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {subAbas.filter(a => a.id !== "visao-geral").map((aba) => (
            <TabsContent key={aba.id} value={aba.id} className="mt-4">
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardContent className="p-12 text-center">
                  <div className="h-12 w-12 mx-auto mb-4 rounded-full bg-dashboard-accent/20 flex items-center justify-center">
                    <TrendingUp className="h-6 w-6 text-dashboard-accent" />
                  </div>
                  <h3 className="text-lg font-medium text-foreground mb-2">{aba.nome}</h3>
                  <p className="text-muted-foreground">Análise detalhada de {aba.nome.toLowerCase()} em desenvolvimento.</p>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      </div>
    </div>
  );
};

export default Analitico;
