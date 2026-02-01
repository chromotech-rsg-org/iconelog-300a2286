import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer, Legend, Tooltip } from "recharts";

interface CategoryData {
  name: string;
  value: number;
}

interface StockCategoryChartProps {
  data: CategoryData[];
}

const COLORS = [
  'hsl(45, 100%, 50%)',   // dashboard-accent
  'hsl(217, 91%, 60%)',   // dashboard-blue
  'hsl(25, 95%, 53%)',    // dashboard-orange
  'hsl(142, 76%, 36%)',   // green
  'hsl(280, 65%, 60%)',   // purple
  'hsl(340, 82%, 52%)',   // pink
  'hsl(180, 70%, 45%)',   // teal
];

export const StockCategoryChart = ({ data }: StockCategoryChartProps) => {
  return (
    <Card className="bg-dashboard-card border-dashboard-border h-full">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-semibold text-foreground">
          Estoque por Categoria
        </CardTitle>
      </CardHeader>
      <CardContent className="h-[250px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={3}
              dataKey="value"
            >
              {data.map((_, index) => (
                <Cell 
                  key={`cell-${index}`} 
                  fill={COLORS[index % COLORS.length]}
                  stroke="transparent"
                />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(0, 0%, 6%)',
                border: '1px solid hsl(0, 0%, 15%)',
                borderRadius: '8px',
                color: 'hsl(0, 0%, 95%)'
              }}
              formatter={(value: number) => [value.toLocaleString('pt-BR'), 'Quantidade']}
            />
            <Legend 
              layout="vertical"
              align="right"
              verticalAlign="middle"
              iconType="circle"
              iconSize={8}
              formatter={(value) => (
                <span style={{ color: 'hsl(0, 0%, 60%)', fontSize: '12px' }}>{value}</span>
              )}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
