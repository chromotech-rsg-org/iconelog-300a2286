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
      <CardContent className="p-0">
        <style>{`
          .tracking-itens-scroll::-webkit-scrollbar { width: 8px; height: 8px; }
          .tracking-itens-scroll::-webkit-scrollbar-track { background: hsl(0, 0%, 10%); }
          .tracking-itens-scroll::-webkit-scrollbar-thumb { background: hsl(0, 0%, 30%); border-radius: 4px; }
          .tracking-itens-scroll::-webkit-scrollbar-thumb:hover { background: hsl(0, 0%, 40%); }
          .tracking-itens-scroll { overflow: scroll !important; }
        `}</style>
        <div className="tracking-itens-scroll overflow-x-scroll overflow-y-auto max-h-[400px]">
          <Table className="min-w-[700px]">
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
              {items.slice(0, 200).map((item, idx) => (
                <TableRow key={idx} className="border-border hover:bg-muted/20">
                  <TableCell className="text-primary text-[11px] px-2 py-1 whitespace-nowrap">{item.nr_pedido || "—"}</TableCell>
                  <TableCell className="text-foreground text-[11px] px-2 py-1 whitespace-nowrap">{item.cod_prod_cliente || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap max-w-[200px] truncate">{item.descricao || "—"}</TableCell>
                  <TableCell className="text-muted-foreground text-[11px] px-2 py-1 whitespace-nowrap">{item.nm_sub_grupo || "—"}</TableCell>
                  <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{parseInt(item.m3_total || "0").toLocaleString()}</TableCell>
                  <TableCell className="text-foreground text-[11px] px-2 py-1 text-right whitespace-nowrap">{formatCurrency(parseFloat(item.vl_total || "0"))}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </CardContent>
    </Card>
  );
};
