import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface Props {
  finalizado: number;
  transito: number;
  onStatusClick: (status: string) => void;
  selectedStatus: string | null;
}

export const TrackingStatusBars = ({ finalizado, transito, onStatusClick, selectedStatus }: Props) => {
  const total = finalizado + transito;
  const percFinalizado = total > 0 ? (finalizado / total) * 100 : 0;
  const percTransito = total > 0 ? (transito / total) * 100 : 0;

  const items = [
    { name: "FINALIZADO", value: finalizado, perc: percFinalizado, color: "bg-green-500" },
    { name: "TRÂNSITO", value: transito, perc: percTransito, color: "bg-blue-500" },
  ];

  return (
    <Card className="bg-card border-border">
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">Status Pedidos</CardTitle>
      </CardHeader>
      <CardContent className="p-3 space-y-2">
        {items.map((item) => {
          const isSelected = selectedStatus === item.name;
          const dimmed = selectedStatus && !isSelected;
          return (
            <div
              key={item.name}
              className={`cursor-pointer transition-all rounded p-1.5 hover:bg-muted/20 ${isSelected ? "ring-1 ring-primary" : ""} ${dimmed ? "opacity-30" : ""}`}
              onClick={() => onStatusClick(item.name)}
            >
              <div className="flex justify-between text-xs mb-1">
                <span className="text-muted-foreground">{item.name}</span>
                <span className="text-foreground font-semibold">{item.value.toLocaleString()}</span>
              </div>
              <div className="w-full h-2 bg-muted/30 rounded-full overflow-hidden">
                <div className={`h-full ${item.color} rounded-full transition-all`} style={{ width: `${item.perc}%` }} />
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
};
