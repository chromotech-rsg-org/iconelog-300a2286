import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DollarSign, Box, Package, Boxes } from "lucide-react";
import { formatCurrency, formatNumber } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

interface StockDualKPICardsProps {
  matrizValor: number;
  matrizM3: number;
  matrizQtdeSKUs: number;
  matrizKits: number;
  matrizKitsCompleto: number;
}

export const StockDualKPICards = ({
  matrizValor,
  matrizM3,
  matrizQtdeSKUs,
  matrizKits,
  matrizKitsCompleto,
}: StockDualKPICardsProps) => {
  const { t } = useLanguage();
  return (
    <Card className="bg-dashboard-card border-dashboard-border">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium text-dashboard-accent">{t("ESTOQUE MATRIZ (BARUERI)")}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="text-center">
            <DollarSign className="h-5 w-5 mx-auto mb-1 text-green-500" />
            <p className="text-sm text-muted-foreground">{t("Valor")}</p>
            <p className="text-xl font-bold text-foreground">{formatCurrency(matrizValor)}</p>
          </div>
          <div className="text-center">
            <Box className="h-5 w-5 mx-auto mb-1 text-dashboard-blue" />
            <p className="text-sm text-muted-foreground">{t("M³")}</p>
            <p className="text-xl font-bold text-foreground">{matrizM3.toFixed(1)}</p>
          </div>
          <div className="text-center">
            <Package className="h-5 w-5 mx-auto mb-1 text-dashboard-accent" />
            <p className="text-sm text-muted-foreground">{t("Qtde SKUs")}</p>
            <p className="text-xl font-bold text-foreground">{formatNumber(matrizQtdeSKUs)}</p>
          </div>
          <div className="text-center">
           <Boxes className="h-5 w-5 mx-auto mb-1 text-dashboard-orange" />
            <p className="text-sm text-muted-foreground">{t("Kits Completo")}</p>
            <p className="text-xl font-bold text-foreground">{formatNumber(matrizKitsCompleto)}</p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
