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
  const colors = ["hsl(142, 76%, 36%)", "hsl(217, 91%, 60%)"];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Status Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="h-[120px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" onClick={(d) => {
            if (d?.activePayload?.[0]) onStatusClick(d.activePayload[0].payload.name);
          }}>
            <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} hide />
            <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={10} width={80} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)" }} />
            <Bar dataKey="value" radius={[0, 4, 4, 0]} cursor="pointer" label={{ position: "right", fill: "hsl(0, 0%, 95%)", fontSize: 11 }}>
              {data.map((entry, i) => (
                <Cell key={i} fill={colors[i]} opacity={selectedStatus && selectedStatus !== entry.name ? 0.3 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
