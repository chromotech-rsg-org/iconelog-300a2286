import { useNavigate, useLocation } from "react-router-dom";
import { Menu, Settings, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
 import { useAuth } from "@/contexts/AuthContext";
 import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { toast } from "sonner";
import { useLanguage } from "@/contexts/LanguageContext";

const pathMap: Record<string, string> = {
  minutas: "/minutas",
  entregas: "/entregas",
  estoque: "/estoque",
  tracking: "/tracking",
  "estoque-consolidado": "/estoque-consolidado",
  faturamento: "/faturamento",
  analitico: "/analitico",
};

export const NavigationMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, canView, isPublicAccess, profile, logout, canViewAdmin } = useAuth();
  const { getPageTitle, getOrderedBiSettings } = useBiSettingsContext();
  const { t } = useLanguage();

  // Get ordered navigation items from settings
  const navigationItems = getOrderedBiSettings().map(setting => ({
    id: setting.page_id,
    path: pathMap[setting.page_id] || `/${setting.page_id}`,
  }));

  const handleNavClick = (item: { id: string; path: string }) => {
    // Verifica se o usuário pode acessar a página
    if (isAuthenticated && !canView(item.id) && !isPublicAccess(item.id)) {
      toast.error(t("Você não tem permissão para acessar esta página."));
      return;
    }
    navigate(item.path);
  };

  const handleAdminClick = () => {
    if (isAuthenticated && canViewAnyConfig()) {
      navigate("/admin");
    } else if (!isAuthenticated) {
      navigate("/auth");
    } else {
      toast.error(t("Você não tem permissão para acessar o painel de administração."));
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success(t("Logout realizado com sucesso!"));
    navigate("/auth");
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Check if user can access admin panel
  const canAccessAdmin = isAuthenticated && canViewAdmin("painelControle");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          size="icon"
          className="border-dashboard-border bg-dashboard-card text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
        >
          <Menu className="h-5 w-5" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="bg-dashboard-card border-dashboard-border z-50 w-56" align="end">
        {navigationItems
          .filter((item) => {
            // Se não está logado, mostra apenas se tem acesso público
            if (!isAuthenticated) {
              return isPublicAccess(item.id);
            }
            // Se está logado, mostra se tem permissão de visualizar OU se é público
            return canView(item.id) || isPublicAccess(item.id);
          })
          .map((item) => {
            const isActive = isActivePath(item.path);
            
            return (
              <DropdownMenuItem
                key={item.id}
                onClick={() => handleNavClick(item)}
                onAuxClick={(e) => {
                  if (e.button === 1) {
                    e.preventDefault();
                    window.open(item.path, '_blank');
                  }
                }}
                className={`cursor-pointer ${
                  isActive 
                    ? "bg-dashboard-accent text-dashboard-dark font-medium" 
                    : "text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
                }`}
              >
                 {getPageTitle(item.id)}
              </DropdownMenuItem>
            );
          })}
        
        <DropdownMenuSeparator className="bg-dashboard-border" />
        
        {/* Admin link - só mostra para quem tem permissão */}
        {canAccessAdmin && (
          <DropdownMenuItem
            onClick={handleAdminClick}
            onAuxClick={(e) => {
              if (e.button === 1) {
                e.preventDefault();
                window.open('/admin', '_blank');
              }
            }}
            className={`cursor-pointer ${
              location.pathname === "/admin"
                ? "bg-dashboard-accent text-dashboard-dark font-medium"
                : "text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
            }`}
          >
            <Settings className="mr-2 h-4 w-4" />
            {t("Painel de Administração")}
          </DropdownMenuItem>
        )}

        <DropdownMenuSeparator className="bg-dashboard-border" />

        {/* Auth section */}
        {isAuthenticated ? (
          <>
            <DropdownMenuItem className="text-muted-foreground cursor-default hover:bg-transparent">
              <User className="mr-2 h-4 w-4" />
              {profile?.nome || "Usuário"}
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={handleLogout}
              className="cursor-pointer text-destructive hover:bg-destructive/20 hover:text-destructive"
            >
              <LogOut className="mr-2 h-4 w-4" />
              {t("Sair")}
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            onClick={() => navigate("/auth")}
            className="cursor-pointer text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
          >
            <User className="mr-2 h-4 w-4" />
            {t("Entrar")}
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
