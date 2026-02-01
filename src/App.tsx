import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import Index from "./pages/Index";
import Estoque from "./pages/Estoque";
import Entregas from "./pages/Entregas";
import Tracking from "./pages/Tracking";
import EstoqueConsolidado from "./pages/EstoqueConsolidado";
import Faturamento from "./pages/Faturamento";
import Analitico from "./pages/Analitico";
import Admin from "./pages/Admin";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/estoque" element={<Estoque />} />
            <Route path="/entregas" element={<Entregas />} />
            <Route path="/tracking" element={<Tracking />} />
            <Route path="/estoque-consolidado" element={<EstoqueConsolidado />} />
            <Route path="/faturamento" element={<Faturamento />} />
            <Route path="/analitico" element={<Analitico />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
