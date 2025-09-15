import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";

const loginSchema = z.object({
  email: z.string().email("Email inválido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

const firstAccessEmailSchema = z.object({
  email: z.string().email("Email inválido"),
});

const verificationCodeSchema = z
  .object({
    code: z.string().length(6, "Código deve ter 6 dígitos"),
    password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres"),
    confirmPassword: z.string().min(6, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Senhas não coincidem",
    path: ["confirmPassword"],
  });

type LoginFormData = z.infer<typeof loginSchema>;
type FirstAccessEmailData = z.infer<typeof firstAccessEmailSchema>;
type VerificationCodeData = z.infer<typeof verificationCodeSchema>;

interface StudentLoginProps {
  onLoginSuccess: (student: any) => void;
}

export function StudentLogin({ onLoginSuccess }: StudentLoginProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [firstAccessStep, setFirstAccessStep] = useState<
    "email" | "verification"
  >("email");
  const [firstAccessEmail, setFirstAccessEmail] = useState("");
  const { toast } = useToast();

  const loginForm = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const firstAccessEmailForm = useForm<FirstAccessEmailData>({
    resolver: zodResolver(firstAccessEmailSchema),
    defaultValues: {
      email: "",
    },
  });

  const verificationForm = useForm<VerificationCodeData>({
    resolver: zodResolver(verificationCodeSchema),
    defaultValues: {
      code: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onLoginSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
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
        onLoginSuccess(result.student);
      } else {
        toast({
          title: "Erro no login",
          description: "Email ou senha incorretos",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível fazer login. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onFirstAccessEmailSubmit = async (data: FirstAccessEmailData) => {
    setIsLoading(true);
    try {
      const response = await fetch("/api/auth/student/first-access", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
        credentials: "include",
      });

      const result = await response.json();

      if (result.success) {
        setFirstAccessEmail(data.email);
        setFirstAccessStep("verification");
        toast({
          title: "Código enviado",
          description: "Verifique seu email para o código de verificação.",
        });
      } else {
        toast({
          title: "Erro",
          description: result.message || "Email não encontrado no sistema.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível enviar o código. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const onVerificationSubmit = async (data: VerificationCodeData) => {
    setIsLoading(true);
    try {
      const response = await fetch(
        "/api/auth/student/verify-and-create-password",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            email: firstAccessEmail,
            code: data.code,
            password: data.password,
          }),
          credentials: "include",
        }
      );

      const result = await response.json();

      if (result.success) {
        toast({
          title: "Senha criada com sucesso",
          description: "Bem-vindo ao seu painel de treinos!",
        });
        onLoginSuccess(result.student);
      } else {
        toast({
          title: "Erro",
          description: result.message || "Código inválido ou expirado.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Erro",
        description: "Não foi possível criar a senha. Tente novamente.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Área do Aluno</CardTitle>
          <CardDescription>
            Acesse seus treinos e acompanhe seu progresso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="login" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="login">Entrar</TabsTrigger>
              <TabsTrigger value="first-access">Primeiro Acesso</TabsTrigger>
            </TabsList>

            <TabsContent value="login" className="space-y-4">
              <form
                onSubmit={loginForm.handleSubmit(onLoginSubmit)}
                className="space-y-4"
              >
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    type="email"
                    placeholder="seu@email.com"
                    data-testid="input-login-email"
                    {...loginForm.register("email")}
                  />
                  {loginForm.formState.errors.email && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.email.message}
                    </p>
                  )}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="login-password">Senha</Label>
                  <Input
                    id="login-password"
                    type="password"
                    placeholder="••••••••"
                    data-testid="input-login-password"
                    {...loginForm.register("password")}
                  />
                  {loginForm.formState.errors.password && (
                    <p className="text-sm text-red-500">
                      {loginForm.formState.errors.password.message}
                    </p>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full"
                  disabled={isLoading}
                  data-testid="button-login"
                >
                  {isLoading ? "Entrando..." : "Entrar"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="first-access" className="space-y-4">
              {firstAccessStep === "email" ? (
                <form
                  onSubmit={firstAccessEmailForm.handleSubmit(
                    onFirstAccessEmailSubmit
                  )}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="first-access-email">Email</Label>
                    <Input
                      id="first-access-email"
                      type="email"
                      placeholder="seu@email.com"
                      data-testid="input-first-access-email"
                      {...firstAccessEmailForm.register("email")}
                    />
                    {firstAccessEmailForm.formState.errors.email && (
                      <p className="text-sm text-red-500">
                        {firstAccessEmailForm.formState.errors.email.message}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Digite o email que seu personal trainer usou para te
                      cadastrar
                    </p>
                  </div>

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                    data-testid="button-first-access-email"
                  >
                    {isLoading ? "Verificando..." : "Verificar Email"}
                  </Button>
                </form>
              ) : (
                <form
                  onSubmit={verificationForm.handleSubmit(onVerificationSubmit)}
                  className="space-y-4"
                >
                  <div className="space-y-2">
                    <Label htmlFor="verification-code">
                      Código de Verificação
                    </Label>
                    <Input
                      id="verification-code"
                      type="text"
                      placeholder="123456"
                      maxLength={6}
                      data-testid="input-verification-code"
                      {...verificationForm.register("code")}
                    />
                    {verificationForm.formState.errors.code && (
                      <p className="text-sm text-red-500">
                        {verificationForm.formState.errors.code.message}
                      </p>
                    )}
                    <p className="text-sm text-gray-600">
                      Enviamos um código de 6 dígitos para {firstAccessEmail}
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="new-password">Nova Senha</Label>
                    <Input
                      id="new-password"
                      type="password"
                      placeholder="••••••••"
                      data-testid="input-new-password"
                      {...verificationForm.register("password")}
                    />
                    {verificationForm.formState.errors.password && (
                      <p className="text-sm text-red-500">
                        {verificationForm.formState.errors.password.message}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="confirm-password">Confirmar Senha</Label>
                    <Input
                      id="confirm-password"
                      type="password"
                      placeholder="••••••••"
                      data-testid="input-confirm-password"
                      {...verificationForm.register("confirmPassword")}
                    />
                    {verificationForm.formState.errors.confirmPassword && (
                      <p className="text-sm text-red-500">
                        {
                          verificationForm.formState.errors.confirmPassword
                            .message
                        }
                      </p>
                    )}
                  </div>

                  <div className="flex space-x-2">
                    <Button
                      type="button"
                      variant="outline"
                      className="w-full"
                      onClick={() => setFirstAccessStep("email")}
                      disabled={isLoading}
                    >
                      Voltar
                    </Button>
                    <Button
                      type="submit"
                      className="w-full"
                      disabled={isLoading}
                      data-testid="button-create-password"
                    >
                      {isLoading ? "Criando..." : "Criar Senha"}
                    </Button>
                  </div>
                </form>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
