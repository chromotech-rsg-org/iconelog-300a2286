import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo, useState, useRef, useCallback, useEffect } from "react";
import BrazilHeatmap, { Tooltip } from "react-brazil-heatmap";
import "react-brazil-heatmap/dist/style.css";
import type { GeographyType, MetaItem } from "react-brazil-heatmap";

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
  const [scale, setScale] = useState(1);
  const [translate, setTranslate] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const translateStart = useRef({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  const handleWheel = useCallback((e: React.WheelEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setScale(prev => {
      const next = prev + (e.deltaY < 0 ? 0.2 : -0.2);
      return Math.min(4, Math.max(1, next));
    });
  }, []);

  // Prevent native wheel scroll on the map container
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const handler = (e: WheelEvent) => { e.preventDefault(); };
    el.addEventListener("wheel", handler, { passive: false });
    return () => el.removeEventListener("wheel", handler);
  }, []);

  const handleMouseDown = useCallback((e: React.MouseEvent) => {
    if (scale <= 1) return;
    setIsDragging(true);
    dragStart.current = { x: e.clientX, y: e.clientY };
    translateStart.current = { ...translate };
  }, [scale, translate]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!isDragging) return;
    setTranslate({
      x: translateStart.current.x + (e.clientX - dragStart.current.x),
      y: translateStart.current.y + (e.clientY - dragStart.current.y),
    });
  }, [isDragging]);

  const handleMouseUp = useCallback(() => setIsDragging(false), []);

  const heatmapData = useMemo(() => {
    const d: Record<string, number> = {};
    estadoData.forEach(e => { d[e.name] = e.value; });
    return d;
  }, [estadoData]);

  const metadata = useMemo(() => {
    const m: Record<string, Record<string, string | number>> = {};
    estadoData.forEach(e => {
      const percNoPrazo = e.value > 0 ? ((e.noPrazo / e.value) * 100).toFixed(1) : "0.0";
      const percForaPrazo = e.value > 0 ? ((e.foraPrazo / e.value) * 100).toFixed(1) : "0.0";
      m[e.name] = {
        nomeEstado: UF_NAMES[e.name] || e.name,
        pedidos: e.value,
        semOcorrencia: e.semOcorrencia,
        comOcorrencia: e.comOcorrencia,
        percNoPrazo: `${percNoPrazo}%`,
        percForaPrazo: `${percForaPrazo}%`,
      };
    });
    return m;
  }, [estadoData]);

  // Attach click handlers via DOM since the library ignores onClick prop
  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const handleStateClick = (e: Event) => {
      const target = e.currentTarget as SVGElement;
      const classList = target.getAttribute("class") || "";
      const match = classList.match(/react-brazil-heatmap__state--(\w{2})/);
      if (match) {
        const uf = match[1].toUpperCase();
        onEstadoClick(uf);
      }
    };

    // Wait for SVG to render
    const timer = setTimeout(() => {
      const states = el.querySelectorAll(".react-brazil-heatmap__state");
      states.forEach(s => s.addEventListener("click", handleStateClick));
    }, 500);

    return () => {
      clearTimeout(timer);
      const states = el.querySelectorAll(".react-brazil-heatmap__state");
      states.forEach(s => s.removeEventListener("click", handleStateClick));
    };
  }, [onEstadoClick, heatmapData]);

  const renderTooltipContent = (meta: MetaItem) => {
    if (!meta) return null;
    return (
      <div className="bg-card/95 backdrop-blur-sm border border-border rounded-lg shadow-xl p-2.5 min-w-[220px]">
        <div className="text-xs font-bold text-primary mb-1.5 border-b border-border pb-1">
          {meta.nomeEstado}
        </div>
        <div className="space-y-0.5 text-[10px]">
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Contagem de Cod Conhecimento</span>
            <span className="text-foreground font-semibold">{Number(meta.pedidos).toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Sem Ocorrência</span>
            <span className="text-foreground font-semibold">{Number(meta.semOcorrencia).toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">Com Ocorrência</span>
            <span className="text-foreground font-semibold">{Number(meta.comOcorrencia).toLocaleString()}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">% No Prazo</span>
            <span className="text-green-400 font-semibold">{meta.percNoPrazo}</span>
          </div>
          <div className="flex justify-between gap-4">
            <span className="text-muted-foreground">% Fora do Prazo</span>
            <span className="text-red-400 font-semibold">{meta.percForaPrazo}</span>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="bg-card border-border h-full flex flex-col">
      <CardHeader className="pb-0 pt-2 px-2">
        <CardTitle className="text-sm font-medium text-foreground">Pedidos | Estado</CardTitle>
      </CardHeader>
      <CardContent className="p-1 relative flex-1 min-h-0">
        <div
          ref={containerRef}
          className="h-full overflow-hidden"
          style={{ cursor: scale > 1 ? (isDragging ? "grabbing" : "grab") : "default" }}
          onWheel={handleWheel}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <div
            className="brazil-map-container h-full"
            style={{
              position: "relative",
              transform: `scale(${scale}) translate(${translate.x / scale}px, ${translate.y / scale}px)`,
              transformOrigin: "center center",
              transition: isDragging ? "none" : "transform 0.15s ease-out",
            }}
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
              ${selectedEstado ? `
              .react-brazil-heatmap__state { opacity: 0.3; }
              .react-brazil-heatmap__state--${selectedEstado.toLowerCase()} { opacity: 1; stroke: hsl(45, 100%, 50%); stroke-width: 2; }
              ` : ""}
            `}</style>
            <BrazilHeatmap
              data={heatmapData}
              metadata={metadata}
              colorRange={["hsl(45, 30%, 20%)", "hsl(45, 100%, 50%)"]}
            >
              <Tooltip trigger="hover" float tooltipContent={renderTooltipContent} />
            </BrazilHeatmap>
          </div>
        </div>
        {scale > 1 && (
          <button
            className="absolute top-2 right-2 text-[10px] bg-card/80 border border-border rounded px-1.5 py-0.5 text-muted-foreground hover:text-foreground"
            onClick={() => { setScale(1); setTranslate({ x: 0, y: 0 }); }}
          >
            Reset
          </button>
        )}
      </CardContent>
    </Card>
  );
};
