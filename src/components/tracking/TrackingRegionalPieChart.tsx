import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(45, 100%, 50%)", "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(25, 95%, 53%)", "hsl(280, 65%, 60%)", "hsl(0, 72%, 51%)", "hsl(180, 60%, 45%)"];

interface Props {
  data: { name: string; value: number }[];
  onRegionalClick: (regional: string) => void;
  selectedRegional: string | null;
}

const CustomTooltip = ({ active, payload }: any) => {
  if (active && payload?.length) {
    const { name, value, percent } = payload[0].payload;
    return (
      <div className="rounded-lg border border-border bg-card/95 backdrop-blur-sm p-2 shadow-xl text-xs">
        <p className="font-semibold text-foreground">{name}</p>
        <p className="text-muted-foreground">{value.toLocaleString()} pedidos ({(percent * 100).toFixed(1)}%)</p>
      </div>
    );
  }
  return null;
};

const renderLabel = ({ name, percent }: any) => {
  if (percent < 0.05) return null;
  return `${(percent * 100).toFixed(0)}%`;
};

export const TrackingRegionalPieChart = ({ data, onRegionalClick, selectedRegional }: Props) => {
  const total = data.reduce((s, d) => s + d.value, 0);
  const withPercent = data.map(d => ({ ...d, percent: total > 0 ? d.value / total : 0 }));

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-0 pt-2">
        <CardTitle className="text-sm font-medium text-foreground">Pedido | Região</CardTitle>
      </CardHeader>
      <CardContent className="p-2 flex-1 min-h-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={withPercent}
              cx="65%"
              cy="50%"
              outerRadius="80%"
              innerRadius="35%"
              dataKey="value"
              nameKey="name"
              label={renderLabel}
              labelLine={false}
              cursor="pointer"
              onClick={(_, idx) => {
                if (withPercent[idx]) onRegionalClick(withPercent[idx].name);
              }}
              stroke="hsl(0, 0%, 10%)"
              strokeWidth={1}
            >
              {withPercent.map((entry, i) => (
                <Cell
                  key={entry.name}
                  fill={selectedRegional && selectedRegional !== entry.name ? "hsl(0, 0%, 25%)" : COLORS[i % COLORS.length]}
                  opacity={selectedRegional && selectedRegional !== entry.name ? 0.35 : 1}
                />
              ))}
            </Pie>
            <Tooltip content={<CustomTooltip />} />
            <Legend
              layout="vertical"
              align="left"
              verticalAlign="middle"
              wrapperStyle={{ fontSize: 9, paddingRight: 4 }}
              formatter={(value) => <span className="text-muted-foreground text-[9px]">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
