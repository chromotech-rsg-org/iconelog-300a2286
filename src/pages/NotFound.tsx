import { useLocation, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { FileQuestion, ArrowLeft, Home } from "lucide-react";
import { Button } from "@/components/ui/button";

const NotFound = () => {
  const location = useLocation();
  const navigate = useNavigate();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-dashboard-dark p-6">
      <div className="text-center max-w-md w-full">
        {/* Icon */}
        <div className="w-20 h-20 mx-auto mb-6 rounded-2xl bg-dashboard-accent/10 flex items-center justify-center">
          <FileQuestion className="w-10 h-10 text-dashboard-accent" />
        </div>

        {/* Title */}
        <h1 className="text-7xl font-bold text-foreground mb-2 tracking-tight">404</h1>
        <p className="text-xl text-muted-foreground mb-2">Página não encontrada</p>
        <p className="text-sm text-muted-foreground/70 mb-8">
          O endereço <code className="bg-dashboard-card px-2 py-1 rounded text-dashboard-accent text-xs">{location.pathname}</code> não existe ou foi alterado.
        </p>

        {/* Actions */}
        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button
            onClick={() => navigate(-1)}
            variant="outline"
            className="border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Voltar
          </Button>
          <Button
            onClick={() => navigate("/")}
            className="bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/90"
          >
            <Home className="mr-2 h-4 w-4" />
            Ir para o início
          </Button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
