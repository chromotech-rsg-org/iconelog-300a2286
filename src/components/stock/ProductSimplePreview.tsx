import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { SKUItem } from "@/data/stockData";
import { formatNumber } from "@/data/mockData";
import { Package, Boxes, MapPin, ExternalLink } from "lucide-react";

interface ProductSimplePreviewProps {
  product: SKUItem | null;
  onOpenDetails: () => void;
}

export const ProductSimplePreview = ({ product, onOpenDetails }: ProductSimplePreviewProps) => {
  if (!product) {
    return (
      <Card className="bg-dashboard-card border-dashboard-border h-full">
        <CardContent className="h-full flex items-center justify-center py-6">
          <p className="text-muted-foreground text-sm text-center">
            Selecione um produto na tabela para ver detalhes
          </p>
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

  const getStockBadge = () => {
    const ratio = product.stockQuantity / product.minStock;
    if (ratio <= 1) {
      return <Badge variant="destructive" className="text-xs">Crítico</Badge>;
    }
    if (ratio <= 1.5) {
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 text-xs">Baixo</Badge>;
    }
    return <Badge className="bg-green-500/20 text-green-400 border-green-500/30 text-xs">Normal</Badge>;
  };

  return (
    <Card className="bg-dashboard-card border-dashboard-border h-full flex flex-col">
      <CardContent className="p-4 flex-1 flex flex-col">
        {/* Header with image and basic info */}
        <div className="flex gap-3 mb-3">
          <img 
            src={product.imageUrl} 
            alt={product.name}
            className="w-16 h-16 rounded-lg object-cover border border-dashboard-border flex-shrink-0"
          />
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-dashboard-accent font-medium text-sm">{product.sku}</span>
              {getStockBadge()}
            </div>
            <h3 className="text-sm font-medium text-foreground truncate">{product.name}</h3>
            <p className="text-xs text-muted-foreground">{product.category}</p>
          </div>
        </div>

        {/* Quick stats */}
        <div className="grid grid-cols-3 gap-2 mb-3">
          <div className="bg-dashboard-dark rounded-lg p-2 text-center">
            <Package className="h-3 w-3 mx-auto mb-1 text-dashboard-accent" />
            <p className="text-xs text-muted-foreground">Estoque</p>
            <p className="text-sm font-semibold text-foreground">{formatNumber(product.stockQuantity)}</p>
          </div>
          <div className="bg-dashboard-dark rounded-lg p-2 text-center">
            <Boxes className="h-3 w-3 mx-auto mb-1 text-dashboard-blue" />
            <p className="text-xs text-muted-foreground">Kits</p>
            <p className="text-sm font-semibold text-foreground">{formatNumber(product.kitsQuantity)}</p>
          </div>
          <div className="bg-dashboard-dark rounded-lg p-2 text-center">
            <MapPin className="h-3 w-3 mx-auto mb-1 text-dashboard-orange" />
            <p className="text-xs text-muted-foreground">Local</p>
            <p className="text-sm font-semibold text-foreground truncate">{product.location}</p>
          </div>
        </div>

        {/* Price */}
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-muted-foreground">Valor unitário:</span>
          <span className="text-sm font-semibold text-foreground">{formatCurrency(product.unitPrice)}</span>
        </div>

        {/* Details button */}
        <Button
          onClick={onOpenDetails}
          className="w-full mt-auto bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/90"
          size="sm"
        >
          <ExternalLink className="h-4 w-4 mr-2" />
          Mais Detalhes
        </Button>
      </CardContent>
    </Card>
  );
};
