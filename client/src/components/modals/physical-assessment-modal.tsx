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
import BodyPhotoGallery from "@/components/dashboard/body-photo-gallery";
import { z } from "zod";

const assessmentFormSchema = insertPhysicalAssessmentSchema
  .omit({
    personalTrainerId: true, // Este campo é adicionado automaticamente pelo servidor
  })
  .extend({
    studentId: z.string().min(1, "Selecione um aluno"),
    assessmentDate: z.date().optional(), // Data da avaliação
    profession: z.string().optional(),
    healthDiagnoses: z.string().optional(),
    medications: z.string().optional(),
    injuriesSurgeries: z.string().optional(),
    currentPains: z.string().optional(),
    familyHistory: z.string().optional(),
    medicalClearance: z.boolean().optional(),
    pastActivities: z.string().optional(),
    currentActivities: z.string().optional(),
    activityLevel: z.enum(["sedentary", "moderate", "very_active"]).optional(),
    currentResistance: z.enum(["low", "medium", "high"]).optional(),
    currentStrength: z.enum(["low", "medium", "high"]).optional(),
    primaryGoal: z.string().optional(),
    specificDeadline: z.string().optional(),
    targetBodyPart: z.string().optional(),
    lifestyleChange: z.boolean().optional(),
    dailyNutrition: z.string().optional(), // Renomeado de nutritionHabits para dailyNutrition
    supplements: z.string().optional(),
    sleepQuality: z.string().optional(),
    stressLevel: z.enum(["low", "moderate", "high"]).optional(),
    smoking: z.enum(["none", "occasional", "regular"]).optional(),
    alcoholConsumption: z.enum(["none", "occasional", "regular"]).optional(),
    caffeineConsumption: z.enum(["none", "moderate", "high"]).optional(),
    currentWeight: z.number().optional(),
    currentHeight: z.number().optional(),
    bmi: z.number().optional(),
    waistCirc: z.number().optional(),
    hipCirc: z.number().optional(),
    abdomenCirc: z.number().optional(),
    armCirc: z.number().optional(),
    thighCirc: z.number().optional(),
    calfCirc: z.number().optional(),
    chestCirc: z.number().optional(),
    bodyFatPercentage: z.number().optional(),
    leanMass: z.number().optional(),
    bodyWater: z.number().optional(),
    bloodPressure: z.string().optional(),
    restingHeartRate: z.number().optional(),
    oxygenSaturation: z.number().optional(),
    subjectiveEffortPerception: z.string().optional(),
    // Performance/Conditioning Assessment fields
    maxPushUps: z.number().int().positive().or(z.literal(0)).optional(),
    maxSquats: z.number().int().positive().or(z.literal(0)).optional(),
    maxSitUps: z.number().int().positive().or(z.literal(0)).optional(),
    plankTime: z.number().int().positive().or(z.literal(0)).optional(),
    cardioTest: z.string().optional(),
    cardioTestResult: z.string().optional(),
    flexibility: z.enum(["poor", "fair", "good", "excellent"]).optional(),
    postureAssessment: z.string().optional(),
    balanceCoordination: z
      .enum(["poor", "fair", "good", "excellent"])
      .optional(),
    additionalNotes: z.string().optional(),
    // Skinfold Measurements
    pectoralSkinFold: z.number().optional(),
    subscapularSkinFold: z.number().optional(),
    tricepsSkinFold: z.number().optional(),
    axillaryMidSkinFold: z.number().optional(),
    abdominalSkinFold: z.number().optional(),
    thighSkinFold: z.number().optional(),
    // Composition Fields
    fatMass: z.number().optional(),
    leanMassBody: z.number().optional(), // Renomeado de leanMass para leanMassBody
    // Additional Circumferences
    rightArmContractedCirc: z.number().optional(),
    rightArmRelaxedCirc: z.number().optional(),
    leftArmContractedCirc: z.number().optional(),
    leftArmRelaxedCirc: z.number().optional(),
    rightThighCirc: z.number().optional(),
    leftThighCirc: z.number().optional(),
    rightCalfCirc: z.number().optional(),
    leftCalfCirc: z.number().optional(),
    // Ratios
    waistHipRatio: z.number().optional(),
    // Gender
    gender: z.enum(["male", "female"]).optional(),
  });

type AssessmentFormData = z.infer<typeof assessmentFormSchema>;

interface PhysicalAssessmentModalProps {
  isOpen: boolean;
  onClose: () => void;
  assessment?: PhysicalAssessment | null;
}

function PhysicalAssessmentModal({
  isOpen,
  onClose,
  assessment,
}: PhysicalAssessmentModalProps) {
  const { toast } = useToast();
  const [selectedGender, setSelectedGender] = useState<string | undefined>(
    undefined
  );

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isOpen,
  });

  // Get assessment history if editing an assessment
  const { data: assessmentHistory } = useQuery({
    queryKey: [`/api/physical-assessments/${assessment?.id}/history`],
    enabled: !!assessment?.id && isOpen,
  });

  const form = useForm<AssessmentFormData>({
    resolver: zodResolver(assessmentFormSchema),
    defaultValues: {
      studentId: "",
      assessmentDate: undefined, // Inicializado como undefined
      profession: "",
      healthDiagnoses: "",
      medications: "",
      injuriesSurgeries: "",
      currentPains: "",
      familyHistory: "",
      medicalClearance: false,
      pastActivities: "",
      currentActivities: "",
      activityLevel: undefined,
      currentResistance: undefined,
      currentStrength: undefined,
      primaryGoal: "",
      specificDeadline: "",
      targetBodyPart: "",
      lifestyleChange: false,
      dailyNutrition: "", // Corrigido para dailyNutrition
      supplements: "",
      sleepQuality: "",
      stressLevel: undefined,
      smoking: undefined,
      alcoholConsumption: undefined,
      caffeineConsumption: undefined,
      currentWeight: undefined,
      currentHeight: undefined,
      bmi: undefined,
      waistCirc: undefined,
      hipCirc: undefined,
      abdomenCirc: undefined,
      armCirc: undefined,
      thighCirc: undefined,
      calfCirc: undefined,
      chestCirc: undefined,
      bodyFatPercentage: undefined,
      leanMass: undefined,
      bodyWater: undefined,
      bloodPressure: "",
      restingHeartRate: undefined,
      oxygenSaturation: undefined,
      subjectiveEffortPerception: "",
      // Performance/Conditioning Assessment fields
      maxPushUps: undefined,
      maxSquats: undefined,
      maxSitUps: undefined,
      plankTime: undefined,
      cardioTest: "",
      cardioTestResult: "",
      flexibility: undefined,
      postureAssessment: "",
      balanceCoordination: undefined,
      additionalNotes: "",
      // Skinfold Measurements
      pectoralSkinFold: undefined,
      subscapularSkinFold: undefined,
      tricepsSkinFold: undefined,
      axillaryMidSkinFold: undefined,
      abdominalSkinFold: undefined,
      thighSkinFold: undefined,
      // Composition Fields
      fatMass: undefined,
      leanMassBody: undefined, // Inicializado como undefined
      // Additional Circumferences
      rightArmContractedCirc: undefined,
      rightArmRelaxedCirc: undefined,
      leftArmContractedCirc: undefined,
      leftArmRelaxedCirc: undefined,
      rightThighCirc: undefined,
      leftThighCirc: undefined,
      rightCalfCirc: undefined,
      leftCalfCirc: undefined,
      // Ratios
      waistHipRatio: undefined,
      // Gender
      gender: undefined,
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
        assessmentDate: assessment.assessmentDate
          ? new Date(assessment.assessmentDate)
          : undefined,
        profession: assessment.profession || "",
        healthDiagnoses: assessment.healthDiagnoses || "",
        medications: assessment.medications || "",
        injuriesSurgeries: assessment.injuriesSurgeries || "",
        currentPains: assessment.currentPains || "",
        familyHistory: assessment.familyHistory || "",
        medicalClearance: assessment.medicalClearance || false,
        pastActivities: assessment.pastActivities || "",
        currentActivities: assessment.currentActivities || "",
        activityLevel:
          assessment.activityLevel &&
          ["sedentary", "moderate", "very_active"].includes(
            assessment.activityLevel
          )
            ? (assessment.activityLevel as
                | "sedentary"
                | "moderate"
                | "very_active")
            : undefined,
        currentResistance:
          assessment.currentResistance &&
          ["low", "medium", "high"].includes(assessment.currentResistance)
            ? (assessment.currentResistance as "low" | "medium" | "high")
            : undefined,
        currentStrength:
          assessment.currentStrength &&
          ["low", "medium", "high"].includes(assessment.currentStrength)
            ? (assessment.currentStrength as "low" | "medium" | "high")
            : undefined,
        primaryGoal: assessment.primaryGoal || "",
        specificDeadline: assessment.specificDeadline || "",
        targetBodyPart: assessment.targetBodyPart || "",
        lifestyleChange: assessment.lifestyleChange || false,
        dailyNutrition: assessment.dailyNutrition || "",
        supplements: assessment.supplements || "",
        sleepQuality: assessment.sleepQuality || "",
        stressLevel:
          assessment.stressLevel &&
          ["low", "moderate", "high"].includes(assessment.stressLevel)
            ? (assessment.stressLevel as "low" | "moderate" | "high")
            : undefined,
        smoking:
          assessment.smoking &&
          ["none", "occasional", "regular"].includes(assessment.smoking)
            ? (assessment.smoking as "none" | "occasional" | "regular")
            : undefined,
        alcoholConsumption:
          assessment.alcoholConsumption &&
          ["none", "occasional", "regular"].includes(
            assessment.alcoholConsumption
          )
            ? (assessment.alcoholConsumption as
                | "none"
                | "occasional"
                | "regular")
            : undefined,
        caffeineConsumption:
          assessment.caffeineConsumption &&
          ["none", "moderate", "high"].includes(assessment.caffeineConsumption)
            ? (assessment.caffeineConsumption as "none" | "moderate" | "high")
            : undefined,
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
        abdomenCirc: assessment.abdomenCirc || undefined,
        armCirc: assessment.armCirc || undefined,
        thighCirc: assessment.thighCirc || undefined,
        calfCirc: assessment.calfCirc || undefined,
        chestCirc: assessment.chestCirc
          ? Number(assessment.chestCirc)
          : undefined,
        bodyFatPercentage: assessment.bodyFatPercentage || undefined,
        leanMass: assessment.leanMass || undefined,
        bodyWater: assessment.bodyWater
          ? Number(assessment.bodyWater)
          : undefined,
        bloodPressure: assessment.bloodPressure || "",
        restingHeartRate: assessment.restingHeartRate
          ? Number(assessment.restingHeartRate)
          : undefined,
        oxygenSaturation: assessment.oxygenSaturation || undefined,
        subjectiveEffortPerception: assessment.subjectiveEffortPerception || "",
        // Performance/Conditioning Assessment fields
        maxPushUps: assessment.maxPushUps
          ? Number(assessment.maxPushUps)
          : undefined,
        maxSquats: assessment.maxSquats
          ? Number(assessment.maxSquats)
          : undefined,
        maxSitUps: assessment.maxSitUps
          ? Number(assessment.maxSitUps)
          : undefined,
        plankTime: assessment.plankTime
          ? Number(assessment.plankTime)
          : undefined,
        cardioTest: assessment.cardioTest || "",
        cardioTestResult: assessment.cardioTestResult || "",
        flexibility:
          assessment.flexibility &&
          ["poor", "fair", "good", "excellent"].includes(assessment.flexibility)
            ? (assessment.flexibility as "poor" | "fair" | "good" | "excellent")
            : undefined,
        postureAssessment: assessment.postureAssessment || "",
        balanceCoordination:
          assessment.balanceCoordination &&
          ["poor", "fair", "good", "excellent"].includes(
            assessment.balanceCoordination
          )
            ? (assessment.balanceCoordination as
                | "poor"
                | "fair"
                | "good"
                | "excellent")
            : undefined,
        additionalNotes: assessment.additionalNotes || "",
        // Skinfold Measurements
        pectoralSkinFold: assessment.pectoralSkinFold
          ? Number(assessment.pectoralSkinFold)
          : undefined,
        subscapularSkinFold: assessment.subscapularSkinFold
          ? Number(assessment.subscapularSkinFold)
          : undefined,
        tricepsSkinFold: assessment.tricepsSkinFold
          ? Number(assessment.tricepsSkinFold)
          : undefined,
        axillaryMidSkinFold: assessment.axillaryMidSkinFold
          ? Number(assessment.axillaryMidSkinFold)
          : undefined,
        abdominalSkinFold: assessment.abdominalSkinFold
          ? Number(assessment.abdominalSkinFold)
          : undefined,
        thighSkinFold: assessment.thighSkinFold
          ? Number(assessment.thighSkinFold)
          : undefined,
        // Composition Fields
        fatMass: assessment.fatMass ? Number(assessment.fatMass) : undefined,
        leanMassBody: assessment.leanMassBody
          ? Number(assessment.leanMassBody)
          : undefined,
        // Additional Circumferences
        rightArmContractedCirc: assessment.rightArmContractedCirc
          ? Number(assessment.rightArmContractedCirc)
          : undefined,
        rightArmRelaxedCirc: assessment.rightArmRelaxedCirc
          ? Number(assessment.rightArmRelaxedCirc)
          : undefined,
        leftArmContractedCirc: assessment.leftArmContractedCirc
          ? Number(assessment.leftArmContractedCirc)
          : undefined,
        leftArmRelaxedCirc: assessment.leftArmRelaxedCirc
          ? Number(assessment.leftArmRelaxedCirc)
          : undefined,
        rightThighCirc: assessment.rightThighCirc
          ? Number(assessment.rightThighCirc)
          : undefined,
        leftThighCirc: assessment.leftThighCirc
          ? Number(assessment.leftThighCirc)
          : undefined,
        rightCalfCirc: assessment.rightCalfCirc
          ? Number(assessment.rightCalfCirc)
          : undefined,
        leftCalfCirc: assessment.leftCalfCirc
          ? Number(assessment.leftCalfCirc)
          : undefined,
        // Ratios
        waistHipRatio: assessment.waistHipRatio
          ? Number(assessment.waistHipRatio)
          : undefined,
        // Gender
        gender: assessment.gender as "male" | "female" | undefined,
      });
      setSelectedGender(assessment?.gender || undefined);
    } else if (isOpen) {
      form.reset({
        studentId: "",
        assessmentDate: undefined,
        profession: "",
        healthDiagnoses: "",
        medications: "",
        injuriesSurgeries: "",
        currentPains: "",
        familyHistory: "",
        medicalClearance: false,
        pastActivities: "",
        currentActivities: "",
        activityLevel: undefined,
        currentResistance: undefined,
        currentStrength: undefined,
        primaryGoal: "",
        specificDeadline: "",
        targetBodyPart: "",
        lifestyleChange: false,
        dailyNutrition: "",
        supplements: "",
        sleepQuality: "",
        stressLevel: undefined,
        smoking: undefined,
        alcoholConsumption: undefined,
        caffeineConsumption: undefined,
        currentWeight: undefined,
        currentHeight: undefined,
        bmi: undefined,
        waistCirc: undefined,
        hipCirc: undefined,
        abdomenCirc: undefined,
        armCirc: undefined,
        thighCirc: undefined,
        calfCirc: undefined,
        chestCirc: undefined,
        bodyFatPercentage: undefined,
        leanMass: undefined,
        bodyWater: undefined,
        bloodPressure: "",
        restingHeartRate: undefined,
        oxygenSaturation: undefined,
        subjectiveEffortPerception: "",
        // Performance/Conditioning Assessment fields
        maxPushUps: undefined,
        maxSquats: undefined,
        maxSitUps: undefined,
        plankTime: undefined,
        cardioTest: "",
        cardioTestResult: "",
        flexibility: undefined,
        postureAssessment: "",
        balanceCoordination: undefined,
        additionalNotes: "",
        // Skinfold Measurements
        pectoralSkinFold: undefined,
        subscapularSkinFold: undefined,
        tricepsSkinFold: undefined,
        axillaryMidSkinFold: undefined,
        abdominalSkinFold: undefined,
        thighSkinFold: undefined,
        // Composition Fields
        fatMass: undefined,
        leanMassBody: undefined,
        // Additional Circumferences
        rightArmContractedCirc: undefined,
        rightArmRelaxedCirc: undefined,
        leftArmContractedCirc: undefined,
        leftArmRelaxedCirc: undefined,
        rightThighCirc: undefined,
        leftThighCirc: undefined,
        rightCalfCirc: undefined,
        leftCalfCirc: undefined,
        // Ratios
        waistHipRatio: undefined,
        // Gender
        gender: undefined,
      });
      setSelectedGender(undefined);
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
    // Convert string fields back to numbers for numeric fields
    const processedData = {
      ...data,
      assessmentDate: data.assessmentDate
        ? data.assessmentDate.toISOString()
        : undefined,
      gender: selectedGender,
      // Convert numeric string fields back to numbers
      currentWeight: data.currentWeight
        ? Number(data.currentWeight)
        : undefined,
      currentHeight: data.currentHeight
        ? Number(data.currentHeight)
        : undefined,
      bmi: data.bmi ? Number(data.bmi) : undefined,
      waistCirc: data.waistCirc ? Number(data.waistCirc) : undefined,
      hipCirc: data.hipCirc ? Number(data.hipCirc) : undefined,
      abdomenCirc: data.abdomenCirc ? Number(data.abdomenCirc) : undefined,
      armCirc: data.armCirc ? Number(data.armCirc) : undefined,
      thighCirc: data.thighCirc ? Number(data.thighCirc) : undefined,
      calfCirc: data.calfCirc ? Number(data.calfCirc) : undefined,
      chestCirc: data.chestCirc ? Number(data.chestCirc) : undefined,
      rightArmContractedCirc: data.rightArmContractedCirc
        ? Number(data.rightArmContractedCirc)
        : undefined,
      rightArmRelaxedCirc: data.rightArmRelaxedCirc
        ? Number(data.rightArmRelaxedCirc)
        : undefined,
      leftArmContractedCirc: data.leftArmContractedCirc
        ? Number(data.leftArmContractedCirc)
        : undefined,
      leftArmRelaxedCirc: data.leftArmRelaxedCirc
        ? Number(data.leftArmRelaxedCirc)
        : undefined,
      rightThighCirc: data.rightThighCirc
        ? Number(data.rightThighCirc)
        : undefined,
      leftThighCirc: data.leftThighCirc
        ? Number(data.leftThighCirc)
        : undefined,
      rightCalfCirc: data.rightCalfCirc
        ? Number(data.rightCalfCirc)
        : undefined,
      leftCalfCirc: data.leftCalfCirc ? Number(data.leftCalfCirc) : undefined,
      bodyFatPercentage: data.bodyFatPercentage
        ? Number(data.bodyFatPercentage)
        : undefined,
      fatMass: data.fatMass ? Number(data.fatMass) : undefined,
      leanMassBody: data.leanMassBody ? Number(data.leanMassBody) : undefined,
      bodyWater: data.bodyWater ? Number(data.bodyWater) : undefined,
      waistHipRatio: data.waistHipRatio
        ? Number(data.waistHipRatio)
        : undefined,
      restingHeartRate: data.restingHeartRate
        ? Number(data.restingHeartRate)
        : undefined,
      oxygenSaturation: data.oxygenSaturation
        ? Number(data.oxygenSaturation)
        : undefined,
      maxPushUps: data.maxPushUps ? Number(data.maxPushUps) : undefined,
      maxSquats: data.maxSquats ? Number(data.maxSquats) : undefined,
      maxSitUps: data.maxSitUps ? Number(data.maxSitUps) : undefined,
      plankTime: data.plankTime ? Number(data.plankTime) : undefined,
      pectoralSkinFold: data.pectoralSkinFold
        ? Number(data.pectoralSkinFold)
        : undefined,
      subscapularSkinFold: data.subscapularSkinFold
        ? Number(data.subscapularSkinFold)
        : undefined,
      tricepsSkinFold: data.tricepsSkinFold
        ? Number(data.tricepsSkinFold)
        : undefined,
      axillaryMidSkinFold: data.axillaryMidSkinFold
        ? Number(data.axillaryMidSkinFold)
        : undefined,
      abdominalSkinFold: data.abdominalSkinFold
        ? Number(data.abdominalSkinFold)
        : undefined,
      thighSkinFold: data.thighSkinFold
        ? Number(data.thighSkinFold)
        : undefined,
    };

    if (assessment) {
      updateAssessmentMutation.mutate(processedData);
    } else {
      createAssessmentMutation.mutate(processedData);
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
              <TabsList
                className={`grid w-full ${
                  assessment ? "grid-cols-10" : "grid-cols-9"
                }`}
              >
                <TabsTrigger value="identification">Identificação</TabsTrigger>
                <TabsTrigger value="health">Saúde</TabsTrigger>
                <TabsTrigger value="physical">Física</TabsTrigger>
                <TabsTrigger value="goals">Objetivos</TabsTrigger>
                <TabsTrigger value="lifestyle">Hábitos</TabsTrigger>
                <TabsTrigger value="anthropometric">Antropométrica</TabsTrigger>
                <TabsTrigger value="performance">Desempenho</TabsTrigger>
                <TabsTrigger value="clinical">Clínica</TabsTrigger>
                <TabsTrigger value="notes">Observações</TabsTrigger>
                {assessment && (
                  <TabsTrigger value="history">📊 Histórico</TabsTrigger>
                )}
              </TabsList>

              <TabsContent value="identification" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      🧑‍⚕️ Identificação Básica
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Data da Avaliação */}
                      <FormField
                        control={form.control}
                        name="assessmentDate"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Data da Avaliação</FormLabel>
                            <FormControl>
                              <Input
                                type="date"
                                {...field}
                                value={
                                  field.value
                                    ? new Date(field.value)
                                        .toISOString()
                                        .split("T")[0]
                                    : ""
                                }
                                onChange={(e) => {
                                  const dateValue = e.target.value
                                    ? new Date(e.target.value)
                                    : undefined;
                                  field.onChange(dateValue);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      {/* Gênero */}
                      <div>
                        <Label>Gênero</Label>
                        <Select
                          value={selectedGender || ""}
                          onValueChange={setSelectedGender}
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

                      {/* Profissão */}
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
                                value={field.value?.toString() ?? ""}
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
                          <FormLabel>
                            Possui alguma doença diagnosticada?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Hipertensão, diabetes, problemas cardíacos, respiratórios, etc."
                              rows={3}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                          <FormLabel>Faz uso de medicação? Qual?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Liste medicamentos e dosagens..."
                              rows={2}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                          <FormLabel>
                            Já teve lesões, cirurgias ou fraturas?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva o histórico de lesões, cirurgias ou fraturas..."
                              rows={2}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                            Possui dores articulares ou musculares atualmente?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva dores atuais e localização..."
                              rows={2}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                          <FormLabel>
                            Histórico familiar de doenças cardiovasculares ou
                            metabólicas?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Informe doenças na família (pais, avós, irmãos)..."
                              rows={2}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Já foi liberado por um médico para praticar
                              exercícios físicos?
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
                            Já praticou atividades físicas regularmente? Quais?
                            Por quanto tempo?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ex: Futebol por 5 anos, academia por 2 anos, corrida..."
                              rows={3}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                          <FormLabel>
                            Atualmente pratica algum esporte ou exercício?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Descreva atividades atuais, frequência e intensidade..."
                              rows={2}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                                  Ativo Moderado
                                </SelectItem>
                                <SelectItem value="very_active">
                                  Muito Ativo
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
                            <FormLabel>
                              Como avalia sua resistência hoje?
                            </FormLabel>
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
                            <FormLabel>Como avalia sua força hoje?</FormLabel>
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
                    <CardTitle>Objetivos</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="primaryGoal"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Qual é o seu principal objetivo?
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Emagrecimento, hipertrofia, condicionamento, saúde, estética, desempenho, etc."
                              rows={3}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                          <FormLabel>
                            Tem algum prazo/meta específica?
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 3 meses, até dezembro, para o verão..."
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                            Qual parte do corpo gostaria mais de desenvolver?
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: Pernas, braços, abdômen, glúteos..."
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                              checked={field.value || false}
                              onCheckedChange={field.onChange}
                            />
                          </FormControl>
                          <div className="space-y-1 leading-none">
                            <FormLabel>
                              Está disposto(a) a mudar hábitos de sono e
                              alimentação junto com o treino?
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
                    <CardTitle>Hábitos de Vida</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <FormField
                      control={form.control}
                      name="dailyNutrition"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Como é sua alimentação diária?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Número de refeições, qualidade, consumo de ultraprocessados, água..."
                              rows={3}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                          <FormLabel>Consome suplementos? Quais?</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Liste os suplementos utilizados..."
                              rows={2}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                          <FormLabel>
                            Como é seu sono? (horas/dia, qualidade, insônia)
                          </FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Ex: 7-8 horas, boa qualidade, sem insônia..."
                              rows={2}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                          <FormLabel>Nível de estresse no dia a dia</FormLabel>
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
                              <SelectItem value="moderate">Moderado</SelectItem>
                              <SelectItem value="high">Alto</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
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
                                <SelectItem value="none">Nenhum</SelectItem>
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
                            <FormLabel>Peso (kg)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="70.5"
                                {...field}
                                value={field.value?.toString() ?? ""}
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
                            <FormLabel>Altura (cm)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="175"
                                {...field}
                                value={field.value?.toString() ?? ""}
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
                            <FormLabel>IMC</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.01"
                                placeholder="Calculado automaticamente"
                                {...field}
                                value={field.value?.toString() ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseFloat(e.target.value)
                                      : undefined
                                  )
                                }
                                readOnly
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="space-y-2">
                      <CardTitle className="text-lg">
                        ℹ️ Circunferências corporais (cm)
                      </CardTitle>
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
                                  placeholder="80.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                                  placeholder="95.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                                  value={field.value?.toString() ?? ""}
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
                                  value={field.value?.toString() ?? ""}
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
                                  value={field.value?.toString() ?? ""}
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
                                  value={field.value?.toString() ?? ""}
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
                                  value={field.value?.toString() ?? ""}
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

                    <div className="space-y-2">
                      <CardTitle className="text-lg">
                        💪 Circunferências adicionais dos braços (cm)
                      </CardTitle>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="rightArmContractedCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Braço D (Cont.)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="34.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                          name="rightArmRelaxedCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Braço D (Rlx.)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="32.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                          name="leftArmContractedCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Braço E (Cont.)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="34.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                          name="leftArmRelaxedCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Braço E (Rlx.)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="32.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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

                    <div className="space-y-2">
                      <CardTitle className="text-lg">
                        🦵 Circunferências adicionais das pernas (cm)
                      </CardTitle>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <FormField
                          control={form.control}
                          name="rightThighCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Coxa D</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="56.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                          name="leftThighCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Coxa E</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="56.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                          name="rightCalfCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Pant D</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="37.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                          name="leftCalfCirc"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">Pant E</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="37.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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

                    {/* Composição corporal e índices */}
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          🏋️‍♂️ Composição corporal e índices
                        </CardTitle>
                      </CardHeader>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          control={form.control}
                          name="bodyWater"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Água Corporal (%)
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="60.0"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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
                          name="waistHipRatio"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-sm">
                                Relação Cintura/Quadril
                              </FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.01"
                                  placeholder="0.85"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
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

                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                          control={form.control}
                          name="bodyFatPercentage"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>%GC</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="15.5"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value || undefined)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="fatMass"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Massa Gorda (kg)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="10.9"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value || undefined)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="leanMassBody"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Massa Livre de Gord. (kg)</FormLabel>
                              <FormControl>
                                <Input
                                  type="number"
                                  step="0.1"
                                  placeholder="59.6"
                                  {...field}
                                  value={field.value?.toString() ?? ""}
                                  onChange={(e) =>
                                    field.onChange(e.target.value || undefined)
                                  }
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                    </Card>

                    {/* Dobras Cutâneas */}
                    <Card className="mt-6">
                      <CardHeader>
                        <CardTitle className="text-lg">
                          📊 Dobras Cutâneas (mm)
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="pectoralSkinFold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Peitoral
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="8.0"
                                    {...field}
                                    value={field.value?.toString() ?? ""}
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
                            name="subscapularSkinFold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Subescapular
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="12.0"
                                    {...field}
                                    value={field.value?.toString() ?? ""}
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
                            name="tricepsSkinFold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Tríceps
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="15.0"
                                    {...field}
                                    value={field.value?.toString() ?? ""}
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
                            name="axillaryMidSkinFold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Axilar Média
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="10.0"
                                    {...field}
                                    value={field.value?.toString() ?? ""}
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
                            name="abdominalSkinFold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">
                                  Abdominal
                                </FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="20.0"
                                    {...field}
                                    value={field.value?.toString() ?? ""}
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
                            name="thighSkinFold"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="text-sm">Coxa</FormLabel>
                                <FormControl>
                                  <Input
                                    type="number"
                                    step="0.1"
                                    placeholder="25.0"
                                    {...field}
                                    value={field.value?.toString() ?? ""}
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
                      </CardContent>
                    </Card>

                    {/* Visualização Corporal - Galeria de Fotos */}
                    <div className="mt-6">
                      <BodyPhotoGallery
                        assessmentId={assessment?.id}
                        studentId={assessment?.studentId}
                        measurements={{
                          currentWeight: form.watch("currentWeight"),
                          currentHeight: form.watch("currentHeight"),
                          bmi: form.watch("bmi"),
                        }}
                        interactive={true}
                        onPhotoAdd={(photo) => {
                          console.log("Nova foto adicionada:", photo);
                        }}
                        onPhotoRemove={(photoId) => {
                          console.log("Foto removida:", photoId);
                        }}
                      />
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="clinical" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      🩺 Avaliação Clínica Básica
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
                                placeholder="Ex: 120/80 mmHg"
                                {...field}
                                value={field.value?.toString() ?? ""}
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
                            <FormLabel>
                              Frequência cardíaca de repouso
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="bpm"
                                {...field}
                                value={field.value?.toString() ?? ""}
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
                            <FormLabel>Saturação de oxigênio</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                step="0.1"
                                placeholder="%"
                                {...field}
                                value={field.value?.toString() ?? ""}
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
                              value={field.value?.toString() ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="performance" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">
                      💪 Avaliação de Desempenho/Condicionamento
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="maxPushUps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Teste de força - Flexões máximas
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value?.toString() ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
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
                        name="maxSquats"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Teste de força - Agachamentos máximos
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value?.toString() ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
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
                        name="maxSitUps"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Teste de força - Abdominais máximos
                            </FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value?.toString() ?? ""}
                                onChange={(e) =>
                                  field.onChange(
                                    e.target.value
                                      ? parseInt(e.target.value)
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
                        name="plankTime"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Tempo de Prancha (segundos)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                placeholder="0"
                                {...field}
                                value={field.value?.toString() ?? ""}
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
                    </div>

                    <FormField
                      control={form.control}
                      name="cardioTest"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Teste de resistência cardiovascular
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: corrida de 12 minutos, esteira, bicicleta..."
                              {...field}
                              value={field.value?.toString() ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="cardioTestResult"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>
                            Resultado do teste cardiovascular
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="Ex: 2000m em 12 min, 150 bpm máximo..."
                              {...field}
                              value={field.value?.toString() ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="flexibility"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>
                              Flexibilidade (teste de sentar e alcançar)
                            </FormLabel>
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
                                <SelectItem value="poor">Ruim</SelectItem>
                                <SelectItem value="fair">Regular</SelectItem>
                                <SelectItem value="good">Boa</SelectItem>
                                <SelectItem value="excellent">
                                  Excelente
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="balanceCoordination"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Equilíbrio e coordenação</FormLabel>
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
                                <SelectItem value="poor">Ruim</SelectItem>
                                <SelectItem value="fair">Regular</SelectItem>
                                <SelectItem value="good">Boa</SelectItem>
                                <SelectItem value="excellent">
                                  Excelente
                                </SelectItem>
                              </SelectContent>
                            </Select>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="postureAssessment"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Mobilidade articular e postura</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Observação de desvios posturais: lordose, cifose, escoliose, etc."
                              rows={3}
                              {...field}
                              value={field.value?.toString() ?? ""}
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
                              value={field.value?.toString() ?? ""}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </CardContent>
                </Card>
              </TabsContent>

              {/* History Tab - only shown when editing an assessment */}
              {assessment && (
                <TabsContent value="history" className="space-y-4">
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        📊 Histórico de Avaliações
                      </CardTitle>
                      <p className="text-sm text-gray-600">
                        Acompanhe a evolução das medidas ao longo do tempo
                      </p>
                    </CardHeader>
                    <CardContent>
                      {assessmentHistory && assessmentHistory.length > 0 ? (
                        <div className="space-y-4">
                          <div className="text-sm font-medium text-gray-700 mb-3">
                            Total de registros: {assessmentHistory.length}
                          </div>
                          <div className="space-y-3 max-h-96 overflow-y-auto">
                            {assessmentHistory.map(
                              (historyItem: any, index: number) => (
                                <div
                                  key={historyItem.id}
                                  className="border rounded-lg p-4 bg-gray-50"
                                >
                                  <div className="flex justify-between items-start mb-2">
                                    <div className="text-sm font-medium">
                                      Versão {historyItem.versionNumber}
                                    </div>
                                    <div className="text-xs text-gray-500">
                                      {new Date(
                                        historyItem.createdAt
                                      ).toLocaleDateString("pt-BR")}
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                                    {historyItem.currentWeight && (
                                      <div>
                                        <span className="font-medium">
                                          Peso:
                                        </span>{" "}
                                        {historyItem.currentWeight}kg
                                      </div>
                                    )}
                                    {historyItem.currentHeight && (
                                      <div>
                                        <span className="font-medium">
                                          Altura:
                                        </span>{" "}
                                        {historyItem.currentHeight}cm
                                      </div>
                                    )}
                                    {historyItem.bmi && (
                                      <div>
                                        <span className="font-medium">
                                          IMC:
                                        </span>{" "}
                                        {historyItem.bmi}
                                      </div>
                                    )}
                                    {historyItem.bodyFatPercentage && (
                                      <div>
                                        <span className="font-medium">
                                          % Gordura:
                                        </span>{" "}
                                        {historyItem.bodyFatPercentage}%
                                      </div>
                                    )}
                                    {historyItem.waistCirc && (
                                      <div>
                                        <span className="font-medium">
                                          Cintura:
                                        </span>{" "}
                                        {historyItem.waistCirc}cm
                                      </div>
                                    )}
                                    {historyItem.hipCirc && (
                                      <div>
                                        <span className="font-medium">
                                          Quadril:
                                        </span>{" "}
                                        {historyItem.hipCirc}cm
                                      </div>
                                    )}
                                  </div>
                                </div>
                              )
                            )}
                          </div>
                        </div>
                      ) : (
                        <div className="text-center py-8 text-gray-500">
                          <p>Ainda não há histórico de avaliações.</p>
                          <p className="text-sm mt-1">
                            O histórico será criado quando você atualizar esta
                            avaliação.
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                </TabsContent>
              )}
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

export default PhysicalAssessmentModal;
