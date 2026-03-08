import { useState, useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { formatCurrency } from "@/data/mockData";

interface Props {
  orders: any[];
  onCidadeClick: (cidade: string) => void;
  onStatusClick: (status: string) => void;
}

const formatDateFull = (dt: any) => {
  if (!dt) return "—";
  return String(dt).trim();
};

export const TrackingPedidosTable = ({ orders, onCidadeClick, onStatusClick }: Props) => {
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const [perPage, setPerPage] = useState(50);
  const [columnFilter, setColumnFilter] = useState<{ key: string; value: string } | null>(null);

  const filtered = useMemo(() => {
    let data = orders;
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
  }, [orders, search, columnFilter]);

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
    <Card className="bg-card border-border flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2">
          <CardTitle className="text-sm font-medium text-foreground">
            Pedidos Consolidados <span className="text-xs text-muted-foreground font-normal">({filtered.length})</span>
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
              <SelectItem value="5">5</SelectItem>
              <SelectItem value="10">10</SelectItem>
              <SelectItem value="20">20</SelectItem>
              <SelectItem value="50">50</SelectItem>
              <SelectItem value="100">100</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent className="p-0 flex-1 flex flex-col">
        <style>{`
          .tracking-pedidos-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
          .tracking-pedidos-scroll::-webkit-scrollbar-track { background: hsl(0, 0%, 14%); border-radius: 3px; }
          .tracking-pedidos-scroll::-webkit-scrollbar-thumb { background: hsl(0, 0%, 35%); border-radius: 3px; }
          .tracking-pedidos-scroll::-webkit-scrollbar-thumb:hover { background: hsl(0, 0%, 50%); }
          .tracking-pedidos-scroll { overflow: scroll !important; }
        `}</style>
        <div className="tracking-pedidos-scroll flex-1" style={{ overflow: "scroll", maxHeight: 400 }}>
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="border-border bg-muted/20 sticky top-0 z-10">
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Nº Mov.</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Pedido</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Tipo de Serviço</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Modalidade</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Campanha</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Qtde. SKU</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">Vl. Tot.</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Prev. Entrega</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Entrega Real</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Status</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Cidade</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">UF</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Solicitante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paged.map((order, idx) => {
                const status = (order.fl_status_real || "").toUpperCase();
                const isFinalizado = status.includes("FINALIZADO") || status.includes("ENTREGUE");
                return (
                  <TableRow key={idx} className="border-border hover:bg-muted/20">
                    <TableCell className="text-primary text-[11px] px-2 py-1 whitespace-nowrap cursor-pointer hover:underline" onClick={() => handleColumnClick("cod_conhecimento", order.cod_conhecimento)}>{order.cod_conhecimento || "—"}</TableCell>
                    <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap cursor-pointer hover:underline" onClick={() => handleColumnClick("nr_pedido", order.nr_pedido)}>{order.nr_pedido || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap cursor-pointer hover:text-primary" onClick={() => handleColumnClick("ds_tipo_servico", order.ds_tipo_servico)}>{order.ds_tipo_servico || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap cursor-pointer hover:text-primary" onClick={() => handleColumnClick("ds_modalidade_transporte", order.ds_modalidade_transporte)}>{order.ds_modalidade_transporte || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap max-w-[140px] truncate">{order.nm_campanha || "—"}</TableCell>
                    <TableCell className="text-foreground text-[11px] px-2 py-1 text-center whitespace-nowrap">{order.nr_qtde_SKU || "—"}</TableCell>
                    <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{formatCurrency(parseFloat(order.vl_total || "0"))}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap">{formatDateFull(order.dt_previsao)}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap">{formatDateFull(order.dt_entrega_real)}</TableCell>
                    <TableCell className="px-2 py-1 whitespace-nowrap">
                      <Badge
                        className={`text-[10px] cursor-pointer ${isFinalizado ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}
                        onClick={() => onStatusClick(isFinalizado ? "FINALIZADO" : "TRÂNSITO")}
                      >
                        {order.fl_status_real || "—"}
                      </Badge>
                    </TableCell>
                    <TableCell
                      className="text-muted-foreground text-[11px] px-2 py-1 cursor-pointer hover:text-primary whitespace-nowrap"
                      onClick={() => onCidadeClick(order.ds_cidade_DES || "")}
                    >
                      {order.ds_cidade_DES || "—"}
                    </TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap cursor-pointer hover:text-primary" onClick={() => handleColumnClick("ds_uf_DES", order.ds_uf_DES)}>{order.ds_uf_DES || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap max-w-[120px] truncate">{order.nm_solicitante || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
        {/* Pagination — sticky at bottom */}
        <div className="flex items-center justify-between px-3 py-2 border-t border-border bg-muted/30 sticky bottom-0 z-10">
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
