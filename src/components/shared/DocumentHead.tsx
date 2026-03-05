 import { useEffect } from "react";
 import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
 
 interface DocumentHeadProps {
   pageId?: string;
 }
 
 export const DocumentHead = ({ pageId }: DocumentHeadProps) => {
   const { getSystemName, getSystemLogo, getPageTitle, getPageLogo, loading } = useBiSettingsContext();
 
   useEffect(() => {
     if (loading) return;
 
     // Set document title
     const systemName = getSystemName();
     const pageTitle = pageId ? getPageTitle(pageId) : null;
     
     document.title = pageTitle && pageId !== "system" 
       ? `${pageTitle} | ${systemName}`
       : systemName;
 
     // Set favicon dynamically - admin pages use system logo, BI pages use BI logo
     const nonBiPages = ["system", "admin_panel", "admin", "settings", "auth"];
     const faviconUrl = pageId && !nonBiPages.includes(pageId) 
       ? getPageLogo(pageId) 
       : getSystemLogo();
    const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
    if (link) {
      link.href = faviconUrl;
    } else {
      const newLink = document.createElement("link");
      newLink.rel = "icon";
      newLink.href = faviconUrl;
      document.head.appendChild(newLink);
    }
   }, [loading, pageId, getSystemName, getSystemLogo, getPageTitle, getPageLogo]);
 
   return null;
 };