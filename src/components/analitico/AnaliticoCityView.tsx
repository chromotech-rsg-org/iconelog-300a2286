import { useMemo, useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, AlertTriangle, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";

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

type SortKey = "pedido" | "campanha" | "cidade" | "uf";
type SortDir = "asc" | "desc";

export const AnaliticoCityView = ({
  followupData,
  cityMappings,
  selectedMonths,
  selectedYears,
}: AnaliticoCityViewProps) => {
  const { t } = useLanguage();
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(20);
  const [sortKey, setSortKey] = useState<SortKey | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [columnFilter, setColumnFilter] = useState<{ key: string; value: string } | null>(null);

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

  // Filter by column click + search
  const filtered = useMemo(() => {
    let data = unmatchedRecords;
    if (columnFilter) {
      data = data.filter(r => String(r[columnFilter.key as keyof typeof r] || "").toUpperCase() === columnFilter.value.toUpperCase());
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(
        (r) =>
          r.cidade.toLowerCase().includes(s) ||
          r.uf.toLowerCase().includes(s) ||
          r.pedido.toLowerCase().includes(s) ||
          r.campanha.toLowerCase().includes(s)
      );
    }
    return data;
  }, [unmatchedRecords, search, columnFilter]);

  // Sort
  const sorted = useMemo(() => {
    if (!sortKey) return filtered;
    return [...filtered].sort((a, b) => {
      const va = (a[sortKey] || "").toLowerCase();
      const vb = (b[sortKey] || "").toLowerCase();
      if (va < vb) return sortDir === "asc" ? -1 : 1;
      if (va > vb) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
  }, [filtered, sortKey, sortDir]);

  const totalPages = Math.ceil(sorted.length / perPage);
  const paged = sorted.slice(page * perPage, (page + 1) * perPage);

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir(d => d === "asc" ? "desc" : "asc");
    } else {
      setSortKey(key);
      setSortDir("asc");
    }
    setPage(0);
  };

  const handleColumnClick = (key: string, value: string) => {
    if (!value || value === "—") return;
    if (columnFilter?.key === key && columnFilter?.value.toUpperCase() === value.toUpperCase()) {
      setColumnFilter(null);
    } else {
      setColumnFilter({ key, value });
      setPage(0);
    }
  };

  const SortIcon = ({ col }: { col: SortKey }) => {
    if (sortKey !== col) return <ArrowUpDown className="h-3 w-3 ml-1 inline opacity-40" />;
    return sortDir === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 inline text-primary" />
      : <ArrowDown className="h-3 w-3 ml-1 inline text-primary" />;
  };

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
                <p className="text-xs text-muted-foreground">{t("Cidades não encontradas")}</p>
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
      <Card className="bg-card border-border flex flex-col">
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div className="flex items-center gap-3">
              <CardTitle className="text-sm font-bold text-primary uppercase">
                Regionais não encontradas
              </CardTitle>
              <span className="text-xs text-muted-foreground">({filtered.length})</span>
              {columnFilter && (
                <Badge variant="outline" className="text-[10px] cursor-pointer border-primary text-primary" onClick={() => { setColumnFilter(null); setPage(0); }}>
                  {columnFilter.value} ✕
                </Badge>
              )}
            </div>
            <div className="flex items-center gap-2">
              <div className="relative">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <Input
                  placeholder="Pesquisar..."
                  value={search}
                  onChange={(e) => { setSearch(e.target.value); setPage(0); }}
                  className="h-7 text-xs pl-7 bg-muted/20 border-border w-60"
                />
              </div>
              <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(0); }}>
                <SelectTrigger className="h-7 w-20 text-xs bg-muted/20 border-border">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="5">5</SelectItem>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="20">20</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0 flex-1 flex flex-col">
          <div className="flex-1 overflow-auto" style={{ maxHeight: 480 }}>
            <Table>
              <TableHeader>
                <TableRow className="border-border bg-muted/20 sticky top-0 z-10">
                  <TableHead
                    className="text-muted-foreground text-[10px] px-3 whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("pedido")}
                  >
                    Pedido <SortIcon col="pedido" />
                  </TableHead>
                  <TableHead
                    className="text-muted-foreground text-[10px] px-3 whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("campanha")}
                  >
                    Campanha <SortIcon col="campanha" />
                  </TableHead>
                  <TableHead
                    className="text-muted-foreground text-[10px] px-3 whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("cidade")}
                  >
                    Cidade Destino <SortIcon col="cidade" />
                  </TableHead>
                  <TableHead
                    className="text-muted-foreground text-[10px] px-3 whitespace-nowrap cursor-pointer hover:text-foreground select-none"
                    onClick={() => handleSort("uf")}
                  >
                    UF <SortIcon col="uf" />
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.map((record, idx) => (
                  <TableRow key={`${record.pedido}-${idx}`} className="border-border hover:bg-muted/20">
                    <TableCell
                      className="text-primary text-[11px] px-3 py-1.5 whitespace-nowrap cursor-pointer hover:underline"
                      onClick={() => handleColumnClick("pedido", record.pedido)}
                    >
                      {record.pedido || "—"}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-[11px] px-3 py-1.5 whitespace-nowrap max-w-[200px] truncate cursor-pointer hover:text-primary"
                      onClick={() => handleColumnClick("campanha", record.campanha)}
                    >
                      {record.campanha || "—"}
                    </TableCell>
                    <TableCell
                      className="text-foreground font-medium text-[11px] px-3 py-1.5 whitespace-nowrap cursor-pointer hover:text-primary"
                      onClick={() => handleColumnClick("cidade", record.cidade)}
                    >
                      {record.cidade}
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-[11px] px-3 py-1.5 whitespace-nowrap cursor-pointer hover:text-primary"
                      onClick={() => handleColumnClick("uf", record.uf)}
                    >
                      {record.uf || "N/I"}
                    </TableCell>
                  </TableRow>
                ))}
                {paged.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground py-8">
                      {unmatchedRecords.length === 0
                        ? "Todas as cidades da API estão mapeadas! ✅"
                        : "Nenhum registro encontrado"}
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
          {/* Pagination — sticky bottom */}
          <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30 sticky bottom-0 z-10">
            <span className="text-[10px] text-muted-foreground">
              {filtered.length > 0
                ? `${page * perPage + 1}–${Math.min((page + 1) * perPage, filtered.length)} de ${filtered.length}`
                : "0 registros"}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={page === 0} onClick={() => setPage(p => p - 1)}>
                <ChevronLeft className="h-3.5 w-3.5" />
              </Button>
              <span className="text-[10px] text-muted-foreground min-w-[60px] text-center">
                {totalPages > 0 ? `${page + 1} / ${totalPages}` : "—"}
              </span>
              <Button variant="ghost" size="icon" className="h-6 w-6" disabled={page >= totalPages - 1} onClick={() => setPage(p => p + 1)}>
                <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
