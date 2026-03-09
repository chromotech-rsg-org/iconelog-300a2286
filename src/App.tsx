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
import Index from "./pages/Index";
import Estoque from "./pages/Estoque";
import Entregas from "./pages/Entregas";
import Tracking from "./pages/Tracking";
import EstoqueConsolidado from "./pages/EstoqueConsolidado";
import Faturamento from "./pages/Faturamento";
import Analitico from "./pages/Analitico";
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
                <Route path="/minutas" element={<ProtectedRoute pageId="minutas"><Index /></ProtectedRoute>} />
                 <Route path="/estoque" element={<ProtectedRoute pageId="estoque"><Estoque /></ProtectedRoute>} />
                 <Route path="/entregas" element={<ProtectedRoute pageId="entregas"><Entregas /></ProtectedRoute>} />
                 <Route path="/tracking" element={<ProtectedRoute pageId="tracking"><Tracking /></ProtectedRoute>} />
                 <Route path="/estoque-consolidado" element={<ProtectedRoute pageId="estoque-consolidado"><EstoqueConsolidado /></ProtectedRoute>} />
                 <Route path="/faturamento" element={<ProtectedRoute pageId="faturamento"><Faturamento /></ProtectedRoute>} />
                 <Route path="/analitico" element={<ProtectedRoute pageId="analitico"><Analitico /></ProtectedRoute>} />
                <Route path="/admin" element={<ProtectedRoute pageId="admin_panel" requireAuth={true}><Admin /></ProtectedRoute>} />
                
                <Route path="/auth" element={<Auth />} />
                <Route path="/no-access" element={<NoAccess />} />
                {/* Dynamic slug-based routing - catches custom slugs like /b-side-entregas */}
                <Route path="/:slug" element={<DynamicBiRoute />} />
                <Route path="*" element={<NotFound />} />
             </Routes>
           </BrowserRouter>
         </TooltipProvider>
         </LanguageProvider>
       </BiSettingsProvider>
    </AuthProvider>
  </QueryClientProvider>
  );
};

export default App;
