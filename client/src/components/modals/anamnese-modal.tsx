"use client";

import { useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  insertAnamneseSchema,
  type Student,
  type Anamnese,
} from "@shared/schema";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const anamneseFormSchema = insertAnamneseSchema.omit({
  personalTrainerId: true,
});

type AnamneseFormData = z.infer<typeof anamneseFormSchema>;

interface AnamneseModalProps {
  isOpen: boolean;
  onClose: () => void;
  student: Student;
  anamnese?: Anamnese | null;
}

export default function AnamneseModal({
  isOpen,
  onClose,
  student,
  anamnese,
}: AnamneseModalProps) {
  const { toast } = useToast();

  const form = useForm<AnamneseFormData>({
    resolver: zodResolver(anamneseFormSchema),
    defaultValues: {
      studentId: student.id,
      assessmentDate: new Date(),
      primaryGoal: undefined,
      otherGoal: "",
      goalTimeframe: "",
      hasTrainedBefore: false,
      timeInactive: "",
      previousActivities: "",
      trainingFrequency: undefined,
      hadProfessionalGuidance: false,
      currentFitnessLevel: undefined,
      doesWarmupStretching: false,
      hasDiagnosedDiseases: false,
      diagnosedDiseases: "",
      takesContinuousMedication: false,
      medications: "",
      hadSurgery: false,
      surgeryDetails: "",
      hasHypertensionHistory: false,
      hasDiabetesHistory: false,
      hasHeartProblemsHistory: false,
      painOrLimitation: "",
      hadDizzinessFainting: false,
      familyHeartDisease: false,
      familyHypertension: false,
      familyDiabetes: false,
      geneticConditions: "",
      dailyNutrition: "",
      waterIntakeLiters: undefined,
      consumesAlcohol: false,
      alcoholFrequency: undefined,
      smokes: false,
      smokingDuration: "",
      sleepHoursPerNight: undefined,
      stressLevel: undefined,
      weeklyTrainingFrequency: undefined,
      availableDaysAndTimes: "",
      preferredTrainingLocation: "",
      availableEquipment: "",
    },
  });

  useEffect(() => {
    if (anamnese && isOpen) {
      form.reset({
        studentId: anamnese.studentId,
        assessmentDate: anamnese.assessmentDate || new Date(),
        primaryGoal: anamnese.primaryGoal || undefined,
        otherGoal: anamnese.otherGoal || "",
        goalTimeframe: anamnese.goalTimeframe || "",
        hasTrainedBefore: anamnese.hasTrainedBefore || false,
        timeInactive: anamnese.timeInactive || "",
        previousActivities: anamnese.previousActivities || "",
        trainingFrequency: anamnese.trainingFrequency || undefined,
        hadProfessionalGuidance: anamnese.hadProfessionalGuidance || false,
        currentFitnessLevel: anamnese.currentFitnessLevel || undefined,
        doesWarmupStretching: anamnese.doesWarmupStretching || false,
        hasDiagnosedDiseases: anamnese.hasDiagnosedDiseases || false,
        diagnosedDiseases: anamnese.diagnosedDiseases || "",
        takesContinuousMedication: anamnese.takesContinuousMedication || false,
        medications: anamnese.medications || "",
        hadSurgery: anamnese.hadSurgery || false,
        surgeryDetails: anamnese.surgeryDetails || "",
        hasHypertensionHistory: anamnese.hasHypertensionHistory || false,
        hasDiabetesHistory: anamnese.hasDiabetesHistory || false,
        hasHeartProblemsHistory: anamnese.hasHeartProblemsHistory || false,
        painOrLimitation: anamnese.painOrLimitation || "",
        hadDizzinessFainting: anamnese.hadDizzinessFainting || false,
        familyHeartDisease: anamnese.familyHeartDisease || false,
        familyHypertension: anamnese.familyHypertension || false,
        familyDiabetes: anamnese.familyDiabetes || false,
        geneticConditions: anamnese.geneticConditions || "",
        dailyNutrition: anamnese.dailyNutrition || "",
        waterIntakeLiters:
          typeof anamnese.waterIntakeLiters === "number"
            ? anamnese.waterIntakeLiters
            : undefined,
        consumesAlcohol: anamnese.consumesAlcohol || false,
        alcoholFrequency: anamnese.alcoholFrequency || undefined,
        smokes: anamnese.smokes || false,
        smokingDuration: anamnese.smokingDuration || "",
        sleepHoursPerNight:
          typeof anamnese.sleepHoursPerNight === "number"
            ? anamnese.sleepHoursPerNight
            : undefined,
        stressLevel: anamnese.stressLevel || undefined,
        weeklyTrainingFrequency: anamnese.weeklyTrainingFrequency || undefined,
        availableDaysAndTimes: anamnese.availableDaysAndTimes || "",
        preferredTrainingLocation: anamnese.preferredTrainingLocation || "",
        availableEquipment: anamnese.availableEquipment || "",
      });
    } else if (isOpen) {
      form.reset({
        studentId: student.id,
      });
    }
  }, [anamnese, isOpen, form, student.id]);

  const createAnamneseMutation = useMutation({
    mutationFn: async (data: AnamneseFormData) => {
      const response = await apiRequest("POST", "/api/anamneses", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anamneses"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/anamneses/student", student.id],
      });
      toast({ title: "Sucesso", description: "Anamnese criada com sucesso!" });
      onClose();
    },
    onError: (error) => handleError(error, "criar"),
  });

  const updateAnamneseMutation = useMutation({
    mutationFn: async (data: AnamneseFormData) => {
      const response = await apiRequest(
        "PUT",
        `/api/anamneses/${anamnese!.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anamneses"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/anamneses/student", student.id],
      });
      toast({
        title: "Sucesso",
        description: "Anamnese atualizada com sucesso!",
      });
      onClose();
    },
    onError: (error) => handleError(error, "atualizar"),
  });

  const handleError = (error: any, action: "criar" | "atualizar") => {
    console.error("Erro ao salvar anamnese:", error);
    if (isUnauthorizedError(error)) {
      toast({
        title: "Não autorizado",
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
      description: `Erro ao ${action} anamnese`,
      variant: "destructive",
    });
  };

  const onSubmit = (data: AnamneseFormData) => {
    if (anamnese) {
      updateAnamneseMutation.mutate(data);
    } else {
      createAnamneseMutation.mutate(data);
    }
  };

  const isLoading =
    createAnamneseMutation.isPending || updateAnamneseMutation.isPending;

  const calculateAge = (dateOfBirth: Date | null | undefined): number => {
    if (!dateOfBirth) return 0;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (
      monthDiff < 0 ||
      (monthDiff === 0 && today.getDate() < birthDate.getDate())
    ) {
      age--;
    }
    return age;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-screen overflow-y-auto"
        aria-describedby="anamnese-form-description"
      >
        <DialogHeader>
          <DialogTitle>
            {anamnese ? "Editar Anamnese" : "Nova Anamnese"}
          </DialogTitle>
          <DialogDescription id="anamnese-form-description">
            Preencha os dados da anamnese do aluno {student.name}
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <Tabs defaultValue="identification" className="w-full">
              <TabsList className="grid w-full grid-cols-4 lg:grid-cols-7">
                <TabsTrigger value="identification">
                  1. Identificação
                </TabsTrigger>
                <TabsTrigger value="goal">2. Objetivo</TabsTrigger>
                <TabsTrigger value="activity">3. Atividade</TabsTrigger>
                <TabsTrigger value="health">4. Saúde</TabsTrigger>
                <TabsTrigger value="family">5. Família</TabsTrigger>
                <TabsTrigger value="habits">6. Hábitos</TabsTrigger>
                <TabsTrigger value="routine">7. Rotina</TabsTrigger>
              </TabsList>

              {/* Section 1: Identification */}
              <TabsContent value="identification" className="space-y-4">
                <h3 className="text-lg font-semibold">1. Identificação</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 bg-muted rounded-lg">
                  <div>
                    <p className="text-sm font-medium">Nome completo:</p>
                    <p className="text-sm text-muted-foreground">
                      {student.name}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Idade:</p>
                    <p className="text-sm text-muted-foreground">
                      {student.dateOfBirth
                        ? `${calculateAge(student.dateOfBirth)} anos`
                        : "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Sexo:</p>
                    <p className="text-sm text-muted-foreground">
                      {student.gender === "male" ? "Masculino" : "Feminino"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Profissão:</p>
                    <p className="text-sm text-muted-foreground">
                      {student.profession || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Telefone / Contato:</p>
                    <p className="text-sm text-muted-foreground">
                      {student.phone || "Não informado"}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium">Data da avaliação:</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date().toLocaleDateString("pt-BR")}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground italic">
                  Os campos de identificação são preenchidos automaticamente com
                  os dados do aluno.
                </p>
              </TabsContent>

              {/* Section 2: Main Goal */}
              <TabsContent value="goal" className="space-y-4">
                <h3 className="text-lg font-semibold">2. Objetivo Principal</h3>

                <FormField
                  control={form.control}
                  name="primaryGoal"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Qual é o seu principal objetivo com o treino?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        data-testid="select-primary-goal"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="weight_loss">
                            Emagrecimento
                          </SelectItem>
                          <SelectItem value="hypertrophy">
                            Hipertrofia
                          </SelectItem>
                          <SelectItem value="conditioning">
                            Condicionamento
                          </SelectItem>
                          <SelectItem value="health">Saúde</SelectItem>
                          <SelectItem value="other">Outros</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {form.watch("primaryGoal") === "other" && (
                  <FormField
                    control={form.control}
                    name="otherGoal"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Especifique o objetivo</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Descreva seu objetivo..."
                            {...field}
                            data-testid="input-other-goal"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="goalTimeframe"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Em quanto tempo pretende atingir esse objetivo?
                      </FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 3 meses, 6 meses..."
                          {...field}
                          data-testid="input-goal-timeframe"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hasTrainedBefore"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-has-trained-before"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Já treinou antes?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="timeInactive"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Há quanto tempo está parado?</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Ex: 1 ano, 6 meses..."
                          {...field}
                          data-testid="input-time-inactive"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Section 3: Physical Activity History */}
              <TabsContent value="activity" className="space-y-4">
                <h3 className="text-lg font-semibold">
                  3. Histórico de Atividade Física
                </h3>

                <FormField
                  control={form.control}
                  name="previousActivities"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quais modalidades já praticou?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Musculação, corrida, natação..."
                          {...field}
                          data-testid="textarea-previous-activities"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="trainingFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Com que frequência treinava?</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        data-testid="select-training-frequency"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="never">Nunca</SelectItem>
                          <SelectItem value="rarely">Raramente</SelectItem>
                          <SelectItem value="sometimes">Às vezes</SelectItem>
                          <SelectItem value="often">Frequentemente</SelectItem>
                          <SelectItem value="daily">Diariamente</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hadProfessionalGuidance"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-had-professional-guidance"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Fez ou faz acompanhamento profissional?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="currentFitnessLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Qual o nível atual de condicionamento físico?
                      </FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        data-testid="select-current-fitness-level"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="medium">Médio</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="doesWarmupStretching"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-does-warmup-stretching"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Faz alongamentos ou aquecimento regularmente?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Section 4: Health History */}
              <TabsContent value="health" className="space-y-4">
                <h3 className="text-lg font-semibold">4. Histórico de Saúde</h3>

                <FormField
                  control={form.control}
                  name="hasDiagnosedDiseases"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-has-diagnosed-diseases"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Possui alguma doença diagnosticada?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("hasDiagnosedDiseases") && (
                  <FormField
                    control={form.control}
                    name="diagnosedDiseases"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual(is)?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Liste as doenças..."
                            {...field}
                            data-testid="textarea-diagnosed-diseases"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="takesContinuousMedication"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-takes-continuous-medication"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Usa medicamentos contínuos?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("takesContinuousMedication") && (
                  <FormField
                    control={form.control}
                    name="medications"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Quais?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Liste os medicamentos..."
                            {...field}
                            data-testid="textarea-medications"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="hadSurgery"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-had-surgery"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Já realizou alguma cirurgia?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("hadSurgery") && (
                  <FormField
                    control={form.control}
                    name="surgeryDetails"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Qual e quando?</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Descreva as cirurgias..."
                            {...field}
                            data-testid="textarea-surgery-details"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <div className="space-y-2">
                  <FormLabel>Histórico de doenças:</FormLabel>
                  <FormField
                    control={form.control}
                    name="hasHypertensionHistory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-has-hypertension-history"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">
                            Hipertensão
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasDiabetesHistory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-has-diabetes-history"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">
                            Diabetes
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="hasHeartProblemsHistory"
                    render={({ field }) => (
                      <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                        <FormControl>
                          <Checkbox
                            checked={field.value}
                            onCheckedChange={field.onChange}
                            data-testid="checkbox-has-heart-problems-history"
                          />
                        </FormControl>
                        <div className="space-y-1 leading-none">
                          <FormLabel className="font-normal">
                            Problemas cardíacos
                          </FormLabel>
                        </div>
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="painOrLimitation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Alguma dor, lesão ou limitação articular/muscular?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva..."
                          {...field}
                          data-testid="textarea-pain-or-limitation"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="hadDizzinessFainting"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-had-dizziness-fainting"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>
                          Já teve algum episódio de tontura, desmaio ou falta de
                          ar durante exercícios?
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Section 5: Family History */}
              <TabsContent value="family" className="space-y-4">
                <h3 className="text-lg font-semibold">5. Histórico Familiar</h3>

                <FormLabel>Há casos na família de:</FormLabel>

                <FormField
                  control={form.control}
                  name="familyHeartDisease"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-family-heart-disease"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          Doenças cardíacas
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="familyHypertension"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-family-hypertension"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">
                          Hipertensão
                        </FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="familyDiabetes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-family-diabetes"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel className="font-normal">Diabetes</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="geneticConditions"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Alguma condição genética relevante?</FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva..."
                          {...field}
                          data-testid="textarea-genetic-conditions"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Section 6: Lifestyle Habits */}
              <TabsContent value="habits" className="space-y-4">
                <h3 className="text-lg font-semibold">6. Hábitos de Vida</h3>

                <FormField
                  control={form.control}
                  name="dailyNutrition"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Como é sua alimentação no dia a dia?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Descreva sua alimentação..."
                          {...field}
                          data-testid="textarea-daily-nutrition"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="waterIntakeLiters"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Consumo de água (litros/dia)</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.1"
                          placeholder="Ex: 2.5"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                          data-testid="input-water-intake-liters"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="consumesAlcohol"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-consumes-alcohol"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Consome álcool?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("consumesAlcohol") && (
                  <FormField
                    control={form.control}
                    name="alcoholFrequency"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Com que frequência?</FormLabel>
                        <Select
                          onValueChange={field.onChange}
                          value={field.value || ""}
                          data-testid="select-alcohol-frequency"
                        >
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecione..." />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            <SelectItem value="never">Nunca</SelectItem>
                            <SelectItem value="rarely">Raramente</SelectItem>
                            <SelectItem value="sometimes">Às vezes</SelectItem>
                            <SelectItem value="often">
                              Frequentemente
                            </SelectItem>
                            <SelectItem value="daily">Diariamente</SelectItem>
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="smokes"
                  render={({ field }) => (
                    <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                      <FormControl>
                        <Checkbox
                          checked={field.value}
                          onCheckedChange={field.onChange}
                          data-testid="checkbox-smokes"
                        />
                      </FormControl>
                      <div className="space-y-1 leading-none">
                        <FormLabel>Fuma?</FormLabel>
                      </div>
                    </FormItem>
                  )}
                />

                {form.watch("smokes") && (
                  <FormField
                    control={form.control}
                    name="smokingDuration"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Há quanto tempo?</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Ex: 5 anos"
                            {...field}
                            data-testid="input-smoking-duration"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                <FormField
                  control={form.control}
                  name="sleepHoursPerNight"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Quantas horas dorme por noite?</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          step="0.5"
                          placeholder="Ex: 7.5"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseFloat(e.target.value)
                                : undefined
                            )
                          }
                          data-testid="input-sleep-hours-per-night"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="stressLevel"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nível de estresse atual</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        data-testid="select-stress-level"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="low">Baixo</SelectItem>
                          <SelectItem value="moderate">Moderado</SelectItem>
                          <SelectItem value="high">Alto</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>

              {/* Section 7: Routine and Availability */}
              <TabsContent value="routine" className="space-y-4">
                <h3 className="text-lg font-semibold">
                  7. Rotina e Disponibilidade
                </h3>

                <FormField
                  control={form.control}
                  name="weeklyTrainingFrequency"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quantas vezes por semana pode treinar?
                      </FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          min="1"
                          max="7"
                          placeholder="Ex: 3"
                          {...field}
                          value={field.value ?? ""}
                          onChange={(e) =>
                            field.onChange(
                              e.target.value
                                ? parseInt(e.target.value)
                                : undefined
                            )
                          }
                          data-testid="input-weekly-training-frequency"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableDaysAndTimes"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Quais dias e horários tem disponíveis?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Segunda, quarta e sexta das 18h às 20h"
                          {...field}
                          data-testid="textarea-available-days-and-times"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="preferredTrainingLocation"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Onde prefere treinar?</FormLabel>
                      <Select
                        onValueChange={field.onChange}
                        value={field.value || ""}
                        data-testid="select-preferred-training-location"
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Selecione..." />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="academia">Academia</SelectItem>
                          <SelectItem value="casa">Casa</SelectItem>
                          <SelectItem value="ar_livre">Ao ar livre</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="availableEquipment"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>
                        Tem equipamentos disponíveis? Quais?
                      </FormLabel>
                      <FormControl>
                        <Textarea
                          placeholder="Ex: Halteres, faixas elásticas, barra fixa..."
                          {...field}
                          data-testid="textarea-available-equipment"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </TabsContent>
            </Tabs>

            <div className="flex justify-end gap-2 pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isLoading}
                data-testid="button-cancel"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={isLoading}
                data-testid="button-submit"
              >
                {isLoading ? "Salvando..." : anamnese ? "Atualizar" : "Salvar"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
