import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";

interface CidadeData {
  name: string;
  finalizado: number;
  transito: number;
  total: number;
}

interface Props {
  data: CidadeData[];
  onCidadeClick: (cidade: string) => void;
  selectedCidade: string | null;
}

export const TrackingCidadeChart = ({ data, onCidadeClick, selectedCidade }: Props) => {
  const chartData = data.slice(0, 12);

  return (
    <Card className={`bg-card border-border cursor-pointer transition-all ${selectedCidade ? "ring-1 ring-orange-500" : ""}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Entregas por Cidade</CardTitle>
      </CardHeader>
      <CardContent className="h-[300px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={chartData} layout="vertical" onClick={(d) => {
            if (d?.activePayload?.[0]) onCidadeClick(d.activePayload[0].payload.name);
          }}>
            <XAxis type="number" stroke="hsl(0, 0%, 40%)" fontSize={9} hide />
            <YAxis type="category" dataKey="name" stroke="hsl(0, 0%, 40%)" fontSize={9} width={95} />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)", fontSize: 11 }} />
            <Legend wrapperStyle={{ fontSize: 10 }} />
            <Bar dataKey="finalizado" stackId="a" fill="hsl(142, 76%, 36%)" name="Finalizado" cursor="pointer" />
            <Bar dataKey="transito" stackId="a" fill="hsl(217, 91%, 60%)" name="Trânsito" radius={[0, 4, 4, 0]} cursor="pointer" />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
