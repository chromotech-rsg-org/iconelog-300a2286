import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(45, 100%, 50%)", "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(25, 95%, 53%)", "hsl(280, 65%, 60%)"];

interface Props {
  data: { name: string; value: number }[];
  onRegionalClick: (regional: string) => void;
  selectedRegional: string | null;
}

export const TrackingRegionalPieChart = ({ data, onRegionalClick, selectedRegional }: Props) => {
  return (
    <Card className={`bg-card border-border cursor-pointer transition-all ${selectedRegional ? "ring-2 ring-purple-500" : ""}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Pedidos por Região</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              outerRadius={65}
              dataKey="value"
              onClick={(d) => d?.name && onRegionalClick(d.name)}
            >
              {data.map((entry, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={selectedRegional && selectedRegional !== entry.name ? 0.3 : 1} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)" }} />
            <Legend wrapperStyle={{ fontSize: 10, color: "hsl(0, 0%, 60%)" }} />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
