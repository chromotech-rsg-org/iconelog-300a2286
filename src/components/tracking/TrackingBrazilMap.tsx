import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
import { brazilStatePaths } from "./brazil-map-paths";

interface Props {
  estadoData: { name: string; value: number }[];
  onEstadoClick: (uf: string) => void;
  selectedEstado: string | null;
}

export const TrackingBrazilMap = ({ estadoData, onEstadoClick, selectedEstado }: Props) => {
  const maxValue = useMemo(() => Math.max(...estadoData.map(e => e.value), 1), [estadoData]);
  
  const getColor = (uf: string) => {
    const entry = estadoData.find(e => e.name === uf);
    if (!entry || entry.value === 0) return "hsl(0, 0%, 15%)";
    const intensity = Math.max(0.15, entry.value / maxValue);
    // Yellow tones: from dark (low) to bright (high)
    return `hsl(45, 100%, ${Math.round(20 + intensity * 40)}%)`;
  };

  const getOpacity = (uf: string) => {
    if (!selectedEstado) return 1;
    return selectedEstado === uf ? 1 : 0.3;
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Mapa do Brasil</CardTitle>
      </CardHeader>
      <CardContent className="flex items-center justify-center p-2">
        <svg viewBox="0 0 700 680" className="w-full max-w-[300px] h-auto">
          {brazilStatePaths.map(({ uf, d }) => (
            <path
              key={uf}
              d={d}
              fill={getColor(uf)}
              stroke="hsl(0, 0%, 25%)"
              strokeWidth={0.5}
              opacity={getOpacity(uf)}
              className="cursor-pointer transition-all duration-200 hover:brightness-125"
              onClick={() => onEstadoClick(uf)}
            >
              <title>{`${uf}: ${estadoData.find(e => e.name === uf)?.value || 0} pedidos`}</title>
            </path>
          ))}
        </svg>
      </CardContent>
    </Card>
  );
};
