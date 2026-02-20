import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, Cell } from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";

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
  // Show all cities, one per line
  const chartData = data;
  const barHeight = 28;
  const chartHeight = Math.max(chartData.length * barHeight, 100);

  return (
    <Card className={`bg-card border-border transition-all ${selectedCidade ? "ring-1 ring-primary" : ""}`}>
      <CardHeader className="pb-1">
        <div className="flex items-center justify-between">
          <CardTitle className="text-sm font-medium text-foreground">Entregas por Cidade</CardTitle>
          <div className="flex items-center gap-3 text-[10px]">
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(45, 100%, 50%)" }} />
              <span className="text-muted-foreground">FINALIZADO</span>
            </span>
            <span className="flex items-center gap-1">
              <span className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: "hsl(0, 0%, 55%)" }} />
              <span className="text-muted-foreground">TRÂNSITO</span>
            </span>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-2">
        <ScrollArea className="h-[350px]" style={{ overflow: "scroll" as any }}>
          <div style={{ height: chartHeight, minHeight: 100 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={chartData}
                layout="vertical"
                margin={{ top: 0, right: 45, left: 5, bottom: 0 }}
                barGap={0}
                barSize={10}
                onClick={(d) => {
                  if (d?.activePayload?.[0]) onCidadeClick(d.activePayload[0].payload.name);
                }}
              >
                <XAxis type="number" hide />
                <YAxis
                  type="category"
                  dataKey="name"
                  width={120}
                  tick={{ fill: "hsl(0, 0%, 70%)", fontSize: 9 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)", fontSize: 11 }}
                />
                <Bar
                  dataKey="finalizado"
                  name="Finalizado"
                  fill="hsl(45, 100%, 50%)"
                  radius={[0, 3, 3, 0]}
                  cursor="pointer"
                  label={{ position: "right", fill: "hsl(45, 100%, 50%)", fontSize: 9, fontWeight: 600 }}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={`f-${entry.name}`}
                      opacity={selectedCidade && selectedCidade !== entry.name.toUpperCase() ? 0.3 : 1}
                    />
                  ))}
                </Bar>
                <Bar
                  dataKey="transito"
                  name="Trânsito"
                  fill="hsl(0, 0%, 55%)"
                  radius={[0, 3, 3, 0]}
                  cursor="pointer"
                  label={{ position: "right", fill: "hsl(0, 0%, 55%)", fontSize: 9, fontWeight: 600 }}
                >
                  {chartData.map((entry) => (
                    <Cell
                      key={`t-${entry.name}`}
                      opacity={selectedCidade && selectedCidade !== entry.name.toUpperCase() ? 0.3 : 1}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
