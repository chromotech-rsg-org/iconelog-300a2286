import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { formatNumber, formatCurrency } from "@/data/mockData";
import { Package, Calendar, Box, Clock, ArrowDownToLine, ArrowUpFromLine } from "lucide-react";
import type { EstoqueMatrizItem, EstoqueBaseItem } from "@/hooks/useEstoqueConsolidadoData";
import { useLanguage } from "@/contexts/LanguageContext";

interface EstoqueMatrizHoverProps {
  product: EstoqueMatrizItem;
  children: React.ReactNode;
}

interface EstoqueBaseHoverProps {
  product: EstoqueBaseItem;
  children: React.ReactNode;
}

const TEMPO_PARADO_COLORS: Record<string, string> = {
  "Antes que 30 dias": "text-green-400 bg-green-500/20",
  "Entre 31 e 60 dias": "text-yellow-400 bg-yellow-500/20",
  "Entre 61 e 90 dias": "text-orange-400 bg-orange-500/20",
  "Mais que 91 dias": "text-red-400 bg-red-500/20",
};

export const EstoqueMatrizHoverCard = ({ product, children }: EstoqueMatrizHoverProps) => {
  const { t } = useLanguage();
  const imageUrl = product.fotoUrl || `https://icone-api.bfranca.com.br/fotos/icone_${product.codigo}.jpg`;
  const tempoColor = TEMPO_PARADO_COLORS[product.tempoParado] || "text-muted-foreground bg-muted";

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        className="w-80 bg-card border-border p-0 overflow-hidden z-50"
        side="right"
        align="start"
      >
        {/* Product Image */}
        <div className="relative h-36 w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={product.descricao}
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${tempoColor}`}>
              {product.tempoParado}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-primary font-medium">{product.codigo}</p>
            <h4 className="text-sm font-semibold text-foreground mt-0.5">{product.descricao}</h4>
            <div className="flex gap-1 mt-1">
              {product.grupo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{product.grupo}</span>}
              {product.subGrupo && <span className="text-[10px] px-1.5 py-0.5 rounded bg-muted text-muted-foreground">{product.subGrupo}</span>}
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs">
            <div className="flex flex-col items-center gap-1 bg-muted/50 rounded p-2">
              <Package className="h-3.5 w-3.5 text-primary" />
              <span className="text-muted-foreground">Estoque</span>
              <span className="font-bold text-foreground">{formatNumber(product.estoque)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-muted/50 rounded p-2">
              <ArrowDownToLine className="h-3.5 w-3.5 text-green-500" />
              <span className="text-muted-foreground">Entrada</span>
              <span className="font-bold text-foreground">{formatNumber(product.qtdeEntrada)}</span>
            </div>
            <div className="flex flex-col items-center gap-1 bg-muted/50 rounded p-2">
              <ArrowUpFromLine className="h-3.5 w-3.5 text-red-400" />
              <span className="text-muted-foreground">Saída</span>
              <span className="font-bold text-foreground">{formatNumber(product.qtdeSaida)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs pt-2 border-t border-border">
            <div>
              <span className="text-muted-foreground">Vl. Total</span>
              <p className="font-semibold text-primary">{formatCurrency(product.vlTotal)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">M³ Total</span>
              <p className="font-semibold text-foreground">{product.m3Total.toFixed(2)}</p>
            </div>
          </div>

          <div className="space-y-1.5 text-xs pt-2 border-t border-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Últ. Entrada: {product.dtUltimaEntrada || "—"} ({formatNumber(product.qtdeUltimaEntrada)} un)</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Últ. Saída: {product.dtUltimaSaida || "—"} ({formatNumber(product.qtdeUltimaSaida)} un)</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Clock className="h-3.5 w-3.5" />
              <span>{product.diasSemMovto} dias sem movimentação</span>
            </div>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

export const EstoqueBaseHoverCard = ({ product, children }: EstoqueBaseHoverProps) => {
  const imageUrl = product.fotoUrl || `https://icone-api.bfranca.com.br/fotos/icone_${product.codigo}.jpg`;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent
        className="w-72 bg-card border-border p-0 overflow-hidden z-50"
        side="right"
        align="start"
      >
        {/* Product Image */}
        <div className="relative h-32 w-full overflow-hidden bg-muted">
          <img
            src={imageUrl}
            alt={product.produto}
            className="w-full h-full object-contain"
            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
          />
        </div>

        {/* Product Info */}
        <div className="p-3 space-y-2">
          <div>
            <p className="text-xs text-primary font-medium">{product.codigo}</p>
            <h4 className="text-sm font-semibold text-foreground mt-0.5">{product.produto}</h4>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="bg-muted/50 rounded p-2">
              <span className="text-muted-foreground">Saldo</span>
              <p className="font-bold text-foreground">{formatNumber(product.saldo)}</p>
            </div>
            <div className="bg-muted/50 rounded p-2">
              <span className="text-muted-foreground">M³</span>
              <p className="font-bold text-foreground">{product.m3.toFixed(4)}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2 text-xs pt-2 border-t border-border">
            <div>
              <span className="text-muted-foreground">Vl. Total</span>
              <p className="font-semibold text-primary">{formatCurrency(product.vlTotal)}</p>
            </div>
            <div>
              <span className="text-muted-foreground">Base</span>
              <p className="font-semibold text-foreground">{product.base}</p>
            </div>
          </div>

          <div className="text-xs text-muted-foreground pt-1 border-t border-border">
            <span>{product.cidade} - {product.uf} | {product.regiao}</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
