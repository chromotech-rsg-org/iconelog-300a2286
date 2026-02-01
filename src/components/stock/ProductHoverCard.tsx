import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { SKUItem } from "@/data/stockData";
import { formatNumber } from "@/data/mockData";
import { MapPin, Package, Calendar, Building2 } from "lucide-react";

interface ProductHoverCardProps {
  product: SKUItem;
  children: React.ReactNode;
}

export const ProductHoverCard = ({ product, children }: ProductHoverCardProps) => {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const formatDate = (date: Date) => {
    return date.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getStockStatus = () => {
    const ratio = product.stockQuantity / product.minStock;
    if (ratio <= 1) return { text: "Estoque Crítico", color: "text-red-400 bg-red-500/20" };
    if (ratio <= 1.5) return { text: "Estoque Baixo", color: "text-yellow-400 bg-yellow-500/20" };
    return { text: "Estoque Normal", color: "text-green-400 bg-green-500/20" };
  };

  const status = getStockStatus();

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        {children}
      </HoverCardTrigger>
      <HoverCardContent 
        className="w-80 bg-dashboard-card border-dashboard-border p-0 overflow-hidden"
        side="right"
        align="start"
      >
        {/* Product Image */}
        <div className="relative h-40 w-full overflow-hidden">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
          <div className="absolute top-2 right-2">
            <span className={`px-2 py-1 rounded-full text-xs font-medium ${status.color}`}>
              {status.text}
            </span>
          </div>
        </div>

        {/* Product Info */}
        <div className="p-4 space-y-3">
          <div>
            <p className="text-xs text-dashboard-accent font-medium">{product.sku}</p>
            <h4 className="text-sm font-semibold text-foreground mt-0.5">{product.name}</h4>
            <p className="text-xs text-muted-foreground mt-1">{product.description}</p>
          </div>

          <div className="grid grid-cols-2 gap-3 text-xs">
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-dashboard-blue" />
              <div>
                <p className="text-muted-foreground">Estoque</p>
                <p className="font-medium text-foreground">{formatNumber(product.stockQuantity)} un</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Package className="h-3.5 w-3.5 text-dashboard-orange" />
              <div>
                <p className="text-muted-foreground">Kits</p>
                <p className="font-medium text-foreground">{formatNumber(product.kitsQuantity)} kits</p>
              </div>
            </div>
          </div>

          <div className="space-y-2 text-xs pt-2 border-t border-dashboard-border">
            <div className="flex items-center gap-2 text-muted-foreground">
              <MapPin className="h-3.5 w-3.5" />
              <span>{product.location}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" />
              <span>{product.supplier}</span>
            </div>
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-3.5 w-3.5" />
              <span>Atualizado: {formatDate(product.lastUpdate)}</span>
            </div>
          </div>

          <div className="flex justify-between items-center pt-2 border-t border-dashboard-border">
            <span className="text-xs text-muted-foreground">Preço Unitário</span>
            <span className="text-sm font-semibold text-dashboard-accent">{formatCurrency(product.unitPrice)}</span>
          </div>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};
