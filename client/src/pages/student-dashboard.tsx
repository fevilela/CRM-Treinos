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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { StudentWorkoutExecution } from "@/components/student-workout-execution";
import { VideoModal } from "@/components/modals/video-modal";
import { useToast } from "@/hooks/use-toast";
import type { Student } from "@shared/schema";

interface StudentDashboardProps {
  student: Student;
  onLogout: () => void;
}

export function StudentDashboard({ student }: StudentDashboardProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showWorkoutExecution, setShowWorkoutExecution] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    exerciseName: string;
  } | null>(null);
  const [workoutTimer, setWorkoutTimer] = useState<number>(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
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
    // Start workout timer
    setWorkoutTimer(0);
    const interval = setInterval(() => {
      setWorkoutTimer((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const handleBackFromWorkout = () => {
    setSelectedWorkout(null);
    setShowWorkoutExecution(false);
    // Stop workout timer
    if (timerInterval) {
      clearInterval(timerInterval);
      setTimerInterval(null);
    }
    setWorkoutTimer(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
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

      {/* My Workouts - Accordion Layout */}
      <div className="space-y-4">
        {workoutsLoading ? (
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center space-x-2">
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                <p>Carregando treinos...</p>
              </div>
            </CardContent>
          </Card>
        ) : Array.isArray(workouts) && workouts.length ? (
          <Card className="bg-white border-gray-200">
            <CardContent className="p-0">
              <Accordion type="multiple" className="w-full">
                {workouts.map((workout: any) => {
                  const totalExercises = workout.exercises?.length || 0;

                  return (
                    <AccordionItem
                      key={workout.id}
                      value={workout.id}
                      className="border-gray-200"
                    >
                      <AccordionTrigger className="px-4 py-3 hover:no-underline hover:bg-gray-50">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                            <Dumbbell className="h-5 w-5 text-primary" />
                          </div>
                          <div className="text-left">
                            <h3 className="font-medium text-gray-900 text-sm">
                              {workout.name}
                            </h3>
                            <p className="text-gray-500 text-xs">
                              {totalExercises} exercícios
                            </p>
                          </div>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent className="px-4 pb-4">
                        <div className="space-y-3">
                          {/* Exercise List */}
                          {workout.exercises &&
                            workout.exercises.length > 0 && (
                              <div className="space-y-2">
                                <h4 className="text-sm font-medium text-gray-700">
                                  Exercícios:
                                </h4>
                                <div className="space-y-1">
                                  {workout.exercises.map(
                                    (exercise: any, index: number) => (
                                      <div
                                        key={exercise.id || index}
                                        className="flex items-center justify-between text-sm text-gray-600 bg-gray-50 rounded p-2"
                                      >
                                        <div>
                                          <span className="font-medium">
                                            {exercise.name}
                                          </span>
                                          {exercise.sets && exercise.reps && (
                                            <span className="text-gray-500 ml-2">
                                              {exercise.sets} séries ×{" "}
                                              {exercise.reps} reps
                                            </span>
                                          )}
                                        </div>
                                        {exercise.videoUrl && (
                                          <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={(e) => {
                                              e.stopPropagation();
                                              setSelectedVideo({
                                                url: exercise.videoUrl,
                                                exerciseName: exercise.name,
                                              });
                                            }}
                                            className="h-6 w-6 p-1 text-primary hover:text-primary/80"
                                          >
                                            <Play className="h-3 w-3" />
                                          </Button>
                                        )}
                                      </div>
                                    )
                                  )}
                                </div>
                              </div>
                            )}

                          {/* Start Workout Button */}
                          <div className="pt-2">
                            <Button
                              onClick={() => handleStartWorkout(workout.id)}
                              className="bg-primary hover:bg-primary/90 text-white w-full"
                              data-testid={`button-start-workout-${workout.id}`}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar Treino
                            </Button>
                          </div>
                        </div>
                      </AccordionContent>
                    </AccordionItem>
                  );
                })}
              </Accordion>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardContent className="p-6">
              <p className="text-gray-500 text-center">
                Nenhum treino disponível ainda
              </p>
            </CardContent>
          </Card>
        )}
      </div>

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

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo?.url || ""}
          exerciseName={selectedVideo?.exerciseName || ""}
        />
      )}
    </div>
  );
}
