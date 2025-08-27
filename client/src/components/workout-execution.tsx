import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, TrendingUp } from "lucide-react";
import { WorkoutTimer } from "@/components/workout-timer";
import type { Student, Exercise } from "@shared/schema";

interface WorkoutExecutionProps {
  workoutId: string;
  student: Student;
  onBack: () => void;
}

interface ExerciseProgress {
  exerciseId: string;
  weight: string;
  sets: number;
  reps: string;
  comments: string;
}

export function WorkoutExecution({
  workoutId,
  student,
  onBack,
}: WorkoutExecutionProps) {
  const [exerciseProgress, setExerciseProgress] = useState<
    Record<string, ExerciseProgress>
  >({});
  const [isSaving, setIsSaving] = useState(false);
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar detalhes do treino
  const { data: workout, isLoading: workoutLoading } = useQuery({
    queryKey: ["/api/workouts", workoutId],
    enabled: !!workoutId,
  });

  // Buscar exercícios do treino
  const { data: exercises, isLoading: exercisesLoading } = useQuery({
    queryKey: ["/api/exercises", workoutId],
    enabled: !!workoutId,
  });

  // Buscar histórico do exercício para mostrar progresso anterior
  const getExerciseHistory = (exerciseId: string) => {
    return useQuery({
      queryKey: ["/api/exercise-progress", student.id, exerciseId],
      enabled: !!exerciseId && !!student.id,
    });
  };

  // Mutation para salvar progresso
  const saveProgressMutation = useMutation({
    mutationFn: async (progressData: any) => {
      const response = await fetch("/api/workout-history", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(progressData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Falha ao salvar progresso");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Progresso salvo",
        description: "Seu progresso foi registrado com sucesso!",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-history"] });
      queryClient.invalidateQueries({ queryKey: ["/api/exercise-progress"] });
    },
    onError: () => {
      toast({
        title: "Erro",
        description: "Não foi possível salvar o progresso",
        variant: "destructive",
      });
    },
  });

  const updateExerciseProgress = (
    exerciseId: string,
    field: keyof ExerciseProgress,
    value: string | number
  ) => {
    setExerciseProgress((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        exerciseId,
        [field]: value,
      },
    }));
  };

  const saveExerciseProgress = async (exercise: Exercise) => {
    const progress = exerciseProgress[exercise.id];
    if (!progress || !progress.weight || !progress.sets || !progress.reps) {
      toast({
        title: "Campos obrigatórios",
        description: "Preencha peso, séries e repetições",
        variant: "destructive",
      });
      return;
    }

    await saveProgressMutation.mutateAsync({
      studentId: student.id,
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      weight: progress.weight,
      sets: progress.sets,
      reps: progress.reps,
      comments: progress.comments,
      workoutSessionId: null,
    });
  };

  const saveAllProgress = async () => {
    setIsSaving(true);
    try {
      for (const exercise of Array.isArray(exercises) ? exercises : []) {
        const progress = exerciseProgress[exercise.id];
        if (progress && progress.weight && progress.sets && progress.reps) {
          await saveProgressMutation.mutateAsync({
            studentId: student.id,
            exerciseId: exercise.id,
            exerciseName: exercise.name,
            weight: progress.weight,
            sets: progress.sets,
            reps: progress.reps,
            comments: progress.comments,
            workoutSessionId: null,
          });
        }
      }

      toast({
        title: "Treino concluído!",
        description: "Todo o progresso foi salvo com sucesso",
      });

      // Voltar para o dashboard após salvar
      setTimeout(() => onBack(), 1500);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao salvar o progresso completo",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  if (workoutLoading || exercisesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
  };

  const handlePauseWorkout = () => {
    // Timer paused but workout still considered active
  };

  const handleStopWorkout = () => {
    setWorkoutStarted(false);
    setWorkoutDuration(0);
  };

  const handleTimeUpdate = (seconds: number) => {
    setWorkoutDuration(seconds);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-6">
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                onClick={onBack}
                data-testid="button-back"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar
              </Button>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  {(workout as any)?.name || "Treino"}
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  {(workout as any)?.description}
                </p>
              </div>
            </div>
            <div className="flex space-x-2">
              <Badge variant="outline" data-testid="badge-category">
                {(workout as any)?.category}
              </Badge>
              <Button
                onClick={saveAllProgress}
                disabled={isSaving}
                data-testid="button-save-all"
              >
                <Save className="h-4 w-4 mr-2" />
                {isSaving ? "Salvando..." : "Finalizar Treino"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Workout Timer */}
        <div className="mb-6">
          <WorkoutTimer
            isActive={workoutStarted}
            onStart={handleStartWorkout}
            onPause={handlePauseWorkout}
            onStop={handleStopWorkout}
            onTimeUpdate={handleTimeUpdate}
          />
        </div>

        {Array.isArray(exercises) && exercises.length ? (
          <div className="space-y-6">
            {exercises.map((exercise: Exercise) => {
              const { data: history } = getExerciseHistory(exercise.id);
              const lastRecord =
                Array.isArray(history) && history.length > 0
                  ? history[0]
                  : null;

              return (
                <Card
                  key={exercise.id}
                  data-testid={`card-exercise-${exercise.id}`}
                >
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {exercise.name}
                        </CardTitle>
                        <CardDescription className="mt-2">
                          <strong>Séries planejadas:</strong> {exercise.sets} ×{" "}
                          {exercise.reps} reps
                          {exercise.weight && (
                            <span className="ml-4">
                              <strong>Peso sugerido:</strong> {exercise.weight}
                              kg
                            </span>
                          )}
                        </CardDescription>

                        {lastRecord && (
                          <div className="mt-2 p-2 bg-gray-50 dark:bg-gray-800 rounded">
                            <div className="flex items-center space-x-2">
                              <TrendingUp className="h-4 w-4 text-blue-500" />
                              <span className="text-sm">
                                <strong>Último treino:</strong>{" "}
                                {lastRecord.weight}kg •{lastRecord.sets} séries
                                × {lastRecord.reps} reps
                              </span>
                            </div>
                          </div>
                        )}
                      </div>

                      <Button
                        size="sm"
                        onClick={() => saveExerciseProgress(exercise)}
                        disabled={saveProgressMutation.isPending}
                        data-testid={`button-save-${exercise.id}`}
                      >
                        <Save className="h-4 w-4 mr-1" />
                        Salvar
                      </Button>
                    </div>
                  </CardHeader>

                  <CardContent>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <Label htmlFor={`weight-${exercise.id}`}>
                          Peso (kg)
                        </Label>
                        <Input
                          id={`weight-${exercise.id}`}
                          type="number"
                          step="0.5"
                          placeholder={lastRecord?.weight || "0"}
                          value={exerciseProgress[exercise.id]?.weight || ""}
                          onChange={(e) =>
                            updateExerciseProgress(
                              exercise.id,
                              "weight",
                              e.target.value
                            )
                          }
                          data-testid={`input-weight-${exercise.id}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`sets-${exercise.id}`}>Séries</Label>
                        <Input
                          id={`sets-${exercise.id}`}
                          type="number"
                          placeholder={exercise.sets?.toString() || "3"}
                          value={exerciseProgress[exercise.id]?.sets || ""}
                          onChange={(e) =>
                            updateExerciseProgress(
                              exercise.id,
                              "sets",
                              parseInt(e.target.value) || 0
                            )
                          }
                          data-testid={`input-sets-${exercise.id}`}
                        />
                      </div>

                      <div className="space-y-2">
                        <Label htmlFor={`reps-${exercise.id}`}>
                          Repetições
                        </Label>
                        <Input
                          id={`reps-${exercise.id}`}
                          type="text"
                          placeholder={exercise.reps || "10-12"}
                          value={exerciseProgress[exercise.id]?.reps || ""}
                          onChange={(e) =>
                            updateExerciseProgress(
                              exercise.id,
                              "reps",
                              e.target.value
                            )
                          }
                          data-testid={`input-reps-${exercise.id}`}
                        />
                      </div>
                    </div>

                    <Separator className="my-4" />

                    <div className="space-y-2">
                      <Label htmlFor={`comments-${exercise.id}`}>
                        Comentários (opcional)
                      </Label>
                      <Textarea
                        id={`comments-${exercise.id}`}
                        placeholder="Como foi o exercício? Alguma observação..."
                        value={exerciseProgress[exercise.id]?.comments || ""}
                        onChange={(e) =>
                          updateExerciseProgress(
                            exercise.id,
                            "comments",
                            e.target.value
                          )
                        }
                        data-testid={`textarea-comments-${exercise.id}`}
                      />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        ) : (
          <Card>
            <CardContent className="text-center py-12">
              <p className="text-gray-500">
                Este treino não possui exercícios cadastrados ainda.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
