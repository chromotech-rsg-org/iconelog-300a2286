import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Search, AlertTriangle } from "lucide-react";

interface CityRegionalMapping {
  cidade: string;
  regional: string;
  uf: string;
}

interface FollowupItem {
  [key: string]: any;
}

const normalize = (str: string): string =>
  str.trim().normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

interface AnaliticoCityViewProps {
  followupData: FollowupItem[];
  cityMappings: CityRegionalMapping[];
  selectedMonths: number[];
  selectedYears: number[];
}

export const AnaliticoCityView = ({
  followupData,
  cityMappings,
  selectedMonths,
  selectedYears,
}: AnaliticoCityViewProps) => {
  const [search, setSearch] = useState("");

  // Extract unique cities from API data that are NOT in city_regional_mapping
  // Detailed unmatched records (each row = one followup record)
  const unmatchedRecords = useMemo(() => {
    const normalizedMappings = new Set(
      cityMappings.map((m) => normalize(m.cidade))
    );

    const records: { pedido: string; campanha: string; cidade: string; uf: string }[] = [];

    followupData.forEach((item) => {
      const tipoServico = (item.ds_tipo_servico || "").toLowerCase();
      if (tipoServico.includes("reentrega")) return;

      const campanha = (item.nm_campanha || item.ds_campanha || item.campanha || "").toUpperCase();
      const isEntrega = campanha.includes("KIT RESTAURANTE") || campanha.includes("POSITIVACAO KIT") || campanha.includes("POSITIVACAO_KIT");
      const isReposicao = campanha.includes("REPOSICAO_KIT") || campanha.includes("REPOSICAO KIT") || campanha.includes("REPOSITIVACAO");
      if (!isEntrega && !isReposicao) return;

      const cidade = (item.ds_cidade_DES || item.ds_cidade || item.cidade || "").trim();
      const uf = (item.ds_uf_DES || item.ds_uf || item.uf || "").trim().toUpperCase();

      if (!cidade) return;

      if (!normalizedMappings.has(normalize(cidade))) {
        records.push({
          pedido: item.nr_minuta || item.nr_pedido || item.pedido || "",
          campanha,
          cidade,
          uf,
        });
      }
    });

    return records;
  }, [followupData, cityMappings]);

  // Aggregated unique cities for KPIs and charts
  const unmatchedCities = useMemo(() => {
    const cityMap = new Map<string, { cidade: string; uf: string; count: number }>();
    unmatchedRecords.forEach((r) => {
      const key = `${normalize(r.cidade)}|${r.uf}`;
      const existing = cityMap.get(key);
      if (existing) {
        existing.count++;
      } else {
        cityMap.set(key, { cidade: r.cidade, uf: r.uf, count: 1 });
      }
    });
    return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
  }, [unmatchedRecords]);

  // Group by UF
  const byUF = useMemo(() => {
    const map: Record<string, number> = {};
    unmatchedCities.forEach((c) => {
      const uf = c.uf || "N/I";
      map[uf] = (map[uf] || 0) + c.count;
    });
    return Object.entries(map)
      .map(([uf, count]) => ({ uf, count }))
      .sort((a, b) => b.count - a.count);
  }, [unmatchedCities]);

  // Top cities by occurrence count
  const topCities = useMemo(() => {
    return unmatchedCities.slice(0, 20).map((c) => ({
      cidade: c.cidade,
      count: c.count,
    }));
  }, [unmatchedCities]);

  // Filtered table (now filtering records, not aggregated cities)
  const filteredRecords = useMemo(() => {
    if (!search) return unmatchedRecords;
    const s = search.toLowerCase();
    return unmatchedRecords.filter(
      (r) =>
        r.cidade.toLowerCase().includes(s) ||
        r.uf.toLowerCase().includes(s) ||
        r.pedido.toLowerCase().includes(s) ||
        r.campanha.toLowerCase().includes(s)
    );
  }, [unmatchedRecords, search]);

  const totalOccurrences = unmatchedRecords.length;

  return (
    <div className="space-y-4">
      {/* KPI summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-amber-500" />
              <div>
                <p className="text-xs text-muted-foreground">Cidades não encontradas</p>
                <p className="text-2xl font-bold text-foreground">{unmatchedCities.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <div>
              <p className="text-xs text-muted-foreground">UFs envolvidas</p>
              <p className="text-2xl font-bold text-foreground">{byUF.length}</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-card border-border">
          <CardContent className="pt-4 pb-3 px-4">
            <div>
              <p className="text-xs text-muted-foreground">Ocorrências sem regional</p>
              <p className="text-2xl font-bold text-foreground">{totalOccurrences.toLocaleString("pt-BR")}</p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <CardTitle className="text-sm font-bold text-primary uppercase">
                Regionais não encontradas
              </CardTitle>
            </div>
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar pedido, campanha, cidade..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9 bg-background border-border text-foreground w-72"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-primary/10">
                  <TableHead className="text-foreground font-semibold">Pedido</TableHead>
                  <TableHead className="text-foreground font-semibold">Campanha</TableHead>
                  <TableHead className="text-foreground font-semibold">Cidade Destino</TableHead>
                  <TableHead className="text-foreground font-semibold">UF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredRecords.map((record, idx) => (
                  <TableRow key={`${record.pedido}-${idx}`} className="border-border">
                    <TableCell className="text-muted-foreground">{record.pedido}</TableCell>
                    <TableCell className="text-muted-foreground">{record.campanha}</TableCell>
                    <TableCell className="text-foreground font-medium">{record.cidade}</TableCell>
                    <TableCell className="text-muted-foreground">{record.uf || "N/I"}</TableCell>
                  </TableRow>
                ))}
                {filteredRecords.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {unmatchedRecords.length === 0
                        ? "Todas as cidades da API estão mapeadas! ✅"
                        : "Nenhum registro encontrado"}
                    </TableCell>
                  </TableRow>
                )}
                {filteredRecords.length > 0 && (
                  <TableRow className="border-border bg-muted/30">
                    <TableCell colSpan={3} className="text-foreground font-bold">Total</TableCell>
                    <TableCell className="text-foreground font-bold">{filteredRecords.length}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
};
