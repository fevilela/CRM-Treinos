"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import { insertStudentSchema, type Student } from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
  FormDescription,
} from "@/components/ui/form";
import { z } from "zod";

const studentFormSchema = insertStudentSchema
  .omit({
    personalTrainerId: true, // Este campo é adicionado automaticamente pelo servidor
    inviteToken: true,
    isInvitePending: true,
  })
  .extend({
    name: z.string().min(1, "Nome é obrigatório"),
    gender: z.enum(["male", "female"], {
      required_error: "Gênero é obrigatório",
    }),
    cpf: z.string().optional(),
  });

type StudentFormData = z.infer<typeof studentFormSchema>;

interface StudentModalProps {
  isOpen: boolean;
  onClose: () => void;
  student?: Student | null;
}

export default function StudentModal({
  isOpen,
  onClose,
  student,
}: StudentModalProps) {
  const { toast } = useToast();
  const [cpfLoading, setCpfLoading] = useState(false);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      cpf: "",
      gender: "male",
      weight: undefined,
      height: undefined,
      goal: "",
      medicalConditions: "",
      status: "active",
    },
  });

  useEffect(() => {
    if (student && isOpen) {
      form.reset({
        name: student.name,
        email: student.email || "",
        phone: student.phone || "",
        cpf: student.cpf || "",
        gender: student.gender,
        weight: typeof student.weight === "number" ? student.weight : undefined,
        height: typeof student.height === "number" ? student.height : undefined,
        goal: student.goal || "",
        medicalConditions: student.medicalConditions || "",
        status: student.status || "active",
      });
    } else if (isOpen) {
      form.reset({
        name: "",
        email: "",
        phone: "",
        cpf: "",
        gender: "male",
        weight: undefined,
        height: undefined,
        goal: "",
        medicalConditions: "",
        status: "active",
      });
    }
  }, [student, isOpen, form]);

  const createStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await apiRequest("POST", "/api/students", data);
      return response.json();
    },
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/stats"] });

      const successMessage = "Aluno criado com sucesso!";

      toast({ title: "Sucesso", description: successMessage });
      onClose();
    },
    onError: (error) => handleError(error, "criar"),
  });

  const updateStudentMutation = useMutation({
    mutationFn: async (data: StudentFormData) => {
      const response = await apiRequest(
        "PUT",
        `/api/students/${student!.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({ title: "Sucesso", description: "Aluno atualizado com sucesso!" });
      onClose();
    },
    onError: (error) => handleError(error, "atualizar"),
  });

  const handleError = (error: any, action: "criar" | "atualizar") => {
    console.error("Erro ao salvar:", error);
    if (isUnauthorizedError(error)) {
      toast({
        title: "Unauthorized",
        description: "Você foi desconectado.",
        variant: "destructive",
      });
      setTimeout(() => {
        window.location.href = "/api/login";
      }, 500);
      return;
    }
    toast({
      title: "Erro",
      description: `Erro ao ${action} aluno`,
      variant: "destructive",
    });
  };

  const handleCPFLookup = async (cpf: string) => {
    const cleanCPF = cpf.replace(/\D/g, "");
    if (cleanCPF.length !== 11) {
      return;
    }

    setCpfLoading(true);
    try {
      const response = await apiRequest("POST", "/api/cpf/validate", { cpf });
      const data = await response.json();

      if (data.valid) {
        toast({
          title: "CPF válido",
          description:
            "CPF encontrado na Receita Federal. Para buscar dados completos (nome e data de nascimento), é necessário integrar com API paga (SERPRO).",
        });

        if (data.name) {
          form.setValue("name", data.name);
        }
        if (data.dateOfBirth) {
          form.setValue("dateOfBirth", new Date(data.dateOfBirth));
        }
      } else {
        toast({
          title: "CPF inválido ou não encontrado",
          description: data.error || "CPF não encontrado na Receita Federal",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Erro ao consultar CPF:", error);
      toast({
        title: "Erro",
        description: "Não foi possível consultar o CPF. Verifique sua conexão.",
        variant: "destructive",
      });
    } finally {
      setCpfLoading(false);
    }
  };

  const formatCPF = (value: string) => {
    const cleanValue = value.replace(/\D/g, "");
    if (cleanValue.length <= 11) {
      return cleanValue
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d)/, "$1.$2")
        .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
    }
    return value;
  };

  const onSubmit = (data: StudentFormData) => {
    if (student) updateStudentMutation.mutate(data);
    else createStudentMutation.mutate(data);
  };

  const isLoading =
    createStudentMutation.isPending || updateStudentMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-2xl max-h-screen overflow-y-auto"
        aria-describedby="student-form-description"
      >
        <DialogHeader>
          <DialogTitle>{student ? "Editar Aluno" : "Novo Aluno"}</DialogTitle>
        </DialogHeader>
        <div id="student-form-description" className="sr-only">
          Formulário para{" "}
          {student
            ? "editar os dados de um aluno existente"
            : "cadastrar um novo aluno no sistema"}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Nome */}
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome Completo</FormLabel>
                    <FormControl>
                      <Input placeholder="Nome do aluno" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Email */}
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input
                        type="email"
                        placeholder="email@exemplo.com"
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-student-email"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Telefone */}
              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Telefone</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="(11) 99999-9999"
                        {...field}
                        value={field.value ?? ""}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* CPF */}
              <FormField
                control={form.control}
                name="cpf"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>CPF (opcional)</FormLabel>
                    <FormControl>
                      <div className="flex gap-2">
                        <Input
                          placeholder="000.000.000-00"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) => {
                            const formatted = formatCPF(e.target.value);
                            field.onChange(formatted);
                          }}
                          onBlur={() => {
                            if (
                              field.value &&
                              field.value.replace(/\D/g, "").length === 11
                            ) {
                              handleCPFLookup(field.value);
                            }
                          }}
                          maxLength={14}
                        />
                      </div>
                    </FormControl>
                    <FormDescription>
                      {cpfLoading
                        ? "Consultando CPF..."
                        : "Preencha para buscar dados automaticamente"}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Gênero */}
              <FormField
                control={form.control}
                name="gender"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gênero</FormLabel>
                    <Select
                      value={field.value ?? ""}
                      onValueChange={field.onChange}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione o gênero" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="male">Masculino</SelectItem>
                        <SelectItem value="female">Feminino</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Peso */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Peso (kg)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="70.5"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Altura */}
              <FormField
                control={form.control}
                name="height"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Altura (cm)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        step="0.1"
                        placeholder="175"
                        {...field}
                        value={field.value ?? ""}
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? parseFloat(e.target.value)
                              : undefined
                          )
                        }
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            {/* Objetivo */}
            <FormField
              control={form.control}
              name="goal"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Objetivo</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Ex: Hipertrofia, Emagrecimento"
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Condições Médicas */}
            <FormField
              control={form.control}
              name="medicalConditions"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Condições Médicas</FormLabel>
                  <FormControl>
                    <Textarea
                      rows={3}
                      placeholder="Condições médicas..."
                      {...field}
                      value={field.value ?? ""}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Status */}
            <FormField
              control={form.control}
              name="status"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="active">Ativo</SelectItem>
                      <SelectItem value="inactive">Inativo</SelectItem>
                      <SelectItem value="suspended">Suspenso</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button type="button" variant="outline" onClick={onClose}>
                Cancelar
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading
                  ? "Salvando..."
                  : student
                  ? "Atualizar"
                  : "Criar Aluno"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
