import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
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
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    return (
      <div className="rounded-lg border border-dashboard-border bg-dashboard-card p-2 shadow-lg">
        <p className="mb-1 text-xs font-semibold text-foreground">Dia {label}</p>
        {payload.map((entry: any, index: number) => (
          <p key={index} className="text-xs" style={{ color: entry.color }}>
            {entry.name}: {formatNumber(entry.value)}
          </p>
        ))}
      </div>
    );
  }
  return null;
};

export const MiniLineChart = ({ region, data, index }: MiniLineChartProps) => {
  return (
    <div 
      className="rounded-lg border border-dashboard-border bg-dashboard-card p-4 transition-all duration-300 hover:border-dashboard-accent/50 animate-fade-in"
      style={{ animationDelay: `${index * 50}ms` }}
    >
      <h4 className="mb-3 text-sm font-semibold text-dashboard-accent">
        {region}
      </h4>
      <ResponsiveContainer width="100%" height={120}>
        <LineChart data={data} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
          <XAxis
            dataKey="day"
            stroke="#4a5568"
            tick={{ fill: '#a0aec0', fontSize: 9 }}
            tickFormatter={(value) => value % 5 === 0 ? value : ''}
          />
          <YAxis
            stroke="#4a5568"
            tick={{ fill: '#a0aec0', fontSize: 9 }}
            tickFormatter={(value) => `${(value / 1000).toFixed(0)}k`}
          />
          <Tooltip content={<CustomTooltip />} />
          <Line
            type="monotone"
            dataKey="expedidas"
            name="Expedidas"
            stroke="hsl(var(--dashboard-blue))"
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
            animationBegin={index * 100}
          />
          <Line
            type="monotone"
            dataKey="baixadas"
            name="Baixadas"
            stroke="hsl(var(--dashboard-orange))"
            strokeWidth={2}
            dot={false}
            animationDuration={1000}
            animationBegin={index * 100 + 200}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
};
