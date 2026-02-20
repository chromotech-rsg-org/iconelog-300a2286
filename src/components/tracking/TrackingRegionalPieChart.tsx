import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(45, 100%, 50%)", "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(25, 95%, 53%)", "hsl(280, 65%, 60%)"];

interface Props {
  data: { name: string; value: number }[];
  onRegionalClick: (regional: string) => void;
  selectedRegional: string | null;
}

export const TrackingRegionalPieChart = ({ data, onRegionalClick, selectedRegional }: Props) => {
  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Pedido | Região</CardTitle>
      </CardHeader>
      <CardContent className="p-2 space-y-1">
        {data.map((item, i) => {
          const perc = total > 0 ? ((item.value / total) * 100).toFixed(1) : "0";
          const isSelected = selectedRegional === item.name;
          const dimmed = selectedRegional && !isSelected;
          return (
            <div
              key={item.name}
              className={`flex items-center justify-between text-xs cursor-pointer rounded px-2 py-1 transition-all hover:bg-muted/30 ${isSelected ? "bg-primary/10 ring-1 ring-primary" : ""} ${dimmed ? "opacity-30" : ""}`}
              onClick={() => onRegionalClick(item.name)}
            >
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                <span className="text-muted-foreground">{item.name}</span>
              </div>
              <span className="text-muted-foreground">{perc}%</span>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
