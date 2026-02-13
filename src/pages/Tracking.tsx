import { useState, useMemo, useCallback } from "react";
 import { DocumentHead } from "@/components/shared/DocumentHead";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
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
  TrackingOrder,
} from "@/data/trackingData";
import { formatNumber, formatCurrency, allMonthValues } from "@/data/mockData";
import { toast } from "sonner";
import * as XLSX from "xlsx";
import { saveAs } from "file-saver";
import { Package, Clock, CheckCircle, AlertTriangle, TrendingUp, Percent, X } from "lucide-react";

const COLORS = ['hsl(45, 100%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)'];

const Tracking = () => {
  const currentMonth = new Date().getMonth() + 1;
  const currentYear = new Date().getFullYear();

  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("bside");
  const [orders] = useState(() => generateTrackingOrders(200));

  // Global filters
  const [selectedMonths, setSelectedMonths] = useState<number[]>(allMonthValues);
  const [selectedYears, setSelectedYears] = useState<number[]>([currentYear]);
  const [selectedGlobalRegions, setSelectedGlobalRegions] = useState<string[]>([]);

  // Filter states for BI interactivity
  const [selectedTipoServico, setSelectedTipoServico] = useState<string | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<string | null>(null);
  const [selectedCidade, setSelectedCidade] = useState<string | null>(null);
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [selectedPrazo, setSelectedPrazo] = useState<boolean | null>(null);

  // Filtered orders
  const filteredOrders = useMemo(() => {
    let result = orders;
    if (selectedTipoServico) result = result.filter(o => o.tipoServico === selectedTipoServico);
    if (selectedModalidade) result = result.filter(o => o.modalidade === selectedModalidade);
    if (selectedCidade) result = result.filter(o => o.cidade === selectedCidade);
    if (selectedRegional) result = result.filter(o => o.regional === selectedRegional);
    if (selectedPrazo !== null) result = result.filter(o => o.noPrazo === selectedPrazo);
    return result;
  }, [orders, selectedTipoServico, selectedModalidade, selectedCidade, selectedRegional, selectedPrazo]);

  const totals = useMemo(() => calculateTrackingTotals(filteredOrders), [filteredOrders]);
  const tipoServicoData = useMemo(() => getOrdersByTipoServico(filteredOrders), [filteredOrders]);
  const modalidadeData = useMemo(() => getOrdersByModalidade(filteredOrders), [filteredOrders]);
  const cidadeData = useMemo(() => getOrdersByCidade(filteredOrders), [filteredOrders]);
  const regionalData = useMemo(() => getOrdersByRegional(filteredOrders), [filteredOrders]);

  const handleRefreshData = () => {
    setLastUpdate(new Date());
    toast.success("Dados atualizados com sucesso!");
  };

  const handleExportExcel = () => {
    const exportData = filteredOrders.map(order => ({
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

  // BI Click handlers
  const handleTipoServicoClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const tipo = data.activePayload[0].payload.name;
      setSelectedTipoServico(prev => prev === tipo ? null : tipo);
    }
  }, []);

  const handleModalidadeClick = useCallback((data: any) => {
    if (data && data.name) {
      setSelectedModalidade(prev => prev === data.name ? null : data.name);
    }
  }, []);

  const handleCidadeClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const cidade = data.activePayload[0].payload.name;
      setSelectedCidade(prev => prev === cidade ? null : cidade);
    }
  }, []);

  const handleRegionalClick = useCallback((data: any) => {
    if (data && data.name) {
      setSelectedRegional(prev => prev === data.name ? null : data.name);
    }
  }, []);

  const handlePrazoClick = useCallback((prazo: boolean) => {
    setSelectedPrazo(prev => prev === prazo ? null : prazo);
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedTipoServico(null);
    setSelectedModalidade(null);
    setSelectedCidade(null);
    setSelectedRegional(null);
    setSelectedPrazo(null);
  }, []);

  const clearGlobalFilters = useCallback(() => {
    setSelectedMonths(allMonthValues);
    setSelectedYears([currentYear]);
    setSelectedGlobalRegions([]);
    clearAllFilters();
  }, []);

  const hasActiveFilters = !!(selectedTipoServico || selectedModalidade || selectedCidade || selectedRegional || selectedPrazo !== null);
  const hasGlobalFilters = selectedMonths.length !== 1 || selectedMonths[0] !== currentMonth || selectedYears.length !== 1 || selectedYears[0] !== currentYear || selectedGlobalRegions.length > 0;

  const kpis = [
    { title: "Quantidade de Pedidos", value: formatNumber(totals.quantidadePedidos), icon: Package, color: "text-dashboard-accent" },
    { title: "Qtde no Prazo", value: formatNumber(totals.qtdeNoPrazo), icon: CheckCircle, color: "text-green-500", onClick: () => handlePrazoClick(true) },
    { title: "% no Prazo", value: `${totals.percentualNoPrazo.toFixed(1)}%`, icon: TrendingUp, color: "text-green-500" },
    { title: "Qtde Fora do Prazo", value: formatNumber(totals.qtdeFora), icon: AlertTriangle, color: "text-red-500", onClick: () => handlePrazoClick(false) },
    { title: "% Fora do Prazo", value: `${totals.percentualFora.toFixed(1)}%`, icon: Percent, color: "text-red-500" },
    { title: "Finalizados", value: formatNumber(totals.statusFinalizado), icon: CheckCircle, color: "text-dashboard-blue" },
  ];

  return (
    <div className="min-h-screen bg-dashboard-dark">
       <DocumentHead pageId="tracking" />
      <SharedHeader
        pageId="tracking"
        lastUpdate={lastUpdate}
        showFilters={true}
        selectedMonths={selectedMonths}
        selectedYears={selectedYears}
        selectedRegions={selectedGlobalRegions}
        onMonthsChange={setSelectedMonths}
        onYearsChange={setSelectedYears}
        onRegionsChange={setSelectedGlobalRegions}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
        onClearAllFilters={clearGlobalFilters}
        hasActiveFilters={hasGlobalFilters || hasActiveFilters}
      />

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedTipoServico && (
            <Badge variant="outline" className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer" onClick={() => setSelectedTipoServico(null)}>
              Tipo: {selectedTipoServico} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedModalidade && (
            <Badge variant="outline" className="border-dashboard-blue bg-dashboard-blue/10 text-dashboard-blue cursor-pointer" onClick={() => setSelectedModalidade(null)}>
              Modalidade: {selectedModalidade} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedCidade && (
            <Badge variant="outline" className="border-dashboard-orange bg-dashboard-orange/10 text-dashboard-orange cursor-pointer" onClick={() => setSelectedCidade(null)}>
              Cidade: {selectedCidade} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedRegional && (
            <Badge variant="outline" className="border-purple-500 bg-purple-500/10 text-purple-500 cursor-pointer" onClick={() => setSelectedRegional(null)}>
              Regional: {selectedRegional} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedPrazo !== null && (
            <Badge variant="outline" className={`cursor-pointer ${selectedPrazo ? 'border-green-500 bg-green-500/10 text-green-500' : 'border-red-500 bg-red-500/10 text-red-500'}`} onClick={() => setSelectedPrazo(null)}>
              {selectedPrazo ? 'No Prazo' : 'Fora do Prazo'} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          <Button variant="ghost" size="sm" onClick={clearAllFilters} className="ml-2 h-6 text-xs text-muted-foreground hover:text-foreground">
            Limpar todos
          </Button>
        </div>
      )}

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
            {/* KPI Cards - clickable */}
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {kpis.map((kpi) => (
                <Card 
                  key={kpi.title} 
                  className={`bg-dashboard-card border-dashboard-border ${kpi.onClick ? 'cursor-pointer hover:border-dashboard-accent transition-colors' : ''}`}
                  onClick={kpi.onClick}
                >
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
              {/* Performance Donut - clickable */}
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedPrazo !== null ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Performance (clique para filtrar)</CardTitle>
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
                        onClick={(data) => {
                          if (data && data.name) {
                            handlePrazoClick(data.name === "No Prazo");
                          }
                        }}
                      >
                        <Cell fill="hsl(142, 76%, 36%)" opacity={selectedPrazo === false ? 0.3 : 1} />
                        <Cell fill="hsl(0, 84%, 60%)" opacity={selectedPrazo === true ? 0.3 : 1} />
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Tipo de Serviço */}
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedTipoServico ? 'ring-2 ring-dashboard-accent' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Por Tipo de Serviço</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tipoServicoData} layout="vertical" onClick={handleTipoServicoClick}>
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
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedModalidade ? 'ring-2 ring-dashboard-blue' : ''}`}>
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
                        onClick={handleModalidadeClick}
                      >
                        {modalidadeData.map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            opacity={selectedModalidade && selectedModalidade !== entry.name ? 0.3 : 1}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Cidade */}
              <Card className={`bg-dashboard-card border-dashboard-border col-span-1 md:col-span-2 cursor-pointer transition-all ${selectedCidade ? 'ring-2 ring-dashboard-orange' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Top 10 Cidades</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={cidadeData} layout="vertical" onClick={handleCidadeClick}>
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
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedRegional ? 'ring-2 ring-purple-500' : ''}`}>
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
                        onClick={handleRegionalClick}
                      >
                        {regionalData.slice(0, 5).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            opacity={selectedRegional && selectedRegional !== entry.name ? 0.3 : 1}
                          />
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
                  Pedidos Consolidados {hasActiveFilters && <span className="text-sm font-normal text-muted-foreground">({filteredOrders.length} resultados)</span>}
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
                    {filteredOrders.slice(0, 20).map((order) => (
                      <TableRow key={order.id} className="border-dashboard-border hover:bg-dashboard-border/50">
                        <TableCell className="text-dashboard-accent font-medium">{order.pedido}</TableCell>
                        <TableCell className="text-foreground">{order.cliente}</TableCell>
                        <TableCell className="text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setSelectedRegional(order.regional)}>{order.regional}</TableCell>
                        <TableCell className="text-muted-foreground cursor-pointer hover:text-foreground" onClick={() => setSelectedCidade(order.cidade)}>{order.cidade}</TableCell>
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
                          <Badge 
                            className={`cursor-pointer ${order.noPrazo 
                              ? "bg-green-500/20 text-green-400 border-green-500/30"
                              : "bg-red-500/20 text-red-400 border-red-500/30"
                            }`}
                            onClick={() => handlePrazoClick(order.noPrazo)}
                          >
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
