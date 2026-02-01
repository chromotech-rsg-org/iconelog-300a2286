import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { SKUItem } from "@/data/stockData";
import { formatNumber } from "@/data/mockData";
import { Package, Boxes, MapPin, Building2, Calendar, TrendingUp, TrendingDown, AlertTriangle } from "lucide-react";

interface ProductDetailModalProps {
  product: SKUItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ProductDetailModal = ({ product, open, onOpenChange }: ProductDetailModalProps) => {
  if (!product) return null;

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(value);
  };

  const getStockStatus = () => {
    const ratio = product.stockQuantity / product.minStock;
    if (ratio <= 1) {
      return { 
        label: "Crítico", 
        variant: "destructive" as const, 
        icon: AlertTriangle,
        color: "text-red-500"
      };
    }
    if (ratio <= 1.5) {
      return { 
        label: "Estoque Baixo", 
        variant: "default" as const, 
        icon: TrendingDown,
        color: "text-yellow-500",
        className: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30"
      };
    }
    return { 
      label: "Estoque Normal", 
      variant: "default" as const, 
      icon: TrendingUp,
      color: "text-green-500",
      className: "bg-green-500/20 text-green-400 border-green-500/30"
    };
  };

  const stockStatus = getStockStatus();
  const stockProgress = Math.min((product.stockQuantity / product.maxStock) * 100, 100);
  const totalValue = product.stockQuantity * product.unitPrice;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-dashboard-card border-dashboard-border max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-3">
            <span className="text-dashboard-accent">{product.sku}</span>
            <Badge className={stockStatus.className || ""} variant={stockStatus.variant}>
              {stockStatus.label}
            </Badge>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Product image and basic info */}
          <div className="flex gap-6">
            <img 
              src={product.imageUrl} 
              alt={product.name}
              className="w-40 h-40 rounded-xl object-cover border-2 border-dashboard-border"
            />
            <div className="flex-1">
              <h2 className="text-xl font-semibold text-foreground mb-2">{product.name}</h2>
              <p className="text-muted-foreground mb-4">{product.description}</p>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <span className="px-2 py-1 rounded bg-dashboard-dark">{product.category}</span>
              </div>
            </div>
          </div>

          {/* Stock metrics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-dashboard-dark rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Package className="h-5 w-5 text-dashboard-accent" />
                <span className="text-sm text-muted-foreground">Estoque Atual</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(product.stockQuantity)}</p>
            </div>
            <div className="bg-dashboard-dark rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Boxes className="h-5 w-5 text-dashboard-blue" />
                <span className="text-sm text-muted-foreground">Qtde Kits</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(product.kitsQuantity)}</p>
            </div>
            <div className="bg-dashboard-dark rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingDown className="h-5 w-5 text-yellow-500" />
                <span className="text-sm text-muted-foreground">Estoque Mínimo</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(product.minStock)}</p>
            </div>
            <div className="bg-dashboard-dark rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <TrendingUp className="h-5 w-5 text-green-500" />
                <span className="text-sm text-muted-foreground">Estoque Máximo</span>
              </div>
              <p className="text-2xl font-bold text-foreground">{formatNumber(product.maxStock)}</p>
            </div>
          </div>

          {/* Stock level progress */}
          <div className="bg-dashboard-dark rounded-xl p-4">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm text-muted-foreground">Nível de Estoque</span>
              <span className="text-sm font-medium text-foreground">{stockProgress.toFixed(1)}%</span>
            </div>
            <Progress 
              value={stockProgress} 
              className="h-3 bg-dashboard-border"
            />
            <div className="flex justify-between mt-2 text-xs text-muted-foreground">
              <span>Min: {formatNumber(product.minStock)}</span>
              <span>Atual: {formatNumber(product.stockQuantity)}</span>
              <span>Max: {formatNumber(product.maxStock)}</span>
            </div>
          </div>

          {/* Financial info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dashboard-dark rounded-xl p-4">
              <span className="text-sm text-muted-foreground">Valor Unitário</span>
              <p className="text-xl font-bold text-dashboard-accent mt-1">{formatCurrency(product.unitPrice)}</p>
            </div>
            <div className="bg-dashboard-dark rounded-xl p-4">
              <span className="text-sm text-muted-foreground">Valor Total em Estoque</span>
              <p className="text-xl font-bold text-foreground mt-1">{formatCurrency(totalValue)}</p>
            </div>
          </div>

          {/* Location and supplier info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-dashboard-dark rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <MapPin className="h-5 w-5 text-dashboard-orange" />
                <span className="text-sm text-muted-foreground">Localização</span>
              </div>
              <p className="text-lg font-medium text-foreground">{product.location}</p>
            </div>
            <div className="bg-dashboard-dark rounded-xl p-4">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="h-5 w-5 text-dashboard-blue" />
                <span className="text-sm text-muted-foreground">Fornecedor</span>
              </div>
              <p className="text-lg font-medium text-foreground">{product.supplier}</p>
            </div>
          </div>

          {/* Last update */}
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="h-4 w-4" />
            <span>Última atualização: {product.lastUpdate.toLocaleDateString('pt-BR', {
              day: '2-digit',
              month: '2-digit',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            })}</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};
