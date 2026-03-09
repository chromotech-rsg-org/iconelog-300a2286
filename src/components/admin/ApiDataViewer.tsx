import { useState, useEffect, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { supabase } from "@/integrations/supabase/client";
import { Loader2, Database, Search, Clock, Download } from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { saveAs } from "file-saver";
import * as XLSX from "xlsx";

interface CacheEntry {
  id: string;
  cache_key: string;
  page_id: string;
  cached_at: string;
  data: any;
}

const ApiDataViewer = () => {
  const [cacheEntries, setCacheEntries] = useState<CacheEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedKey, setSelectedKey] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [rowsPerPage, setRowsPerPage] = useState<number | "all">(50);

  useEffect(() => {
    loadCacheKeys();
  }, []);

  // Only load metadata first, not the heavy data column
  const loadCacheKeys = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bi_data_cache")
      .select("id, cache_key, page_id, cached_at")
      .order("cached_at", { ascending: false });

    if (!error && data) {
      // Initialize with empty data, will load on selection
      setCacheEntries(data.map(d => ({ ...d, data: null })) as CacheEntry[]);
    }
    setLoading(false);
  };

  // Load data only when a specific key is selected
  const loadCacheData = async (cacheKey: string) => {
    const { data, error } = await supabase
      .from("bi_data_cache")
      .select("data")
      .eq("cache_key", cacheKey)
      .maybeSingle();

    if (!error && data) {
      setCacheEntries(prev => prev.map(e => 
        e.cache_key === cacheKey ? { ...e, data: data.data } : e
      ));
    }
  };

  const cacheKeys = useMemo(() => {
    const keys = [...new Set(cacheEntries.map(e => e.cache_key))];
    return keys.sort();
  }, [cacheEntries]);

  const selectedEntry = useMemo(() => {
    if (selectedKey === "all" || !selectedKey) return null;
    return cacheEntries.find(e => e.cache_key === selectedKey) || null;
  }, [cacheEntries, selectedKey]);

  const flatData = useMemo(() => {
    if (!selectedEntry?.data) return [];
    const raw = selectedEntry.data;
    return Array.isArray(raw) ? raw : [raw];
  }, [selectedEntry]);

  const columns = useMemo(() => {
    if (flatData.length === 0) return [];
    const allKeys = new Set<string>();
    flatData.slice(0, 100).forEach(row => {
      if (row && typeof row === "object") {
        Object.keys(row).forEach(k => allKeys.add(k));
      }
    });
    return Array.from(allKeys);
  }, [flatData]);

  const filteredData = useMemo(() => {
    if (!searchTerm.trim()) return flatData;
    const term = searchTerm.toLowerCase();
    return flatData.filter(row =>
      Object.values(row || {}).some(v =>
        String(v ?? "").toLowerCase().includes(term)
      )
    );
  }, [flatData, searchTerm]);

  const paginatedData = useMemo(() => {
    if (rowsPerPage === "all") return filteredData;
    const start = (currentPage - 1) * rowsPerPage;
    return filteredData.slice(start, start + rowsPerPage);
  }, [filteredData, currentPage, rowsPerPage]);

  const totalPages = rowsPerPage === "all" ? 1 : Math.ceil(filteredData.length / rowsPerPage);

  const exportToExcel = () => {
    if (filteredData.length === 0 || !selectedEntry) return;
    const ws = XLSX.utils.json_to_sheet(filteredData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Dados");
    const buf = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    saveAs(new Blob([buf]), `${selectedEntry.cache_key}.xlsx`);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-6 w-6 animate-spin text-dashboard-accent" />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base text-foreground flex items-center gap-2">
            <Database className="h-4 w-4 text-dashboard-accent" />
            Dados das APIs no Banco
          </CardTitle>
          <Badge variant="secondary" className="text-muted-foreground">
            {cacheEntries.length} cache(s)
          </Badge>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <Select value={selectedKey} onValueChange={(value) => {
              setSelectedKey(value);
              if (value !== "all") {
                // Load data on demand when selected
                const entry = cacheEntries.find(e => e.cache_key === value);
                if (entry && !entry.data) {
                  loadCacheData(value);
                }
              }
            }}>
              <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground sm:w-80">
                <SelectValue placeholder="Selecione uma API / cache_key" />
              </SelectTrigger>
              <SelectContent className="bg-dashboard-card border-dashboard-border">
                <SelectItem value="all">— Selecione —</SelectItem>
                {cacheKeys.map(key => (
                  <SelectItem key={key} value={key}>{key}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            {selectedEntry && (
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input
                  placeholder="Buscar nos dados..."
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  className="pl-9 bg-dashboard-dark border-dashboard-border text-foreground"
                />
              </div>
            )}

            {selectedEntry && (
              <div className="flex flex-wrap items-center gap-3">
                <Select value={String(rowsPerPage)} onValueChange={v => { setRowsPerPage(v === "all" ? "all" : Number(v)); setCurrentPage(1); }}>
                  <SelectTrigger className="bg-dashboard-dark border-dashboard-border text-foreground w-36">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-dashboard-card border-dashboard-border">
                    <SelectItem value="5">5</SelectItem>
                    <SelectItem value="10">10</SelectItem>
                    <SelectItem value="20">20</SelectItem>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline" size="sm" onClick={exportToExcel} className="gap-1.5 border-dashboard-border">
                  <Download className="h-3.5 w-3.5" /> Exportar Excel
                </Button>
              </div>
            )}
          </div>

          {selectedEntry && (
            <div className="flex items-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Atualizado: {format(new Date(selectedEntry.cached_at), "dd/MM/yyyy HH:mm", { locale: ptBR })}
              </span>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedEntry && columns.length > 0 && (
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardContent className="p-0">
            <div className="overflow-auto" style={{ maxHeight: "60vh", maxWidth: "100%" }}>
              <Table>
                <TableHeader>
                  <TableRow className="border-dashboard-border">
                    <TableHead className="text-muted-foreground text-xs w-12 sticky left-0 bg-dashboard-card z-10">#</TableHead>
                    {columns.map(col => (
                      <TableHead key={col} className="text-muted-foreground text-xs whitespace-nowrap">
                        {col}
                      </TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedData.map((row, idx) => (
                    <TableRow key={idx} className="border-dashboard-border">
                      <TableCell className="text-muted-foreground text-xs sticky left-0 bg-dashboard-card z-10">
                        {rowsPerPage === "all" ? idx + 1 : (currentPage - 1) * rowsPerPage + idx + 1}
                      </TableCell>
                      {columns.map(col => (
                        <TableCell key={col} className="text-foreground text-xs whitespace-nowrap max-w-[200px] truncate">
                          {row?.[col] != null ? String(row[col]) : "—"}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                  {paginatedData.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={columns.length + 1} className="text-center text-muted-foreground py-8">
                        Nenhum registro encontrado
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t border-dashboard-border">
                <span className="text-xs text-muted-foreground">
                  Página {currentPage} de {totalPages}
                </span>
                <div className="flex gap-2">
                  <button
                    onClick={() => setCurrentPage(p => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="text-xs px-3 py-1 rounded bg-dashboard-dark text-foreground disabled:opacity-40 border border-dashboard-border hover:bg-dashboard-border/50"
                  >
                    Anterior
                  </button>
                  <button
                    onClick={() => setCurrentPage(p => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="text-xs px-3 py-1 rounded bg-dashboard-dark text-foreground disabled:opacity-40 border border-dashboard-border hover:bg-dashboard-border/50"
                  >
                    Próximo
                  </button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {selectedKey === "all" && (
        <Card className="bg-dashboard-card border-dashboard-border">
          <CardContent className="py-12 text-center text-muted-foreground">
            <Database className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Selecione uma API acima para visualizar os dados armazenados no banco.</p>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default ApiDataViewer;
