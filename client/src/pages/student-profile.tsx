"use client";

import { useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Camera, Save, User } from "lucide-react";

const studentProfileSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.enum(["male", "female"]),
  weight: z.string().optional(),
  height: z.string().optional(),
  goal: z.string().optional(),
  medicalConditions: z.string().optional(),
});

type StudentProfileData = z.infer<typeof studentProfileSchema>;

export default function StudentProfile() {
  const { toast } = useToast();
  const [profileImage, setProfileImage] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>("");

  // Buscar dados do estudante atual
  const { data: student, isLoading } = useQuery({
    queryKey: ["/api/auth/student/me"],
    queryFn: async () => {
      const response = await fetch("/api/auth/student/me", {
        credentials: "include",
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const result = await response.json();
      return result.student;
    },
  });

  const form = useForm<StudentProfileData>({
    resolver: zodResolver(studentProfileSchema),
    defaultValues: {
      name: "",
      phone: "",
      dateOfBirth: "",
      gender: "male",
      weight: "",
      height: "",
      goal: "",
      medicalConditions: "",
    },
  });

  // Atualizar formulário quando os dados do estudante carregarem
  useEffect(() => {
    if (student) {
      form.reset({
        name: student.name || "",
        phone: student.phone || "",
        dateOfBirth: student.dateOfBirth
          ? new Date(student.dateOfBirth).toISOString().split("T")[0]
          : "",
        gender: student.gender || "male",
        weight: student.weight ? String(student.weight) : "",
        height: student.height ? String(student.height) : "",
        goal: student.goal || "",
        medicalConditions: student.medicalConditions || "",
      });
      setPreviewUrl(student.profileImage || "");
    }
  }, [student, form]);

  // Mutation para atualizar perfil
  const updateProfileMutation = useMutation({
    mutationFn: async (data: StudentProfileData) => {
      const formData = new FormData();

      // Adicionar dados do formulário
      Object.entries(data).forEach(([key, value]) => {
        if (value) formData.append(key, value);
      });

      // Adicionar foto se houver
      if (profileImage) {
        formData.append("profileImage", profileImage);
      }

      const response = await fetch("/api/profile/student", {
        method: "PUT",
        credentials: "include",
        body: formData,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Perfil atualizado",
        description: "Suas informações foram salvas com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/auth/student/me"] });
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar perfil",
        description: error.message,
        variant: "destructive",
      });
    },
  });

  const handleImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setProfileImage(file);
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    }
  };

  const onSubmit = (data: StudentProfileData) => {
    updateProfileMutation.mutate(data);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 max-w-4xl">
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Meu Perfil</h1>
          <p className="text-gray-600">Gerencie suas informações pessoais</p>
        </div>

        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          {/* Foto de Perfil */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Camera className="h-5 w-5" />
                Foto de Perfil
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-6">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={previewUrl} alt="Foto de perfil" />
                  <AvatarFallback className="text-lg">
                    <User className="h-8 w-8" />
                  </AvatarFallback>
                </Avatar>
                <div>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                    id="profile-image"
                  />
                  <label htmlFor="profile-image">
                    <Button
                      type="button"
                      variant="outline"
                      className="cursor-pointer"
                    >
                      <Camera className="h-4 w-4 mr-2" />
                      Alterar Foto
                    </Button>
                  </label>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Informações Pessoais */}
          <Card>
            <CardHeader>
              <CardTitle>Informações Pessoais</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="name">Nome Completo *</Label>
                <Input
                  {...form.register("name")}
                  id="name"
                  placeholder="Seu nome completo"
                />
                {form.formState.errors.name && (
                  <p className="text-sm text-red-600">
                    {form.formState.errors.name.message}
                  </p>
                )}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="phone">Telefone</Label>
                  <Input
                    {...form.register("phone")}
                    id="phone"
                    placeholder="(11) 99999-9999"
                  />
                </div>
                <div>
                  <Label htmlFor="dateOfBirth">Data de Nascimento</Label>
                  <Input
                    {...form.register("dateOfBirth")}
                    id="dateOfBirth"
                    type="date"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="gender">Gênero</Label>
                  <Select
                    value={form.watch("gender")}
                    onValueChange={(value) =>
                      form.setValue("gender", value as "male" | "female")
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Selecione o gênero" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="male">Masculino</SelectItem>
                      <SelectItem value="female">Feminino</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <Label htmlFor="weight">Peso (kg)</Label>
                  <Input
                    {...form.register("weight")}
                    id="weight"
                    placeholder="Ex: 70.5"
                    type="number"
                    step="0.1"
                  />
                </div>
                <div>
                  <Label htmlFor="height">Altura (cm)</Label>
                  <Input
                    {...form.register("height")}
                    id="height"
                    placeholder="Ex: 175"
                    type="number"
                    step="0.1"
                  />
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Objetivos e Condições Médicas */}
          <Card>
            <CardHeader>
              <CardTitle>Objetivos e Saúde</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="goal">Objetivo Principal</Label>
                <Textarea
                  {...form.register("goal")}
                  id="goal"
                  placeholder="Descreva seus objetivos de treino..."
                  rows={3}
                />
              </div>

              <div>
                <Label htmlFor="medicalConditions">
                  Condições Médicas ou Limitações
                </Label>
                <Textarea
                  {...form.register("medicalConditions")}
                  id="medicalConditions"
                  placeholder="Descreva qualquer condição médica, lesão ou limitação..."
                  rows={3}
                />
              </div>
            </CardContent>
          </Card>

          {/* Botões de Ação */}
          <div className="flex justify-end gap-4">
            <Button type="submit" disabled={updateProfileMutation.isPending}>
              {updateProfileMutation.isPending ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Salvando...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Salvar Alterações
                </>
              )}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}
