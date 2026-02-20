import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
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
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Pedidos Consolidados <span className="text-xs text-muted-foreground font-normal">({orders.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <style>{`
          .tracking-pedidos-scroll::-webkit-scrollbar { width: 6px; height: 6px; }
          .tracking-pedidos-scroll::-webkit-scrollbar-track { background: hsl(0, 0%, 12%); border-radius: 3px; }
          .tracking-pedidos-scroll::-webkit-scrollbar-thumb { background: hsl(0, 0%, 35%); border-radius: 3px; }
          .tracking-pedidos-scroll::-webkit-scrollbar-thumb:hover { background: hsl(0, 0%, 45%); }
          .tracking-pedidos-scroll { overflow: scroll !important; }
        `}</style>
        <div className="tracking-pedidos-scroll" style={{ overflow: "scroll", maxHeight: 500 }}>
          <Table className="min-w-[1200px]">
            <TableHeader>
              <TableRow className="border-border bg-muted/20 sticky top-0 z-10">
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Nº Mov.</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Pedido</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Tipo de Serviço</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Modalidade</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Campanha</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Qtde. SKU</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap text-right">Vl. Tot. Pedido</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Prev. de Entrega</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Data Entrega Real</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Status</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Cidade Destino</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">UF</TableHead>
                <TableHead className="text-muted-foreground text-[10px] px-2 whitespace-nowrap">Solicitante</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.slice(0, 200).map((order, idx) => {
                const status = (order.fl_status_real || "").toUpperCase();
                const isFinalizado = status.includes("FINALIZADO") || status.includes("ENTREGUE");
                return (
                  <TableRow key={idx} className="border-border hover:bg-muted/20">
                    <TableCell className="text-primary text-[11px] px-2 py-1 whitespace-nowrap">{order.cod_conhecimento || "—"}</TableCell>
                    <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap">{order.nr_pedido || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap">{order.ds_tipo_servico || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap">{order.ds_modalidade_transporte || "—"}</TableCell>
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
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap">{order.ds_uf_DES || "—"}</TableCell>
                    <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap max-w-[120px] truncate">{order.nm_solicitante || "—"}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
