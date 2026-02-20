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

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-0 pt-3">
        <CardTitle className="text-sm font-medium text-foreground">Performance</CardTitle>
      </CardHeader>
      <CardContent className="flex flex-col items-center justify-between flex-1 pb-3">
        <div className="relative w-full flex-1 min-h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <PieChart>
              <Pie
                data={gaugeData}
                cx="50%"
                cy="85%"
                startAngle={180}
                endAngle={0}
                innerRadius={55}
                outerRadius={80}
                dataKey="value"
                stroke="none"
              >
                <Cell fill="hsl(142, 76%, 36%)" />
                <Cell fill="hsl(0, 70%, 50%)" />
              </Pie>
            </PieChart>
          </ResponsiveContainer>
          <div className="absolute inset-0 flex flex-col items-center justify-end pb-0 pointer-events-none">
            <span className="text-2xl font-black text-foreground">{percNoPrazo.toFixed(2)}%</span>
          </div>
        </div>

        <div className="flex gap-2 mt-1 w-full">
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 text-[10px] h-7 ${selectedPrazo === true ? "bg-green-500/20 border-green-500 text-green-400" : "border-border text-muted-foreground hover:text-green-400 hover:border-green-500"}`}
            onClick={() => onPrazoClick(true)}
          >
            No Prazo
          </Button>
          <Button
            variant="outline"
            size="sm"
            className={`flex-1 text-[10px] h-7 ${selectedPrazo === false ? "bg-red-500/20 border-red-500 text-red-400" : "border-border text-muted-foreground hover:text-red-400 hover:border-red-500"}`}
            onClick={() => onPrazoClick(false)}
          >
            Fora do Prazo
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};
