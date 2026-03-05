import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
 import { DocumentHead } from "@/components/shared/DocumentHead";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/contexts/AuthContext";
import { useBiSettingsContext } from "@/contexts/BiSettingsContext";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { LogIn, Eye, EyeOff } from "lucide-react";
import { NavigationMenu } from "@/components/shared/NavigationMenu";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const { login, isAuthenticated, loading } = useAuth();
  const { getSystemLogo, getSystemName } = useBiSettingsContext();
  const navigate = useNavigate();

  const systemLogo = getSystemLogo();
  const systemName = getSystemName();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  // Timeout to prevent infinite loading screen
  useEffect(() => {
    if (loading) {
      const timer = setTimeout(() => setLoadingTimeout(true), 8000);
      return () => clearTimeout(timer);
    }
  }, [loading]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error("Preencha email e senha");
      return;
    }
    
    setIsLoading(true);
    try {
      const result = await login(email, senha);
      
      if (result.success) {
        toast.success(result.message);
        navigate("/");
      } else {
        toast.error(result.message);
      }
    } catch (err) {
      console.error("Login error:", err);
      toast.error("Erro ao conectar. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  if (loading && !loadingTimeout) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
       <DocumentHead pageId="auth" />
      {/* Header with navigation menu for public pages */}
      <header className="bg-card border-b border-border p-4 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <img src={systemLogo} alt="Logo" className="h-10 w-10 rounded-lg object-cover border border-primary" />
          <span className="text-foreground font-semibold">{systemName}</span>
        </div>
        <NavigationMenu />
      </header>
      
      <div className="flex-1 flex items-center justify-center p-6">
      <Card className="bg-card border-border w-full max-w-md">
        <CardHeader className="text-center">
          <img src={systemLogo} alt="Logo" className="h-16 w-16 mx-auto rounded-xl object-cover border-2 border-primary mb-4" />
          <CardTitle className="text-xl text-foreground">{systemName}</CardTitle>
          <p className="text-sm text-muted-foreground">Entre com suas credenciais</p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="login-email" className="text-foreground">Email</Label>
              <Input
                id="login-email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                className="bg-background border-border text-foreground"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="login-senha" className="text-foreground">Senha</Label>
              <div className="relative">
                <Input
                  id="login-senha"
                  type={showPassword ? "text" : "password"}
                  value={senha}
                  onChange={(e) => setSenha(e.target.value)}
                  placeholder="••••••••"
                  className="bg-background border-border text-foreground pr-10"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-0 top-0 h-full px-3 text-muted-foreground hover:text-foreground"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </Button>
              </div>
            </div>
            <Button
              type="submit"
              className="w-full bg-primary text-primary-foreground hover:bg-primary/90"
              disabled={isLoading}
            >
              <LogIn className="h-4 w-4 mr-2" />
              {isLoading ? "Entrando..." : "Entrar"}
            </Button>
          </form>
        </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Auth;
