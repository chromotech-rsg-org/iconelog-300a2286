import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Define page order for redirect priority
const PAGE_ORDER = [
  { id: "minutas", path: "/minutas" },
  { id: "estoque", path: "/estoque" },
  { id: "entregas", path: "/entregas" },
  { id: "tracking", path: "/tracking" },
  { id: "estoque-consolidado", path: "/estoque-consolidado" },
  { id: "faturamento", path: "/faturamento" },
  { id: "analitico", path: "/analitico" },
  { id: "admin", path: "/admin" },
];

export const SmartRedirect = () => {
  const { isAuthenticated, loading, canView, isPublicAccess } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Find first page user has access to
  for (const page of PAGE_ORDER) {
    if (canView(page.id) || isPublicAccess(page.id)) {
      return <Navigate to={page.path} replace />;
    }
  }

  // No access to any page
  return <Navigate to="/no-access" replace />;
};
