import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const COLORS = ["hsl(45, 100%, 50%)", "hsl(217, 91%, 60%)", "hsl(142, 76%, 36%)", "hsl(25, 95%, 53%)", "hsl(280, 65%, 60%)", "hsl(0, 72%, 51%)", "hsl(180, 60%, 45%)"];

// Map individual regionals to macro regions
const MACRO_REGIONS: Record<string, string> = {
  "SUDESTE": "SUDESTE",
  "NORDESTE": "NORDESTE",
  "SUL": "SUL",
  "NORTE": "NORTE",
  "CENTRO-OESTE": "CENTRO-OESTE",
};

const UF_TO_MACRO: Record<string, string> = {
  SP: "SUDESTE", RJ: "SUDESTE", MG: "SUDESTE", ES: "SUDESTE",
  BA: "NORDESTE", SE: "NORDESTE", AL: "NORDESTE", PE: "NORDESTE", PB: "NORDESTE", RN: "NORDESTE", CE: "NORDESTE", PI: "NORDESTE", MA: "NORDESTE",
  PR: "SUL", SC: "SUL", RS: "SUL",
  AM: "NORTE", PA: "NORTE", AC: "NORTE", RO: "NORTE", RR: "NORTE", AP: "NORTE", TO: "NORTE",
  GO: "CENTRO-OESTE", MT: "CENTRO-OESTE", MS: "CENTRO-OESTE", DF: "CENTRO-OESTE",
};

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
  // Group data by macro region
  const macroMap = new Map<string, number>();
  data.forEach(item => {
    // Check if item.name is already a macro region
    const upper = item.name.toUpperCase().trim();
    const macroKey = Object.keys(MACRO_REGIONS).find(k => upper.includes(k));
    if (macroKey) {
      macroMap.set(macroKey, (macroMap.get(macroKey) || 0) + item.value);
    } else {
      // Try UF mapping or keep as-is
      macroMap.set(upper, (macroMap.get(upper) || 0) + item.value);
    }
  });

  const pieData = Array.from(macroMap.entries())
    .map(([name, value]) => ({ name, value }))
    .sort((a, b) => b.value - a.value);

  const total = pieData.reduce((s, d) => s + d.value, 0);
  const withPercent = pieData.map(d => ({ ...d, percent: total > 0 ? d.value / total : 0 }));

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-0">
        <CardTitle className="text-sm font-medium text-foreground">Pedido | Região</CardTitle>
      </CardHeader>
      <CardContent className="p-2 h-[260px]">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={withPercent}
              cx="50%"
              cy="45%"
              outerRadius={75}
              innerRadius={30}
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
              wrapperStyle={{ fontSize: 10, paddingTop: 4 }}
              formatter={(value) => <span className="text-muted-foreground text-[10px]">{value}</span>}
            />
          </PieChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
