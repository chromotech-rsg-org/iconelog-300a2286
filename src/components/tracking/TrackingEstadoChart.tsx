import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { name: string; value: number }[];
  onEstadoClick: (uf: string) => void;
  selectedEstado: string | null;
}

export const TrackingEstadoChart = ({ data, onEstadoClick, selectedEstado }: Props) => {
  return (
    <Card className={`bg-card border-border cursor-pointer transition-all ${selectedEstado ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Pedidos por Estado</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} onClick={(d) => {
            if (d?.activePayload?.[0]) onEstadoClick(d.activePayload[0].payload.name);
          }}>
            <XAxis dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={10} />
            <YAxis stroke="hsl(0, 0%, 60%)" fontSize={10} hide />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)" }} />
            <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[4, 4, 0, 0]} cursor="pointer" label={{ position: "top", fill: "hsl(0, 0%, 95%)", fontSize: 9 }}>
              {data.map((entry) => (
                <Cell key={entry.name} opacity={selectedEstado && selectedEstado !== entry.name ? 0.3 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
