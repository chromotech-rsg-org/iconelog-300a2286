import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import { ScrollArea } from "@/components/ui/scroll-area";
import { formatNumber } from "@/data/mockData";

interface RegionalData {
  name: string;
  expedidas: number;
  baixadas: number;
}

interface RegionalBarChartProps {
  data: RegionalData[];
  selectedMetric: "expedidas" | "baixadas" | null;
  selectedRegion: string;
  onRegionClick: (region: string) => void;
  onMetricClick: (metric: "expedidas" | "baixadas") => void;
  onBarClick: (region: string, metric: "expedidas" | "baixadas") => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-dashboard-border bg-dashboard-card p-3 shadow-lg z-50">
        <p className="mb-2 font-semibold text-foreground text-base">{label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-sm" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
        <p className="mt-2 text-xs text-muted-foreground">Clique para filtrar</p>
      </div>
    );
  }
  return null;
};

export const RegionalBarChart = ({ 
  data, 
  selectedMetric,
  selectedRegion,
  onRegionClick, 
  onMetricClick,
  onBarClick 
}: RegionalBarChartProps) => {
  const handleBarClick = (data: any, metric: "expedidas" | "baixadas") => {
    if (data && data.name) {
      onBarClick(data.name, metric);
    }
  };

  const handleLegendClick = (dataKey: string) => {
    onMetricClick(dataKey as "expedidas" | "baixadas");
  };

  const getBarOpacity = (metric: "expedidas" | "baixadas") => {
    if (selectedMetric === null) return 1;
    return selectedMetric === metric ? 1 : 0.3;
  };

  // Calculate height based on number of items - each bar needs ~55px
  const chartHeight = Math.max(data.length * 55, 400);

  return (
    <div className="h-full rounded-lg border border-dashboard-border bg-dashboard-card p-4 flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-base font-semibold text-dashboard-accent">
          Comparativo por Regional
        </h3>
        <div className="flex gap-4 text-sm">
          <button
            onClick={() => onMetricClick("expedidas")}
            className={`flex items-center gap-2 transition-opacity cursor-pointer hover:opacity-100 ${
              selectedMetric === "baixadas" ? "opacity-40" : "opacity-100"
            }`}
          >
            <span className="w-3 h-3 rounded-sm bg-dashboard-blue" />
            <span className="text-foreground">Expedidas</span>
          </button>
          <button
            onClick={() => onMetricClick("baixadas")}
            className={`flex items-center gap-2 transition-opacity cursor-pointer hover:opacity-100 ${
              selectedMetric === "expedidas" ? "opacity-40" : "opacity-100"
            }`}
          >
            <span className="w-3 h-3 rounded-sm bg-dashboard-orange" />
            <span className="text-foreground">Baixadas</span>
          </button>
        </div>
      </div>
      
      <ScrollArea className="flex-1">
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            <BarChart
              layout="vertical"
              data={data}
              margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
              barGap={4}
              barSize={14}
            >
              <XAxis
                type="number"
                stroke="#4a5568"
                tick={{ fill: '#a0aec0', fontSize: 12 }}
                tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
              />
              <YAxis
                type="category"
                dataKey="name"
                stroke="#4a5568"
                tick={{ fill: '#e2e8f0', fontSize: 13, cursor: 'pointer' }}
                width={110}
                onClick={(e: any) => {
                  if (e && e.value) {
                    onRegionClick(e.value);
                  }
                }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="expedidas"
                name="Expedidas"
                fill="hsl(var(--dashboard-blue))"
                radius={[0, 6, 6, 0]}
                animationDuration={800}
                animationBegin={0}
                cursor="pointer"
                onClick={(data) => handleBarClick(data, "expedidas")}
                opacity={getBarOpacity("expedidas")}
              />
              <Bar
                dataKey="baixadas"
                name="Baixadas"
                fill="hsl(var(--dashboard-orange))"
                radius={[0, 6, 6, 0]}
                animationDuration={800}
                animationBegin={200}
                cursor="pointer"
                onClick={(data) => handleBarClick(data, "baixadas")}
                opacity={getBarOpacity("baixadas")}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </ScrollArea>
    </div>
  );
};
