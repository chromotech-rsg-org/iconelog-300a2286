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
 import { Search, ChevronLeft, ChevronRight, ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react";
 import { SKUItem } from "@/data/stockData";
 import { formatNumber, formatCurrency } from "@/data/mockData";
 import { cn } from "@/lib/utils";
 
 interface StockLocationTablesProps {
   matrizItems: SKUItem[];
   baseItems: SKUItem[];
   selectedSKU: string | null;
   selectedGrupo: string | null;
   onSKUClick: (sku: string) => void;
   onGrupoClick: (grupo: string) => void;
 }
 
 type SortDirection = "asc" | "desc" | null;
 type SortField = "sku" | "name" | "grupo" | "stockQuantity" | "value" | "tempoParado" | "base" | "kitsQuantity";
 
 interface SortConfig {
   field: SortField | null;
   direction: SortDirection;
 }
 
 const LocationTable = ({
   items,
   title,
   type,
   selectedSKU,
   onSKUClick,
   onGrupoClick,
 }: {
   items: SKUItem[];
   title: string;
   type: "matriz" | "base";
   selectedSKU: string | null;
   onSKUClick: (sku: string) => void;
   onGrupoClick: (grupo: string) => void;
 }) => {
   const [searchTerm, setSearchTerm] = useState("");
   const [currentPage, setCurrentPage] = useState(1);
   const [itemsPerPage, setItemsPerPage] = useState(10);
   const [sortConfig, setSortConfig] = useState<SortConfig>({ field: null, direction: null });
 
   const filteredAndSortedItems = useMemo(() => {
     let result = items.filter(item => 
       item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.grupo.toLowerCase().includes(searchTerm.toLowerCase()) ||
       (item.base && item.base.toLowerCase().includes(searchTerm.toLowerCase()))
     );
 
     if (sortConfig.field && sortConfig.direction) {
       result = [...result].sort((a, b) => {
         let aVal: number | string;
         let bVal: number | string;
         
         switch (sortConfig.field) {
           case "sku":
             aVal = a.sku;
             bVal = b.sku;
             break;
           case "name":
             aVal = a.name;
             bVal = b.name;
             break;
           case "grupo":
             aVal = a.grupo;
             bVal = b.grupo;
             break;
           case "stockQuantity":
             aVal = a.stockQuantity;
             bVal = b.stockQuantity;
             break;
           case "kitsQuantity":
             aVal = a.kitsQuantity;
             bVal = b.kitsQuantity;
             break;
           case "value":
             aVal = a.stockQuantity * a.unitPrice;
             bVal = b.stockQuantity * b.unitPrice;
             break;
           case "tempoParado":
             aVal = a.tempoParado;
             bVal = b.tempoParado;
             break;
           case "base":
             aVal = a.base || "";
             bVal = b.base || "";
             break;
           default:
             return 0;
         }
 
         if (typeof aVal === "string" && typeof bVal === "string") {
           return sortConfig.direction === "asc" 
             ? aVal.localeCompare(bVal)
             : bVal.localeCompare(aVal);
         }
         
         return sortConfig.direction === "asc"
           ? (aVal as number) - (bVal as number)
           : (bVal as number) - (aVal as number);
       });
     }
 
     return result;
   }, [items, searchTerm, sortConfig]);
 
   const totalPages = Math.ceil(filteredAndSortedItems.length / itemsPerPage);
   const startIndex = (currentPage - 1) * itemsPerPage;
   const paginatedItems = filteredAndSortedItems.slice(startIndex, startIndex + itemsPerPage);
 
   const handleSort = (field: SortField) => {
     setSortConfig(prev => {
       if (prev.field !== field) {
         return { field, direction: "asc" };
       }
       if (prev.direction === "asc") {
         return { field, direction: "desc" };
       }
       return { field: null, direction: null };
     });
   };
 
   const SortIcon = ({ field }: { field: SortField }) => {
     if (sortConfig.field !== field) {
       return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
     }
     return sortConfig.direction === "asc" 
       ? <ArrowUp className="h-3 w-3 ml-1 text-dashboard-accent" />
       : <ArrowDown className="h-3 w-3 ml-1 text-dashboard-accent" />;
   };
 
   const getPageNumbers = () => {
     const pages: (number | string)[] = [];
     if (totalPages <= 5) {
       for (let i = 1; i <= totalPages; i++) pages.push(i);
     } else {
       if (currentPage <= 2) {
         pages.push(1, 2, 3, "...", totalPages);
       } else if (currentPage >= totalPages - 1) {
         pages.push(1, "...", totalPages - 2, totalPages - 1, totalPages);
       } else {
         pages.push(1, "...", currentPage, "...", totalPages);
       }
     }
     return pages;
   };
 
   return (
     <Card className="bg-dashboard-card border-dashboard-border">
       <CardHeader className="pb-2">
         <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
           <CardTitle className="text-sm font-semibold text-foreground">
             {title} <span className="text-xs font-normal text-muted-foreground">({filteredAndSortedItems.length} itens)</span>
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
         <div className="overflow-auto max-h-[300px] custom-scrollbar">
           <Table>
             <TableHeader className="sticky top-0 bg-dashboard-card z-10">
               <TableRow className="border-dashboard-border">
                 <TableHead className="text-muted-foreground text-xs w-10">Foto</TableHead>
                 <TableHead 
                   className="text-muted-foreground text-xs cursor-pointer hover:text-foreground"
                   onClick={() => handleSort("sku")}
                 >
                   <span className="flex items-center">SKU <SortIcon field="sku" /></span>
                 </TableHead>
                 <TableHead 
                   className="text-muted-foreground text-xs cursor-pointer hover:text-foreground"
                   onClick={() => handleSort("name")}
                 >
                   <span className="flex items-center">Nome <SortIcon field="name" /></span>
                 </TableHead>
                 {type === "base" && (
                   <TableHead 
                     className="text-muted-foreground text-xs cursor-pointer hover:text-foreground"
                     onClick={() => handleSort("base")}
                   >
                     <span className="flex items-center">Base <SortIcon field="base" /></span>
                   </TableHead>
                 )}
                 <TableHead 
                   className="text-muted-foreground text-xs cursor-pointer hover:text-foreground"
                   onClick={() => handleSort("grupo")}
                 >
                   <span className="flex items-center">Grupo <SortIcon field="grupo" /></span>
                 </TableHead>
                 <TableHead 
                   className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground"
                   onClick={() => handleSort("stockQuantity")}
                 >
                   <span className="flex items-center justify-end">Qtde <SortIcon field="stockQuantity" /></span>
                 </TableHead>
                 <TableHead 
                   className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground"
                   onClick={() => handleSort("kitsQuantity")}
                 >
                   <span className="flex items-center justify-end">Kits <SortIcon field="kitsQuantity" /></span>
                 </TableHead>
                 <TableHead 
                   className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground"
                   onClick={() => handleSort("value")}
                 >
                   <span className="flex items-center justify-end">Valor <SortIcon field="value" /></span>
                 </TableHead>
                 {type === "matriz" && (
                   <TableHead 
                     className="text-muted-foreground text-xs text-right cursor-pointer hover:text-foreground"
                     onClick={() => handleSort("tempoParado")}
                   >
                     <span className="flex items-center justify-end">Dias <SortIcon field="tempoParado" /></span>
                   </TableHead>
                 )}
               </TableRow>
             </TableHeader>
             <TableBody>
               {paginatedItems.map((item) => (
                 <TableRow 
                   key={item.id} 
                   className={cn(
                     "border-dashboard-border hover:bg-dashboard-border/50 cursor-pointer",
                     selectedSKU === item.sku && "bg-dashboard-accent/10"
                   )}
                   onClick={() => onSKUClick(item.sku)}
                 >
                   <TableCell className="py-1">
                     <img 
                       src={item.imageUrl} 
                       alt={item.name}
                       className="w-8 h-8 rounded object-cover border border-dashboard-border"
                     />
                   </TableCell>
                   <TableCell className="text-dashboard-accent font-medium text-xs py-1">{item.sku}</TableCell>
                   <TableCell className="text-foreground truncate max-w-[120px] text-xs py-1">{item.name}</TableCell>
                   {type === "base" && (
                     <TableCell className="text-dashboard-blue font-medium text-xs py-1">{item.base || '-'}</TableCell>
                   )}
                   <TableCell 
                     className="text-muted-foreground cursor-pointer hover:text-foreground text-xs py-1"
                     onClick={(e) => { e.stopPropagation(); onGrupoClick(item.grupo); }}
                   >
                     {item.grupo}
                   </TableCell>
                   <TableCell className="text-foreground text-right text-xs py-1">{formatNumber(item.stockQuantity)}</TableCell>
                   <TableCell className="text-foreground text-right text-xs py-1">{formatNumber(item.kitsQuantity)}</TableCell>
                   <TableCell className="text-foreground text-right text-xs py-1">{formatCurrency(item.stockQuantity * item.unitPrice)}</TableCell>
                   {type === "matriz" && (
                     <TableCell className="text-foreground text-right text-xs py-1">{item.tempoParado}</TableCell>
                   )}
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </div>
         
         {/* Pagination */}
         {totalPages > 1 && (
           <div className="flex items-center justify-between px-4 py-2 border-t border-dashboard-border">
             <span className="text-xs text-muted-foreground">
               {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredAndSortedItems.length)} de {filteredAndSortedItems.length}
             </span>
             <div className="flex items-center gap-1">
               <Button
                 variant="outline"
                 size="icon"
                 className="h-6 w-6 border-dashboard-border"
                 onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                 disabled={currentPage === 1}
               >
                 <ChevronLeft className="h-3 w-3" />
               </Button>
               {getPageNumbers().map((page, index) => (
                 typeof page === "number" ? (
                   <Button
                     key={index}
                     variant={currentPage === page ? "default" : "outline"}
                     size="icon"
                     className={cn(
                       "h-6 w-6 text-xs",
                       currentPage === page 
                         ? "bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent" 
                         : "border-dashboard-border"
                     )}
                     onClick={() => setCurrentPage(page)}
                   >
                     {page}
                   </Button>
                 ) : (
                   <span key={index} className="px-1 text-muted-foreground text-xs">...</span>
                 )
               ))}
               <Button
                 variant="outline"
                 size="icon"
                 className="h-6 w-6 border-dashboard-border"
                 onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                 disabled={currentPage === totalPages}
               >
                 <ChevronRight className="h-3 w-3" />
               </Button>
             </div>
           </div>
         )}
       </CardContent>
     </Card>
   );
 };
 
 export const StockLocationTables = ({
   matrizItems,
   baseItems,
   selectedSKU,
   selectedGrupo,
   onSKUClick,
   onGrupoClick,
 }: StockLocationTablesProps) => {
   return (
     <div className="space-y-4">
       <LocationTable
         items={matrizItems}
         title="Estoque Matriz"
         type="matriz"
         selectedSKU={selectedSKU}
         onSKUClick={onSKUClick}
         onGrupoClick={onGrupoClick}
       />
       <LocationTable
         items={baseItems}
         title="Estoque Base"
         type="base"
         selectedSKU={selectedSKU}
         onSKUClick={onSKUClick}
         onGrupoClick={onGrupoClick}
       />
     </div>
   );
 };