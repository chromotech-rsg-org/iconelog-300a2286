import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Search, ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import { SKUItem } from "@/data/stockData";
import { formatNumber } from "@/data/mockData";
import { ProductHoverCard } from "./ProductHoverCard";
import { cn } from "@/lib/utils";

interface StockTableProps {
  items: SKUItem[];
  onSelectProduct: (product: SKUItem) => void;
  selectedProduct: SKUItem | null;
  onFullscreen?: () => void;
}

export const StockTable = ({ items, onSelectProduct, selectedProduct, onFullscreen }: StockTableProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const filteredItems = items.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const paginatedItems = filteredItems.slice(startIndex, endIndex);

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

  const handlePageChange = (page: number) => {
    setCurrentPage(Math.max(1, Math.min(page, totalPages)));
  };

  const handleItemsPerPageChange = (value: string) => {
    setItemsPerPage(Number(value));
    setCurrentPage(1);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 7) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 3) {
        pages.push(1, 2, 3, 4, "...", totalPages);
      } else if (currentPage >= totalPages - 2) {
        pages.push(1, "...", totalPages - 3, totalPages - 2, totalPages - 1, totalPages);
      } else {
        pages.push(1, "...", currentPage - 1, currentPage, currentPage + 1, "...", totalPages);
      }
    }
    return pages;
  };

  return (
    <Card className="bg-dashboard-card border-dashboard-border h-full flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-3">
            <CardTitle className="text-base font-semibold text-foreground">
              Lista de SKUs
            </CardTitle>
            <span className="text-sm text-muted-foreground">
              {filteredItems.length} registros
            </span>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground">Mostrar:</span>
              <Select value={itemsPerPage.toString()} onValueChange={handleItemsPerPageChange}>
                <SelectTrigger className="w-20 h-8 bg-dashboard-dark border-dashboard-border text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="bg-dashboard-card border-dashboard-border">
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="relative w-48">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => {
                  setSearchTerm(e.target.value);
                  setCurrentPage(1);
                }}
                className="pl-9 h-8 bg-dashboard-dark border-dashboard-border text-foreground placeholder:text-muted-foreground"
              />
            </div>
            {onFullscreen && (
              <Button
                variant="ghost"
                size="icon"
                onClick={onFullscreen}
                className="h-8 w-8 text-muted-foreground hover:text-dashboard-accent"
              >
                <Maximize2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="flex-1 overflow-hidden flex flex-col">
        <div className="flex-1 overflow-auto custom-scrollbar">
          <Table>
            <TableHeader>
              <TableRow className="border-dashboard-border hover:bg-transparent">
                <TableHead className="text-muted-foreground w-14">Foto</TableHead>
                <TableHead className="text-muted-foreground w-24">SKU</TableHead>
                <TableHead className="text-muted-foreground">Produto</TableHead>
                <TableHead className="text-muted-foreground w-28">Categoria</TableHead>
                <TableHead className="text-muted-foreground text-right w-20">Estoque</TableHead>
                <TableHead className="text-muted-foreground text-right w-16">Kits</TableHead>
                <TableHead className="text-muted-foreground text-right w-24">Preço</TableHead>
                <TableHead className="text-muted-foreground text-center w-20">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                <ProductHoverCard key={item.id} product={item}>
                  <TableRow 
                    className={cn(
                      "border-dashboard-border cursor-pointer transition-colors",
                      selectedProduct?.id === item.id 
                        ? "bg-dashboard-accent/10" 
                        : "hover:bg-dashboard-border/50"
                    )}
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
        </div>
        
        {/* Pagination */}
        <div className="flex items-center justify-between pt-4 border-t border-dashboard-border mt-2">
          <span className="text-sm text-muted-foreground">
            Mostrando {startIndex + 1} a {Math.min(endIndex, filteredItems.length)} de {filteredItems.length}
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-dashboard-border"
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>
            
            {getPageNumbers().map((page, index) => (
              typeof page === "number" ? (
                <Button
                  key={index}
                  variant={currentPage === page ? "default" : "outline"}
                  size="icon"
                  className={cn(
                    "h-8 w-8",
                    currentPage === page 
                      ? "bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent" 
                      : "border-dashboard-border"
                  )}
                  onClick={() => handlePageChange(page)}
                >
                  {page}
                </Button>
              ) : (
                <span key={index} className="px-2 text-muted-foreground">...</span>
              )
            ))}
            
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 border-dashboard-border"
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
