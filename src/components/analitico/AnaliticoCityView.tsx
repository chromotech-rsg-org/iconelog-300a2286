import { useMemo, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useCityMapping } from "@/hooks/useCityMapping";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Search, Loader2 } from "lucide-react";

export const AnaliticoCityView = () => {
  const { cities, loading } = useCityMapping();
  const [search, setSearch] = useState("");

  // Group by UF
  const byUF = useMemo(() => {
    const map: Record<string, number> = {};
    cities.forEach(c => {
      map[c.uf] = (map[c.uf] || 0) + 1;
    });
    return Object.entries(map)
      .map(([uf, count]) => ({ uf, count }))
      .sort((a, b) => b.count - a.count);
  }, [cities]);

  // Group by regional (city count)
  const byRegional = useMemo(() => {
    const map: Record<string, number> = {};
    cities.forEach(c => {
      map[c.regional] = (map[c.regional] || 0) + 1;
    });
    return Object.entries(map)
      .map(([regional, count]) => ({ regional, count }))
      .sort((a, b) => b.count - a.count);
  }, [cities]);

  // Filtered table
  const filteredCities = useMemo(() => {
    if (!search) return cities;
    const s = search.toLowerCase();
    return cities.filter(
      c => c.cidade.toLowerCase().includes(s) || c.regional.toLowerCase().includes(s) || c.uf.toLowerCase().includes(s)
    );
  }, [cities, search]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-dashboard-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* By UF */}
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Cidades Cadastradas por UF</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byUF} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} />
                <YAxis dataKey="uf" type="category" stroke="hsl(0, 0%, 60%)" fontSize={11} width={40} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} />
                <Bar dataKey="count" name="Cidades" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* By Regional */}
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-foreground">Cidades Cadastradas por Regional</CardTitle>
          </CardHeader>
          <CardContent className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={byRegional.slice(0, 15)} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
                <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} />
                <YAxis dataKey="regional" type="category" stroke="hsl(0, 0%, 60%)" fontSize={9} width={120} />
                <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} />
                <Bar dataKey="count" name="Cidades" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Table */}
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="flex flex-row items-center justify-between flex-wrap gap-4 pb-2">
          <div>
            <CardTitle className="text-sm font-medium text-foreground">Mapeamento Cidade → Regional</CardTitle>
            <p className="text-xs text-muted-foreground mt-1">{cities.length} registros cadastrados</p>
          </div>
          <div className="relative">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 bg-dashboard-dark border-dashboard-border text-foreground w-64"
            />
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[400px]">
            <Table>
              <TableHeader>
                <TableRow className="border-dashboard-border">
                  <TableHead className="text-muted-foreground">Cidade</TableHead>
                  <TableHead className="text-muted-foreground">Regional</TableHead>
                  <TableHead className="text-muted-foreground">UF</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCities.map(city => (
                  <TableRow key={city.id} className="border-dashboard-border">
                    <TableCell className="text-foreground">{city.cidade}</TableCell>
                    <TableCell className="text-muted-foreground">{city.regional}</TableCell>
                    <TableCell>
                      <Badge variant="outline" className="border-dashboard-border text-foreground">
                        {city.uf}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
                {filteredCities.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={3} className="text-center text-muted-foreground py-8">
                      Nenhum registro encontrado
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
