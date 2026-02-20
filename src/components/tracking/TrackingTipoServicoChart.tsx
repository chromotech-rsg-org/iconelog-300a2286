import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { name: string; value: number }[];
  onTipoClick: (tipo: string) => void;
  selectedTipo: string | null;
}

const ALLOWED_TYPES = ["ENTREGA", "REENTREGA", "COLETA", "RETIRA MATRIZ", "DESCARTE", "DIFAL"];

export const TrackingTipoServicoChart = ({ data, onTipoClick, selectedTipo }: Props) => {
  const filtered = data.filter(d => ALLOWED_TYPES.includes(d.name));
  const chartHeight = Math.max(filtered.length * 45, 100);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Pedidos | Tipo de Serviço</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={filtered}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 5, bottom: 0 }}
              barSize={16}
              onClick={(d) => {
                if (d?.activePayload?.[0]) onTipoClick(d.activePayload[0].payload.name);
              }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={100}
                tick={{ fill: "hsl(0, 0%, 65%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)", fontSize: 11 }}
                formatter={(value: number) => [value.toLocaleString(), "Pedidos"]}
              />
              <Bar dataKey="value" name="Pedidos" radius={[0, 4, 4, 0]} cursor="pointer" label={{ position: "right", fill: "hsl(0, 0%, 75%)", fontSize: 10 }}>
                {filtered.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={selectedTipo && selectedTipo !== entry.name ? "hsl(0, 0%, 25%)" : "hsl(var(--primary))"}
                    opacity={selectedTipo && selectedTipo !== entry.name ? 0.4 : 1}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
};
