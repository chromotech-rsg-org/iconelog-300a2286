import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState, useRef } from "react";
import BrazilHeatmap from "react-brazil-heatmap";
import "react-brazil-heatmap/dist/style.css";
import type { GeographyType, Metadata } from "react-brazil-heatmap";

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
    estadoData.forEach(e => {
      d[e.name] = e.value;
    });
    return d;
  }, [estadoData]);

  const metadata = useMemo<Metadata>(() => {
    const m: Metadata = {};
    estadoData.forEach(e => {
      const total = e.value;
      const percNoPrazo = total > 0 ? ((e.noPrazo / total) * 100).toFixed(2) : "0.00";
      const percForaPrazo = total > 0 ? ((e.foraPrazo / total) * 100).toFixed(2) : "0.00";
      m[e.name] = {
        "Nome Estado": UF_NAMES[e.name] || e.name,
        "Contagem de Cod Conhecimento": total,
        "Sem Ocorrência": e.semOcorrencia,
        "Com Ocorrência": e.comOcorrencia,
        "% No Prazo": `${percNoPrazo}%`,
        "% Fora do Prazo": `${percForaPrazo}%`,
      };
    });
    return m;
  }, [estadoData]);

  const handleClick = (geo: GeographyType) => {
    const uf = geo.properties.uf;
    if (uf) onEstadoClick(uf);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setTooltipPos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
    }
  };

  const hoveredData = useMemo(() => {
    if (!hoveredState) return null;
    return estadoData.find(e => e.name === hoveredState) || null;
  }, [hoveredState, estadoData]);

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Pedidos | Estado</CardTitle>
      </CardHeader>
      <CardContent className="p-2 relative" ref={containerRef} onMouseMove={handleMouseMove}>
        <div
          className="brazil-map-container"
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
            colorRange={["hsl(220, 15%, 25%)", "hsl(220, 60%, 45%)"]}
            onClick={handleClick}
          />
        </div>

        {/* Custom Tooltip */}
        {hoveredData && (
          <div
            className="absolute z-50 pointer-events-none bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-3 min-w-[220px]"
            style={{
              left: Math.min(tooltipPos.x + 12, 200),
              top: tooltipPos.y - 10,
            }}
          >
            <div className="text-xs font-bold text-primary mb-2 border-b border-border pb-1.5">
              {UF_NAMES[hoveredData.name] || hoveredData.name}
            </div>
            <div className="space-y-1 text-[11px]">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Cod Conhecimento</span>
                <span className="text-foreground font-semibold">{hoveredData.value.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Sem Ocorrência</span>
                <span className="text-foreground font-semibold">{hoveredData.semOcorrencia.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Com Ocorrência</span>
                <span className="text-foreground font-semibold">{hoveredData.comOcorrencia.toLocaleString()}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">% No Prazo</span>
                <span className="text-green-400 font-semibold">
                  {hoveredData.value > 0 ? ((hoveredData.noPrazo / hoveredData.value) * 100).toFixed(2) : "0.00"}%
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">% Fora do Prazo</span>
                <span className="text-red-400 font-semibold">
                  {hoveredData.value > 0 ? ((hoveredData.foraPrazo / hoveredData.value) * 100).toFixed(2) : "0.00"}%
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
