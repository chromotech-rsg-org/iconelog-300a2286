import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { formatNumber } from "@/data/mockData";

interface RegionalData {
  name: string;
  expedidas: number;
  baixadas: number;
}

interface RegionalBarChartProps {
  data: RegionalData[];
  selectedMetric: "expedidas" | "baixadas" | null;
  onRegionClick: (region: string) => void;
  onMetricClick: (metric: "expedidas" | "baixadas") => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-dashboard-border bg-dashboard-card p-3 shadow-lg z-50">
        <p className="mb-2 font-semibold text-foreground">{label}</p>
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
  onRegionClick, 
  onMetricClick 
}: RegionalBarChartProps) => {
  const handleBarClick = (data: any, dataKey: string) => {
    if (data && data.name) {
      onRegionClick(data.name);
    }
  };

  const handleLegendClick = (dataKey: string) => {
    onMetricClick(dataKey as "expedidas" | "baixadas");
  };

  const getBarOpacity = (metric: "expedidas" | "baixadas") => {
    if (selectedMetric === null) return 1;
    return selectedMetric === metric ? 1 : 0.3;
  };

  return (
    <div className="h-full rounded-lg border border-dashboard-border bg-dashboard-card p-4">
      <h3 className="mb-4 text-sm font-semibold text-dashboard-accent">
        Comparativo por Regional
      </h3>
      <ResponsiveContainer width="100%" height="90%">
        <BarChart
          layout="vertical"
          data={data}
          margin={{ top: 5, right: 20, left: 0, bottom: 5 }}
          barGap={2}
          barSize={8}
        >
          <XAxis
            type="number"
            stroke="#4a5568"
            tick={{ fill: '#a0aec0', fontSize: 10 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <YAxis
            type="category"
            dataKey="name"
            stroke="#4a5568"
            tick={{ fill: '#a0aec0', fontSize: 10, cursor: 'pointer' }}
            width={80}
            onClick={(e: any) => {
              if (e && e.value) {
                onRegionClick(e.value);
              }
            }}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend 
            wrapperStyle={{ paddingTop: '10px', cursor: 'pointer' }}
            onClick={(e) => handleLegendClick(e.dataKey as string)}
            formatter={(value) => (
              <span className="text-xs hover:text-dashboard-accent transition-colors">
                {value}
              </span>
            )}
          />
          <Bar
            dataKey="expedidas"
            name="Expedidas"
            fill="hsl(var(--dashboard-blue))"
            radius={[0, 4, 4, 0]}
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
            radius={[0, 4, 4, 0]}
            animationDuration={800}
            animationBegin={200}
            cursor="pointer"
            onClick={(data) => handleBarClick(data, "baixadas")}
            opacity={getBarOpacity("baixadas")}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};
