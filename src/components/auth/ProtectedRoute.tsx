import { ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Lock } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface ProtectedRouteProps {
  children: ReactNode;
  pageId: string;
  requireAuth?: boolean;
}

export const ProtectedRoute = ({ 
  children, 
  pageId, 
  requireAuth = true 
}: ProtectedRouteProps) => {
  const { isAuthenticated, canView, isPublicAccess, canViewAnyConfig } = useAuth();
  
  // Se a página tem acesso público, não precisa de auth
  if (isPublicAccess(pageId)) {
    return <>{children}</>;
  }
  
  // Se requer autenticação e não está logado
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }
  
  // Admin panel: check if user has any admin permission
  if (pageId === "admin_panel") {
    if (isAuthenticated && !canViewAnyConfig()) {
      return (
        <div className="min-h-screen bg-dashboard-dark flex items-center justify-center p-6">
          <Card className="bg-dashboard-card border-dashboard-border max-w-md w-full">
            <CardContent className="pt-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
                <Lock className="w-8 h-8 text-destructive" />
              </div>
              <h2 className="text-xl font-semibold text-foreground mb-2">Acesso Negado</h2>
              <p className="text-muted-foreground mb-6">Você não tem permissão para acessar o painel de administração.</p>
              <Button onClick={() => window.history.back()} variant="outline" className="border-dashboard-border">Voltar</Button>
            </CardContent>
          </Card>
        </div>
      );
    }
    return <>{children}</>;
  }
  
  // Se está logado mas não tem permissão para visualizar
  if (isAuthenticated && !canView(pageId)) {
    return (
      <div className="min-h-screen bg-dashboard-dark flex items-center justify-center p-6">
        <Card className="bg-dashboard-card border-dashboard-border max-w-md w-full">
          <CardContent className="pt-6 text-center">
            <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-destructive/20 flex items-center justify-center">
              <Lock className="w-8 h-8 text-destructive" />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">
              Acesso Negado
            </h2>
            <p className="text-muted-foreground mb-6">
              Você não tem permissão para acessar esta página. 
              Entre em contato com o administrador do sistema.
            </p>
            <Button
              onClick={() => window.history.back()}
              variant="outline"
              className="border-dashboard-border"
            >
              Voltar
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }
  
  return <>{children}</>;
};
