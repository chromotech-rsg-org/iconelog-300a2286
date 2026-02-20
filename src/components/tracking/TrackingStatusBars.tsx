import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  finalizado: number;
  transito: number;
  onStatusClick: (status: string) => void;
  selectedStatus: string | null;
}

export const TrackingStatusBars = ({ finalizado, transito, onStatusClick, selectedStatus }: Props) => {
  const data = [
    { name: "FINALIZADO", value: finalizado },
    { name: "TRÂNSITO", value: transito },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Status Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="p-3">
        <div style={{ height: 90 }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              data={data}
              layout="vertical"
              margin={{ top: 0, right: 40, left: 5, bottom: 0 }}
              barSize={16}
              onClick={(d) => {
                if (d?.activePayload?.[0]) onStatusClick(d.activePayload[0].payload.name);
              }}
            >
              <XAxis type="number" hide />
              <YAxis
                type="category"
                dataKey="name"
                width={85}
                tick={{ fill: "hsl(0, 0%, 65%)", fontSize: 10 }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)", fontSize: 11 }}
                formatter={(value: number) => [value.toLocaleString(), "Pedidos"]}
              />
              <Bar dataKey="value" name="Pedidos" radius={[0, 4, 4, 0]} cursor="pointer" label={{ position: "right", fill: "hsl(0, 0%, 75%)", fontSize: 10 }}>
                {data.map((entry) => (
                  <Cell
                    key={entry.name}
                    fill={selectedStatus && selectedStatus !== entry.name ? "hsl(0, 0%, 25%)" : "hsl(45, 100%, 50%)"}
                    opacity={selectedStatus && selectedStatus !== entry.name ? 0.4 : 1}
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
