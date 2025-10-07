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
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
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
import AnamneseModal from "./anamnese-modal";

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
  const [showAnamneseDialog, setShowAnamneseDialog] = useState(false);
  const [showAnamneseModal, setShowAnamneseModal] = useState(false);
  const [createdStudent, setCreatedStudent] = useState<Student | null>(null);

  const form = useForm<StudentFormData>({
    resolver: zodResolver(studentFormSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      gender: "male",
      dateOfBirth: undefined,
      profession: "",
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
        gender: student.gender,
        dateOfBirth: student.dateOfBirth
          ? new Date(student.dateOfBirth)
          : undefined,
        profession: student.profession || "",
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
        gender: "male",
        dateOfBirth: undefined,
        profession: "",
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

      toast({ title: "Sucesso", description: "Aluno criado com sucesso!" });

      setCreatedStudent(result);
      setShowAnamneseDialog(true);
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

              {/* Data de Nascimento */}
              <FormField
                control={form.control}
                name="dateOfBirth"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Data de Nascimento</FormLabel>
                    <FormControl>
                      <Input
                        type="date"
                        {...field}
                        value={
                          field.value
                            ? new Date(field.value).toISOString().split("T")[0]
                            : ""
                        }
                        onChange={(e) =>
                          field.onChange(
                            e.target.value
                              ? new Date(e.target.value)
                              : undefined
                          )
                        }
                        data-testid="input-date-of-birth"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Profissão */}
              <FormField
                control={form.control}
                name="profession"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Profissão</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Engenheiro, Professor..."
                        {...field}
                        value={field.value ?? ""}
                        data-testid="input-profession"
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
      console.log(studentData);
      {/* Alert Dialog to ask about anamnese */}
      <AlertDialog
        open={showAnamneseDialog}
        onOpenChange={setShowAnamneseDialog}
      >
        <AlertDialogContent data-testid="dialog-anamnese-prompt">
          <AlertDialogHeader>
            <AlertDialogTitle>Deseja preencher uma anamnese?</AlertDialogTitle>
            <AlertDialogDescription>
              A anamnese é uma avaliação completa que ajuda a criar um treino
              mais personalizado para o aluno. Você pode preencher agora ou
              adicionar depois.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setShowAnamneseDialog(false);
                setCreatedStudent(null);
                onClose();
              }}
              data-testid="button-anamnese-no"
            >
              Não, obrigado
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                setShowAnamneseDialog(false);
                setShowAnamneseModal(true);
              }}
              data-testid="button-anamnese-yes"
            >
              Sim, preencher agora
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Anamnese Modal */}
      {createdStudent && (
        <AnamneseModal
          isOpen={showAnamneseModal}
          onClose={() => {
            setShowAnamneseModal(false);
            setCreatedStudent(null);
            onClose();
          }}
          student={createdStudent}
        />
      )}
    </Dialog>
  );
}
