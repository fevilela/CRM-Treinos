import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
});

type LoginForm = z.infer<typeof loginSchema>;

interface LoginPageProps {
  onSuccess: () => void;
}

export default function LoginPage({ onSuccess }: LoginPageProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [isRegistering, setIsRegistering] = useState(false);
  const { toast } = useToast();

  const registerSchema = loginSchema
    .extend({
      firstName: z.string().min(1, "Nome é obrigatório"),
      lastName: z.string().min(1, "Sobrenome é obrigatório"),
      confirmPassword: z.string(),
      role: z.enum(["teacher", "student"], {
        required_error: "Selecione se você é professor ou aluno",
      }),
    })
    .refine((data) => data.password === data.confirmPassword, {
      message: "Senhas não coincidem",
      path: ["confirmPassword"],
    });

  const form = useForm<LoginForm>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const registerForm = useForm<z.infer<typeof registerSchema>>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      confirmPassword: "",
      firstName: "",
      lastName: "",
      role: undefined,
    },
  });

  const handleLogin = async (data: LoginForm) => {
    setIsLoading(true);
    setError("");

    try {
      // Primeiro, tenta login como professor
      try {
        await apiRequest("POST", "/api/login", data);
        toast({
          title: "Login realizado",
          description: "Bem-vindo ao CRM Treinos!",
        });
        onSuccess();
        return;
      } catch (teacherError: any) {
        // Se falhar, tenta login como estudante
        try {
          const response = await fetch("/api/auth/student/login", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(data),
            credentials: "include",
          });

          const result = await response.json();

          if (result.success) {
            toast({
              title: "Login realizado",
              description: "Bem-vindo ao seu painel de treinos!",
            });
            onSuccess();
            return;
          } else {
            throw new Error(result.message || "Credenciais inválidas");
          }
        } catch (studentError: any) {
          // Se ambos falharem, mostra erro genérico
          setError("Email ou senha incorretos");
        }
      }
    } catch (error: any) {
      setError(error.message || "Erro ao fazer login");
    } finally {
      setIsLoading(false);
    }
  };

  const handleRegister = async (data: z.infer<typeof registerSchema>) => {
    setIsLoading(true);
    setError("");

    try {
      await apiRequest("POST", "/api/register", {
        email: data.email,
        password: data.password,
        firstName: data.firstName,
        lastName: data.lastName,
        role: data.role,
      });
      toast({
        title: "Conta criada",
        description: "Sua conta foi criada com sucesso!",
      });
      onSuccess();
    } catch (error: any) {
      setError(error.message || "Erro ao criar conta");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <CardTitle className="text-2xl text-center">
            {isRegistering ? "Criar Conta" : "CRM Treinos MP"}
          </CardTitle>
          <CardDescription className="text-center">
            {isRegistering
              ? "Crie sua conta para começar a gerenciar seus treinos"
              : "Entre com suas credenciais para acessar o sistema"}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {isRegistering ? (
            <form
              onSubmit={registerForm.handleSubmit(handleRegister)}
              className="space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="firstName">Nome</Label>
                  <Input
                    id="firstName"
                    data-testid="input-firstName"
                    {...registerForm.register("firstName")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.firstName && (
                    <p className="text-sm text-red-500 mt-1">
                      {registerForm.formState.errors.firstName.message}
                    </p>
                  )}
                </div>
                <div>
                  <Label htmlFor="lastName">Sobrenome</Label>
                  <Input
                    id="lastName"
                    data-testid="input-lastName"
                    {...registerForm.register("lastName")}
                    disabled={isLoading}
                  />
                  {registerForm.formState.errors.lastName && (
                    <p className="text-sm text-red-500 mt-1">
                      {registerForm.formState.errors.lastName.message}
                    </p>
                  )}
                </div>
              </div>

              <div>
                <Label htmlFor="register-email">Email</Label>
                <Input
                  id="register-email"
                  type="email"
                  data-testid="input-register-email"
                  {...registerForm.register("email")}
                  disabled={isLoading}
                />
                {registerForm.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {registerForm.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="register-password">Senha</Label>
                <Input
                  id="register-password"
                  type="password"
                  data-testid="input-register-password"
                  {...registerForm.register("password")}
                  disabled={isLoading}
                />
                {registerForm.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {registerForm.formState.errors.password.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="confirmPassword">Confirmar Senha</Label>
                <Input
                  id="confirmPassword"
                  type="password"
                  data-testid="input-confirmPassword"
                  {...registerForm.register("confirmPassword")}
                  disabled={isLoading}
                />
                {registerForm.formState.errors.confirmPassword && (
                  <p className="text-sm text-red-500 mt-1">
                    {registerForm.formState.errors.confirmPassword.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="role">Tipo de Usuário</Label>
                <Select
                  onValueChange={(value) =>
                    registerForm.setValue(
                      "role",
                      value as "teacher" | "student"
                    )
                  }
                  disabled={isLoading}
                >
                  <SelectTrigger data-testid="select-role">
                    <SelectValue placeholder="Selecione se você é professor ou aluno" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="teacher">Professor</SelectItem>
                    <SelectItem value="student">Aluno</SelectItem>
                  </SelectContent>
                </Select>
                {registerForm.formState.errors.role && (
                  <p className="text-sm text-red-500 mt-1">
                    {registerForm.formState.errors.role.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-register"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Criar Conta
              </Button>
            </form>
          ) : (
            <form
              onSubmit={form.handleSubmit(handleLogin)}
              className="space-y-4"
            >
              <div>
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  data-testid="input-email"
                  {...form.register("email")}
                  disabled={isLoading}
                />
                {form.formState.errors.email && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.email.message}
                  </p>
                )}
              </div>

              <div>
                <Label htmlFor="password">Senha</Label>
                <Input
                  id="password"
                  type="password"
                  data-testid="input-password"
                  {...form.register("password")}
                  disabled={isLoading}
                />
                {form.formState.errors.password && (
                  <p className="text-sm text-red-500 mt-1">
                    {form.formState.errors.password.message}
                  </p>
                )}
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
                data-testid="button-login"
              >
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Entrar
              </Button>
            </form>
          )}

          <div className="text-center">
            <Button
              variant="link"
              onClick={() => setIsRegistering(!isRegistering)}
              disabled={isLoading}
              data-testid="button-toggle-register"
            >
              {isRegistering
                ? "Já tem uma conta? Faça login"
                : "Não tem uma conta? Registre-se"}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
