import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";

interface Props {
  data: { name: string; value: number }[];
  onTipoClick: (tipo: string) => void;
  selectedTipo: string | null;
}

export const TrackingTipoServicoChart = ({ data, onTipoClick, selectedTipo }: Props) => {
  return (
    <Card className={`bg-card border-border cursor-pointer transition-all ${selectedTipo ? "ring-2 ring-primary" : ""}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Pedidos por Tipo de Serviço</CardTitle>
      </CardHeader>
      <CardContent className="h-[200px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} layout="vertical" onClick={(d) => {
            if (d?.activePayload?.[0]) onTipoClick(d.activePayload[0].payload.name);
          }}>
            <XAxis type="number" stroke="hsl(0, 0%, 60%)" fontSize={10} hide />
            <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 60%)" fontSize={9} width={100} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)" }} />
            <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[0, 4, 4, 0]} cursor="pointer" label={{ position: "right", fill: "hsl(0, 0%, 95%)", fontSize: 10 }}>
              {data.map((entry) => (
                <Cell key={entry.name} opacity={selectedTipo && selectedTipo !== entry.name ? 0.3 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
