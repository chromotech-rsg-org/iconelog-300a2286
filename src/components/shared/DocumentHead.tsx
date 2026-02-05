 import { useEffect } from "react";
 import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
 
 interface DocumentHeadProps {
   pageId?: string;
 }
 
 export const DocumentHead = ({ pageId }: DocumentHeadProps) => {
   const { getSystemName, getSystemLogo, getPageTitle, loading } = useBiSettingsContext();
 
   useEffect(() => {
     if (loading) return;
 
     // Set document title
     const systemName = getSystemName();
     const pageTitle = pageId ? getPageTitle(pageId) : null;
     
     document.title = pageTitle && pageId !== "system" 
       ? `${pageTitle} | ${systemName}`
       : systemName;
 
     // Set favicon dynamically
     const systemLogo = getSystemLogo();
     const link = document.querySelector("link[rel~='icon']") as HTMLLinkElement;
     if (link) {
       link.href = systemLogo;
     } else {
       const newLink = document.createElement("link");
       newLink.rel = "icon";
       newLink.href = systemLogo;
       document.head.appendChild(newLink);
     }
   }, [loading, pageId, getSystemName, getSystemLogo, getPageTitle]);
 
   return null;
 };