 import { useState, useEffect, useCallback } from "react";
 import { supabase } from "@/integrations/supabase/client";
 
export interface BiSetting {
  id: string;
  page_id: string;
  display_name: string;
  logo_url: string | null;
  display_order: number;
  cod_cli: string | null;
  company_name: string | null;
  refresh_interval_minutes: number;
  created_at: string;
  updated_at: string;
}
 
 export const useBiSettings = () => {
   const [settings, setSettings] = useState<BiSetting[]>([]);
   const [loading, setLoading] = useState(true);
 
   const fetchSettings = useCallback(async () => {
     try {
       const { data, error } = await supabase
         .from("bi_settings")
         .select("*")
         .order("page_id");
 
       if (error) throw error;
       setSettings(data || []);
     } catch (error) {
       console.error("Error fetching BI settings:", error);
     } finally {
       setLoading(false);
     }
   }, []);
 
   useEffect(() => {
     fetchSettings();
   }, [fetchSettings]);
 
   const getSettingByPageId = useCallback(
     (pageId: string): BiSetting | undefined => {
       return settings.find((s) => s.page_id === pageId);
     },
     [settings]
   );
 
   const updateSetting = async (
     pageId: string,
     updates: Partial<Pick<BiSetting, "display_name" | "logo_url">>
   ) => {
     try {
       const { error } = await supabase
         .from("bi_settings")
         .update(updates)
         .eq("page_id", pageId);
 
       if (error) throw error;
       await fetchSettings();
       return { success: true };
     } catch (error) {
       console.error("Error updating BI setting:", error);
       return { success: false, error };
     }
   };
 
   const uploadLogo = async (pageId: string, file: File) => {
     try {
       const fileExt = file.name.split(".").pop();
       const fileName = `${pageId}-logo.${fileExt}`;
       const filePath = `logos/${fileName}`;
 
       // Upload to storage
       const { error: uploadError } = await supabase.storage
         .from("bi-assets")
         .upload(filePath, file, { upsert: true });
 
       if (uploadError) throw uploadError;
 
       // Get public URL
       const { data: urlData } = supabase.storage
         .from("bi-assets")
         .getPublicUrl(filePath);
 
       // Update setting with new logo URL
       const logoUrl = `${urlData.publicUrl}?t=${Date.now()}`;
       await updateSetting(pageId, { logo_url: logoUrl });
 
       return { success: true, url: logoUrl };
     } catch (error) {
       console.error("Error uploading logo:", error);
       return { success: false, error };
     }
   };
 
   const removeLogo = async (pageId: string) => {
     try {
       const setting = getSettingByPageId(pageId);
       if (setting?.logo_url) {
         // Remove from storage
         const filePath = `logos/${pageId}-logo`;
         await supabase.storage.from("bi-assets").remove([filePath]);
       }
 
       await updateSetting(pageId, { logo_url: null });
       return { success: true };
     } catch (error) {
       console.error("Error removing logo:", error);
       return { success: false, error };
     }
   };
 
  // Get system setting (for Login, Admin, Settings pages)
  const getSystemSetting = useCallback((): BiSetting | undefined => {
    return settings.find((s) => s.page_id === "system");
  }, [settings]);

  // Get ordered BI settings (excludes system)
  const getOrderedBiSettings = useCallback((): BiSetting[] => {
    return settings
      .filter((s) => s.page_id !== "system")
      .sort((a, b) => a.display_order - b.display_order);
  }, [settings]);

  // Update display order
  const updateDisplayOrder = async (pageId: string, order: number) => {
    try {
      const { error } = await supabase
        .from("bi_settings")
        .update({ display_order: order })
        .eq("page_id", pageId);

      if (error) throw error;
      await fetchSettings();
      return { success: true };
    } catch (error) {
      console.error("Error updating display order:", error);
      return { success: false, error };
    }
  };

   return {
     settings,
     loading,
     getSettingByPageId,
     updateSetting,
     uploadLogo,
     removeLogo,
    getSystemSetting,
    getOrderedBiSettings,
    updateDisplayOrder,
     refetch: fetchSettings,
   };
 };