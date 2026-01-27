import { ScrollArea } from "@/components/ui/scroll-area";
import { MiniLineChart } from "./MiniLineChart";

interface DayData {
  day: number;
  expedidas: number;
  baixadas: number;
}

interface RegionalDailyData {
  region: string;
  data: DayData[];
}

interface RegionalLineChartsProps {
  data: RegionalDailyData[];
}

export const RegionalLineCharts = ({ data }: RegionalLineChartsProps) => {
  return (
    <div className="h-full rounded-lg border border-dashboard-border bg-dashboard-card/50 p-4">
      <h3 className="mb-4 text-sm font-semibold text-dashboard-accent">
        Evolução Diária por Regional
      </h3>
      <ScrollArea className="h-[calc(100%-2rem)]">
        <div className="flex flex-col gap-4 pr-4">
          {data.map((regionalData, index) => (
            <MiniLineChart
              key={regionalData.region}
              region={regionalData.region}
              data={regionalData.data}
              index={index}
            />
          ))}
        </div>
      </ScrollArea>
    </div>
  );
};
