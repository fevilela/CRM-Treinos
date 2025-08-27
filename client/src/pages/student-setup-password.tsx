import { useState, useEffect } from "react";
import { useRoute, useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Eye, EyeOff, CheckCircle2 } from "lucide-react";

export default function StudentSetupPassword() {
  const [, params] = useRoute("/student/setup-password");
  const [, setLocation] = useLocation();
  const { toast } = useToast();

  const [token, setToken] = useState("");
  const [studentData, setStudentData] = useState<{
    studentName: string;
    email: string;
    valid: boolean;
  } | null>(null);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isValidating, setIsValidating] = useState(true);

  useEffect(() => {
    // Pegar token da URL
    const urlParams = new URLSearchParams(window.location.search);
    const urlToken = urlParams.get("token");

    if (!urlToken) {
      toast({
        title: "Token inválido",
        description: "Link de convite inválido ou expirado.",
        variant: "destructive",
      });
      setLocation("/student/login");
      return;
    }

    setToken(urlToken);
    validateToken(urlToken);
  }, []);

  const validateToken = async (tokenToValidate: string) => {
    try {
      setIsValidating(true);
      const response = await fetch(`/api/students/invite/${tokenToValidate}`);

      if (response.ok) {
        const data = await response.json();
        setStudentData(data);
      } else {
        toast({
          title: "Token inválido",
          description: "Este convite não é válido ou já foi utilizado.",
          variant: "destructive",
        });
        setLocation("/student/login");
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao validar o convite.",
        variant: "destructive",
      });
      setLocation("/student/login");
    } finally {
      setIsValidating(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast({
        title: "Erro",
        description: "As senhas não coincidem.",
        variant: "destructive",
      });
      return;
    }

    if (password.length < 6) {
      toast({
        title: "Senha muito fraca",
        description: "A senha deve ter pelo menos 6 caracteres.",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      const response = await fetch("/api/students/setup-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (response.ok) {
        toast({
          title: "Sucesso!",
          description:
            "Sua senha foi configurada com sucesso. Você já pode fazer login.",
        });
        setLocation("/student/login");
      } else {
        const data = await response.json();
        toast({
          title: "Erro",
          description: data.message || "Erro ao configurar a senha.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao configurar a senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (isValidating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
        <Card className="w-full max-w-md">
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2">Validando convite...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!studentData) {
    return null;
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <CheckCircle2 className="h-12 w-12 text-green-500" />
          </div>
          <CardTitle className="text-2xl font-bold">
            Bem-vindo ao CRM Treinos!
          </CardTitle>
          <p className="text-gray-600 dark:text-gray-400">
            Olá, <strong>{studentData.studentName}</strong>!<br />
            Configure sua senha para acessar seus treinos.
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={studentData.email}
                disabled
                className="bg-gray-100 dark:bg-gray-800"
                data-testid="input-email"
              />
            </div>

            <div>
              <Label htmlFor="password">Nova Senha</Label>
              <div className="relative">
                <Input
                  id="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  minLength={6}
                  placeholder="Mínimo 6 caracteres"
                  data-testid="input-password"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(!showPassword)}
                  data-testid="button-toggle-password"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
            </div>

            <div>
              <Label htmlFor="confirmPassword">Confirmar Senha</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="Digite a senha novamente"
                data-testid="input-confirm-password"
              />
            </div>

            <Button
              type="submit"
              className="w-full"
              disabled={isLoading || !password || !confirmPassword}
              data-testid="button-setup-password"
            >
              {isLoading ? "Configurando..." : "Configurar Senha"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
