 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import { SKUItem } from "@/data/stockData";
 import { formatNumber, formatCurrency } from "@/data/mockData";
 
 interface StockLocationTablesProps {
   matrizItems: SKUItem[];
   baseItems: SKUItem[];
   selectedSKU: string | null;
   selectedGrupo: string | null;
   onSKUClick: (sku: string) => void;
   onGrupoClick: (grupo: string) => void;
 }
 
 export const StockLocationTables = ({
   matrizItems,
   baseItems,
   selectedSKU,
   selectedGrupo,
   onSKUClick,
   onGrupoClick,
 }: StockLocationTablesProps) => {
   return (
     <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
       {/* Estoque Matriz Table */}
       <Card className="bg-dashboard-card border-dashboard-border">
         <CardHeader className="pb-2">
           <CardTitle className="text-sm font-semibold text-foreground">
             Estoque Matriz <span className="text-xs font-normal text-muted-foreground">({matrizItems.length} itens)</span>
           </CardTitle>
         </CardHeader>
         <CardContent className="overflow-auto max-h-[250px] custom-scrollbar p-0">
           <Table>
             <TableHeader>
               <TableRow className="border-dashboard-border">
                 <TableHead className="text-muted-foreground text-xs">SKU</TableHead>
                 <TableHead className="text-muted-foreground text-xs">Nome</TableHead>
                 <TableHead className="text-muted-foreground text-xs">Grupo</TableHead>
                 <TableHead className="text-muted-foreground text-xs text-right">Qtde</TableHead>
                 <TableHead className="text-muted-foreground text-xs text-right">Valor</TableHead>
                 <TableHead className="text-muted-foreground text-xs text-right">Dias</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {matrizItems.slice(0, 10).map((item) => (
                 <TableRow 
                   key={item.id} 
                   className={`border-dashboard-border hover:bg-dashboard-border/50 cursor-pointer ${selectedSKU === item.sku ? 'bg-dashboard-accent/10' : ''}`}
                   onClick={() => onSKUClick(item.sku)}
                 >
                   <TableCell className="text-dashboard-accent font-medium text-xs py-2">{item.sku}</TableCell>
                   <TableCell className="text-foreground truncate max-w-[100px] text-xs py-2">{item.name}</TableCell>
                   <TableCell 
                     className="text-muted-foreground cursor-pointer hover:text-foreground text-xs py-2"
                     onClick={(e) => { e.stopPropagation(); onGrupoClick(item.grupo); }}
                   >
                     {item.grupo}
                   </TableCell>
                   <TableCell className="text-foreground text-right text-xs py-2">{formatNumber(item.stockQuantity)}</TableCell>
                   <TableCell className="text-foreground text-right text-xs py-2">{formatCurrency(item.stockQuantity * item.unitPrice)}</TableCell>
                   <TableCell className="text-foreground text-right text-xs py-2">{item.tempoParado}</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </CardContent>
       </Card>
 
       {/* Estoque Base Table */}
       <Card className="bg-dashboard-card border-dashboard-border">
         <CardHeader className="pb-2">
           <CardTitle className="text-sm font-semibold text-foreground">
             Estoque Base <span className="text-xs font-normal text-muted-foreground">({baseItems.length} itens)</span>
           </CardTitle>
         </CardHeader>
         <CardContent className="overflow-auto max-h-[250px] custom-scrollbar p-0">
           <Table>
             <TableHeader>
               <TableRow className="border-dashboard-border">
                 <TableHead className="text-muted-foreground text-xs">Base</TableHead>
                 <TableHead className="text-muted-foreground text-xs">SKU</TableHead>
                 <TableHead className="text-muted-foreground text-xs">Grupo</TableHead>
                 <TableHead className="text-muted-foreground text-xs text-right">Qtde</TableHead>
                 <TableHead className="text-muted-foreground text-xs text-right">Valor</TableHead>
               </TableRow>
             </TableHeader>
             <TableBody>
               {baseItems.slice(0, 10).map((item) => (
                 <TableRow 
                   key={item.id} 
                   className={`border-dashboard-border hover:bg-dashboard-border/50 cursor-pointer ${selectedSKU === item.sku ? 'bg-dashboard-accent/10' : ''}`}
                   onClick={() => onSKUClick(item.sku)}
                 >
                   <TableCell className="text-dashboard-blue font-medium text-xs py-2">{item.base || '-'}</TableCell>
                   <TableCell className="text-dashboard-accent text-xs py-2">{item.sku}</TableCell>
                   <TableCell 
                     className="text-muted-foreground cursor-pointer hover:text-foreground text-xs py-2"
                     onClick={(e) => { e.stopPropagation(); onGrupoClick(item.grupo); }}
                   >
                     {item.grupo}
                   </TableCell>
                   <TableCell className="text-foreground text-right text-xs py-2">{formatNumber(item.stockQuantity)}</TableCell>
                   <TableCell className="text-foreground text-right text-xs py-2">{formatCurrency(item.stockQuantity * item.unitPrice)}</TableCell>
                 </TableRow>
               ))}
             </TableBody>
           </Table>
         </CardContent>
       </Card>
     </div>
   );
 };