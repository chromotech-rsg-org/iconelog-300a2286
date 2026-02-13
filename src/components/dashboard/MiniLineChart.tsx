import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine,
} from "recharts";
import { formatNumber } from "@/data/mockData";

interface DayData {
  day: number;
  expedidas: number;
  baixadas: number;
}

interface MiniLineChartProps {
  region: string;
  data: DayData[];
  index: number;
  selectedDay: number | null;
  selectedMetric: "expedidas" | "baixadas" | null;
  selectedMonths: number[];
  selectedDateRange?: { from: Date | undefined; to: Date | undefined };
  isSelected: boolean;
  onDayClick: (day: number) => void;
  onRegionClick: (region: string) => void;
  onLinePointClick: (region: string, day: number, metric: "expedidas" | "baixadas") => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-dashboard-border bg-dashboard-card p-2 shadow-lg z-50">
        <p className="mb-1 text-xs font-semibold text-foreground">Dia {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
        <p className="mt-1 text-xs text-muted-foreground">Clique na bolinha para filtrar</p>
      </div>
    );
  }
  return null;
};

export const MiniLineChart = ({ 
  region, 
  data, 
  index, 
  selectedDay,
  selectedMetric,
  selectedMonths,
  selectedDateRange,
  isSelected,
  onDayClick,
  onRegionClick,
  onLinePointClick 
}: MiniLineChartProps) => {
  
  const getLineOpacity = (metric: "expedidas" | "baixadas") => {
    if (selectedMetric === null) return 1;
    return selectedMetric === metric ? 1 : 0.2;
  };

  const getLineStrokeWidth = (metric: "expedidas" | "baixadas") => {
    if (selectedMetric === null) return 2;
    return selectedMetric === metric ? 3 : 1;
  };

  // Handler for clicking on a specific dot
  const handleDotClick = (metric: "expedidas" | "baixadas") => (data: any) => {
    if (data && data.payload) {
      onLinePointClick(region, data.payload.day, metric);
    }
  };

  return (
    <div 
      className={`rounded-lg border bg-dashboard-card p-4 transition-all duration-300 animate-fade-in ${
        isSelected 
          ? "border-dashboard-accent shadow-lg shadow-dashboard-accent/20" 
          : "border-dashboard-border hover:border-dashboard-accent/50"
      }`}
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <h4 
        className={`mb-3 text-sm font-semibold transition-colors cursor-pointer hover:text-dashboard-accent ${
          isSelected ? "text-dashboard-accent" : "text-foreground"
        }`}
        onClick={() => onRegionClick(region)}
      >
        {region}
        {isSelected && <span className="ml-2 text-xs">(selecionada)</span>}
      </h4>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart 
          data={data} 
          margin={{ top: 5, right: 10, left: 0, bottom: 5 }}
        >
          <XAxis
            dataKey="day"
            stroke="#4a5568"
            tick={{ fill: '#a0aec0', fontSize: 9 }}
            tickFormatter={(value) => {
              let month = '';
              if (selectedMonths && selectedMonths.length > 0) {
                month = String(selectedMonths[0]).padStart(2, '0');
              } else if (selectedDateRange?.from) {
                month = String(selectedDateRange.from.getMonth() + 1).padStart(2, '0');
              } else {
                month = String(new Date().getMonth() + 1).padStart(2, '0');
              }
              return `${value}/${month}`;
            }}
            interval={data.length > 20 ? 4 : data.length > 10 ? 2 : 0}
          />
          <YAxis
            stroke="#4a5568"
            tick={{ fill: '#a0aec0', fontSize: 9 }}
            tickFormatter={(value) => {
              if (value >= 1000000) return `${(value / 1000000).toFixed(1)}M`;
              if (value >= 10000) return `${(value / 1000).toFixed(0)}k`;
              if (value >= 1000) return `${(value / 1000).toFixed(1)}k`;
              return String(value);
            }}
            width={45}
          />
          <Tooltip content={<CustomTooltip />} />
          {selectedDay !== null && (
            <ReferenceLine 
              x={selectedDay} 
              stroke="hsl(var(--dashboard-accent))" 
              strokeWidth={2}
              strokeDasharray="3 3"
            />
          )}
          <Line
            type="monotone"
            dataKey="expedidas"
            name="Expedidas"
            stroke="hsl(var(--dashboard-blue))"
            strokeWidth={getLineStrokeWidth("expedidas")}
            dot={{ r: 4, fill: "hsl(var(--dashboard-blue))", strokeWidth: 0, cursor: 'pointer' }}
            activeDot={{ 
              r: 7, 
              cursor: 'pointer', 
              strokeWidth: 2, 
              stroke: "hsl(var(--dashboard-accent))",
              onClick: handleDotClick("expedidas")
            }}
            animationDuration={1000}
            animationBegin={index * 100}
            opacity={getLineOpacity("expedidas")}
          />
          <Line
            type="monotone"
            dataKey="baixadas"
            name="Baixadas"
            stroke="hsl(var(--dashboard-orange))"
            strokeWidth={getLineStrokeWidth("baixadas")}
            dot={{ r: 4, fill: "hsl(var(--dashboard-orange))", strokeWidth: 0, cursor: 'pointer' }}
            activeDot={{ 
              r: 7, 
              cursor: 'pointer', 
              strokeWidth: 2, 
              stroke: "hsl(var(--dashboard-accent))",
              onClick: handleDotClick("baixadas")
            }}
            animationDuration={1000}
            animationBegin={index * 100 + 200}
            opacity={getLineOpacity("baixadas")}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
