import { useEffect, useState, useMemo } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

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

const PERM_CACHE_KEY = "auth_permissions_cache";

export const SmartRedirect = () => {
  const { isAuthenticated, loading, canView, isPublicAccess, canViewAnyConfig, refreshUserData } = useAuth();
  const [retryCount, setRetryCount] = useState(0);
  const [retrying, setRetrying] = useState(false);

  // Try to get first accessible page from local cache when DB is down
  const cachedRedirect = useMemo(() => {
    try {
      const raw = localStorage.getItem(PERM_CACHE_KEY);
      if (!raw) return null;
      const parsed = JSON.parse(raw);
      if (Date.now() - parsed.ts > 24 * 60 * 60 * 1000) return null;
      const { pagePerms, adminPerms } = parsed;
      // Check admin access from cache
      if (adminPerms) {
        const hasAdmin = Object.values(adminPerms).some((p: any) => p.ver);
        if (hasAdmin) return "/admin";
      }
      // Check page access from cache
      if (pagePerms) {
        for (const page of PAGE_ORDER) {
          if (page.id === "admin_panel") continue;
          if (pagePerms[page.id]?.visualizar) return page.path;
        }
      }
      return null;
    } catch { return null; }
  }, []);

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

  if (loading || retrying) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="text-foreground">Carregando permissões...</div>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/auth" replace />;
  }

  // Find first page user has access to from live permissions
  for (const page of PAGE_ORDER) {
    if (page.id === "admin_panel") {
      if (canViewAnyConfig()) return <Navigate to={page.path} replace />;
      continue;
    }
    if (canView(page.id) || isPublicAccess(page.id)) {
      return <Navigate to={page.path} replace />;
    }
  }

  // If no live permissions but we have a valid cached redirect, use it
  if (cachedRedirect && retryCount >= 3) {
    console.log("Using cached redirect:", cachedRedirect);
    return <Navigate to={cachedRedirect} replace />;
  }

  // Still waiting for permissions after retries but not exhausted yet
  if (!hasAnyAccess() && isAuthenticated && retryCount < 3) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
          <div className="text-foreground">Carregando permissões...</div>
        </div>
      </div>
    );
  }

  return <Navigate to="/no-access" replace />;
};
