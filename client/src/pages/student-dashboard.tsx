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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Calendar,
  Dumbbell,
  TrendingUp,
  Play,
  ChevronDown,
  ChevronUp,
  Clock,
  VideoIcon,
  Check,
  X,
  Save,
  MessageSquare,
} from "lucide-react";
import { StudentWorkoutExecution } from "@/components/student-workout-execution";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";

interface StudentDashboardProps {
  student: Student;
  onLogout: () => void;
}

export function StudentDashboard({ student }: StudentDashboardProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showWorkoutExecution, setShowWorkoutExecution] = useState(false);
  const [expandedWorkouts, setExpandedWorkouts] = useState<Set<string>>(
    new Set()
  );
  const [exerciseData, setExerciseData] = useState<
    Record<
      string,
      {
        weight: string;
        sets: number;
        completedSets: number;
        reps: string;
        exerciseName: string;
        comments: string;
        hasUnsavedChanges: boolean;
      }
    >
  >({});
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Buscar treinos do aluno
  const {
    data: workouts,
    isLoading: workoutsLoading,
    error: workoutsError,
  } = useQuery({
    queryKey: ["/api/workouts/student", student.id],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/student/${student.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workouts: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!student.id,
    retry: 3,
    retryDelay: 1000,
  });

  // Buscar histórico de progresso
  const { data: workoutHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/workout-history", student.id],
    queryFn: () =>
      fetch(`/api/workout-history/${student.id}`, {
        credentials: "include",
      }).then((res) =>
        res.ok
          ? res.json()
          : Promise.reject(new Error("Failed to fetch workout history"))
      ),
    enabled: !!student.id,
  });

  const stats = {
    totalWorkouts: Array.isArray(workouts) ? workouts.length : 0,
    completedSessions: Array.isArray(workoutHistory)
      ? workoutHistory.length
      : 0,
    weeklyGoal: 3,
    currentWeekSessions: 2,
  };

  const progressPercentage =
    (stats.currentWeekSessions / stats.weeklyGoal) * 100;

  const handleStartWorkout = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    setShowWorkoutExecution(true);
  };

  const handleBackFromWorkout = () => {
    setShowWorkoutExecution(false);
    setSelectedWorkout(null);
  };

  const toggleWorkoutExpansion = (workoutId: string) => {
    const newExpanded = new Set(expandedWorkouts);
    if (newExpanded.has(workoutId)) {
      newExpanded.delete(workoutId);
    } else {
      newExpanded.add(workoutId);
    }
    setExpandedWorkouts(newExpanded);
  };

  const updateExerciseData = (
    exerciseId: string,
    field: string,
    value: any
  ) => {
    setExerciseData((prev) => ({
      ...prev,
      [exerciseId]: {
        ...prev[exerciseId],
        [field]: value,
        hasUnsavedChanges: true,
      },
    }));
  };

  const saveExerciseProgress = async (exerciseId: string) => {
    const data = exerciseData[exerciseId];
    if (!data || !data.hasUnsavedChanges) return;

    try {
      await saveProgressMutation.mutateAsync({
        exerciseId,
        exerciseName: data.exerciseName,
        data: {
          weight: data.weight,
          sets: data.sets,
          reps: data.reps,
          comments: data.comments,
        },
      });

      // Mark as saved
      setExerciseData((prev) => ({
        ...prev,
        [exerciseId]: {
          ...prev[exerciseId],
          hasUnsavedChanges: false,
        },
      }));

      toast({
        title: "Progresso salvo!",
        description: `Progresso do exercício ${data.exerciseName} foi salvo com sucesso.`,
      });
    } catch (error) {
      console.error("Failed to save exercise progress:", error);
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar o progresso. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  // Mutation to save exercise progress using workout history
  const saveProgressMutation = useMutation({
    mutationFn: async ({
      exerciseId,
      exerciseName,
      data,
    }: {
      exerciseId: string;
      exerciseName: string;
      data: { weight: string; sets: number; reps: string; comments?: string };
    }) => {
      const response = await fetch("/api/workout-history", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          studentId: student.id,
          exerciseId,
          exerciseName,
          sets: data.sets,
          reps: data.reps,
          weight: parseFloat(data.weight) || 0,
          comments: data.comments || "",
        }),
      });
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Failed to save progress");
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/workout-history", student.id],
      });
      queryClient.invalidateQueries({
        queryKey: ["/api/workouts/student", student.id],
      });
    },
    onError: (error) => {
      console.error("Error saving progress:", error);
    },
  });

  if (showWorkoutExecution && selectedWorkout) {
    return (
      <StudentWorkoutExecution
        workoutId={selectedWorkout}
        student={{
          id: student.id,
          name: student.name,
          email: student.email || "",
        }}
        onBack={handleBackFromWorkout}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bem-vindo, {student.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Seus treinos e progresso
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card data-testid="card-total-workouts">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Total de Treinos
            </CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-total-workouts"
            >
              {stats.totalWorkouts}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-completed-sessions">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sessões Concluídas
            </CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-completed-sessions"
            >
              {stats.completedSessions}
            </div>
          </CardContent>
        </Card>

        <Card data-testid="card-weekly-progress">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Semanal</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div
              className="text-2xl font-bold"
              data-testid="text-weekly-progress"
            >
              {stats.currentWeekSessions}/{stats.weeklyGoal}
            </div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card data-testid="card-status">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={student.status === "active" ? "default" : "secondary"}
              data-testid="badge-status"
            >
              {student.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* My Workouts */}
      <Card data-testid="card-my-workouts">
        <CardHeader>
          <CardTitle>Meus Treinos</CardTitle>
          <CardDescription>
            Treinos criados pelo seu personal trainer
          </CardDescription>
        </CardHeader>
        <CardContent>
          {workoutsLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <p>Carregando treinos...</p>
            </div>
          ) : Array.isArray(workouts) && workouts.length ? (
            <div className="space-y-4">
              {workouts.map((workout: any) => {
                const isExpanded = expandedWorkouts.has(workout.id);
                return (
                  <Card
                    key={workout.id}
                    className="hover:shadow-md transition-shadow"
                    data-testid={`card-workout-${workout.id}`}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-lg">
                            {workout.name}
                          </CardTitle>
                          <CardDescription>
                            {workout.description}
                          </CardDescription>
                          {workout.exercises &&
                            workout.exercises.length > 0 && (
                              <div className="flex items-center text-sm text-gray-600 mt-2">
                                <Dumbbell className="h-4 w-4 mr-1" />
                                {workout.exercises.length} exercício
                                {workout.exercises.length !== 1 ? "s" : ""}
                                <Badge variant="outline" className="ml-2">
                                  {workout.category}
                                </Badge>
                              </div>
                            )}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => toggleWorkoutExpansion(workout.id)}
                            data-testid={`button-toggle-${workout.id}`}
                          >
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4" />
                            ) : (
                              <ChevronDown className="h-4 w-4" />
                            )}
                          </Button>
                          <Button
                            size="sm"
                            onClick={() => handleStartWorkout(workout.id)}
                            data-testid={`button-start-workout-${workout.id}`}
                          >
                            <Play className="h-4 w-4 mr-1" />
                            Iniciar
                          </Button>
                        </div>
                      </div>
                    </CardHeader>

                    {isExpanded && workout.exercises && (
                      <CardContent className="pt-0">
                        <div className="space-y-4">
                          <h4 className="font-medium text-gray-900 dark:text-white">
                            Exercícios:
                          </h4>
                          {workout.exercises.map(
                            (exercise: any, index: number) => {
                              const exerciseProgress = exerciseData[
                                exercise.id
                              ] || {
                                weight: exercise.weight?.toString() || "",
                                sets: exercise.sets || 3,
                                completedSets: 0,
                                reps: exercise.reps || "12",
                                exerciseName: exercise.name || "",
                                comments: "",
                                hasUnsavedChanges: false,
                              };

                              return (
                                <Card
                                  key={exercise.id}
                                  className="bg-gray-50 dark:bg-gray-800"
                                >
                                  <CardContent className="p-4">
                                    <div className="space-y-3">
                                      {/* Exercise header */}
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <h5 className="font-medium">
                                            {exercise.name}
                                          </h5>
                                          <p className="text-sm text-gray-600">
                                            {exercise.reps} repetições
                                          </p>
                                        </div>
                                        {exercise.videoUrl && (
                                          <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() =>
                                              window.open(
                                                exercise.videoUrl,
                                                "_blank"
                                              )
                                            }
                                            data-testid={`button-video-${exercise.id}`}
                                          >
                                            <VideoIcon className="h-4 w-4 mr-1" />
                                            Vídeo
                                          </Button>
                                        )}
                                      </div>

                                      {/* Exercise controls */}
                                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                        {/* Weight input */}
                                        <div className="space-y-2">
                                          <Label
                                            htmlFor={`weight-${exercise.id}`}
                                            className="text-sm"
                                          >
                                            Peso (kg)
                                          </Label>
                                          <Input
                                            id={`weight-${exercise.id}`}
                                            type="number"
                                            value={exerciseProgress.weight}
                                            onChange={(e) =>
                                              updateExerciseData(
                                                exercise.id,
                                                "weight",
                                                e.target.value
                                              )
                                            }
                                            placeholder="0"
                                            className="h-8"
                                          />
                                        </div>

                                        {/* Sets control */}
                                        <div className="space-y-2">
                                          <Label className="text-sm">
                                            Séries
                                          </Label>
                                          <div className="flex items-center gap-2">
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                updateExerciseData(
                                                  exercise.id,
                                                  "sets",
                                                  Math.max(
                                                    1,
                                                    exerciseProgress.sets - 1
                                                  )
                                                )
                                              }
                                              className="h-8 w-8 p-0"
                                            >
                                              -
                                            </Button>
                                            <span className="w-8 text-center">
                                              {exerciseProgress.sets}
                                            </span>
                                            <Button
                                              variant="outline"
                                              size="sm"
                                              onClick={() =>
                                                updateExerciseData(
                                                  exercise.id,
                                                  "sets",
                                                  exerciseProgress.sets + 1
                                                )
                                              }
                                              className="h-8 w-8 p-0"
                                            >
                                              +
                                            </Button>
                                          </div>
                                        </div>

                                        {/* Rest time */}
                                        <div className="space-y-2">
                                          <Label className="text-sm">
                                            Descanso
                                          </Label>
                                          <div className="flex items-center text-sm text-gray-600">
                                            <Clock className="h-4 w-4 mr-1" />
                                            {exercise.restTime}s
                                          </div>
                                        </div>
                                      </div>

                                      {/* Comments */}
                                      <div className="space-y-2">
                                        <Label
                                          htmlFor={`comments-${exercise.id}`}
                                          className="text-sm flex items-center gap-1"
                                        >
                                          <MessageSquare className="h-4 w-4" />
                                          Comentários
                                        </Label>
                                        <Input
                                          id={`comments-${exercise.id}`}
                                          value={exerciseProgress.comments}
                                          onChange={(e) =>
                                            updateExerciseData(
                                              exercise.id,
                                              "comments",
                                              e.target.value
                                            )
                                          }
                                          placeholder="Adicione observações sobre o exercício..."
                                          className="h-8"
                                        />
                                      </div>

                                      {/* Save button */}
                                      <div className="flex justify-end">
                                        <Button
                                          onClick={() =>
                                            saveExerciseProgress(exercise.id)
                                          }
                                          disabled={
                                            !exerciseProgress.hasUnsavedChanges ||
                                            saveProgressMutation.isPending
                                          }
                                          size="sm"
                                          className="gap-2"
                                        >
                                          <Save className="h-4 w-4" />
                                          {saveProgressMutation.isPending
                                            ? "Salvando..."
                                            : "Salvar Progresso"}
                                        </Button>
                                      </div>

                                      {/* Sets progress */}
                                      <div className="space-y-2">
                                        <div className="flex justify-between items-center">
                                          <Label className="text-sm">
                                            Progresso das Séries
                                          </Label>
                                          <span className="text-sm text-gray-600">
                                            {exerciseProgress.completedSets} /{" "}
                                            {exerciseProgress.sets} concluídas
                                          </span>
                                        </div>
                                        <div className="flex gap-1">
                                          {Array.from(
                                            { length: exerciseProgress.sets },
                                            (_, setIndex) => (
                                              <Button
                                                key={setIndex}
                                                variant={
                                                  setIndex <
                                                  exerciseProgress.completedSets
                                                    ? "default"
                                                    : "outline"
                                                }
                                                size="sm"
                                                onClick={() => {
                                                  const newCompleted =
                                                    setIndex <
                                                    exerciseProgress.completedSets
                                                      ? setIndex
                                                      : setIndex + 1;
                                                  updateExerciseData(
                                                    exercise.id,
                                                    "completedSets",
                                                    newCompleted
                                                  );
                                                }}
                                                className="h-8 w-12 p-0"
                                              >
                                                {setIndex <
                                                exerciseProgress.completedSets ? (
                                                  <Check className="h-4 w-4" />
                                                ) : (
                                                  setIndex + 1
                                                )}
                                              </Button>
                                            )
                                          )}
                                        </div>
                                        <Progress
                                          value={
                                            (exerciseProgress.completedSets /
                                              exerciseProgress.sets) *
                                            100
                                          }
                                          className="h-2"
                                        />
                                      </div>
                                    </div>
                                  </CardContent>
                                </Card>
                              );
                            }
                          )}
                        </div>
                      </CardContent>
                    )}
                  </Card>
                );
              })}
            </div>
          ) : (
            <p className="text-gray-500">Nenhum treino disponível ainda</p>
          )}
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Suas últimas sessões de treino</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-900"></div>
              <p>Carregando histórico...</p>
            </div>
          ) : Array.isArray(workoutHistory) && workoutHistory.length ? (
            <div className="space-y-3">
              {workoutHistory.slice(0, 5).map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-3 border rounded"
                  data-testid={`row-session-${session.id}`}
                >
                  <div>
                    <p className="font-medium">{session.exerciseName}</p>
                    <p className="text-sm text-gray-600">
                      {session.sets} séries × {session.reps} reps •{" "}
                      {session.weight}kg
                    </p>
                  </div>
                  <div className="text-sm text-gray-500">
                    {new Date(session.completedAt).toLocaleDateString()}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-gray-500">Nenhuma atividade ainda</p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
