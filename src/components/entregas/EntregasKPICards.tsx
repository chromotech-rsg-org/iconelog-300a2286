import { Card, CardContent } from "@/components/ui/card";
import { Package, Truck, RotateCcw, Clock } from "lucide-react";
import { formatNumber } from "@/data/mockData";
import { useLanguage } from "@/contexts/LanguageContext";

interface EntregasKPICardsProps {
  entregaFinalizado: number;
  entregaEmTransito: number;
  reposicaoFinalizado: number;
  reposicaoEmTransito: number;
  onEntregaClick?: () => void;
  onReposicaoClick?: () => void;
  selectedTipo?: "Entrega" | "Reposição" | null;
}

export const EntregasKPICards = ({
  entregaFinalizado,
  entregaEmTransito,
  reposicaoFinalizado,
  reposicaoEmTransito,
  onEntregaClick,
  onReposicaoClick,
  selectedTipo,
}: EntregasKPICardsProps) => {
  const { t } = useLanguage();
  
  const cards = [
    {
      title: t("Entrega Finalizado"),
      value: entregaFinalizado,
      icon: Package,
      color: "text-green-500",
      bgColor: "bg-green-500/10",
      tipo: "Entrega" as const,
      onClick: onEntregaClick,
    },
    {
      title: t("Entrega em Trânsito"),
      value: entregaEmTransito,
      icon: Truck,
      color: "text-dashboard-blue",
      bgColor: "bg-dashboard-blue/10",
      tipo: "Entrega" as const,
      onClick: onEntregaClick,
    },
    {
      title: t("Reposição Finalizado"),
      value: reposicaoFinalizado,
      icon: RotateCcw,
      color: "text-dashboard-accent",
      bgColor: "bg-dashboard-accent/10",
      tipo: "Reposição" as const,
      onClick: onReposicaoClick,
    },
    {
      title: t("Reposição em Trânsito"),
      value: reposicaoEmTransito,
      icon: Clock,
      color: "text-dashboard-orange",
      bgColor: "bg-dashboard-orange/10",
      tipo: "Reposição" as const,
      onClick: onReposicaoClick,
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      {cards.map((card) => (
        <Card 
          key={card.title} 
          className={`bg-dashboard-card border-dashboard-border cursor-pointer transition-all hover:border-dashboard-accent ${selectedTipo === card.tipo ? 'ring-2 ring-dashboard-accent' : ''}`}
          onClick={card.onClick}
        >
          <CardContent className="p-5">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-lg ${card.bgColor}`}>
                <card.icon className={`h-6 w-6 ${card.color}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground uppercase font-semibold tracking-wide">{card.title}</p>
                <p className="text-4xl font-black text-foreground">{formatNumber(card.value)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
