import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
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
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown, Package, Calendar, Boxes, DollarSign } from "lucide-react";
import { formatNumber, formatCurrency } from "@/data/mockData";
import { cn } from "@/lib/utils";
import type { StockItem } from "@/hooks/useEstoqueData";

const formatDateBR = (dateStr: string): string => {
  const normalized = String(dateStr).replace(/\//g, "-");
  const parts = normalized.split("-");
  if (parts.length === 3) {
    // If YYYY-MM-DD format
    if (parts[0].length === 4) {
      return `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    // Already DD/MM/YYYY or DD-MM-YYYY
    return `${parts[0]}/${parts[1]}/${parts[2]}`;
  }
  return dateStr;
};

interface StockLocationTablesProps {
  matrizItems: StockItem[];
  selectedSKU: string | null;
  onSKUClick: (sku: string) => void;
  onNameClick?: (name: string) => void;
  onDateClick?: (date: string) => void;
  onCategoryClick?: (category: string) => void;
}

type SortDirection = "asc" | "desc" | null;
type SortField = "sku" | "name" | "category" | "stockQuantity" | "kitsQuantity" | "lastEntryQty" | "lastEntryDate";

interface SortConfig {
  field: SortField | null;
  direction: SortDirection;
}

export const StockLocationTables = ({
  matrizItems,
  selectedSKU,
  onSKUClick,
  onNameClick,
  onDateClick,
  onCategoryClick,
}: StockLocationTablesProps) => {
  const { t } = useLanguage();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(20);
  const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });
  const [hoveredItem, setHoveredItem] = useState<StockItem | null>(null);
  const [modalItem, setModalItem] = useState<StockItem | null>(null);

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
            case "category": aVal = a.category; bVal = b.category; break;
            case "stockQuantity": aVal = a.stockQuantity; bVal = b.stockQuantity; break;
            case "kitsQuantity": aVal = a.kitsQuantity; bVal = b.kitsQuantity; break;
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
    <>
      <Card className="bg-dashboard-card border-dashboard-border">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
            <CardTitle className="text-base font-semibold text-foreground">
              Estoque Matriz (Barueri) <span className="text-sm font-normal text-muted-foreground">({filteredAndSortedItems.length} itens)</span>
            </CardTitle>
            <div className="flex items-center gap-2">
              <Select value={itemsPerPage.toString()} onValueChange={(v) => { setItemsPerPage(Number(v)); setCurrentPage(1); }}>
                <SelectTrigger className="w-16 h-7 text-xs bg-dashboard-dark border-dashboard-border">
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
          <div className="overflow-auto max-h-[600px] custom-scrollbar">
            <Table>
              <TableHeader className="sticky top-0 bg-dashboard-card z-10">
                <TableRow className="border-dashboard-border">
                 <TableHead className="text-muted-foreground text-sm w-24">Foto</TableHead>
                  <TableHead className="text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => handleSort("sku")}>
                    <span className="flex items-center">Código <SortIcon field="sku" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => handleSort("name")}>
                    <span className="flex items-center">Nome <SortIcon field="name" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-sm cursor-pointer hover:text-foreground" onClick={() => handleSort("category")}>
                    <span className="flex items-center">Fornecedor <SortIcon field="category" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-sm text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("stockQuantity")}>
                    <span className="flex items-center justify-end">Qtde <SortIcon field="stockQuantity" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-sm text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("kitsQuantity")}>
                    <span className="flex items-center justify-end">Kits <SortIcon field="kitsQuantity" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-sm text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("lastEntryDate")}>
                    <span className="flex items-center justify-end">Ult. Ent. Data <SortIcon field="lastEntryDate" /></span>
                  </TableHead>
                  <TableHead className="text-muted-foreground text-sm text-right cursor-pointer hover:text-foreground" onClick={() => handleSort("lastEntryQty")}>
                    <span className="flex items-center justify-end">Ult. Ent. Qtd <SortIcon field="lastEntryQty" /></span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paginatedItems.map((item) => (
                  <TableRow
                    key={item.sku}
                    className={cn(
                      "border-dashboard-border hover:bg-dashboard-border/50",
                      selectedSKU === item.sku && "bg-dashboard-accent/10"
                    )}
                    onMouseEnter={() => setHoveredItem(item)}
                    onMouseLeave={() => setHoveredItem(null)}
                  >
                    <TableCell className="py-1.5">
                      {item.imageUrl ? (
                        <div className="w-20 h-20 rounded-lg overflow-hidden bg-white border border-dashboard-border cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={(e) => { e.stopPropagation(); setModalItem(item); }}>
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="w-full h-full object-contain p-1"
                          />
                        </div>
                      ) : (
                        <div className="w-20 h-20 rounded-lg bg-dashboard-border flex items-center justify-center text-xs text-muted-foreground">
                          N/A
                        </div>
                      )}
                    </TableCell>
                    <TableCell
                      className="text-dashboard-accent font-medium text-sm py-1.5 cursor-pointer hover:underline"
                      onClick={() => onSKUClick(item.sku)}
                    >
                      {item.sku}
                    </TableCell>
                    <TableCell
                      className="text-foreground truncate max-w-[200px] text-sm py-1.5 cursor-pointer hover:underline"
                      onClick={() => onNameClick?.(item.name)}
                    >
                      {item.name}
                    </TableCell>
                    <TableCell
                      className="text-foreground font-semibold text-sm py-1.5 truncate max-w-[150px] cursor-pointer hover:underline"
                      onClick={() => item.category && onCategoryClick?.(item.category)}
                    >
                      {item.category || "-"}
                    </TableCell>
                    <TableCell className="text-foreground text-right text-sm py-1.5">{formatNumber(item.stockQuantity)}</TableCell>
                    <TableCell className="text-foreground text-right text-sm py-1.5">{formatNumber(item.kitsQuantity)}</TableCell>
                    <TableCell
                      className="text-muted-foreground text-right text-sm py-1.5 cursor-pointer hover:underline"
                      onClick={() => item.lastEntryDate && onDateClick?.(item.lastEntryDate)}
                    >
                      {item.lastEntryDate ? formatDateBR(item.lastEntryDate) : "-"}
                    </TableCell>
                    <TableCell className="text-foreground text-right text-sm py-1.5">{item.lastEntryQty != null ? formatNumber(item.lastEntryQty) : "-"}</TableCell>
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

      {/* Hover tooltip for product preview */}
      {hoveredItem && (
        <div className="fixed bottom-4 right-4 z-50 w-80 bg-dashboard-card border border-dashboard-border rounded-xl shadow-2xl p-4 pointer-events-none animate-fade-in">
          <div className="flex gap-3">
            {hoveredItem.imageUrl && (
              <img src={hoveredItem.imageUrl} alt={hoveredItem.name} className="w-20 h-20 rounded-lg object-cover border border-dashboard-border" />
            )}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-dashboard-accent font-medium">{hoveredItem.sku}</p>
              <p className="text-sm font-semibold text-foreground truncate">{hoveredItem.name}</p>
              <p className="text-xs text-muted-foreground mt-1">{hoveredItem.category}</p>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
            <div><span className="text-muted-foreground">Estoque:</span> <span className="text-foreground font-medium">{formatNumber(hoveredItem.stockQuantity)}</span></div>
            <div><span className="text-muted-foreground">Kits:</span> <span className="text-foreground font-medium">{formatNumber(hoveredItem.kitsQuantity)}</span></div>
            <div><span className="text-muted-foreground">Valor:</span> <span className="text-foreground font-medium">{formatCurrency(hoveredItem.totalValue)}</span></div>
            <div><span className="text-muted-foreground">M³:</span> <span className="text-foreground font-medium">{hoveredItem.m3Total.toFixed(2)}</span></div>
            {hoveredItem.lastEntryDate && (
              <div className="col-span-2"><span className="text-muted-foreground">Ult. Entrada:</span> <span className="text-foreground font-medium">{hoveredItem.lastEntryQty} un - {formatDateBR(hoveredItem.lastEntryDate)}</span></div>
            )}
            {hoveredItem.daysSinceLastMovement != null && (
              <div className="col-span-2"><span className="text-muted-foreground">Dias sem mov.:</span> <span className="text-foreground font-medium">{hoveredItem.daysSinceLastMovement}</span></div>
            )}
          </div>
        </div>
      )}

      <Dialog open={!!modalItem} onOpenChange={(open) => !open && setModalItem(null)}>
        <DialogContent className="bg-dashboard-card border-dashboard-border max-w-2xl max-h-[90vh] overflow-y-auto">
          {modalItem && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-3">
                  <span className="text-dashboard-accent">{modalItem.sku}</span>
                  <span className="text-foreground">{modalItem.name}</span>
                </DialogTitle>
                <p className="text-sm text-muted-foreground mt-1">Fornecedor: <span className="text-foreground font-medium">{modalItem.category || "-"}</span></p>
              </DialogHeader>
              <div className="space-y-6">
                {/* Large product image */}
                {modalItem.imageUrl && (
                  <div className="w-full aspect-square max-h-96 overflow-hidden rounded-xl border border-dashboard-border">
                    <img src={modalItem.imageUrl} alt={modalItem.name} className="w-full h-full object-contain bg-white" />
                  </div>
                )}

                {/* Info grid */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-dashboard-dark rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-dashboard-accent" />
                      <span className="text-xs text-muted-foreground">Estoque</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{formatNumber(modalItem.stockQuantity)}</p>
                  </div>
                  <div className="bg-dashboard-dark rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Boxes className="h-4 w-4 text-dashboard-blue" />
                      <span className="text-xs text-muted-foreground">Kits</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{formatNumber(modalItem.kitsQuantity)}</p>
                  </div>
                  <div className="bg-dashboard-dark rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <DollarSign className="h-4 w-4 text-dashboard-accent" />
                      <span className="text-xs text-muted-foreground">Valor Total</span>
                    </div>
                    <p className="text-sm font-bold text-foreground">{formatCurrency(modalItem.totalValue)}</p>
                  </div>
                  <div className="bg-dashboard-dark rounded-xl p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Package className="h-4 w-4 text-muted-foreground" />
                      <span className="text-xs text-muted-foreground">M³ Total</span>
                    </div>
                    <p className="text-xl font-bold text-foreground">{modalItem.m3Total.toFixed(2)}</p>
                  </div>
                </div>

                {/* Movimentações - full width side by side */}
                <div className="bg-dashboard-dark rounded-xl p-4 space-y-3">
                  <h3 className="text-sm font-semibold text-foreground">Movimentações</h3>
                  <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-xs">
                    <div><span className="text-muted-foreground">Ult. Entrada:</span> <span className="text-foreground">{modalItem.lastEntryQty ?? "-"} un - {modalItem.lastEntryDate ? formatDateBR(modalItem.lastEntryDate) : "-"}</span></div>
                    <div><span className="text-muted-foreground">Ult. Saída:</span> <span className="text-foreground">{modalItem.lastExitQty ?? "-"} un - {modalItem.lastExitDate ? formatDateBR(modalItem.lastExitDate) : "-"}</span></div>
                    <div><span className="text-muted-foreground">Total Entradas:</span> <span className="text-foreground">{modalItem.totalEntryQty != null ? formatNumber(modalItem.totalEntryQty) : "-"}</span></div>
                    <div><span className="text-muted-foreground">Total Saídas:</span> <span className="text-foreground">{modalItem.totalExitQty != null ? formatNumber(modalItem.totalExitQty) : "-"}</span></div>
                    {modalItem.daysSinceLastMovement != null && (
                      <div className="col-span-2"><span className="text-muted-foreground">Dias sem mov.:</span> <span className="text-foreground">{modalItem.daysSinceLastMovement}</span></div>
                    )}
                  </div>
                </div>

                {/* Price info */}
                <div className="flex justify-between items-center bg-dashboard-dark rounded-xl p-4">
                  <div>
                    <span className="text-xs text-muted-foreground">Preço Unitário</span>
                    <p className="text-lg font-bold text-dashboard-accent">{formatCurrency(modalItem.unitPrice)}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-xs text-muted-foreground">Valor Padrão</span>
                    <p className="text-lg font-bold text-foreground">{formatCurrency(parseFloat(modalItem.vl_padrao || "0"))}</p>
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
