import { useState, useRef, useEffect, useMemo } from "react";
import { DocumentHead } from "@/components/shared/DocumentHead";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { Upload, Save, Image as ImageIcon, Building2, LayoutGrid } from "lucide-react";
import { useBiSettings } from "@/hooks/useBiSettings";
import { useAuth } from "@/contexts/AuthContext";
import { Navigate } from "react-router-dom";
import { toast } from "sonner";
import defaultLogo from "@/assets/logo.jpg";
import { NavigationMenu } from "@/components/shared/NavigationMenu";
 
 const Settings = () => {
   const { isDeveloper, loading: authLoading } = useAuth();
  const { settings, loading, uploadLogo, updateSetting, updateDisplayOrder, getSystemSetting, getOrderedBiSettings, refetch } = useBiSettings();
   const [editingNames, setEditingNames] = useState<Record<string, string>>({});
  const [editingOrders, setEditingOrders] = useState<Record<string, number>>({});
   const [uploading, setUploading] = useState<string | null>(null);
   const [saving, setSaving] = useState<string | null>(null);
  const [savingOrder, setSavingOrder] = useState<string | null>(null);
   const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
  const systemFileInputRef = useRef<HTMLInputElement | null>(null);

  // Get system setting and ordered BIs
  const systemSetting = useMemo(() => getSystemSetting(), [getSystemSetting]);
  const orderedBiSettings = useMemo(() => getOrderedBiSettings(), [getOrderedBiSettings]);
 
   // Initialize editing names from settings
   useEffect(() => {
     const names: Record<string, string> = {};
    const orders: Record<string, number> = {};
     settings.forEach((s) => {
       names[s.page_id] = s.display_name;
      orders[s.page_id] = s.display_order;
     });
     setEditingNames(names);
    setEditingOrders(orders);
   }, [settings]);
 
   // Redirect non-developers
   if (!authLoading && !isDeveloper) {
     return <Navigate to="/" replace />;
   }
 
   const handleFileChange = async (pageId: string, file: File | null) => {
     if (!file) return;
 
     // Validate file
     if (!file.type.startsWith("image/")) {
       toast.error("Por favor, selecione uma imagem");
       return;
     }
 
     if (file.size > 2 * 1024 * 1024) {
       toast.error("A imagem deve ter no máximo 2MB");
       return;
     }
 
     setUploading(pageId);
     const result = await uploadLogo(pageId, file);
     setUploading(null);
 
     if (result.success) {
       toast.success("Logo atualizado com sucesso!");
     } else {
       toast.error("Erro ao enviar logo");
     }
   };
 
   const handleNameSave = async (pageId: string) => {
     const newName = editingNames[pageId];
     if (!newName?.trim()) {
       toast.error("O nome não pode ser vazio");
       return;
     }
 
     setSaving(pageId);
     const result = await updateSetting(pageId, { display_name: newName.trim() });
     setSaving(null);
 
     if (result.success) {
       toast.success("Nome atualizado com sucesso!");
     } else {
       toast.error("Erro ao atualizar nome");
     }
   };
 
  const handleOrderSave = async (pageId: string) => {
    const order = editingOrders[pageId];
    if (order === undefined || order < 0) {
      toast.error("A ordem deve ser um número positivo");
      return;
    }

    setSavingOrder(pageId);
    const result = await updateDisplayOrder(pageId, order);
    setSavingOrder(null);

    if (result.success) {
      toast.success("Ordem atualizada com sucesso!");
    } else {
      toast.error("Erro ao atualizar ordem");
    }
  };

   const getPageLabel = (pageId: string) => {
     const labels: Record<string, string> = {
       minutas: "Minutas",
       estoque: "Estoque",
       entregas: "Entregas",
       tracking: "Tracking",
       "estoque-consolidado": "Est. Consolidado",
       faturamento: "Faturamento",
       analitico: "Analítico",
      system: "Sistema",
     };
     return labels[pageId] || pageId;
   };
 
  const getCurrentSetting = (pageId: string) => {
    return settings.find(s => s.page_id === pageId);
  };

   if (authLoading || loading) {
     return (
       <div className="min-h-screen bg-dashboard-dark">
       <DocumentHead pageId="settings" />
          <header className="bg-dashboard-card border-b border-dashboard-border p-4 flex justify-between items-center sticky top-0 z-50">
            <div className="flex items-center gap-3">
              <img src={systemSetting?.logo_url || defaultLogo} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-dashboard-accent" />
              <span className="text-foreground font-semibold">Configurações</span>
            </div>
            <NavigationMenu />
          </header>
         <div className="p-6">
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {[1, 2, 3, 4, 5, 6, 7].map((i) => (
               <Card key={i} className="bg-dashboard-card border-dashboard-border">
                 <CardContent className="p-4">
                   <Skeleton className="h-12 w-12 rounded-lg mb-4" />
                   <Skeleton className="h-4 w-3/4 mb-2" />
                   <Skeleton className="h-10 w-full" />
                 </CardContent>
               </Card>
             ))}
           </div>
         </div>
       </div>
     );
   }
 
  return (
    <div className="min-h-screen bg-dashboard-dark">
      <DocumentHead pageId="settings" />
      
      {/* Header similar to Auth page */}
      <header className="bg-dashboard-card border-b border-dashboard-border p-4 flex justify-between items-center sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <img src={systemSetting?.logo_url || defaultLogo} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-dashboard-accent" />
          <span className="text-foreground font-semibold">Configurações</span>
        </div>
        <NavigationMenu />
      </header>

      <div className="p-6 space-y-6">
        {/* Title and subtitle */}
        <div className="mb-4">
          <h1 className="text-xl font-bold text-foreground">{systemSetting?.display_name || "Relatórios"}</h1>
          <p className="text-sm text-muted-foreground">Gerencie as configurações do sistema</p>
        </div>

        {/* System Settings Section */}
        <Card className="bg-dashboard-card border-dashboard-accent/30">
          <CardHeader className="pb-3">
            <div className="flex items-center gap-3">
              <Building2 className="h-5 w-5 text-dashboard-accent" />
              <div>
                <CardTitle className="text-lg text-foreground">Logo do Sistema</CardTitle>
                <CardDescription className="text-muted-foreground">
                  Este logo será usado nas telas de Login, Administração e Configurações
                </CardDescription>
              </div>
              <Badge className="ml-auto bg-dashboard-accent/20 text-dashboard-accent border-dashboard-accent/30">
                Global
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="flex flex-col md:flex-row gap-6 items-start">
              {/* System Logo */}
              <div className="flex items-center gap-4">
                <div className="relative group">
                  <Avatar className="h-20 w-20 rounded-lg border-2 border-dashboard-accent/50">
                    <AvatarImage
                      src={systemSetting?.logo_url || defaultLogo}
                      alt="Logo do Sistema"
                      className="object-cover"
                    />
                    <AvatarFallback className="rounded-lg bg-dashboard-border">
                      <ImageIcon className="h-8 w-8 text-muted-foreground" />
                    </AvatarFallback>
                  </Avatar>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    ref={systemFileInputRef}
                    onChange={(e) => handleFileChange("system", e.target.files?.[0] || null)}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/80"
                    onClick={() => systemFileInputRef.current?.click()}
                    disabled={uploading === "system"}
                  >
                    {uploading === "system" ? (
                      <div className="h-4 w-4 border-2 border-dashboard-dark border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Upload className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <div>
                  <p className="text-sm text-foreground font-medium">Logo Principal</p>
                  <p className="text-xs text-muted-foreground">PNG, JPG até 2MB</p>
                </div>
              </div>

              {/* System Name */}
              <div className="flex-1 space-y-2">
                <Label className="text-sm text-muted-foreground">Nome do Sistema</Label>
                <div className="flex gap-2">
                  <Input
                    value={editingNames["system"] || ""}
                    onChange={(e) =>
                      setEditingNames((prev) => ({
                        ...prev,
                        system: e.target.value,
                      }))
                    }
                    className="bg-dashboard-dark border-dashboard-border text-foreground"
                    placeholder="Nome do sistema"
                  />
                  <Button
                    variant="outline"
                    className="border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark hover:border-dashboard-accent"
                    onClick={() => handleNameSave("system")}
                    disabled={
                      saving === "system" ||
                      editingNames["system"] === systemSetting?.display_name
                    }
                  >
                    {saving === "system" ? (
                      <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                    ) : (
                      <Save className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* BI Settings Section */}
        <div className="flex items-center gap-3 mt-8">
          <LayoutGrid className="h-5 w-5 text-dashboard-accent" />
           <div>
            <h2 className="text-lg font-semibold text-foreground">
               Configurações dos BIs
             </h2>
             <p className="text-sm text-muted-foreground">
              Configure logos, nomes e ordem de exibição para cada módulo
             </p>
           </div>
         </div>
 
         {/* BI Settings Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {orderedBiSettings.map((setting) => (
             <Card
               key={setting.id}
               className="bg-dashboard-card border-dashboard-border hover:border-dashboard-accent/50 transition-colors"
             >
               <CardHeader className="pb-3">
                 <div className="flex items-center justify-between">
                   <Badge variant="outline" className="text-xs">
                     {getPageLabel(setting.page_id)}
                   </Badge>
                  <Badge variant="secondary" className="text-xs bg-dashboard-border">
                    Ordem: {setting.display_order}
                  </Badge>
                 </div>
               </CardHeader>
               <CardContent className="space-y-4">
                 {/* Logo Section */}
                 <div className="flex items-center gap-3">
                   <div className="relative group">
                     <Avatar className="h-14 w-14 rounded-lg border-2 border-dashboard-border">
                       <AvatarImage
                         src={setting.logo_url || defaultLogo}
                         alt={setting.display_name}
                         className="object-cover"
                       />
                       <AvatarFallback className="rounded-lg bg-dashboard-border">
                         <ImageIcon className="h-6 w-6 text-muted-foreground" />
                       </AvatarFallback>
                     </Avatar>
                     <input
                       type="file"
                       accept="image/*"
                       className="hidden"
                       ref={(el) => (fileInputRefs.current[setting.page_id] = el)}
                       onChange={(e) =>
                         handleFileChange(setting.page_id, e.target.files?.[0] || null)
                       }
                     />
                     <Button
                       variant="ghost"
                       size="icon"
                       className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/80"
                       onClick={() => fileInputRefs.current[setting.page_id]?.click()}
                       disabled={uploading === setting.page_id}
                     >
                       {uploading === setting.page_id ? (
                         <div className="h-3 w-3 border-2 border-dashboard-dark border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <Upload className="h-3 w-3" />
                       )}
                     </Button>
                   </div>
                   <div className="flex-1 min-w-0">
                     <p className="text-xs text-muted-foreground mb-1">Logo do BI</p>
                     <p className="text-xs text-muted-foreground/60">
                       PNG, JPG até 2MB
                     </p>
                   </div>
                 </div>
 
                 {/* Name Section */}
                 <div className="space-y-2">
                   <Label className="text-xs text-muted-foreground">
                     Nome de exibição
                   </Label>
                   <div className="flex gap-2">
                     <Input
                       value={editingNames[setting.page_id] || ""}
                       onChange={(e) =>
                         setEditingNames((prev) => ({
                           ...prev,
                           [setting.page_id]: e.target.value,
                         }))
                       }
                       className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-9"
                       placeholder="Nome do BI"
                     />
                     <Button
                       variant="outline"
                       size="icon"
                       className="h-9 w-9 border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark hover:border-dashboard-accent"
                       onClick={() => handleNameSave(setting.page_id)}
                       disabled={
                         saving === setting.page_id ||
                        editingNames[setting.page_id] === getCurrentSetting(setting.page_id)?.display_name
                       }
                     >
                       {saving === setting.page_id ? (
                         <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                       ) : (
                         <Save className="h-4 w-4" />
                       )}
                     </Button>
                   </div>
                 </div>

                {/* Order Section */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">
                    Ordem no menu
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      type="number"
                      min={0}
                      value={editingOrders[setting.page_id] ?? 0}
                      onChange={(e) =>
                        setEditingOrders((prev) => ({
                          ...prev,
                          [setting.page_id]: parseInt(e.target.value) || 0,
                        }))
                      }
                      className="bg-dashboard-dark border-dashboard-border text-foreground text-sm h-9 w-20"
                    />
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-9 w-9 border-dashboard-border hover:bg-dashboard-accent hover:text-dashboard-dark hover:border-dashboard-accent"
                      onClick={() => handleOrderSave(setting.page_id)}
                      disabled={
                        savingOrder === setting.page_id ||
                        editingOrders[setting.page_id] === getCurrentSetting(setting.page_id)?.display_order
                      }
                    >
                      {savingOrder === setting.page_id ? (
                        <div className="h-4 w-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      ) : (
                        <Save className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
               </CardContent>
             </Card>
           ))}
         </div>
       </div>
     </div>
   );
 };
 
 export default Settings;