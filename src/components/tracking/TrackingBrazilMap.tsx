import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useMemo } from "react";
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

  const handleClick = (geo: GeographyType) => {
    const uf = geo.properties.uf;
    if (uf) onEstadoClick(uf);
  };

  const renderTooltipContent = (meta: MetaItem) => {
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
        <div className="brazil-map-container h-full" style={{ position: "relative" }}>
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
            onClick={handleClick}
          >
            <Tooltip trigger="hover" float tooltipContent={renderTooltipContent} />
          </BrazilHeatmap>
        </div>
      </CardContent>
    </Card>
  );
};
