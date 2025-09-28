import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import {
  insertWorkoutSchema,
  type InsertWorkout,
  type Workout,
  type Student,
  type ExerciseTemplate,
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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Badge } from "@/components/ui/badge";
import { VideoSelector } from "@/components/video-selector";
import { z } from "zod";

const workoutFormSchema = insertWorkoutSchema
  .omit({
    personalTrainerId: true, // Este campo é adicionado automaticamente pelo servidor
  })
  .extend({
    studentId: z.string().min(1, "Selecione um aluno"),
    name: z.string().min(1, "Nome do treino é obrigatório"),
    category: z.string().min(1, "Selecione uma categoria"),
    weekday: z
      .enum([
        "monday",
        "tuesday",
        "wednesday",
        "thursday",
        "friday",
        "saturday",
        "sunday",
      ])
      .optional(),
  });

type WorkoutFormData = z.infer<typeof workoutFormSchema>;

interface WorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  workout?: Workout | null;
}

export default function WorkoutModal({
  isOpen,
  onClose,
  workout,
}: WorkoutModalProps) {
  const { toast } = useToast();
  const [exercises, setExercises] = useState<any[]>([]);
  const [exerciseSearch, setExerciseSearch] = useState("");
  const [showNewExerciseForm, setShowNewExerciseForm] = useState(false);
  const [newExerciseVideoUrl, setNewExerciseVideoUrl] = useState("");

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isOpen,
  });

  const { data: exerciseTemplates } = useQuery<ExerciseTemplate[]>({
    queryKey: ["/api/exercise-templates"],
    enabled: isOpen,
  });

  // Fetch workout exercises when editing
  const { data: workoutData } = useQuery<any>({
    queryKey: ["/api/workouts", workout?.id],
    enabled: isOpen && !!workout?.id,
  });

  const form = useForm<WorkoutFormData>({
    resolver: zodResolver(workoutFormSchema),
    defaultValues: {
      name: "",
      category: "",
      studentId: "",
      description: "",
      weekday: undefined,
      isActive: true,
    },
  });

  useEffect(() => {
    if (workout && isOpen) {
      form.reset({
        name: workout.name,
        category: workout.category as any,
        studentId: workout.studentId,
        description: workout.description || "",
        weekday: (workout as any).weekday || undefined,
        isActive: workout.isActive,
      });

      // Load exercises if we have workout data
      if (workoutData?.exercises) {
        setExercises(workoutData.exercises);
      }
    } else if (isOpen) {
      form.reset({
        name: "",
        category: "",
        studentId: "",
        description: "",
        weekday: undefined,
        isActive: true,
      });
      setExercises([]);
    }
  }, [workout, workoutData, isOpen, form]);

  const createWorkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log("Sending workout data to API:", data);
      try {
        const response = await apiRequest("POST", "/api/workouts", data);
        const result = await response.json();
        console.log("API response:", result);
        return result;
      } catch (error) {
        console.error("API error:", error);
        throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Sucesso",
        description: "Treino criado com sucesso!",
      });
      onClose();
    },
    onError: (error: any) => {
      console.error("Mutation error:", error);
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
        description: `Erro ao criar treino: ${
          error.message || "Erro desconhecido"
        }`,
        variant: "destructive",
      });
    },
  });

  const updateWorkoutMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest(
        "PUT",
        `/api/workouts/${workout?.id}`,
        data
      );
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      queryClient.invalidateQueries({
        queryKey: ["/api/workouts", workout?.id],
      });
      toast({
        title: "Sucesso",
        description: "Treino atualizado com sucesso!",
      });
      onClose();
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao atualizar treino",
        variant: "destructive",
      });
    },
  });

  const addExercise = (template?: ExerciseTemplate) => {
    const newExercise = {
      id: Date.now(),
      templateId: template?.id || null,
      name: template?.name || "",
      sets: 3,
      reps: "12-15",
      weight: 0,
      restTime: 90,
      notes: "",
      videoUrl: template?.videoUrl || "",
      order: exercises.length + 1,
    };
    setExercises([...exercises, newExercise]);
    setExerciseSearch("");
    setShowNewExerciseForm(false);
  };

  const createNewExerciseTemplate = async (name: string) => {
    try {
      const response = await apiRequest("POST", "/api/exercise-templates", {
        name,
        videoUrl: newExerciseVideoUrl,
        description: `Exercício criado pelo usuário: ${name}`,
        muscleGroups: ["custom"],
        equipment: "Vários",
        difficulty: "intermediate",
      });

      const template = await response.json();
      addExercise(template);
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-templates"] });
      toast({
        title: "Sucesso",
        description: "Novo exercício criado e adicionado!",
      });
    } catch (error: any) {
      toast({
        title: "Erro",
        description: `Erro ao criar novo exercício: ${error.message}`,
        variant: "destructive",
      });
    }
  };

  const filteredTemplates =
    exerciseTemplates?.filter((template) =>
      template.name.toLowerCase().includes(exerciseSearch.toLowerCase())
    ) || [];

  const removeExercise = (id: number) => {
    setExercises(exercises.filter((ex) => ex.id !== id));
  };

  const updateExercise = (id: number, field: string, value: any) => {
    setExercises(
      exercises.map((ex) => (ex.id === id ? { ...ex, [field]: value } : ex))
    );
  };

  const moveExercise = (id: number, direction: "up" | "down") => {
    const currentIndex = exercises.findIndex((ex) => ex.id === id);
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === exercises.length - 1)
    ) {
      return;
    }

    const newExercises = [...exercises];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    [newExercises[currentIndex], newExercises[targetIndex]] = [
      newExercises[targetIndex],
      newExercises[currentIndex],
    ];

    setExercises(newExercises);
  };

  const onSubmit = (data: WorkoutFormData) => {
    console.log("Form submitted with data:", data);
    console.log("Exercises:", exercises);
    console.log("Form errors:", form.formState.errors);
    console.log("Form is valid:", form.formState.isValid);

    // Resetar estados de erro anterior
    createWorkoutMutation.reset();
    updateWorkoutMutation.reset();

    const exercisesForSubmission = exercises.map((exercise, index) => ({
      templateId: exercise.templateId,
      name: exercise.name,
      sets: exercise.sets,
      reps: exercise.reps,
      weight: exercise.weight,
      restTime: exercise.restTime,
      notes: exercise.notes,
      videoUrl: exercise.videoUrl,
      order: index + 1,
    }));

    console.log("=== WORKOUT MODAL SUBMISSION ===");
    console.log("Exercises being submitted:", exercisesForSubmission);
    exercisesForSubmission.forEach((ex, idx) => {
      console.log(`Exercise ${idx + 1}:`, {
        name: ex.name,
        templateId: ex.templateId,
        sets: ex.sets,
        reps: ex.reps,
      });
    });

    const workoutWithExercises = {
      ...data,
      exercises: exercisesForSubmission,
    };

    console.log("Submitting workout with exercises:", workoutWithExercises);

    if (workout) {
      updateWorkoutMutation.mutate(workoutWithExercises);
    } else {
      createWorkoutMutation.mutate(workoutWithExercises);
    }
  };

  const categories = [
    { value: "chest-triceps", label: "Peito/Tríceps" },
    { value: "back-biceps", label: "Costas/Bíceps" },
    { value: "legs", label: "Pernas" },
    { value: "shoulders", label: "Ombros" },
    { value: "cardio", label: "Cardio" },
    { value: "full-body", label: "Corpo Inteiro" },
  ];

  const weekdays = [
    { value: "monday", label: "Segunda-feira" },
    { value: "tuesday", label: "Terça-feira" },
    { value: "wednesday", label: "Quarta-feira" },
    { value: "thursday", label: "Quinta-feira" },
    { value: "friday", label: "Sexta-feira" },
    { value: "saturday", label: "Sábado" },
    { value: "sunday", label: "Domingo" },
  ];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent
        className="max-w-4xl max-h-screen overflow-y-auto"
        aria-describedby="workout-form-description"
      >
        <DialogHeader>
          <DialogTitle>
            {workout ? "Editar Treino" : "Criar Novo Treino"}
          </DialogTitle>
        </DialogHeader>
        <div id="workout-form-description" className="sr-only">
          Formulário para{" "}
          {workout
            ? "editar um treino existente"
            : "criar um novo treino para um aluno"}
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Treino</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Ex: Treino A - Peito e Tríceps"
                        {...field}
                        data-testid="input-workout-name"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="category"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Categoria</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-workout-category">
                          <SelectValue placeholder="Selecione uma categoria" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem
                            key={category.value}
                            value={category.value}
                          >
                            {category.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="weekday"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Dia da Semana</FormLabel>
                    <Select onValueChange={field.onChange} value={field.value}>
                      <FormControl>
                        <SelectTrigger data-testid="select-workout-weekday">
                          <SelectValue placeholder="Selecione o dia" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {weekdays.map((day) => (
                          <SelectItem key={day.value} value={day.value}>
                            {day.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="studentId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Aluno</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value}>
                    <FormControl>
                      <SelectTrigger data-testid="select-workout-student">
                        <SelectValue placeholder="Selecione um aluno" />
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

            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Descrição</FormLabel>
                  <FormControl>
                    <Textarea
                      placeholder="Descrição opcional do treino"
                      {...field}
                      value={field.value || ""}
                      data-testid="textarea-workout-description"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  Exercícios
                </h3>
              </div>

              {/* Sistema de seleção de exercícios */}
              <div className="mb-6 p-4 border border-gray-200 rounded-lg bg-gray-50">
                <h4 className="font-medium mb-3">Adicionar Exercício</h4>

                <div className="space-y-3">
                  <div>
                    <Input
                      placeholder="Buscar exercício..."
                      value={exerciseSearch}
                      onChange={(e) => setExerciseSearch(e.target.value)}
                      className="mb-2"
                    />
                  </div>

                  {exerciseSearch && (
                    <div className="max-h-40 overflow-y-auto">
                      {filteredTemplates.length > 0 ? (
                        <div className="space-y-1">
                          {filteredTemplates.map((template) => (
                            <div
                              key={template.id}
                              className="flex items-center justify-between p-2 bg-white rounded border hover:bg-gray-50 cursor-pointer"
                              onClick={() => addExercise(template)}
                            >
                              <div className="flex-1">
                                <div className="font-medium text-sm">
                                  {template.name}
                                </div>
                                {template.description && (
                                  <div className="text-xs text-gray-500">
                                    {template.description}
                                  </div>
                                )}
                              </div>
                              {template.videoUrl && (
                                <Badge variant="secondary" className="text-xs">
                                  <i className="fas fa-video mr-1"></i>
                                  Vídeo
                                </Badge>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-3">
                          <p className="text-sm text-gray-500 mb-2">
                            Exercício "{exerciseSearch}" não encontrado
                          </p>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => setShowNewExerciseForm(true)}
                            className="text-xs"
                          >
                            <i className="fas fa-plus mr-1"></i>
                            Criar Novo Exercício
                          </Button>
                        </div>
                      )}
                    </div>
                  )}

                  {!exerciseSearch && (
                    <div className="text-center">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => addExercise()}
                        data-testid="button-add-exercise"
                      >
                        <i className="fas fa-plus mr-2"></i>
                        Adicionar Exercício Customizado
                      </Button>
                    </div>
                  )}

                  {/* Formulário para criar novo exercício */}
                  {showNewExerciseForm && (
                    <div className="mt-3 p-3 bg-white rounded border">
                      <h5 className="font-medium mb-2">Criar Novo Exercício</h5>
                      <div className="space-y-2">
                        <Input
                          placeholder="Nome do exercício"
                          value={exerciseSearch}
                          onChange={(e) => setExerciseSearch(e.target.value)}
                        />
                        <VideoSelector
                          value={newExerciseVideoUrl}
                          onChange={setNewExerciseVideoUrl}
                          placeholder="URL do vídeo ou fazer upload"
                        />
                        <div className="flex space-x-2">
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => {
                              createNewExerciseTemplate(exerciseSearch);
                            }}
                          >
                            Criar e Adicionar
                          </Button>
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              setShowNewExerciseForm(false);
                              setNewExerciseVideoUrl("");
                            }}
                          >
                            Cancelar
                          </Button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {exercises.map((exercise, index) => (
                <div
                  key={exercise.id}
                  className="border border-gray-200 rounded-lg p-4 mb-4"
                >
                  <div className="flex items-center justify-between mb-4">
                    <h4 className="font-medium text-gray-900">
                      Exercício {index + 1}
                    </h4>
                    <div className="flex items-center space-x-2">
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExercise(exercise.id, "up")}
                        disabled={index === 0}
                        data-testid={`button-move-up-${exercise.id}`}
                      >
                        <i className="fas fa-arrow-up"></i>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => moveExercise(exercise.id, "down")}
                        disabled={index === exercises.length - 1}
                        data-testid={`button-move-down-${exercise.id}`}
                      >
                        <i className="fas fa-arrow-down"></i>
                      </Button>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeExercise(exercise.id)}
                        className="text-red-600 hover:text-red-700"
                        data-testid={`button-remove-${exercise.id}`}
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div className="md:col-span-2">
                      <div className="flex items-center justify-between mb-2">
                        <Label>Nome do Exercício</Label>
                        {exercise.videoUrl && (
                          <a
                            href={exercise.videoUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 text-sm"
                          >
                            <i className="fas fa-video mr-1"></i>
                            Ver Vídeo
                          </a>
                        )}
                      </div>
                      <Input
                        placeholder="Supino reto"
                        value={exercise.name}
                        onChange={(e) =>
                          updateExercise(exercise.id, "name", e.target.value)
                        }
                        data-testid={`input-exercise-name-${exercise.id}`}
                      />
                    </div>
                    <div>
                      <Label>Séries</Label>
                      <Input
                        type="number"
                        placeholder="3"
                        value={exercise.sets || ""}
                        onChange={(e) =>
                          updateExercise(
                            exercise.id,
                            "sets",
                            e.target.value === ""
                              ? 0
                              : parseInt(e.target.value) || 0
                          )
                        }
                        data-testid={`input-exercise-sets-${exercise.id}`}
                      />
                    </div>
                    <div>
                      <Label>Repetições</Label>
                      <Input
                        placeholder="12-15"
                        value={exercise.reps}
                        onChange={(e) =>
                          updateExercise(exercise.id, "reps", e.target.value)
                        }
                        data-testid={`input-exercise-reps-${exercise.id}`}
                      />
                    </div>
                    <div>
                      <Label>Peso (kg)</Label>
                      <Input
                        type="number"
                        step="0.5"
                        placeholder="60"
                        value={exercise.weight || ""}
                        onChange={(e) =>
                          updateExercise(
                            exercise.id,
                            "weight",
                            e.target.value === ""
                              ? 0
                              : parseFloat(e.target.value) || 0
                          )
                        }
                        data-testid={`input-exercise-weight-${exercise.id}`}
                      />
                    </div>
                  </div>

                  <div className="mt-4 grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                      <Label>Tempo de Descanso (segundos)</Label>
                      <Input
                        type="number"
                        placeholder="90"
                        value={exercise.restTime || ""}
                        onChange={(e) =>
                          updateExercise(
                            exercise.id,
                            "restTime",
                            parseInt(e.target.value)
                          )
                        }
                        data-testid={`input-exercise-rest-${exercise.id}`}
                      />
                    </div>
                    <div>
                      <VideoSelector
                        value={exercise.videoUrl || ""}
                        onChange={(url) =>
                          updateExercise(exercise.id, "videoUrl", url)
                        }
                        placeholder="URL do vídeo ou fazer upload"
                      />
                    </div>
                    <div>
                      <Label>Observações</Label>
                      <Textarea
                        rows={2}
                        placeholder="Instruções específicas para o exercício"
                        value={exercise.notes}
                        onChange={(e) =>
                          updateExercise(exercise.id, "notes", e.target.value)
                        }
                        data-testid={`textarea-exercise-notes-${exercise.id}`}
                      />
                    </div>
                  </div>
                </div>
              ))}

              {exercises.length === 0 && (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg">
                  <i className="fas fa-dumbbell text-gray-400 text-3xl mb-3"></i>
                  <p className="text-gray-600">Nenhum exercício adicionado</p>
                  <p className="text-sm text-gray-500 mb-4">
                    Clique em "Adicionar Exercício" para começar
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 pt-6 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                data-testid="button-cancel-workout"
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                disabled={
                  createWorkoutMutation.isPending ||
                  updateWorkoutMutation.isPending
                }
                data-testid="button-save-workout"
              >
                {createWorkoutMutation.isPending ||
                updateWorkoutMutation.isPending
                  ? "Salvando..."
                  : workout
                  ? "Atualizar Treino"
                  : "Salvar Treino"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
