import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SKUItem } from "@/data/stockData";
import { formatNumber } from "@/data/mockData";
import { MapPin, Building2, Calendar, Package, Boxes, DollarSign } from "lucide-react";

interface ProductDetailPanelProps {
  product: SKUItem | null;
}

export const ProductDetailPanel = ({ product }: ProductDetailPanelProps) => {
  if (!product) {
    return (
      <Card className="bg-dashboard-card border-dashboard-border h-full flex items-center justify-center">
        <CardContent className="text-center py-12">
          <Package className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
          <p className="text-muted-foreground">Selecione um produto para ver os detalhes</p>
        </CardContent>
      </Card>
    );
  }

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
    if (ratio <= 1) return { text: "Estoque Crítico", color: "bg-red-500/20 text-red-400 border-red-500/30" };
    if (ratio <= 1.5) return { text: "Estoque Baixo", color: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30" };
    return { text: "Estoque Normal", color: "bg-green-500/20 text-green-400 border-green-500/30" };
  };

  const status = getStockStatus();
  const stockPercentage = Math.min((product.stockQuantity / product.maxStock) * 100, 100);
  const totalValue = product.stockQuantity * product.unitPrice;

  return (
    <Card className="bg-dashboard-card border-dashboard-border h-full overflow-auto">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div>
            <p className="text-sm text-dashboard-accent font-medium">{product.sku}</p>
            <CardTitle className="text-lg font-semibold text-foreground mt-1">
              {product.name}
            </CardTitle>
          </div>
          <Badge className={status.color}>{status.text}</Badge>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Product Image */}
        <div className="relative w-full aspect-square max-h-48 overflow-hidden rounded-lg border border-dashboard-border">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-full h-full object-cover"
          />
        </div>

        {/* Description */}
        <p className="text-sm text-muted-foreground">{product.description}</p>

        {/* Stock Progress */}
        <div className="space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Nível de Estoque</span>
            <span className="text-foreground font-medium">
              {formatNumber(product.stockQuantity)} / {formatNumber(product.maxStock)}
            </span>
          </div>
          <Progress 
            value={stockPercentage} 
            className="h-2 bg-dashboard-border"
          />
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Mín: {formatNumber(product.minStock)}</span>
            <span>Máx: {formatNumber(product.maxStock)}</span>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-dashboard-dark rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Boxes className="h-4 w-4 text-dashboard-blue" />
              <span className="text-xs text-muted-foreground">Estoque</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatNumber(product.stockQuantity)}</p>
          </div>
          <div className="bg-dashboard-dark rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <Package className="h-4 w-4 text-dashboard-orange" />
              <span className="text-xs text-muted-foreground">Kits</span>
            </div>
            <p className="text-lg font-bold text-foreground">{formatNumber(product.kitsQuantity)}</p>
          </div>
          <div className="bg-dashboard-dark rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-dashboard-accent" />
              <span className="text-xs text-muted-foreground">Preço Un.</span>
            </div>
            <p className="text-sm font-bold text-foreground">{formatCurrency(product.unitPrice)}</p>
          </div>
          <div className="bg-dashboard-dark rounded-lg p-3">
            <div className="flex items-center gap-2 mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              <span className="text-xs text-muted-foreground">Valor Total</span>
            </div>
            <p className="text-sm font-bold text-foreground">{formatCurrency(totalValue)}</p>
          </div>
        </div>

        {/* Additional Info */}
        <div className="space-y-2 pt-3 border-t border-dashboard-border">
          <div className="flex items-center gap-2 text-sm">
            <MapPin className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{product.location}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Building2 className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">{product.supplier}</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-muted-foreground">Atualizado: {formatDate(product.lastUpdate)}</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
