import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from "recharts";
import { useLanguage } from "@/contexts/LanguageContext";

interface Props {
  data: { name: string; value: number; noPrazo: number; foraPrazo: number; semOcorrencia: number; comOcorrencia: number }[];
  onEstadoClick: (uf: string) => void;
  selectedEstado: string | null;
}

export const TrackingEstadoChart = ({ data, onEstadoClick, selectedEstado }: Props) => {
  const { t } = useLanguage();
  return (
    <Card className={`bg-card border-border cursor-pointer transition-all ${selectedEstado ? "ring-1 ring-primary" : ""}`}>
      <CardHeader className="pb-1">
        <CardTitle className="text-sm font-medium text-foreground">{t("Pedidos por Estado")}</CardTitle>
      </CardHeader>
      <CardContent className="h-[180px]">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} onClick={(d) => {
            if (d?.activePayload?.[0]) onEstadoClick(d.activePayload[0].payload.name);
          }}>
            <XAxis dataKey="name" stroke="hsl(0, 0%, 40%)" fontSize={9} interval={0} />
            <YAxis stroke="hsl(0, 0%, 40%)" fontSize={9} hide />
            <Tooltip contentStyle={{ backgroundColor: "hsl(0, 0%, 6%)", border: "1px solid hsl(0, 0%, 15%)", fontSize: 11 }} />
            <Bar dataKey="value" fill="hsl(45, 100%, 50%)" radius={[3, 3, 0, 0]} cursor="pointer">
              {data.map((entry) => (
                <Cell key={entry.name} opacity={selectedEstado && selectedEstado !== entry.name ? 0.2 : 1} />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
