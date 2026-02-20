import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/data/mockData";

interface Props {
  items: any[];
}

export const TrackingItensTable = ({ items }: Props) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-foreground">
          Itens dos Pedidos <span className="text-xs text-muted-foreground font-normal">({items.length})</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="overflow-auto max-h-[350px] custom-scrollbar p-0">
        <Table>
          <TableHeader>
            <TableRow className="border-border">
              <TableHead className="text-muted-foreground text-[10px] px-2">Pedido</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Cod. Item</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">Descrição</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2">SubGrupo</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2 text-right">M3 Total</TableHead>
              <TableHead className="text-muted-foreground text-[10px] px-2 text-right">Vl. Total</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {items.slice(0, 100).map((item, idx) => (
              <TableRow key={idx} className="border-border hover:bg-muted/30">
                <TableCell className="text-primary text-[11px] px-2 py-1.5">{item.nr_pedido || "—"}</TableCell>
                <TableCell className="text-foreground text-[11px] px-2 py-1.5">{item.cod_prod_cliente || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5 max-w-[150px] truncate">{item.descricao || "—"}</TableCell>
                <TableCell className="text-muted-foreground text-[11px] px-2 py-1.5">{item.nm_sub_grupo || "—"}</TableCell>
                <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right">{parseFloat(item.m3_total || "0").toFixed(4)}</TableCell>
                <TableCell className="text-foreground text-[11px] px-2 py-1.5 text-right">{formatCurrency(parseFloat(item.vl_total || "0"))}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
