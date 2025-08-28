import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  insertPhysicalAssessmentSchema,
  type InsertPhysicalAssessment,
  type PhysicalAssessment,
  type Student,
} from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
} from "@/components/ui/form";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { z } from "zod";

const assessmentFormSchema = insertPhysicalAssessmentSchema
  .omit({
    personalTrainerId: true, // Este campo é adicionado automaticamente pelo servidor
  })
  .extend({
    studentId: z.string().min(1, "Selecione um aluno"),
  });

type AssessmentFormData = z.infer<typeof assessmentFormSchema>;

interface PhysicalAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment?: PhysicalAssessment | null;
}

export default function PhysicalAssessmentModal({
  isOpen,
  onClose,
  assessment,
}: PhysicalAssessmentModalProps) {
  const { toast } = useToast();

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isOpen,
  });

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      studentId: "",
      profession: "",
      healthDiagnoses: "",
      medications: "",
      injuriesSurgeries: "",
      currentPains: "",
      familyHistory: "",
      medicalClearance: false,
      pastActivities: "",
      currentActivities: "",
      activityLevel: "",
      currentResistance: "",
      currentStrength: "",
      primaryGoal: "",
      specificDeadline: "",
      targetBodyPart: "",
      lifestyleChange: false,
      dailyNutrition: "",
      supplements: "",
      sleepQuality: "",
      stressLevel: "",
      smoking: "",
      alcoholConsumption: "",
      caffeineConsumption: "",
      bloodPressure: "",
      subjectiveEffortPerception: "",
      additionalNotes: "",
    },
  });

  // Auto-calculate BMI when weight and height change
  const watchWeight = form.watch("currentWeight");
  const watchHeight = form.watch("currentHeight");

  useEffect(() => {
    if (watchWeight && watchHeight) {
      const heightInMeters = Number(watchHeight) / 100;
      const bmi = Number(watchWeight) / (heightInMeters * heightInMeters);
      form.setValue("bmi", Number(bmi.toFixed(2)));
    }
  }, [watchWeight, watchHeight, form]);

  useEffect(() => {
    if (assessment && isOpen) {
      form.reset({
        studentId: assessment.studentId,
        profession: assessment.profession || "",
        healthDiagnoses: assessment.healthDiagnoses || "",
        medications: assessment.medications || "",
        injuriesSurgeries: assessment.injuriesSurgeries || "",
        currentPains: assessment.currentPains || "",
        familyHistory: assessment.familyHistory || "",
        medicalClearance: assessment.medicalClearance || false,
        pastActivities: assessment.pastActivities || "",
        currentActivities: assessment.currentActivities || "",
        activityLevel: assessment.activityLevel || "",
        currentResistance: assessment.currentResistance || "",
        currentStrength: assessment.currentStrength || "",
        primaryGoal: assessment.primaryGoal || "",
        specificDeadline: assessment.specificDeadline || "",
        targetBodyPart: assessment.targetBodyPart || "",
        lifestyleChange: assessment.lifestyleChange || false,
        dailyNutrition: assessment.dailyNutrition || "",
        supplements: assessment.supplements || "",
        sleepQuality: assessment.sleepQuality || "",
        stressLevel: assessment.stressLevel || "",
        smoking: assessment.smoking || "",
        alcoholConsumption: assessment.alcoholConsumption || "",
        caffeineConsumption: assessment.caffeineConsumption || "",
        currentWeight: assessment.currentWeight
          ? Number(assessment.currentWeight)
          : undefined,
        currentHeight: assessment.currentHeight
          ? Number(assessment.currentHeight)
          : undefined,
        bmi: assessment.bmi ? Number(assessment.bmi) : undefined,
        waistCirc: assessment.waistCirc
          ? Number(assessment.waistCirc)
          : undefined,
        hipCirc: assessment.hipCirc ? Number(assessment.hipCirc) : undefined,
        abdomenCirc: assessment.abdomenCirc
          ? Number(assessment.abdomenCirc)
          : undefined,
        armCirc: assessment.armCirc ? Number(assessment.armCirc) : undefined,
        thighCirc: assessment.thighCirc
          ? Number(assessment.thighCirc)
          : undefined,
        calfCirc: assessment.calfCirc ? Number(assessment.calfCirc) : undefined,
        chestCirc: assessment.chestCirc
          ? Number(assessment.chestCirc)
          : undefined,
        bodyFatPercentage: assessment.bodyFatPercentage
          ? Number(assessment.bodyFatPercentage)
          : undefined,
        leanMass: assessment.leanMass ? Number(assessment.leanMass) : undefined,
        bodyWater: assessment.bodyWater
          ? Number(assessment.bodyWater)
          : undefined,
        bloodPressure: assessment.bloodPressure || "",
        restingHeartRate: assessment.restingHeartRate || undefined,
        oxygenSaturation: assessment.oxygenSaturation
          ? Number(assessment.oxygenSaturation)
          : undefined,
        subjectiveEffortPerception: assessment.subjectiveEffortPerception || "",
        additionalNotes: assessment.additionalNotes || "",
      });
    } else if (isOpen) {
      form.reset({
        studentId: "",
        profession: "",
        healthDiagnoses: "",
        medications: "",
        injuriesSurgeries: "",
        currentPains: "",
        familyHistory: "",
        medicalClearance: false,
        pastActivities: "",
        currentActivities: "",
        activityLevel: "",
        currentResistance: "",
        currentStrength: "",
        primaryGoal: "",
        specificDeadline: "",
        targetBodyPart: "",
        lifestyleChange: false,
        dailyNutrition: "",
        supplements: "",
        sleepQuality: "",
        stressLevel: "",
        smoking: "",
        alcoholConsumption: "",
        caffeineConsumption: "",
        bloodPressure: "",
        subjectiveEffortPerception: "",
        additionalNotes: "",
      });
    }
  }, [assessment, isOpen, form]);

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "POST",
        "/api/physical-assessments",
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/physical-assessments"],
      });
      toast({
        title: "Sucesso",
        description: "Avaliação física criada com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você precisa fazer login novamente",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        return;
      }
      toast({
        title: "Erro",
        description: `Erro ao criar avaliação: ${
          error.message || "Erro desconhecido"
        }`,
        variant: "destructive",
      });
    },
  });

  const updateAssessmentMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "PUT",
        `/api/physical-assessments/${assessment?.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/physical-assessments"],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/physical-assessments", assessment?.id],
      });
      toast({
        title: "Sucesso",
        description: "Avaliação física atualizada com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você precisa fazer login novamente",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/login";
        }, 1000);
        return;
      }
      toast({
        title: "Erro",
        description: `Erro ao atualizar avaliação: ${
          error.message || "Erro desconhecido"
        }`,
        variant: "destructive",
      });
    },
  });

  const onSubmit = (data: AssessmentFormData) => {
    if (assessment) {
      updateAssessmentMutation.mutate(data);
    } else {
      createAssessmentMutation.mutate(data);
    }
  };

  const isLoading =
    createAssessmentMutation.isPending || updateAssessmentMutation.isPending;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-6xl max-h-screen overflow-y-auto"
        aria-describedby="assessment-form-description"
      >
        <DialogHeader>
          <DialogTitle>
            {assessment ? "Editar Avaliação Física" : "Nova Avaliação Física"}
          </DialogTitle>
        </DialogHeader>
        <div id="assessment-form-description" className="sr-only">
          Formulário para{" "}
          {assessment
            ? "editar uma avaliação física existente"
            : "criar uma nova avaliação física completa"}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Seleção do Aluno */}
            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluno</FormLabel>
                  <Select
                    value={field.value || ""}
                    onValueChange={field.onChange}
                    disabled={!!assessment}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Selecione o aluno" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {students?.map((student) => (
                        <SelectItem key={student.id} value={student.id}>
                          {student.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Tabs defaultValue="identification" className="w-full">
              <TabsList className="grid w-full grid-cols-8">
                <TabsTrigger value="identification">Identificação</TabsTrigger>
                <TabsTrigger value="health">Saúde</TabsTrigger>
                <TabsTrigger value="physical">Física</TabsTrigger>
                <TabsTrigger value="goals">Objetivos</TabsTrigger>
                <TabsTrigger value="lifestyle">Hábitos</TabsTrigger>
                <TabsTrigger value="anthropometric">Antropométrica</TabsTrigger>
                <TabsTrigger value="clinical">Clínica</TabsTrigger>
                <TabsTrigger value="notes">Observações</TabsTrigger>
              </TabsList>

              <TabsContent value="identification" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      🧑‍⚕️ Identificação Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="profession"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Profissão</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Engenheiro, Professor, Vendedor..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="health" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      🧑‍⚕️ Histórico de Saúde (Anamnese)
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="healthDiagnoses"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doenças diagnosticadas</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Hipertensão, diabetes, problemas cardíacos, respiratórios, etc."
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="medications"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Medicações em uso</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Liste todas as medicações e dosagens..."
                              rows={2}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="injuriesSurgeries"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Lesões, cirurgias ou fraturas</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Histórico de lesões, cirurgias ou fraturas..."
                              rows={2}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentPains"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Dores articulares ou musculares atuais
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva dores atuais e intensidade..."
                              rows={2}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="familyHistory"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Histórico familiar</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Doenças cardiovasculares ou metabólicas na família..."
                              rows={2}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="medicalClearance"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Foi liberado por um médico para praticar
                              exercícios físicos
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="physical" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      🏃 Histórico de Atividade Física
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="pastActivities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Atividades físicas praticadas anteriormente
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Quais atividades praticou? Por quanto tempo?"
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="currentActivities"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Atividades físicas atuais</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Pratica algum esporte ou exercício atualmente?"
                              rows={2}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="activityLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nível de atividade diária</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="sedentary">
                                  Sedentário
                                </SelectItem>
                                <SelectItem value="moderate">
                                  Ativo moderado
                                </SelectItem>
                                <SelectItem value="very_active">
                                  Muito ativo
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currentResistance"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Resistência atual</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Baixa</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="currentStrength"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Força atual</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Baixa</SelectItem>
                                <SelectItem value="medium">Média</SelectItem>
                                <SelectItem value="high">Alta</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="goals" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">🎯 Objetivos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="primaryGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Objetivo principal</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Emagrecimento, hipertrofia, condicionamento, saúde, estética, desempenho..."
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="specificDeadline"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Prazo/meta específica</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Perder 10kg em 6 meses, ganhar 5kg de massa em 1 ano..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="targetBodyPart"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Parte do corpo que gostaria mais de desenvolver
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Pernas, braços, abdômen, glúteos..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="lifestyleChange"
                      render={({ field }) => (
                        <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                          <FormControl>
                            <Checkbox
                              checked={field.value}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Está disposto(a) a mudar hábitos de sono e
                              alimentação junto com o treino
                            </FormLabel>
                          </div>
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lifestyle" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      🍎 Hábitos de Vida
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dailyNutrition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Alimentação diária</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Número de refeições, qualidade, consumo de ultraprocessados, água..."
                              rows={3}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="supplements"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Suplementos</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Whey, creatina, vitaminas..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sleepQuality"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Qualidade do sono</FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Horas por dia, qualidade, problemas de insônia..."
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                      <FormField
                        control={form.control}
                        name="stressLevel"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Nível de estresse</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="low">Baixo</SelectItem>
                                <SelectItem value="moderate">
                                  Moderado
                                </SelectItem>
                                <SelectItem value="high">Alto</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="smoking"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tabagismo</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Não fuma</SelectItem>
                                <SelectItem value="occasional">
                                  Ocasional
                                </SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="alcoholConsumption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Consumo de álcool</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">Não bebe</SelectItem>
                                <SelectItem value="occasional">
                                  Ocasional
                                </SelectItem>
                                <SelectItem value="regular">Regular</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="caffeineConsumption"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Consumo de cafeína</FormLabel>
                            <Select
                              value={field.value || ""}
                              onValueChange={field.onChange}
                            >
                              <FormControl>
                                <SelectTrigger>
                                  <SelectValue placeholder="Selecione" />
                                </SelectTrigger>
                              </FormControl>
                              <SelectContent>
                                <SelectItem value="none">
                                  Não consome
                                </SelectItem>
                                <SelectItem value="moderate">
                                  Moderado
                                </SelectItem>
                                <SelectItem value="high">Alto</SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="anthropometric" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      📏 Avaliação Física Antropométrica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="currentWeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Peso atual (kg)</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="currentHeight"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Altura atual (cm)</FormLabel>
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

                      <FormField
                        control={form.control}
                        name="bmi"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              IMC (calculado automaticamente)
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="23.4"
                                readOnly
                                {...field}
                                value={field.value ?? ""}
                                className="bg-gray-50"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <Label className="text-sm font-medium">
                        Circunferências corporais (cm)
                      </Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="waistCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Cintura</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="80"
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
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="hipCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Quadril</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="95"
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
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="abdomenCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Abdômen</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="85"
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
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="armCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Braço</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="32"
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
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="thighCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Coxa</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="55"
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
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="calfCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Panturrilha
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="36"
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
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="chestCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Peito</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="95"
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
                            </FormItem>
                          )}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="bodyFatPercentage"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>% Gordura corporal</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="15.5"
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

                      <FormField
                        control={form.control}
                        name="leanMass"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Massa magra (kg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="60.5"
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

                      <FormField
                        control={form.control}
                        name="bodyWater"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>% Água corporal</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="60.2"
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
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clinical" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      🫀 Avaliação Clínica Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <FormField
                        control={form.control}
                        name="bloodPressure"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Pressão arterial</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="120/80"
                                {...field}
                                value={field.value || ""}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="restingHeartRate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>FC repouso (bpm)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="70"
                                {...field}
                                value={field.value ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
                                      : undefined
                                  )
                                }
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="oxygenSaturation"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Saturação O2 (%)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="98.5"
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

                    <FormField
                      control={form.control}
                      name="subjectiveEffortPerception"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Percepção subjetiva de esforço</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Escala Borg ou outras observações sobre percepção de esforço..."
                              rows={2}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      📝 Observações Gerais
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <FormField
                      control={form.control}
                      name="additionalNotes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Observações adicionais</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observações importantes, restrições específicas, recomendações..."
                              rows={6}
                              {...field}
                              value={field.value || ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-assessment"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-save-assessment"
              >
                {isLoading
                  ? "Salvando..."
                  : assessment
                  ? "Atualizar Avaliação"
                  : "Salvar Avaliação"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
