import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { formatCurrency } from "@/data/mockData";

interface Props {
  orders: any[];
  onCidadeClick: (cidade: string) => void;
  onStatusClick: (status: string) => void;
}

const formatDate = (dt: any) => {
  if (!dt) return "—";
  const str = String(dt).trim().split(/[\sT]/)[0];
  const parts = str.split(/[\/\-]/);
  if (parts.length < 3) return str;
  if (parts[0].length === 4) return `${parts[2]}/${parts[1]}/${parts[0]}`;
  return str;
};

export const TrackingPedidosTable = ({ orders, onCidadeClick, onStatusClick }: Props) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Pedidos Consolidados <span className="text-xs text-muted-foreground font-normal">({orders.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[400px] custom-scrollbar p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground text-[10px] px-2">N Mov</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Pedido</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Tipo Serviço</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Modalidade</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Campanha</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">SKU</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2 text-right">Vl. Total</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Prev. Entrega</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Entrega Real</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Status</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Cidade</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">UF</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Solicitante</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.slice(0, 100).map((order, idx) => {
              const status = (order.fl_status_real || "").toUpperCase();
              const isFinalizado = status.includes("FINALIZADO") || status.includes("ENTREGUE");
              return (
                <TableRow key={idx} className="border-border hover:bg-muted/30">
                  <TableCell className="text-primary text-[11px] px-2 py-1.5">{order.cod_conhecimento || "—"}</TableCell>
                  <TableCell className="text-foreground text-[11px] px-2 py-1.5">{order.nr_pedido || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5">{order.ds_tipo_servico || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5">{order.ds_modalidade_transporte || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5 max-w-[100px] truncate">{order.nm_campanha || "—"}</TableCell>
                  <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-center">{order.nr_qtde_SKU || "—"}</TableCell>
                  <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right">{formatCurrency(parseFloat(order.vl_total || "0"))}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5">{formatDate(order.dt_previsao)}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5">{formatDate(order.dt_entrega_real)}</TableCell>
                  <TableCell className="px-2 py-1.5">
                    <Badge
                      className={`text-[10px] cursor-pointer ${isFinalizado ? "bg-green-500/20 text-green-400 border-green-500/30" : "bg-blue-500/20 text-blue-400 border-blue-500/30"}`}
                      onClick={() => onStatusClick(isFinalizado ? "FINALIZADO" : "TRÂNSITO")}
                    >
                      {order.fl_status_real || "—"}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5 cursor-pointer hover:text-foreground" onClick={() => onCidadeClick(order.ds_cidade_DES || "")}>{order.ds_cidade_DES || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5">{order.ds_uf_DES || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5 max-w-[100px] truncate">{order.nm_solicitante || "—"}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
