import { useState, useMemo } from "react";
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
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
import { formatNumber, formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";

interface StockItem {
  sku: string;
  name: string;
  description: string;
  stockQuantity: number;
  kitsQuantity: number;
  unitPrice: number;
  m3: number;
  imageUrl?: string;
  lastEntryQty?: number;
  lastEntryDate?: string;
  [key: string]: any;
}

interface StockLocationTablesProps {
  matrizItems: StockItem[];
  selectedSKU: string | null;
  onSKUClick: (sku: string) => void;
}

type SortDirection = "asc" | "desc" | null;
type SortField = "sku" | "name" | "stockQuantity" | "kitsQuantity" | "value" | "lastEntryQty" | "lastEntryDate";

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

export const StockLocationTables = ({
  matrizItems,
  selectedSKU,
  onSKUClick,
}: StockLocationTablesProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });

  const filteredAndSortedItems = useMemo(() => {
    let result = matrizItems.filter(item =>
      item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.name.toLowerCase().includes(searchTerm.toLowerCase())
    );

    if (sortConfig.field && sortConfig.direction) {
      result = [...result].sort((a, b) => {
        let aVal: number | string;
        let bVal: number | string;

        switch (sortConfig.field) {
          case "sku": aVal = a.sku; bVal = b.sku; break;
          case "name": aVal = a.name; bVal = b.name; break;
          case "stockQuantity": aVal = a.stockQuantity; bVal = b.stockQuantity; break;
          case "kitsQuantity": aVal = a.kitsQuantity; bVal = b.kitsQuantity; break;
          case "value": aVal = a.stockQuantity * a.unitPrice; bVal = b.stockQuantity * b.unitPrice; break;
          case "lastEntryQty": aVal = a.lastEntryQty || 0; bVal = b.lastEntryQty || 0; break;
          case "lastEntryDate": aVal = a.lastEntryDate || ""; bVal = b.lastEntryDate || ""; break;
          default: return 0;
        }

        if (typeof aVal === "string" && typeof bVal === "string") {
          return sortConfig.direction === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
        }
        return sortConfig.direction === "asc" ? (aVal as number) - (bVal as number) : (bVal as number) - (aVal as number);
      });
    }

    return result;
  }, [matrizItems, searchTerm, sortConfig]);

  const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedItems = filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);

  const handleSort = (field: SortField) => {
    setSortConfig(prev => {
      if (prev.field !== field) return { field, direction: "asc" };
      if (prev.direction === "asc") return { field, direction: "desc" };
      return { field: null, direction: null };
    });
  };

  const SortIcon = ({ field }: { field: SortField }) => {
    if (sortConfig.field !== field) return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    return sortConfig.direction === "asc"
      ? <ArrowUp className="h-3 w-3 ml-1 text-dashboard-accent" />
      : <ArrowDown className="h-3 w-3 ml-1 text-dashboard-accent" />;
  };

  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    if (totalPages <= 5) {
      for (let i = 1; i <= totalPages; i++) pages.push(i);
    } else {
      if (currentPage <= 2) pages.push(1, 2, 3, "...", totalPages);
      else if (currentPage >= totalPages - 1) pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
      else pages.push(1, "...", currentPage, "...", totalPages);
    }
    return pages;
  };

  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader className="pb-2">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <CardTitle className="text-sm font-semibold text-foreground">
            Estoque Matriz (Barueri) <span className="text-xs font-normal text-muted-foreground">({filteredAndSortedItems.length} itens)</span>
          </CardTitle>
          <div className="flex items-center gap-2">
            <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
              <SelectTrigger className="w-16 h-7 text-xs bg-dashboard-dark border-dashboard-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-dashboard-card border-dashboard-border">
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="25">25</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
            <div className="relative w-36">
              <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
              <Input
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="pl-7 h-7 text-xs bg-dashboard-dark border-dashboard-border"
              />
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-auto max-h-[400px] custom-scrollbar">
          <Table>
            <TableHeader className="sticky top-0 bg-dashboard-card z-10">
              <TableRow className="border-dashboard-border">
                <TableHead className="text-muted-foreground text-xs w-12">Foto</TableHead>
                <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground" onClick={() => handleSort("sku")}>
                  <span className="flex items-center">SKU <SortIcon field="sku" /></span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                  <span className="flex items-center">Nome <SortIcon field="name" /></span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("stockQuantity")}>
                  <span className="flex items-center justify-end">Qtde <SortIcon field="stockQuantity" /></span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("kitsQuantity")}>
                  <span className="flex items-center justify-end">Kits <SortIcon field="kitsQuantity" /></span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("value")}>
                  <span className="flex items-center justify-end">Valor <SortIcon field="value" /></span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("lastEntryQty")}>
                  <span className="flex items-center justify-end">Ult. Ent. Qtd <SortIcon field="lastEntryQty" /></span>
                </TableHead>
                <TableHead className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("lastEntryDate")}>
                  <span className="flex items-center justify-end">Ult. Ent. Data <SortIcon field="lastEntryDate" /></span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {paginatedItems.map((item) => (
                <TableRow
                  key={item.sku}
                  className={cn(
                    "border-dashboard-border hover:bg-dashboard-border/50 cursor-pointer",
                    selectedSKU === item.sku && "bg-dashboard-accent/10"
                  )}
                  onClick={() => onSKUClick(item.sku)}
                >
                  <TableCell className="py-1">
                    {item.imageUrl ? (
                      <HoverCard>
                        <HoverCardTrigger asChild>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-10 h-10 rounded object-cover border border-dashboard-border cursor-zoom-in"
                          />
                        </HoverCardTrigger>
                        <HoverCardContent className="w-64 p-1 bg-dashboard-card border-dashboard-border">
                          <img src={item.imageUrl} alt={item.name} className="w-full rounded object-cover" />
                        </HoverCardContent>
                      </HoverCard>
                    ) : (
                      <div className="w-10 h-10 rounded bg-dashboard-border flex items-center justify-center text-xs text-muted-foreground">
                        N/A
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-dashboard-accent font-medium text-xs py-1">{item.sku}</TableCell>
                  <TableCell className="text-foreground truncate max-w-[150px] text-xs py-1">{item.name}</TableCell>
                  <TableCell className="text-foreground text-right text-xs py-1">{formatNumber(item.stockQuantity)}</TableCell>
                  <TableCell className="text-foreground text-right text-xs py-1">{formatNumber(item.kitsQuantity)}</TableCell>
                  <TableCell className="text-foreground text-right text-xs py-1">{formatCurrency(item.stockQuantity * item.unitPrice)}</TableCell>
                  <TableCell className="text-foreground text-right text-xs py-1">{item.lastEntryQty != null ? formatNumber(item.lastEntryQty) : "-"}</TableCell>
                  <TableCell className="text-muted-foreground text-right text-xs py-1">{item.lastEntryDate || "-"}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>

        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-2 border-t border-dashboard-border">
            <span className="text-xs text-muted-foreground">
              {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedItems.length)} de {filteredAndSortedItems.length}
            </span>
            <div className="flex items-center gap-1">
              <Button variant="outline" size="icon" className="h-6 w-6 border-dashboard-border" onClick={() => setCurrentPage(Math.max(1, currentPage - 1))} disabled={currentPage === 1}>
                <ChevronLeft className="h-3 w-3" />
              </Button>
              {getPageNumbers().map((page, index) =>
                typeof page === "number" ? (
                  <Button
                    key={index}
                    variant={currentPage === page ? "default" : "outline"}
                    size="icon"
                    className={cn("h-6 w-6 text-xs", currentPage === page ? "bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent" : "border-dashboard-border")}
                    onClick={() => setCurrentPage(page)}
                  >
                    {page}
                  </Button>
                ) : (
                  <span key={index} className="px-1 text-muted-foreground text-xs">...</span>
                )
              )}
              <Button variant="outline" size="icon" className="h-6 w-6 border-dashboard-border" onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))} disabled={currentPage === totalPages}>
                <ChevronRight className="h-3 w-3" />
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
