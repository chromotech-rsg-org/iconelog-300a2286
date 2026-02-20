import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ScrollArea } from "@/components/ui/scroll-area";

interface DeliveryData {
  id: string;
  regional: string;
  entregaFinalizado: number;
  entregaEmTransito: number;
  entregaTotal: number;
  reposicaoFinalizado: number;
  reposicaoEmTransito: number;
  reposicaoTotal: number;
}
import { formatNumber } from "@/data/mockData";

interface EntregasTablesProps {
  data: DeliveryData[];
  onRegionalClick?: (regional: string) => void;
  selectedRegional?: string | null;
}

// UF mapping for regionals
const getUF = (regional: string): string => {
  const ufMap: Record<string, string> = {
    "São Paulo": "SP",
    "Piracicaba": "SP",
    "Campinas": "SP",
    "Rio de Janeiro": "RJ",
    "Niterói": "RJ",
    "Belo Horizonte": "MG",
    "Curitiba": "PR",
    "Porto Alegre": "RS",
    "Salvador": "BA",
    "Fortaleza": "CE",
    "Recife": "PE",
    "Brasília": "DF",
    "Goiânia": "GO",
    "Manaus": "AM",
    "Belém": "PA",
    "Maceió": "AL",
    "Sorocaba": "SP",
    "São José dos Campos": "SP",
    "Botucatu": "SP",
    "Poços de Caldas": "MG",
    "Macapá": "AP",
  };
  return ufMap[regional] || "BR";
};

export const EntregasTables = ({ data, onRegionalClick, selectedRegional }: EntregasTablesProps) => {
  // Sort data by total descending
  const entregaData = [...data].sort((a, b) => b.entregaTotal - a.entregaTotal);
  const reposicaoData = [...data].sort((a, b) => b.reposicaoTotal - a.reposicaoTotal);
  
  // Calculate totals
  const entregaTotals = data.reduce((acc, item) => ({
    finalizado: acc.finalizado + item.entregaFinalizado,
    emTransito: acc.emTransito + item.entregaEmTransito,
    total: acc.total + item.entregaTotal,
  }), { finalizado: 0, emTransito: 0, total: 0 });
  
  const reposicaoTotals = data.reduce((acc, item) => ({
    finalizado: acc.finalizado + item.reposicaoFinalizado,
    emTransito: acc.emTransito + item.reposicaoEmTransito,
    total: acc.total + item.reposicaoTotal,
  }), { finalizado: 0, emTransito: 0, total: 0 });

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {/* ENTREGA Table */}
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="py-2 px-4 bg-dashboard-accent">
          <CardTitle className="text-sm font-bold text-dashboard-dark uppercase tracking-wide">
            ENTREGA
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader className="sticky top-0 bg-dashboard-accent z-10">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2">REGIONAL</TableHead>
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2">UF</TableHead>
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2 text-right">FINALIZADO</TableHead>
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2 text-right">EM TRÂNSITO</TableHead>
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2 text-right">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {entregaData.map((item) => {
                  const isSelected = selectedRegional === item.regional;
                  return (
                    <TableRow 
                      key={item.id} 
                      className={`border-dashboard-border cursor-pointer hover:bg-dashboard-border/50 ${isSelected ? 'bg-dashboard-accent/10' : ''}`}
                      onClick={() => onRegionalClick?.(item.regional)}
                    >
                      <TableCell className={`text-sm py-2 ${isSelected ? 'text-dashboard-accent font-medium' : 'text-foreground'}`}>
                        {item.regional}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-muted-foreground">
                        {getUF(item.regional)}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right text-foreground">
                        {formatNumber(item.entregaFinalizado)}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right text-foreground">
                        {formatNumber(item.entregaEmTransito)}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right font-medium text-foreground">
                        {formatNumber(item.entregaTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          {/* Total Row */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-dashboard-border bg-dashboard-card">
            <span className="text-sm font-bold text-foreground">Total</span>
            <div className="flex gap-8 text-sm">
              <span className="font-bold text-foreground">{formatNumber(entregaTotals.finalizado)}</span>
              <span className="font-bold text-foreground">{formatNumber(entregaTotals.emTransito)}</span>
              <span className="font-bold text-dashboard-accent">{formatNumber(entregaTotals.total)}</span>
            </div>
          </div>
          {/* Progress bar at bottom */}
          <div className="h-2 bg-dashboard-border">
            <div 
              className="h-full bg-dashboard-accent transition-all"
              style={{ width: `${entregaTotals.total > 0 ? (entregaTotals.finalizado / entregaTotals.total) * 100 : 0}%` }}
            />
          </div>
        </CardContent>
      </Card>

      {/* REPOSIÇÃO Table */}
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="py-2 px-4 bg-dashboard-accent">
          <CardTitle className="text-sm font-bold text-dashboard-dark uppercase tracking-wide">
            REPOSIÇÃO
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <ScrollArea className="h-[350px]">
            <Table>
              <TableHeader className="sticky top-0 bg-dashboard-accent z-10">
                <TableRow className="border-none hover:bg-transparent">
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2">REGIONAL</TableHead>
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2">UF</TableHead>
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2 text-right">FINALIZADO</TableHead>
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2 text-right">EM TRÂNSITO</TableHead>
                  <TableHead className="text-dashboard-dark font-bold text-sm py-2 text-right">TOTAL</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {reposicaoData.map((item) => {
                  const isSelected = selectedRegional === item.regional;
                  return (
                    <TableRow 
                      key={item.id} 
                      className={`border-dashboard-border cursor-pointer hover:bg-dashboard-border/50 ${isSelected ? 'bg-dashboard-accent/10' : ''}`}
                      onClick={() => onRegionalClick?.(item.regional)}
                    >
                      <TableCell className={`text-sm py-2 ${isSelected ? 'text-dashboard-accent font-medium' : 'text-foreground'}`}>
                        {item.regional}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-muted-foreground">
                        {getUF(item.regional)}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right text-foreground">
                        {formatNumber(item.reposicaoFinalizado)}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right text-foreground">
                        {formatNumber(item.reposicaoEmTransito)}
                      </TableCell>
                      <TableCell className="text-sm py-2 text-right font-medium text-foreground">
                        {formatNumber(item.reposicaoTotal)}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </ScrollArea>
          {/* Total Row */}
          <div className="flex items-center justify-between px-4 py-2 border-t border-dashboard-border bg-dashboard-card">
            <span className="text-sm font-bold text-foreground">Total</span>
            <div className="flex gap-8 text-sm">
              <span className="font-bold text-foreground">{formatNumber(reposicaoTotals.finalizado)}</span>
              <span className="font-bold text-foreground">{formatNumber(reposicaoTotals.emTransito)}</span>
              <span className="font-bold text-dashboard-accent">{formatNumber(reposicaoTotals.total)}</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};