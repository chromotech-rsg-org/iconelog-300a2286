import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Search } from "lucide-react";
import { SKUItem } from "@/data/stockData";
import { formatNumber } from "@/data/mockData";
import { ProductHoverCard } from "./ProductHoverCard";

interface StockTableProps {
  items: SKUItem[];
  onSelectProduct: (product: SKUItem) => void;
  selectedProduct: SKUItem | null;
}

export const StockTable = ({ items, onSelectProduct, selectedProduct }: StockTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStockBadge = (item: SKUItem) => {
    const ratio = item.stockQuantity / item.minStock;
    if (ratio <= 1) {
      return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
    }
    if (ratio <= 1.5) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Baixo</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Normal</Badge>;
  };

  return (
    <Card className="bg-dashboard-card border-dashboard-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <CardTitle className="text-base font-semibold text-foreground">
            Lista de SKUs
          </CardTitle>
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Buscar SKU, nome ou categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-9 bg-dashboard-dark border-dashboard-border text-foreground placeholder:text-muted-foreground"
            />
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-auto">
        <Table>
          <TableHeader>
            <TableRow className="border-dashboard-border hover:bg-transparent">
              <TableHead className="text-muted-foreground">Foto</TableHead>
              <TableHead className="text-muted-foreground">SKU</TableHead>
              <TableHead className="text-muted-foreground">Produto</TableHead>
              <TableHead className="text-muted-foreground">Categoria</TableHead>
              <TableHead className="text-muted-foreground text-right">Estoque</TableHead>
              <TableHead className="text-muted-foreground text-right">Kits</TableHead>
              <TableHead className="text-muted-foreground text-right">Preço</TableHead>
              <TableHead className="text-muted-foreground text-center">Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredItems.map((item) => (
              <ProductHoverCard key={item.id} product={item}>
                <TableRow 
                  className={`border-dashboard-border cursor-pointer transition-colors ${
                    selectedProduct?.id === item.id 
                      ? 'bg-dashboard-accent/10' 
                      : 'hover:bg-dashboard-border/50'
                  }`}
                  onClick={() => onSelectProduct(item)}
                >
                  <TableCell className="py-2">
                    <img 
                      src={item.imageUrl} 
                      alt={item.name}
                      className="w-10 h-10 rounded-lg object-cover border border-dashboard-border"
                    />
                  </TableCell>
                  <TableCell className="text-dashboard-accent font-medium text-sm">
                    {item.sku}
                  </TableCell>
                  <TableCell className="text-foreground text-sm max-w-[200px] truncate">
                    {item.name}
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {item.category}
                  </TableCell>
                  <TableCell className="text-foreground text-sm text-right font-medium">
                    {formatNumber(item.stockQuantity)}
                  </TableCell>
                  <TableCell className="text-foreground text-sm text-right">
                    {formatNumber(item.kitsQuantity)}
                  </TableCell>
                  <TableCell className="text-foreground text-sm text-right">
                    {formatCurrency(item.unitPrice)}
                  </TableCell>
                  <TableCell className="text-center">
                    {getStockBadge(item)}
                  </TableCell>
                </TableRow>
              </ProductHoverCard>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
