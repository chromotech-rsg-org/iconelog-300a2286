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
import { toast } from "sonner";

const navigationItems = [
  { id: "minutas", label: "Minutas Expedidas x Baixadas", path: "/minutas" },
  { id: "entregas", label: "B-Side Entregas", path: "/entregas" },
  { id: "estoque", label: "B-Side Estoque", path: "/estoque" },
  { id: "tracking", label: "Tracking Consolidado", path: "/tracking" },
  { id: "estoque-consolidado", label: "Estoque Consolidado", path: "/estoque-consolidado" },
  { id: "faturamento", label: "Faturamento", path: "/faturamento" },
  { id: "analitico", label: "Analítico", path: "/analitico" },
];

export const NavigationMenu = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, canView, isPublicAccess, profile, logout, canViewAdmin } = useAuth();

  const handleNavClick = (item: typeof navigationItems[0]) => {
    // Verifica se o usuário pode acessar a página
    if (isAuthenticated && !canView(item.id) && !isPublicAccess(item.id)) {
      toast.error("Você não tem permissão para acessar esta página.");
      return;
    }
    navigate(item.path);
  };

  const handleAdminClick = () => {
    if (isAuthenticated && (canViewAdmin("usuarios") || canViewAdmin("perfis") || canViewAdmin("acessoPublico"))) {
      navigate("/admin");
    } else if (!isAuthenticated) {
      navigate("/auth");
    } else {
      toast.error("Você não tem permissão para acessar o painel de administração.");
    }
  };

  const handleLogout = async () => {
    await logout();
    toast.success("Logout realizado com sucesso!");
    navigate("/auth");
  };

  const isActivePath = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(path + "/");
  };

  // Check if user can access admin panel
  const canAccessAdmin = isAuthenticated && (canViewAdmin("usuarios") || canViewAdmin("perfis") || canViewAdmin("acessoPublico"));

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
                className={`cursor-pointer ${
                  isActive 
                    ? "bg-dashboard-accent text-dashboard-dark font-medium" 
                    : "text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
                }`}
              >
                {item.label}
              </DropdownMenuItem>
            );
          })}
        
        <DropdownMenuSeparator className="bg-dashboard-border" />
        
        {/* Admin link - só mostra para quem tem permissão */}
        {canAccessAdmin && (
          <DropdownMenuItem
            onClick={handleAdminClick}
            className={`cursor-pointer ${
              location.pathname === "/admin"
                ? "bg-dashboard-accent text-dashboard-dark font-medium"
                : "text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
            }`}
          >
            <Settings className="mr-2 h-4 w-4" />
            Painel de Administração
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
              Sair
            </DropdownMenuItem>
          </>
        ) : (
          <DropdownMenuItem
            onClick={() => navigate("/auth")}
            className="cursor-pointer text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
          >
            <User className="mr-2 h-4 w-4" />
            Entrar
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
