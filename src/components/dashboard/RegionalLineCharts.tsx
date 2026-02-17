import { MiniLineChart } from "./MiniLineChart";

interface DayData {
  day: number;
  dateStr?: string;
  expedidas: number;
  baixadas: number;
}

interface RegionalDailyData {
  region: string;
  data: DayData[];
}

interface RegionalLineChartsProps {
  data: RegionalDailyData[];
  selectedDay: number | null;
  selectedMetric: "expedidas" | "baixadas" | null;
  selectedMonths: number[];
  selectedDateRange?: { from: Date | undefined; to: Date | undefined };
  selectedRegion: string;
  onDayClick: (day: number) => void;
  onRegionClick: (region: string) => void;
  onLinePointClick: (region: string, day: number, metric: "expedidas" | "baixadas") => void;
}

export const RegionalLineCharts = ({ 
  data, 
  selectedDay,
  selectedMetric,
  selectedMonths,
  selectedDateRange,
  selectedRegion,
  onDayClick,
  onRegionClick,
  onLinePointClick 
}: RegionalLineChartsProps) => {
  return (
    <div className="h-full rounded-lg border border-dashboard-border bg-dashboard-card/50 p-4 overflow-y-auto custom-scrollbar">
      <h3 className="mb-4 text-sm font-semibold text-dashboard-accent">
        Evolução Diária por Regional
        {selectedDay !== null && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            (Dia {selectedDay} destacado)
          </span>
        )}
      </h3>
      <div className="flex flex-col gap-4">
        {data.map((regionalData, index) => (
          <MiniLineChart
            key={regionalData.region}
            region={regionalData.region}
            data={regionalData.data}
            index={index}
            selectedDay={selectedDay}
            selectedMetric={selectedMetric}
            selectedMonths={selectedMonths}
            selectedDateRange={selectedDateRange}
            isSelected={selectedRegion === regionalData.region}
            onDayClick={onDayClick}
            onRegionClick={onRegionClick}
            onLinePointClick={onLinePointClick}
          />
        ))}
      </div>
    </div>
  );
};
