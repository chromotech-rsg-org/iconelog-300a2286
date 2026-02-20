import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatCurrency } from "@/data/mockData";

interface Props {
  items: any[];
}

export const TrackingItensTable = ({ items }: Props) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [columnFilter, setColumnFilter] = useState<{ key: string; value: string } | null>(null);

  const filtered = useMemo(() => {
    let data = items;
    if (columnFilter) {
      data = data.filter(o => String(o[columnFilter.key] || "").toUpperCase() === columnFilter.value.toUpperCase());
    }
    if (search.trim()) {
      const s = search.toLowerCase();
      data = data.filter(o =>
        Object.values(o).some(v => String(v || "").toLowerCase().includes(s))
      );
    }
    return data;
  }, [items, search, columnFilter]);

  const vlTotal = useMemo(() => {
    return filtered.reduce((sum, item) => {
      const val = parseFloat(item.vl_total || "0");
      return sum + (isNaN(val) ? 0 : val);
    }, 0);
  }, [filtered]);

  const totalPages = Math.ceil(filtered.length / perPage);
  const paged = filtered.slice(page * perPage, (page + 1) * perPage);

  const handleColumnClick = (key: string, value: string) => {
    if (!value || value === "—") return;
    if (columnFilter?.key === key && columnFilter?.value.toUpperCase() === value.toUpperCase()) {
      setColumnFilter(null);
    } else {
      setColumnFilter({ key, value });
      setPage(0);
    }
  };

  return (
    <Card className="bg-card border-border flex flex-col h-full">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Itens dos Pedidos <span className="text-xs text-muted-foreground font-normal">({filtered.length})</span>
          </CardTitle>
          {columnFilter && (
            <Badge variant="outline" className="text-[10px] cursor-pointer border-primary text-primary" onClick={() => { setColumnFilter(null); setPage(0); }}>
              {columnFilter.value} ✕
            </Badge>
          )}
        </div>
        <div className="flex items-center gap-2 mt-1">
          <div className="relative flex-1">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
            <Input
              placeholder="Pesquisar..."
              value={search}
              onChange={e => { setSearch(e.target.value); setPage(0); }}
              className="h-7 text-xs pl-7 bg-muted/20 border-border"
            />
          </div>
          <Select value={String(perPage)} onValueChange={v => { setPerPage(Number(v)); setPage(0); }}>
            <SelectTrigger className="h-7 w-20 text-xs bg-muted/20 border-border">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="25">25</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
              <SelectItem value="200">200</SelectItem>
            </SelectContent>
          </Select>
        </div>
        {vlTotal > 0 && (
          <div className="mt-1 text-right">
            <span className="text-[10px] text-muted-foreground">Vl. Total: </span>
            <span className="text-xs font-bold text-primary">{formatCurrency(vlTotal)}</span>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col min-h-0">
        <style>{`
          .tracking-itens-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
          .tracking-itens-scroll::-webkit-scrollbar-track { background: hsl(0, 0%, 14%); border-radius: 3px; }
          .tracking-itens-scroll::-webkit-scrollbar-thumb { background: hsl(0, 0%, 35%); border-radius: 3px; }
          .tracking-itens-scroll::-webkit-scrollbar-thumb:hover { background: hsl(0, 0%, 50%); }
          .tracking-itens-scroll { overflow: scroll !important; }
        `}</style>
        <div className="tracking-itens-scroll flex-1" style={{ overflow: "scroll" }}>
          <Table className="min-w-[800px]">
            <TableHeader>
              <TableRow className="border-border bg-muted/20 sticky top-0 z-10">
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Pedido</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Cód. Item</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Descrição</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">SubGrupo</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">M³ Total</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">Vl. Total</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-muted-foreground text-xs py-8">
                    {items.length === 0 ? "Nenhum dado disponível" : "0 registros"}
                  </TableCell>
                </TableRow>
              ) : (
                paged.map((item, idx) => (
                  <TableRow key={idx} className="border-border hover:bg-muted/20">
                    <TableCell className="text-primary text-[11px] px-2 py-1 whitespace-nowrap cursor-pointer hover:underline" onClick={() => handleColumnClick("nr_pedido", item.nr_pedido)}>{item.nr_pedido || "—"}</TableCell>
                    <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap cursor-pointer hover:underline" onClick={() => handleColumnClick("cod_prod_cliente", item.cod_prod_cliente)}>{item.cod_prod_cliente || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap max-w-[200px] truncate cursor-pointer hover:text-primary" onClick={() => handleColumnClick("descricao", item.descricao)}>{item.descricao || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap cursor-pointer hover:text-primary" onClick={() => handleColumnClick("nm_sub_grupo", item.nm_sub_grupo)}>{item.nm_sub_grupo || "—"}</TableCell>
                    <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{parseInt(item.m3_total || "0").toLocaleString()}</TableCell>
                    <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{formatCurrency(parseFloat(item.vl_total || "0"))}</TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {/* Pagination */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/10">
          <span className="text-[10px] text-muted-foreground">
            {filtered.length > 0 ? `${page * perPage + 1}–${Math.min((page + 1) * perPage, filtered.length)} de ${filtered.length}` : "0 registros"}
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
  );
};
