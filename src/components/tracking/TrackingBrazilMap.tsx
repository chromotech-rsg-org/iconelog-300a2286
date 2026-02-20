import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState, useRef } from "react";
import BrazilHeatmap from "react-brazil-heatmap";
import "react-brazil-heatmap/dist/style.css";
import type { GeographyType } from "react-brazil-heatmap";

interface EstadoStats {
  name: string;
  value: number;
  noPrazo: number;
  foraPrazo: number;
  semOcorrencia: number;
  comOcorrencia: number;
}

interface Props {
  estadoData: EstadoStats[];
  onEstadoClick: (uf: string) => void;
  selectedEstado: string | null;
}

const UF_NAMES: Record<string, string> = {
  AC: "Acre", AL: "Alagoas", AM: "Amazonas", AP: "Amapá",
  BA: "Bahia", CE: "Ceará", DF: "Distrito Federal", ES: "Espírito Santo",
  GO: "Goiás", MA: "Maranhão", MG: "Minas Gerais", MS: "Mato Grosso do Sul",
  MT: "Mato Grosso", PA: "Pará", PB: "Paraíba", PE: "Pernambuco",
  PI: "Piauí", PR: "Paraná", RJ: "Rio de Janeiro", RN: "Rio Grande do Norte",
  RO: "Rondônia", RR: "Roraima", RS: "Rio Grande do Sul", SC: "Santa Catarina",
  SE: "Sergipe", SP: "São Paulo", TO: "Tocantins",
};

export const TrackingBrazilMap = ({ estadoData, onEstadoClick, selectedEstado }: Props) => {
  const [hoveredState, setHoveredState] = useState<string | null>(null);
  const [tooltipPos, setTooltipPos] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const heatmapData = useMemo(() => {
    const d: Record<string, number> = {};
    estadoData.forEach(e => { d[e.name] = e.value; });
    return d;
  }, [estadoData]);

  const handleClick = (geo: GeographyType) => {
    const uf = geo.properties.uf;
    if (uf) onEstadoClick(uf);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      const target = e.target as SVGElement;
      const uf = target?.getAttribute?.("data-uf") || target?.closest?.("[data-uf]")?.getAttribute("data-uf");
      if (uf) setHoveredState(uf);
    }
  };

  const hoveredData = useMemo(() => {
    if (!hoveredState) return null;
    return estadoData.find(e => e.name === hoveredState) || null;
  }, [hoveredState, estadoData]);

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-1 pt-2">
        <CardTitle className="text-sm font-medium text-foreground">Pedidos | Estado</CardTitle>
      </CardHeader>
      <CardContent className="p-2 relative flex-1 min-h-0" ref={containerRef} onMouseMove={handleMouseMove}>
        <div
          className="brazil-map-container h-full"
          onMouseLeave={() => setHoveredState(null)}
          style={{ position: "relative" }}
        >
          <style>{`
            .react-brazil-heatmap__state {
              cursor: pointer;
              transition: opacity 0.2s ease, filter 0.2s ease;
              stroke: hsl(0, 0%, 30%);
              stroke-width: 0.5;
            }
            .react-brazil-heatmap__state:hover {
              filter: brightness(1.3);
              stroke: hsl(45, 100%, 50%);
              stroke-width: 1.5;
            }
            ${selectedEstado ? `.react-brazil-heatmap__state { opacity: 0.3; }
            .react-brazil-heatmap__state[data-uf="${selectedEstado}"] { opacity: 1; }` : ""}
          `}</style>
          <BrazilHeatmap
            data={heatmapData}
            colorRange={["hsl(45, 30%, 20%)", "hsl(45, 100%, 50%)"]}
            onClick={handleClick}
          />
        </div>

        {hoveredData && (
          <div
            className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-2.5 min-w-[200px]"
            style={{
              left: Math.min(tooltipPos.x + 12, 160),
              top: tooltipPos.y - 10,
            }}
          >
            <div className="text-xs font-bold text-primary mb-1.5 border-b border-border pb-1">
              {UF_NAMES[hoveredData.name] || hoveredData.name}
            </div>
            <div className="space-y-0.5 text-[10px]">
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">Pedidos</span>
                <span className="text-foreground font-semibold">{hoveredData.value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">% No Prazo</span>
                <span className="text-green-400 font-semibold">
                  {hoveredData.value > 0 ? ((hoveredData.noPrazo / hoveredData.value) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-muted-foreground">% Fora do Prazo</span>
                <span className="text-red-400 font-semibold">
                  {hoveredData.value > 0 ? ((hoveredData.foraPrazo / hoveredData.value) * 100).toFixed(1) : "0.0"}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
