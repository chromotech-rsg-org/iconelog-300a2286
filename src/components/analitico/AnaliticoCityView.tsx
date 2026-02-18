import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  const unmatchedCities = useMemo(() => {
    const normalizedMappings = new Set(
      cityMappings.map((m) => normalize(m.cidade))
    );

    // Collect unique city+UF combinations from followup data
    const cityMap = new Map<string, { cidade: string; uf: string; count: number }>();

    followupData.forEach((item) => {
      // Apply same campaign/service filters as B-Side Entregas
      const tipoServico = (item.ds_tipo_servico || "").toLowerCase();
      if (tipoServico.includes("reentrega")) return;

      const campanha = (item.nm_campanha || item.ds_campanha || item.campanha || "").toUpperCase();
      const isEntrega = campanha.includes("KIT RESTAURANTE") || campanha.includes("POSITIVACAO KIT") || campanha.includes("POSITIVACAO_KIT");
      const isReposicao = campanha.includes("REPOSICAO_KIT") || campanha.includes("REPOSICAO KIT") || campanha.includes("REPOSITIVACAO");
      if (!isEntrega && !isReposicao) return;

      const cidade = (item.ds_cidade_DES || item.ds_cidade || item.cidade || "").trim();
      const uf = (item.ds_uf_DES || item.ds_uf || item.uf || "").trim().toUpperCase();

      if (!cidade) return;

      const normalizedCidade = normalize(cidade);

      // Only include cities NOT found in mapping
      if (!normalizedMappings.has(normalizedCidade)) {
        const key = `${normalizedCidade}|${uf}`;
        const existing = cityMap.get(key);
        if (existing) {
          existing.count++;
        } else {
          cityMap.set(key, { cidade, uf, count: 1 });
        }
      }
    });

    return Array.from(cityMap.values()).sort((a, b) => b.count - a.count);
  }, [followupData, cityMappings]);

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

  // Filtered table
  const filteredCities = useMemo(() => {
    if (!search) return unmatchedCities;
    const s = search.toLowerCase();
    return unmatchedCities.filter(
      (c) =>
        c.cidade.toLowerCase().includes(s) ||
        c.uf.toLowerCase().includes(s)
    );
  }, [unmatchedCities, search]);

  const totalOccurrences = useMemo(
    () => unmatchedCities.reduce((sum, c) => sum + c.count, 0),
    [unmatchedCities]
  );

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

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By UF */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Ocorrências por UF (não mapeadas)
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byUF} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis dataKey="uf" type="category" stroke="hsl(var(--muted-foreground))" fontSize={11} width={40} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" name="Ocorrências" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Top cities */}
        <Card className="bg-card border-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">
              Top 20 Cidades não mapeadas
            </CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={topCities} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis type="number" stroke="hsl(var(--muted-foreground))" fontSize={10} />
                <YAxis dataKey="cidade" type="category" stroke="hsl(var(--muted-foreground))" fontSize={9} width={120} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--card))",
                    border: "1px solid hsl(var(--border))",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Bar dataKey="count" name="Ocorrências" fill="hsl(0, 84%, 60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-card border-border">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-foreground">
              Cidades da API sem regional cadastrada
            </CardTitle>
            <p className="text-xs text-muted-foreground mt-1">
              {unmatchedCities.length} cidades únicas · {totalOccurrences.toLocaleString("pt-BR")} registros na API
            </p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar cidade ou UF..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9 bg-background border-border text-foreground w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Cidade</TableHead>
                  <TableHead className="text-muted-foreground">UF</TableHead>
                  <TableHead className="text-muted-foreground text-right">Ocorrências</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCities.map((city, idx) => (
                  <TableRow key={`${city.cidade}-${city.uf}-${idx}`} className="border-border">
                    <TableCell className="text-foreground">{city.cidade}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-border text-foreground">
                        {city.uf || "N/I"}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-right text-muted-foreground">
                      {city.count.toLocaleString("pt-BR")}
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      {unmatchedCities.length === 0
                        ? "Todas as cidades da API estão mapeadas! ✅"
                        : "Nenhum registro encontrado"}
                    </TableCell>
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
