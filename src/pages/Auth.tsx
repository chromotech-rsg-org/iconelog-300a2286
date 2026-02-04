import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import logo from "@/assets/logo.jpg";
import { LogIn, Eye, EyeOff, UserPlus } from "lucide-react";

const Auth = () => {
  const [email, setEmail] = useState("");
  const [senha, setSenha] = useState("");
  const [nome, setNome] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [activeTab, setActiveTab] = useState("login");
  const { login, signUp, isAuthenticated, loading } = useAuth();
  const navigate = useNavigate();

  // Redirect if already authenticated
  useEffect(() => {
    if (!loading && isAuthenticated) {
      navigate("/");
    }
  }, [isAuthenticated, loading, navigate]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha) {
      toast.error("Preencha email e senha");
      return;
    }
    
    setIsLoading(true);
    const result = await login(email, senha);
    
    if (result.success) {
      toast.success(result.message);
      navigate("/");
    } else {
      toast.error(result.message);
    }
    
    setIsLoading(false);
  };

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !senha || !nome) {
      toast.error("Preencha todos os campos");
      return;
    }

    if (senha.length < 6) {
      toast.error("A senha deve ter pelo menos 6 caracteres");
      return;
    }
    
    setIsLoading(true);
    const result = await signUp(email, senha, nome);
    
    if (result.success) {
      toast.success(result.message);
      if (result.needsConfirmation) {
        setActiveTab("login");
      } else {
        navigate("/");
      }
    } else {
      toast.error(result.message);
    }
    
    setIsLoading(false);
  };

  const resetForm = () => {
    setEmail("");
    setSenha("");
    setNome("");
    setShowPassword(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-dashboard-dark flex items-center justify-center">
        <div className="text-foreground">Carregando...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-dashboard-dark flex items-center justify-center p-6">
      <Card className="bg-dashboard-card border-dashboard-border w-full max-w-md">
        <CardHeader className="text-center">
          <img src={logo} alt="Logo" className="h-16 w-16 mx-auto rounded-xl border-2 border-dashboard-accent mb-4" />
          <CardTitle className="text-xl text-foreground">Relatórios Icone Log</CardTitle>
          <p className="text-sm text-muted-foreground">Entre com suas credenciais</p>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); resetForm(); }}>
            <TabsList className="w-full bg-dashboard-dark">
              <TabsTrigger value="login" className="flex-1 data-[state=active]:bg-dashboard-accent data-[state=active]:text-dashboard-dark">
                Entrar
              </TabsTrigger>
              <TabsTrigger value="signup" className="flex-1 data-[state=active]:bg-dashboard-accent data-[state=active]:text-dashboard-dark">
                Cadastrar
              </TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="mt-4">
              <form onSubmit={handleLogin} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="login-email" className="text-foreground">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-dashboard-dark border-dashboard-border text-foreground"
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
                      className="bg-dashboard-dark border-dashboard-border text-foreground pr-10"
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
                  className="w-full bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/90"
                  disabled={isLoading}
                >
                  <LogIn className="h-4 w-4 mr-2" />
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="signup" className="mt-4">
              <form onSubmit={handleSignUp} className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="signup-nome" className="text-foreground">Nome</Label>
                  <Input
                    id="signup-nome"
                    type="text"
                    value={nome}
                    onChange={(e) => setNome(e.target.value)}
                    placeholder="Seu nome completo"
                    className="bg-dashboard-dark border-dashboard-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email" className="text-foreground">Email</Label>
                  <Input
                    id="signup-email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="seu@email.com"
                    className="bg-dashboard-dark border-dashboard-border text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-senha" className="text-foreground">Senha</Label>
                  <div className="relative">
                    <Input
                      id="signup-senha"
                      type={showPassword ? "text" : "password"}
                      value={senha}
                      onChange={(e) => setSenha(e.target.value)}
                      placeholder="Mínimo 6 caracteres"
                      className="bg-dashboard-dark border-dashboard-border text-foreground pr-10"
                      required
                      minLength={6}
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
                  className="w-full bg-dashboard-accent text-dashboard-dark hover:bg-dashboard-accent/90"
                  disabled={isLoading}
                >
                  <UserPlus className="h-4 w-4 mr-2" />
                  {isLoading ? "Cadastrando..." : "Cadastrar"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <div className="mt-4 text-center">
            <Button variant="link" onClick={() => navigate("/")} className="text-muted-foreground hover:text-dashboard-accent">
              Continuar sem login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default Auth;
