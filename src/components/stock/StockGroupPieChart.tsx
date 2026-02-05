 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
 import { formatCurrency } from "@/data/mockData";
 
 const COLORS = ['hsl(45, 100%, 50%)', 'hsl(217, 91%, 60%)', 'hsl(25, 95%, 53%)', 'hsl(142, 76%, 36%)'];
 
 interface StockGroupPieChartProps {
   data: { name: string; value: number }[];
   selectedGrupo: string | null;
   onGrupoClick: (grupo: string) => void;
 }
 
 export const StockGroupPieChart = ({
   data,
   selectedGrupo,
   onGrupoClick,
 }: StockGroupPieChartProps) => {
   // Find the index of the selected item to preserve its color
   const selectedIndex = selectedGrupo ? data.findIndex(d => d.name === selectedGrupo) : -1;
 
   return (
     <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
       <CardHeader className="pb-2">
         <CardTitle className="text-sm font-medium text-foreground">Representação do Estoque | Grupo</CardTitle>
       </CardHeader>
       <CardContent className="h-[180px]">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={data}
               cx="50%"
               cy="50%"
               innerRadius={35}
               outerRadius={60}
               dataKey="value"
               onClick={(entry) => onGrupoClick(entry.name)}
             >
               {data.map((entry, index) => (
                 <Cell 
                   key={`cell-${index}`} 
                   fill={selectedGrupo === entry.name ? COLORS[index % COLORS.length] : (selectedGrupo ? 'hsl(0, 0%, 30%)' : COLORS[index % COLORS.length])} 
                   opacity={1}
                   stroke={selectedGrupo === entry.name ? '#fff' : 'none'}
                   strokeWidth={2}
                 />
               ))}
             </Pie>
             <Tooltip formatter={(value: number) => formatCurrency(value)} />
           </PieChart>
         </ResponsiveContainer>
       </CardContent>
     </Card>
   );
 };