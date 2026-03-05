import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

// Define page order for redirect priority
// Admin first so users with admin access land there after login
const PAGE_ORDER = [
  { id: "admin_panel", path: "/admin" },
  { id: "minutas", path: "/minutas" },
  { id: "estoque", path: "/estoque" },
  { id: "entregas", path: "/entregas" },
  { id: "tracking", path: "/tracking" },
  { id: "estoque-consolidado", path: "/estoque-consolidado" },
  { id: "faturamento", path: "/faturamento" },
  { id: "analitico", path: "/analitico" },
];

export const SmartRedirect = () => {
  const { isAuthenticated, loading, canView, isPublicAccess, canViewAnyConfig, refreshUserData } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  // Check if user has access to any page
  const hasAnyAccess = () => {
    for (const page of PAGE_ORDER) {
      if (page.id === "admin_panel") {
        if (canViewAnyConfig()) return true;
        continue;
      }
      if (canView(page.id) || isPublicAccess(page.id)) return true;
    }
    return false;
  };

  // Auto-retry loading permissions if authenticated but no access (likely transient DB failure)
  useEffect(() => {
    if (!loading && isAuthenticated && !hasAnyAccess() && retryCount < 3) {
      setRetrying(true);
      const timer = setTimeout(() => {
        console.log(`SmartRedirect: retrying permission load (attempt ${retryCount + 1}/3)...`);
        refreshUserData();
        setRetryCount(prev => prev + 1);
        setRetrying(false);
      }, 2000 * (retryCount + 1));
      return () => clearTimeout(timer);
    }
  }, [loading, isAuthenticated, retryCount]);

  if (loading || retrying || (!hasAnyAccess() && isAuthenticated && retryCount < 3)) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="text-foreground">Carregando permissões...</div>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Find first page user has access to
  for (const page of PAGE_ORDER) {
    if (page.id === "admin_panel") {
      if (canViewAnyConfig()) return <Navigate to={page.path} replace />;
      continue;
    }
    if (canView(page.id) || isPublicAccess(page.id)) {
      return <Navigate to={page.path} replace />;
    }
  }

  // No access to any page after retries
  return <Navigate to="/no-access" replace />;
};
