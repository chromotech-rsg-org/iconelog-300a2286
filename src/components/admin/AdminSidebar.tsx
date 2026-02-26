import { useState } from "react";
import { Users, Shield, Globe, MapPin, Settings, LayoutGrid, Building2, Link, FlaskConical, FileText, ChevronDown, ChevronRight, Package, Database } from "lucide-react";
import { useAuth, AdminSectionType } from "@/contexts/AuthContext";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";

export type AdminSection = 
  | "usuarios" | "perfis" | "publico" | "regionais"
  | "configurar_bi" | "empresas_clientes" | "integracao" | "testes_api" | "logs_api" | "produtos_estoque" | "dados_api";

interface AdminSidebarProps {
  activeSection: AdminSection;
  onSectionChange: (section: AdminSection) => void;
}

interface MenuItem {
  id: AdminSection;
  label: string;
  icon: React.ElementType;
  permissionKey: AdminSectionType;
}

const mainItems: MenuItem[] = [
  { id: "usuarios", label: "Usuários", icon: Users, permissionKey: "usuarios" },
  { id: "perfis", label: "Perfis", icon: Shield, permissionKey: "perfis" },
  { id: "publico", label: "Acesso Público", icon: Globe, permissionKey: "acessoPublico" },
  { id: "regionais", label: "Cadastro de Regionais", icon: MapPin, permissionKey: "cadastroCidades" },
  { id: "empresas_clientes", label: "Empresas / Clientes", icon: Building2, permissionKey: "empresasClientes" },
  { id: "produtos_estoque", label: "Produtos & Kits", icon: Package, permissionKey: "produtosEstoque" },
];

const configItems: MenuItem[] = [
  { id: "configurar_bi", label: "Configurar BI", icon: LayoutGrid, permissionKey: "configurarBi" },
  { id: "integracao", label: "Integração", icon: Link, permissionKey: "integracao" },
  { id: "testes_api", label: "Testes de API", icon: FlaskConical, permissionKey: "testesApi" },
  { id: "logs_api", label: "Logs", icon: FileText, permissionKey: "logsApi" },
  { id: "dados_api", label: "Dados das APIs", icon: Database, permissionKey: "dadosApi" },
];

export const AdminSidebar = ({ activeSection, onSectionChange }: AdminSidebarProps) => {
  const { canViewAdmin, canViewAnyConfig, isDeveloper, isAdminDevOnly } = useAuth();
  const [configOpen, setConfigOpen] = useState(
    configItems.some(item => item.id === activeSection)
  );

  const visibleMainItems = mainItems.filter(item => canViewAdmin(item.permissionKey) && (isDeveloper || !isAdminDevOnly(item.permissionKey)));
  const visibleConfigItems = configItems.filter(item => canViewAdmin(item.permissionKey) && (isDeveloper || !isAdminDevOnly(item.permissionKey)));
  const showConfig = canViewAnyConfig();

  const renderItem = (item: MenuItem) => (
    <Button
      key={item.id}
      variant="ghost"
      className={cn(
        "w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-normal",
        activeSection === item.id
          ? "bg-dashboard-accent text-dashboard-dark font-medium"
          : "text-muted-foreground hover:text-foreground hover:bg-dashboard-border/50"
      )}
      onClick={() => onSectionChange(item.id)}
    >
      <item.icon className="h-4 w-4 shrink-0" />
      <span className="truncate">{item.label}</span>
    </Button>
  );

  return (
    <div className="w-64 min-h-full bg-dashboard-card border-r border-dashboard-border flex flex-col shrink-0">
      <div className="p-4 border-b border-dashboard-border">
        <h2 className="text-sm font-semibold text-foreground">Administração</h2>
      </div>
      <nav className="flex-1 p-2 space-y-1">
        {visibleMainItems.map(renderItem)}

        {showConfig && (
          <Collapsible open={configOpen} onOpenChange={setConfigOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                className="w-full justify-start gap-3 px-3 py-2 h-auto text-sm font-normal text-muted-foreground hover:text-foreground hover:bg-dashboard-border/50"
              >
                <Settings className="h-4 w-4 shrink-0" />
                <span className="truncate flex-1 text-left">Configurações</span>
                {configOpen ? <ChevronDown className="h-3 w-3" /> : <ChevronRight className="h-3 w-3" />}
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="pl-4 space-y-1 mt-1">
              {visibleConfigItems.map(renderItem)}
            </CollapsibleContent>
          </Collapsible>
        )}
      </nav>
    </div>
  );
};
