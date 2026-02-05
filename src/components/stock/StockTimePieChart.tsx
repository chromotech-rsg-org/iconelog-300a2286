 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";
 
 const COLORS = ['hsl(142, 76%, 36%)', 'hsl(45, 100%, 50%)', 'hsl(25, 95%, 53%)', 'hsl(0, 84%, 60%)'];
 
 interface StockTimePieChartProps {
   data: { name: string; value: number }[];
   selectedTempo: string | null;
   onTempoClick: (tempo: string) => void;
 }
 
 export const StockTimePieChart = ({
   data,
   selectedTempo,
   onTempoClick,
 }: StockTimePieChartProps) => {
   return (
     <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedTempo ? 'ring-2 ring-dashboard-orange' : ''}`}>
       <CardHeader className="pb-2">
         <CardTitle className="text-sm font-medium text-foreground">Tempo Parado | SKU</CardTitle>
       </CardHeader>
       <CardContent className="h-[180px]">
         <ResponsiveContainer width="100%" height="100%">
           <PieChart>
             <Pie
               data={data}
               cx="50%"
               cy="50%"
               innerRadius={30}
               outerRadius={55}
               dataKey="value"
               onClick={(entry) => onTempoClick(entry.name)}
             >
               {data.map((entry, index) => (
                 <Cell 
                   key={`cell-${index}`} 
                   fill={COLORS[index % COLORS.length]} 
                   opacity={selectedTempo && selectedTempo !== entry.name ? 0.3 : 1}
                   stroke={selectedTempo === entry.name ? '#fff' : 'none'}
                   strokeWidth={2}
                 />
               ))}
             </Pie>
             <Tooltip />
           </PieChart>
         </ResponsiveContainer>
       </CardContent>
     </Card>
   );
 };