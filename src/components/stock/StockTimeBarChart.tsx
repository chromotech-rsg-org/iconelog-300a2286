 import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
 import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
 
 interface StockTimeBarChartProps {
   data: { name: string; value: number }[];
   selectedGrupo: string | null;
   onGrupoClick: (grupo: string) => void;
 }
 
 export const StockTimeBarChart = ({
   data,
   selectedGrupo,
   onGrupoClick,
 }: StockTimeBarChartProps) => {
   const handleClick = (chartData: any) => {
     if (chartData && chartData.activePayload && chartData.activePayload[0]) {
       onGrupoClick(chartData.activePayload[0].payload.name);
     }
   };
 
   return (
     <Card className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all ${selectedGrupo ? 'ring-2 ring-dashboard-accent' : ''}`}>
       <CardHeader className="pb-2">
         <CardTitle className="text-sm font-medium text-foreground">Tempo Parado Médio | Grupo</CardTitle>
       </CardHeader>
       <CardContent className="h-[180px]">
         <ResponsiveContainer width="100%" height="100%">
           <BarChart data={data} layout="vertical" onClick={handleClick}>
             <CartesianGrid strokeDasharray="3 3" stroke="hsl(0, 0%, 15%)" />
             <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} />
             <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={80} />
             <Tooltip contentStyle={{ backgroundColor: 'hsl(0, 0%, 6%)', border: '1px solid hsl(0, 0%, 15%)' }} formatter={(value: number) => `${value} dias`} />
             <Bar dataKey="value" fill="hsl(217, 91%, 60%)" radius={[0, 4, 4, 0]} />
           </BarChart>
         </ResponsiveContainer>
       </CardContent>
     </Card>
   );
 };