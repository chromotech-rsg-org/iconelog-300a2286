import { useMemo } from "react";
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
import { useLanguage } from "@/contexts/LanguageContext";

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

interface GeneralDailyChartProps {
  data: RegionalDailyData[];
  selectedDay: number | null;
  selectedMetric: "expedidas" | "baixadas" | null;
  selectedMonths: number[];
  selectedDateRange?: { from: Date | undefined; to: Date | undefined };
  onDayClick: (day: number) => void;
}

const CustomTooltip = ({ active, payload, label }: any) => {
  if (active && payload && payload.length) {
    const firstPayload = payload[0]?.payload;
    const dateStr = firstPayload?.dateStr;
    let displayLabel = `Dia ${label}`;
    if (dateStr) {
      const parts = dateStr.split("-");
      displayLabel = `${parts[2]}/${parts[1]}/${parts[0]}`;
    }
    return (
      <div className="rounded-lg border border-dashboard-border bg-dashboard-card p-2 shadow-lg z-50">
        <p className="mb-1 text-xs font-semibold text-foreground">{displayLabel}</p>
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

export const GeneralDailyChart = ({
  data,
  selectedDay,
  selectedMetric,
  selectedMonths,
  selectedDateRange,
  onDayClick,
}: GeneralDailyChartProps) => {
  const { t } = useLanguage();
  

  // Aggregate all regions into a single daily series
  const generalData = useMemo(() => {
    const dayMap = new Map<number, { day: number; dateStr?: string; expedidas: number; baixadas: number }>();
    data.forEach((regional) => {
      regional.data.forEach((d) => {
        const existing = dayMap.get(d.day);
        if (existing) {
          existing.expedidas += d.expedidas;
          existing.baixadas += d.baixadas;
          if (!existing.dateStr && d.dateStr) existing.dateStr = d.dateStr;
        } else {
          dayMap.set(d.day, { day: d.day, dateStr: d.dateStr, expedidas: d.expedidas, baixadas: d.baixadas });
        }
      });
    });
    return Array.from(dayMap.values()).sort((a, b) => {
      if (a.dateStr && b.dateStr) return a.dateStr.localeCompare(b.dateStr);
      return a.day - b.day;
    });
  }, [data]);

  const getLineOpacity = (metric: "expedidas" | "baixadas") => {
    if (selectedMetric === null) return 1;
    return selectedMetric === metric ? 1 : 0.2;
  };

  const getLineStrokeWidth = (metric: "expedidas" | "baixadas") => {
    if (selectedMetric === null) return 2;
    return selectedMetric === metric ? 3 : 1;
  };

  const needsScroll = generalData.length > 0;
  const chartWidthPx = needsScroll ? Math.max(generalData.length * 28, 800) : undefined;
  const dotRadius = generalData.length > 60 ? 2 : 4;

  return (
    <div className="rounded-lg border border-dashboard-border bg-dashboard-card/50 p-4 mb-0 shrink-0 overflow-hidden">
      <h3 className="mb-3 text-sm font-semibold text-dashboard-accent">
        {t("Evolução Diária Geral")}
        {selectedDay !== null && (
          <span className="ml-2 text-xs font-normal text-muted-foreground">
            ({t("Dia")} {selectedDay} {t("destacado")})
          </span>
        )}
      </h3>
      <div className="chart-scroll-x">
        <div style={{ width: chartWidthPx || "100%", minWidth: chartWidthPx || "100%", height: 140 }}>
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={generalData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
              <XAxis
                dataKey="dateStr"
                stroke="#4a5568"
                tick={{ fill: "#a0aec0", fontSize: 9 }}
                tickFormatter={(value) => {
                  if (value && typeof value === "string" && value.includes("-")) {
                    const parts = value.split("-");
                    return `${parts[2]}/${parts[1]}`;
                  }
                  let month = "";
                  if (selectedMonths && selectedMonths.length > 0) {
                    month = String(selectedMonths[0]).padStart(2, "0");
                  } else if (selectedDateRange?.from) {
                    month = String(selectedDateRange.from.getMonth() + 1).padStart(2, "0");
                  } else {
                    month = String(new Date().getMonth() + 1).padStart(2, "0");
                  }
                  return `${value}/${month}`;
                }}
                interval={generalData.length > 60 ? Math.floor(generalData.length / 20) : generalData.length > 20 ? 4 : generalData.length > 10 ? 2 : 0}
              />
              <YAxis
                stroke="#4a5568"
                tick={{ fill: "#a0aec0", fontSize: 9 }}
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
                dot={{ r: dotRadius, fill: "hsl(var(--dashboard-blue))", strokeWidth: 0, cursor: "pointer" }}
                activeDot={{
                  r: 7,
                  cursor: "pointer",
                  strokeWidth: 2,
                  stroke: "hsl(var(--dashboard-accent))",
                  onClick: (data: any) => {
                    if (data?.payload) onDayClick(data.payload.day);
                  },
                }}
                animationDuration={1000}
                opacity={getLineOpacity("expedidas")}
              />
              <Line
                type="monotone"
                dataKey="baixadas"
                name="Baixadas"
                stroke="hsl(var(--dashboard-orange))"
                strokeWidth={getLineStrokeWidth("baixadas")}
                dot={{ r: dotRadius, fill: "hsl(var(--dashboard-orange))", strokeWidth: 0, cursor: "pointer" }}
                activeDot={{
                  r: 7,
                  cursor: "pointer",
                  strokeWidth: 2,
                  stroke: "hsl(var(--dashboard-accent))",
                  onClick: (data: any) => {
                    if (data?.payload) onDayClick(data.payload.day);
                  },
                }}
                animationDuration={1000}
                animationBegin={200}
                opacity={getLineOpacity("baixadas")}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};
