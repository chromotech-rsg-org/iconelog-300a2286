 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
 import { formatCurrency } from "@/data/mockData";
 
 interface StockValueBarChartProps {
   data: { name: string; value: number }[];
   selectedGrupo: string | null;
   onGrupoClick: (grupo: string) => void;
 }
 
 export const StockValueBarChart = ({
   data,
   selectedGrupo,
   onGrupoClick,
 }: StockValueBarChartProps) => {
   const handleClick = (chartData: any) => {
     if (chartData && chartData.activePayload && chartData.activePayload[0]) {
       onGrupoClick(chartData.activePayload[0].payload.name);
     }
   };
 
   return (
     <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
       <CardHeader className="pb-2">
         <CardTitle className="text-base font-semibold text-foreground">Valor Estoque | Grupo</CardTitle>
       </CardHeader>
       <CardContent className="h-[180px]">
         <ResponsiveContainer width="100%" height="100%">
           <BarChart data={data} layout="vertical" onClick={handleClick}>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 20%)" />
             <XAxis type="number" stroke="hsl(0, 0%, 75%)" fontSize={11} tickFormatter={(v) => `${(v/1000).toFixed(0)}k`} />
             <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 75%)" fontSize={11} width={90} tick={{ fill: 'hsl(0, 0%, 90%)' }} />
             <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => formatCurrency(value)} />
             <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]} />
           </BarChart>
         </ResponsiveContainer>
       </CardContent>
     </Card>
   );
 };