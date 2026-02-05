 import { useState, useRef, useEffect } from "react";
 import { SharedHeader } from "@/components/shared/SharedHeader";
 import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
 import { Button } from "@/components/ui/button";
 import { Input } from "@/components/ui/input";
 import { Label } from "@/components/ui/label";
 import { Badge } from "@/components/ui/badge";
 import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
 import { Skeleton } from "@/components/ui/skeleton";
 import { Upload, Save, X, Image as ImageIcon, Settings as SettingsIcon } from "lucide-react";
 import { useBiSettings, BiSetting } from "@/hooks/useBiSettings";
 import { useAuth } from "@/contexts/AuthContext";
 import { Navigate } from "react-router-dom";
 import { toast } from "sonner";
 import defaultLogo from "@/assets/logo.jpg";
 
 const Settings = () => {
   const { isDeveloper, loading: authLoading } = useAuth();
   const { settings, loading, uploadLogo, updateSetting, refetch } = useBiSettings();
   const [editingNames, setEditingNames] = useState<Record<string, string>>({});
   const [uploading, setUploading] = useState<string | null>(null);
   const [saving, setSaving] = useState<string | null>(null);
   const fileInputRefs = useRef<Record<string, HTMLInputElement | null>>({});
 
   // Initialize editing names from settings
   useEffect(() => {
     const names: Record<string, string> = {};
     settings.forEach((s) => {
       names[s.page_id] = s.display_name;
     });
     setEditingNames(names);
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
 
   const getPageLabel = (pageId: string) => {
     const labels: Record<string, string> = {
       minutas: "Minutas",
       estoque: "Estoque",
       entregas: "Entregas",
       tracking: "Tracking",
       "estoque-consolidado": "Est. Consolidado",
       faturamento: "Faturamento",
       analitico: "Analítico",
     };
     return labels[pageId] || pageId;
   };
 
   if (authLoading || loading) {
     return (
       <div className="min-h-screen bg-dashboard-dark">
         <SharedHeader
           pageTitle="Configurações"
           pageId="settings"
           lastUpdate={new Date()}
         />
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
       <SharedHeader
         pageTitle="Configurações"
         pageId="settings"
         lastUpdate={new Date()}
       />
 
       <div className="p-6 space-y-6">
         {/* Header */}
         <div className="flex items-center gap-3">
           <SettingsIcon className="h-6 w-6 text-dashboard-accent" />
           <div>
             <h2 className="text-xl font-semibold text-foreground">
               Configurações dos BIs
             </h2>
             <p className="text-sm text-muted-foreground">
               Configure logos e nomes para cada módulo de BI
             </p>
           </div>
           <Badge className="ml-auto bg-dashboard-accent/20 text-dashboard-accent border-dashboard-accent/30">
             Desenvolvedor
           </Badge>
         </div>
 
         {/* BI Settings Grid */}
         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
           {settings.map((setting) => (
             <Card
               key={setting.id}
               className="bg-dashboard-card border-dashboard-border hover:border-dashboard-accent/50 transition-colors"
             >
               <CardHeader className="pb-3">
                 <div className="flex items-center justify-between">
                   <Badge variant="outline" className="text-xs">
                     {getPageLabel(setting.page_id)}
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
                         editingNames[setting.page_id] === setting.display_name
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
               </CardContent>
             </Card>
           ))}
         </div>
       </div>
     </div>
   );
 };
 
 export default Settings;