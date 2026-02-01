import { Clock, Menu, RefreshCw, Download } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { Construction } from "lucide-react";
import { useNavigate } from "react-router-dom";

const navigationItems = [
  { label: "B-Side Entregas", active: false, path: "/" },
  { label: "B-Side Estoque", active: true, path: "/estoque" },
  { label: "Tracking Consolidado", active: false, path: "/" },
  { label: "Estoque Consolidado", active: false, path: "/" },
  { label: "Faturamento", active: false, path: "/" },
  { label: "Analítico", active: false, path: "/" },
  { label: "Minutas Expedidas x Baixadas", active: false, path: "/" },
  { label: "Painel de Controle", active: false, path: "/" },
];

interface StockHeaderProps {
  lastUpdate: Date;
  onRefreshData?: () => void;
  onExportExcel?: () => void;
}

export const StockHeader = ({
  lastUpdate,
  onRefreshData,
  onExportExcel
}: StockHeaderProps) => {
  const navigate = useNavigate();

  const formatLastUpdate = (date: Date) => {
    return date.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const handleNavClick = (item: typeof navigationItems[0]) => {
    if (item.label === "Minutas Expedidas x Baixadas") {
      navigate("/");
    } else if (item.label === "B-Side Estoque") {
      navigate("/estoque");
    } else if (!item.active) {
      toast.info(`${item.label} - Em desenvolvimento`, {
        icon: <Construction className="h-4 w-4" />,
      });
    }
  };

  return (
    <header className="w-full border-b border-dashboard-border bg-dashboard-card">
      {/* Top bar with logo, update time, and navigation */}
      <div className="flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <div className="flex items-center gap-3">
          <img 
            src={logo} 
            alt="Logo" 
            className="h-12 w-12 rounded-lg object-cover border-2 border-dashboard-accent"
          />
          <div>
            <h1 className="text-lg font-bold text-foreground">B-Side Estoque</h1>
            <p className="text-xs text-muted-foreground">Gestão de Estoque</p>
          </div>
        </div>

        {/* Last update */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span className="hidden sm:inline">Última atualização: {formatLastUpdate(lastUpdate)}</span>
          <span className="sm:hidden">{formatLastUpdate(lastUpdate)}</span>
          {onRefreshData && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefreshData}
              className="h-8 w-8 text-muted-foreground hover:text-dashboard-accent hover:bg-dashboard-border"
              title="Atualizar dados"
            >
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Navigation dropdown - icon only */}
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
          <DropdownMenuContent className="bg-dashboard-card border-dashboard-border z-50" align="end">
            {navigationItems.map((item) => (
              <DropdownMenuItem
                key={item.label}
                onClick={() => handleNavClick(item)}
                className={`cursor-pointer ${
                  item.active 
                    ? "bg-dashboard-accent text-dashboard-dark font-medium" 
                    : "text-foreground hover:bg-dashboard-border hover:text-dashboard-accent"
                }`}
              >
                {item.label}
                {!item.active && item.label !== "Minutas Expedidas x Baixadas" && (
                  <Construction className="ml-2 h-3 w-3 text-muted-foreground" />
                )}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Actions bar */}
      <div className="flex items-center gap-4 px-6 py-3 border-t border-dashboard-border">
        {/* Export Excel button */}
        {onExportExcel && (
          <Button
            variant="outline"
            size="sm"
            onClick={onExportExcel}
            className="border-dashboard-border text-foreground hover:bg-dashboard-accent hover:text-dashboard-dark"
          >
            <Download className="mr-2 h-4 w-4" />
            Exportar Excel
          </Button>
        )}
      </div>
    </header>
  );
};
