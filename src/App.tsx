import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
 import { AuthProvider } from "@/contexts/AuthContext";
 import { BiSettingsProvider } from "@/contexts/BiSettingsContext";
 import { LanguageProvider } from "@/contexts/LanguageContext";
import { SmartRedirect } from "@/components/auth/SmartRedirect";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import DynamicBiRoute from "@/components/auth/DynamicBiRoute";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NoAccess from "./pages/NoAccess";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      staleTime: 5 * 60 * 1000, // 5 minutes
    },
  },
});

const App = () => {
  return (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
        <LanguageProvider>
          <BiSettingsProvider>
         <TooltipProvider>
           <Toaster />
           <Sonner />
           <BrowserRouter>
             <Routes>
                <Route path="/" element={<SmartRedirect />} />
                <Route path="/admin" element={<ProtectedRoute pageId="admin_panel" requireAuth={true}><Admin /></ProtectedRoute>} />
                <Route path="/auth" element={<Auth />} />
                <Route path="/no-access" element={<NoAccess />} />
                {/* All BI pages handled dynamically via slug */}
                <Route path="/:slug" element={<DynamicBiRoute />} />
                <Route path="*" element={<NotFound />} />
             </Routes>
           </BrowserRouter>
         </TooltipProvider>
       </BiSettingsProvider>
         </LanguageProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
