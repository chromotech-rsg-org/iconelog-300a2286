import React, { createContext, useContext, ReactNode, useMemo } from "react";
import { useBiSettings, BiSetting, type BiSetting as BiSettingType } from "@/hooks/useBiSettings";
 import defaultLogo from "@/assets/logo.jpg";
 
 interface BiSettingsContextType {
   settings: BiSetting[];
   loading: boolean;
   getPageTitle: (pageId: string) => string;
   getPageLogo: (pageId: string) => string;
  getSystemLogo: () => string;
  getSystemName: () => string;
  getOrderedBiSettings: () => BiSetting[];
   refetch: () => void;
 }
 
 const BiSettingsContext = createContext<BiSettingsContextType | undefined>(undefined);
 
 const defaultTitles: Record<string, string> = {
   minutas: "Minutas Expedidas x Baixadas",
   estoque: "B-Side Estoque",
   entregas: "B-Side Entregas",
   tracking: "Tracking Consolidado",
   "estoque-consolidado": "Estoque Consolidado",
   faturamento: "Faturamento",
   analitico: "Analítico",
   settings: "Configurações",
  system: "Relatórios Ícone Log",
 };
 
 export const BiSettingsProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { settings, loading, getSettingByPageId, getSystemSetting, getOrderedBiSettings, refetch } = useBiSettings();
 
   const getPageTitle = (pageId: string): string => {
     const setting = getSettingByPageId(pageId);
     return setting?.display_name || defaultTitles[pageId] || pageId;
   };
 
   const getPageLogo = (pageId: string): string => {
     const setting = getSettingByPageId(pageId);
     return setting?.logo_url || defaultLogo;
   };
 
  const getSystemLogo = (): string => {
    const systemSetting = getSystemSetting();
    return systemSetting?.logo_url || defaultLogo;
  };

  const getSystemName = (): string => {
    const systemSetting = getSystemSetting();
    return systemSetting?.display_name || defaultTitles.system;
  };

   return (
     <BiSettingsContext.Provider
       value={{
         settings,
         loading,
         getPageTitle,
         getPageLogo,
        getSystemLogo,
        getSystemName,
        getOrderedBiSettings,
         refetch,
       }}
     >
       {children}
     </BiSettingsContext.Provider>
   );
 };
 
 export const useBiSettingsContext = (): BiSettingsContextType => {
   const context = useContext(BiSettingsContext);
   if (!context) {
     throw new Error("useBiSettingsContext must be used within BiSettingsProvider");
   }
   return context;
 };