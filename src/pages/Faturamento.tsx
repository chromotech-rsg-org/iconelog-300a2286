import { useState, useMemo, useCallback } from "react";
import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
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
import { DollarSign, Warehouse, Truck, Percent, Clock, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const COLORS = ['hsl(45, 100%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)', 'hsl(280, 65%, 60%)', 'hsl(340, 82%, 52%)', 'hsl(180, 70%, 45%)'];

const Faturamento = () => {
  const [lastUpdate, setLastUpdate] = useState(new Date());
  const [activeTab, setActiveTab] = useState("bside");
  
  // Filter states for BI interactivity
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [selectedRegional, setSelectedRegional] = useState<string | null>(null);
  const [selectedModalidade, setSelectedModalidade] = useState<string | null>(null);
  const [selectedTipoServico, setSelectedTipoServico] = useState<string | null>(null);
  const [selectedCampanha, setSelectedCampanha] = useState<string | null>(null);

  const faturamentoMensal = useMemo(() => generateFaturamentoMensal(2025), []);
  const tipoServicoData = useMemo(() => generateFaturamentoByTipoServico(), []);
  const modalidadeData = useMemo(() => generateFaturamentoByModalidade(), []);
  const campanhaData = useMemo(() => generateFaturamentoByCampanha(), []);
  const regionalData = useMemo(() => generateFaturamentoByRegional(), []);
  
  // Filtered data based on selections
  const filteredFaturamentoMensal = useMemo(() => {
    if (!selectedMonth) return faturamentoMensal;
    return faturamentoMensal.filter(d => d.mes === selectedMonth);
  }, [faturamentoMensal, selectedMonth]);

  const totals = useMemo(() => calculateFaturamentoTotals(filteredFaturamentoMensal), [filteredFaturamentoMensal]);

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

  // Click handlers for BI interactivity
  const handleMonthClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const month = data.activePayload[0].payload.mes;
      setSelectedMonth(prev => prev === month ? null : month);
    }
  }, []);

  const handleRegionalClick = useCallback((data: any) => {
    if (data && data.name) {
      setSelectedRegional(prev => prev === data.name ? null : data.name);
    }
  }, []);

  const handleModalidadeClick = useCallback((data: any) => {
    if (data && data.name) {
      setSelectedModalidade(prev => prev === data.name ? null : data.name);
    }
  }, []);

  const handleTipoServicoClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const tipo = data.activePayload[0].payload.name;
      setSelectedTipoServico(prev => prev === tipo ? null : tipo);
    }
  }, []);

  const handleCampanhaClick = useCallback((data: any) => {
    if (data && data.activePayload && data.activePayload[0]) {
      const campanha = data.activePayload[0].payload.name;
      setSelectedCampanha(prev => prev === campanha ? null : campanha);
    }
  }, []);

  const clearAllFilters = useCallback(() => {
    setSelectedMonth(null);
    setSelectedRegional(null);
    setSelectedModalidade(null);
    setSelectedTipoServico(null);
    setSelectedCampanha(null);
  }, []);

  const hasActiveFilters = selectedMonth || selectedRegional || selectedModalidade || selectedTipoServico || selectedCampanha;

  return (
    <div className="min-h-screen bg-dashboard-dark">
      <SharedHeader
        pageTitle="Faturamento"
        pageId="faturamento"
        lastUpdate={lastUpdate}
        onRefreshData={handleRefreshData}
        onExportExcel={handleExportExcel}
      />

      {/* Active Filters Bar */}
      {hasActiveFilters && (
        <div className="flex items-center gap-2 px-6 py-2 border-b border-dashboard-border bg-dashboard-card/50 animate-fade-in">
          <span className="text-xs text-muted-foreground">Filtros:</span>
          {selectedMonth && (
            <Badge variant="outline" className="border-dashboard-accent bg-dashboard-accent/10 text-dashboard-accent cursor-pointer" onClick={() => setSelectedMonth(null)}>
              Mês: {selectedMonth} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedRegional && (
            <Badge variant="outline" className="border-dashboard-blue bg-dashboard-blue/10 text-dashboard-blue cursor-pointer" onClick={() => setSelectedRegional(null)}>
              Regional: {selectedRegional} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedModalidade && (
            <Badge variant="outline" className="border-dashboard-orange bg-dashboard-orange/10 text-dashboard-orange cursor-pointer" onClick={() => setSelectedModalidade(null)}>
              Modalidade: {selectedModalidade} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedTipoServico && (
            <Badge variant="outline" className="border-green-500 bg-green-500/10 text-green-500 cursor-pointer" onClick={() => setSelectedTipoServico(null)}>
              Tipo: {selectedTipoServico} <X className="ml-1 h-3 w-3" />
            </Badge>
          )}
          {selectedCampanha && (
            <Badge variant="outline" className="border-purple-500 bg-purple-500/10 text-purple-500 cursor-pointer" onClick={() => setSelectedCampanha(null)}>
              Campanha: {selectedCampanha} <X className="ml-1 h-3 w-3" />
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
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedMonth ? 'ring-2 ring-dashboard-accent' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento Mensal (clique para filtrar)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={faturamentoMensal} onClick={handleMonthClick}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis dataKey="mes" stroke="hsl(0, 0%, 60%)" fontSize={11} />
                      <YAxis stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                      <Line 
                        type="monotone" 
                        dataKey="faturamento" 
                        stroke="hsl(45, 100%, 50%)" 
                        strokeWidth={2} 
                        dot={({ cx, cy, payload }) => (
                          <circle 
                            cx={cx} 
                            cy={cy} 
                            r={selectedMonth === payload.mes ? 8 : 4} 
                            fill={selectedMonth === payload.mes ? 'hsl(45, 100%, 60%)' : 'hsl(45, 100%, 50%)'} 
                            stroke={selectedMonth === payload.mes ? 'hsl(45, 100%, 70%)' : 'none'}
                            strokeWidth={2}
                          />
                        )}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Transporte e Armazenagem Mensal */}
              <Card className="bg-dashboard-card border-dashboard-border cursor-pointer">
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Transporte vs Armazenagem (clique para filtrar)</CardTitle>
                </CardHeader>
                <CardContent className="h-[250px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={faturamentoMensal} onClick={handleMonthClick}>
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
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedRegional ? 'ring-2 ring-dashboard-blue' : ''}`}>
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
                        onClick={handleRegionalClick}
                      >
                        {regionalData.slice(0, 5).map((entry, index) => (
                          <Cell 
                            key={`cell-${index}`} 
                            fill={COLORS[index % COLORS.length]} 
                            opacity={selectedRegional && selectedRegional !== entry.regional ? 0.3 : 1}
                            stroke={selectedRegional === entry.regional ? '#fff' : 'none'}
                            strokeWidth={2}
                          />
                        ))}
                      </Pie>
                      <Tooltip formatter={(value: number) => formatCurrency(value)} />
                    </PieChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Modalidade */}
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedModalidade ? 'ring-2 ring-dashboard-orange' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento | Modalidade</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={modalidadeData} layout="vertical" onClick={(data) => {
                      if (data && data.activePayload && data.activePayload[0]) {
                        const mod = data.activePayload[0].payload.name;
                        setSelectedModalidade(prev => prev === mod ? null : mod);
                      }
                    }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                      <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
                      <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={10} width={70} />
                      <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
                      <Bar 
                        dataKey="value" 
                        fill="hsl(217, 91%, 60%)" 
                        radius={[0, 4, 4, 0]}
                      />
                    </BarChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              {/* Por Tipo de Serviço */}
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedTipoServico ? 'ring-2 ring-green-500' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento | Tipo de Serviço</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={tipoServicoData} layout="vertical" onClick={handleTipoServicoClick}>
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
              <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedCampanha ? 'ring-2 ring-purple-500' : ''}`}>
                <CardHeader className="pb-2">
                  <CardTitle className="text-sm font-medium text-foreground">Faturamento | Campanha</CardTitle>
                </CardHeader>
                <CardContent className="h-[200px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={campanhaData} layout="vertical" onClick={handleCampanhaClick}>
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
