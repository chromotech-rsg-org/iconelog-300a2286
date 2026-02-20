import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  data: { name: string; value: number }[];
  onTipoClick: (tipo: string) => void;
  selectedTipo: string | null;
}

export const TrackingTipoServicoChart = ({ data, onTipoClick, selectedTipo }: Props) => {
  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Pedidos | Tipo de Serviço</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-1.5">
        {data.map((item) => {
          const isSelected = selectedTipo === item.name;
          const dimmed = selectedTipo && !isSelected;
          return (
            <div
              key={item.name}
              className={`flex items-center justify-between text-xs cursor-pointer rounded px-2 py-1.5 transition-all hover:bg-muted/30 ${isSelected ? "bg-primary/10 ring-1 ring-primary" : ""} ${dimmed ? "opacity-30" : ""}`}
              onClick={() => onTipoClick(item.name)}
            >
              <span className="text-muted-foreground truncate mr-2">{item.name}</span>
              <div className="flex items-center gap-2">
                <span className="text-foreground font-semibold">{item.value.toLocaleString()}</span>
                <span className="text-muted-foreground text-[10px]">MIL</span>
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
