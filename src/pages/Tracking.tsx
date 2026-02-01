import { useState, useMemo } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";
import {
  generateTrackingOrders,
  calculateTrackingTotals,
  getOrdersByTipoServico,
  getOrdersByModalidade,
  getOrdersByCidade,
  getOrdersByRegional,
} from "@/data/trackingData";
import { formatNumber, formatCurrency } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Package, Clock, CheckCircle, AlertTriangle, TrendingUp, Percent } from "lucide-react";

const COLORS = ['hsl(45, 100%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)'];

const Tracking = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("bside");
  const [orders] = useState(() => generateTrackingOrders(200));

  const totals = useMemo(() => calculateTrackingTotals(orders), [orders]);
  const tipoServicoData = useMemo(() => getOrdersByTipoServico(orders), [orders]);
  const modalidadeData = useMemo(() => getOrdersByModalidade(orders), [orders]);
  const cidadeData = useMemo(() => getOrdersByCidade(orders), [orders]);
  const regionalData = useMemo(() => getOrdersByRegional(orders), [orders]);

  const handleRefreshData = () => {
    setLastUpdate(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const exportData = orders.map(order => ({
      Pedido: order.pedido,
      Cliente: order.cliente,
      Regional: order.regional,
      Cidade: order.cidade,
      Estado: order.estado,
      "Tipo Serviço": order.tipoServico,
      Modalidade: order.modalidade,
      Status: order.status,
      "No Prazo": order.noPrazo ? "Sim" : "Não",
      "Data Pedido": order.dataPedido.toLocaleDateString('pt-BR'),
      Valor: order.valor,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Tracking");
    
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `tracking_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  const kpis = [
    { title: "Quantidade de Pedidos", value: formatNumber(totals.quantidadePedidos), icon: Package, color: "text-dashboard-accent" },
    { title: "Qtde no Prazo", value: formatNumber(totals.qtdeNoPrazo), icon: CheckCircle, color: "text-green-500" },
    { title: "% no Prazo", value: `${totals.percentualNoPrazo.toFixed(1)}%`, icon: TrendingUp, color: "text-green-500" },
    { title: "Qtde Fora do Prazo", value: formatNumber(totals.qtdeFora), icon: AlertTriangle, color: "text-red-500" },
    { title: "% Fora do Prazo", value: `${totals.percentualFora.toFixed(1)}%`, icon: Percent, color: "text-red-500" },
    { title: "Finalizados", value: formatNumber(totals.statusFinalizado), icon: CheckCircle, color: "text-dashboard-blue" },
  ];

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader
        pageTitle="Tracking Consolidado"
        pageId="tracking"
        lastUpdate={lastUpdate}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
      />

      <div className="p-6 space-y-4">
        {/* Tabs B-SIDE / D-SIDE */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-dashboard-card border border-dashboard-border">
            <TabsTrigger value="bside" className="data-[state=active]:bg-dashboard-accent data-[state=active]:text-dashboard-dark">
              B-SIDE
            </TabsTrigger>
            <TabsTrigger value="dside" className="data-[state=active]:bg-dashboard-accent data-[state=active]:text-dashboard-dark">
              D-SIDE
            </TabsTrigger>
          </TabsList>

          <TabsContent value="bside" className="space-y-4 mt-4">
            {/* KPI Cards */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpis.map((kpi) => (
                <Card key={kpi.title} className="bg-dashboard-card border-dashboard-border">
                  <CardContent className="p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <kpi.icon className={`h-4 w-4 ${kpi.color}`} />
                      <span className="text-xs text-muted-foreground">{kpi.title}</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{kpi.value}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Charts Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {/* Performance Donut */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Performance</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={[
                          { name: "No Prazo", value: totals.qtdeNoPrazo },
                          { name: "Fora do Prazo", value: totals.qtdeFora },
                        ]}
                        cx="50%"
                        cy="50%"
                        innerRadius={50}
                        outerRadius={70}
                        dataKey="value"
                      >
                        <Cell fill="hsl(142, 76%, 36%)" />
                        <Cell fill="hsl(0, 84%, 60%)" />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tipo de Serviço */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Por Tipo de Serviço</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tipoServicoData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={10} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} />
                      <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Modalidade */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Por Modalidade</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={modalidadeData}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                        label={({ name }) => name}
                      >
                        {modalidadeData.map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Cidade */}
              <Card className="bg-dashboard-card border-dashboard-border col-span-1 md:col-span-2">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Top 10 Cidades</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cidadeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} />
                      <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={10} width={100} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} />
                      <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Regional */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Por Regional</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionalData.slice(0, 5)}
                        cx="50%"
                        cy="50%"
                        outerRadius={70}
                        dataKey="value"
                      >
                        {regionalData.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Orders Table */}
            <Card className="bg-dashboard-card border-dashboard-border">
              <CardHeader>
                <CardTitle className="text-base font-semibold text-foreground">
                  Pedidos Consolidados
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-auto max-h-[400px] custom-scrollbar">
                <Table>
                  <TableHeader>
                    <TableRow className="border-dashboard-border">
                      <TableHead className="text-muted-foreground">Pedido</TableHead>
                      <TableHead className="text-muted-foreground">Cliente</TableHead>
                      <TableHead className="text-muted-foreground">Regional</TableHead>
                      <TableHead className="text-muted-foreground">Cidade</TableHead>
                      <TableHead className="text-muted-foreground">Status</TableHead>
                      <TableHead className="text-muted-foreground">Prazo</TableHead>
                      <TableHead className="text-muted-foreground text-right">Valor</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {orders.slice(0, 20).map((order) => (
                      <TableRow key={order.id} className="border-dashboard-border hover:bg-dashboard-border/50">
                        <TableCell className="text-dashboard-accent font-medium">{order.pedido}</TableCell>
                        <TableCell className="text-foreground">{order.cliente}</TableCell>
                        <TableCell className="text-muted-foreground">{order.regional}</TableCell>
                        <TableCell className="text-muted-foreground">{order.cidade}</TableCell>
                        <TableCell>
                          <Badge className={
                            order.status === "Finalizado" 
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : order.status === "Em Trânsito"
                                ? "bg-blue-500/20 text-blue-400 border-blue-500/30"
                                : "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
                          }>
                            {order.status}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge className={order.noPrazo 
                            ? "bg-green-500/20 text-green-400 border-green-500/30"
                            : "bg-red-500/20 text-red-400 border-red-500/30"
                          }>
                            {order.noPrazo ? "No Prazo" : "Atrasado"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-foreground text-right">{formatCurrency(order.valor)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="dside" className="mt-4">
            <Card className="bg-dashboard-card border-dashboard-border">
              <CardContent className="p-12 text-center">
                <Clock className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                <h3 className="text-lg font-medium text-foreground mb-2">D-SIDE em Desenvolvimento</h3>
                <p className="text-muted-foreground">Esta funcionalidade estará disponível em breve.</p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Tracking;
