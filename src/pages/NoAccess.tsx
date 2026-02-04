import { SharedHeader } from "@/components/shared/SharedHeader";
import { Card, CardContent } from "@/components/ui/card";
import { ShieldX } from "lucide-react";

const NoAccess = () => {
  return (
    <div className="min-h-screen bg-background">
      <SharedHeader
        pageTitle=""
        pageId=""
        lastUpdate={new Date()}
        showFilters={false}
      />

      <div className="flex items-center justify-center p-6" style={{ minHeight: 'calc(100vh - 80px)' }}>
        <Card className="bg-card border-border max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-20 h-20 mx-auto mb-6 rounded-full bg-muted flex items-center justify-center">
              <ShieldX className="w-10 h-10 text-muted-foreground" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-3">
              Sem Acesso a Relatórios
            </h2>
            <p className="text-muted-foreground mb-2">
              Você ainda não possui permissão para visualizar nenhum relatório.
            </p>
            <p className="text-sm text-muted-foreground">
              Entre em contato com o administrador do sistema para solicitar acesso.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default NoAccess;
