import { useState, useMemo } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
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
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";
import {
  generateFaturamentoMensal,
  generateFaturamentoByTipoServico,
  generateFaturamentoByModalidade,
  generateFaturamentoByCampanha,
  generateFaturamentoByRegional,
  calculateFaturamentoTotals,
} from "@/data/faturamentoData";
import { formatCurrency } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { DollarSign, Warehouse, Truck, Percent, Clock } from "lucide-react";

const COLORS = ['hsl(45, 100%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)', 'hsl(340, 82%, 52%)', 'hsl(180, 70%, 45%)'];

const Faturamento = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("bside");

  const faturamentoMensal = useMemo(() => generateFaturamentoMensal(2025), []);
  const tipoServicoData = useMemo(() => generateFaturamentoByTipoServico(), []);
  const modalidadeData = useMemo(() => generateFaturamentoByModalidade(), []);
  const campanhaData = useMemo(() => generateFaturamentoByCampanha(), []);
  const regionalData = useMemo(() => generateFaturamentoByRegional(), []);
  const totals = useMemo(() => calculateFaturamentoTotals(faturamentoMensal), [faturamentoMensal]);

  const handleRefreshData = () => {
    setLastUpdate(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const exportData = faturamentoMensal.map(item => ({
      Mês: item.mes,
      Ano: item.ano,
      Faturamento: item.faturamento,
      Armazenagem: item.armazenagem,
      Transporte: item.transporte,
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Faturamento");
    
    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" });
    saveAs(blob, `faturamento_${new Date().toISOString().split('T')[0]}.xlsx`);
    
    toast.success("Arquivo Excel exportado com sucesso!");
  };

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader
        pageTitle="Faturamento"
        pageId="faturamento"
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
            {/* Main KPI Card */}
            <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
              <Card className="bg-dashboard-card border-dashboard-border md:col-span-1">
                <CardContent className="p-6 text-center">
                  <DollarSign className="h-8 w-8 mx-auto mb-2 text-dashboard-accent" />
                  <p className="text-sm text-muted-foreground mb-1">Faturamento</p>
                  <p className="text-2xl font-bold text-dashboard-accent">{formatCurrency(totals.faturamento)}</p>
                </CardContent>
              </Card>

              <Card className="bg-dashboard-card border-dashboard-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Warehouse className="h-4 w-4 text-dashboard-blue" />
                    <span className="text-xs text-muted-foreground">R$ Armazenagem</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totals.armazenagem)}</p>
                </CardContent>
              </Card>

              <Card className="bg-dashboard-card border-dashboard-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-dashboard-blue" />
                    <span className="text-xs text-muted-foreground">% Armazenagem</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{totals.percentArmazenagem.toFixed(1)}%</p>
                </CardContent>
              </Card>

              <Card className="bg-dashboard-card border-dashboard-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Truck className="h-4 w-4 text-dashboard-orange" />
                    <span className="text-xs text-muted-foreground">R$ Transporte</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{formatCurrency(totals.transporte)}</p>
                </CardContent>
              </Card>

              <Card className="bg-dashboard-card border-dashboard-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-2">
                    <Percent className="h-4 w-4 text-dashboard-orange" />
                    <span className="text-xs text-muted-foreground">% Transporte</span>
                  </div>
                  <p className="text-xl font-bold text-foreground">{totals.percentTransporte.toFixed(1)}%</p>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 1 */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Faturamento Mensal */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento Mensal</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={faturamentoMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis dataKey="mes" stroke="hsl(0, 0%, 60%)" fontSize={11} />
                      <YAxis stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                      <Line type="monotone" dataKey="faturamento" stroke="hsl(45, 100%, 50%)" strokeWidth={2} dot={{ fill: 'hsl(45, 100%, 50%)' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Transporte e Armazenagem Mensal */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Transporte vs Armazenagem</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={faturamentoMensal}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis dataKey="mes" stroke="hsl(0, 0%, 60%)" fontSize={11} />
                      <YAxis stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                      <Legend />
                      <Bar dataKey="transporte" name="Transporte" fill="hsl(25, 95%, 53%)" radius={[4, 4, 0, 0]} />
                      <Bar dataKey="armazenagem" name="Armazenagem" fill="hsl(217, 91%, 60%)" radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>

            {/* Charts Row 2 */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Por Regional */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento | Região</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={regionalData.slice(0, 5).map(r => ({ name: r.regional, value: r.valor }))}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={70}
                        dataKey="value"
                      >
                        {regionalData.slice(0, 5).map((_, index) => (
                          <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Modalidade */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento | Modalidade</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modalidadeData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={10} width={70} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Tipo de Serviço */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento | Tipo de Serviço</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tipoServicoData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={80} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Campanha */}
              <Card className="bg-dashboard-card border-dashboard-border">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento | Campanha</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campanhaData} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={70} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                      <Bar dataKey="value" fill="hsl(25, 95%, 53%)" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            </div>
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

export default Faturamento;
