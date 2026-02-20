import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PieChart, Pie, Cell, ResponsiveContainer } from "recharts";
import { Button } from "@/components/ui/button";

interface Props {
  percNoPrazo: number;
  noPrazo: number;
  foraPrazo: number;
  onPrazoClick: (prazo: boolean) => void;
  selectedPrazo: boolean | null;
}

export const TrackingGaugeChart = ({ percNoPrazo, noPrazo, foraPrazo, onPrazoClick, selectedPrazo }: Props) => {
  const gaugeData = [
    { name: "No Prazo", value: percNoPrazo },
    { name: "Fora do Prazo", value: 100 - percNoPrazo },
  ];

  // Needle angle calculation
  const RADIAN = Math.PI / 180;

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Performance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center">
        <div className="relative w-full h-[160px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={70}
                outerRadius={95}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="hsl(142, 76%, 36%)" />
                <Cell fill="hsl(0, 70%, 55%)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          {/* Center text */}
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-4 pointer-events-none">
            <span className="text-3xl font-bold text-foreground">{percNoPrazo.toFixed(1)}%</span>
            <span className="text-[10px] text-muted-foreground">No Prazo</span>
          </div>
        </div>

        <div className="flex gap-2 mt-2 w-full">
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 text-xs ${selectedPrazo === true ? "bg-green-500/20 border-green-500 text-green-400" : "border-border text-muted-foreground hover:text-green-400 hover:border-green-500"}`}
            onClick={() => onPrazoClick(true)}
          >
            ● No Prazo ({noPrazo})
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 text-xs ${selectedPrazo === false ? "bg-red-500/20 border-red-500 text-red-400" : "border-border text-muted-foreground hover:text-red-400 hover:border-red-500"}`}
            onClick={() => onPrazoClick(false)}
          >
            ● Fora ({foraPrazo})
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
