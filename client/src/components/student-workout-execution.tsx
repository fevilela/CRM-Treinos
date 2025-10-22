import { useState, useEffect } from "react";
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
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ArrowLeft,
  Play,
  Pause,
  Square,
  Timer,
  CheckCircle,
  Clock,
  Target,
  TrendingUp,
  Coffee,
  PlayCircle,
  Calendar,
  CheckCircle2,
  Dumbbell,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { VideoModal } from "./modals/video-modal";
import type { Student, Exercise } from "@shared/schema";

interface StudentWorkoutExecutionProps {
  workoutId: string;
  student: { id: string; name: string; email: string };
  onBack: () => void;
}

interface ExerciseSet {
  setNumber: number;
  weight: string;
  reps: string;
  completed: boolean;
  restStartTime?: number;
  restDuration?: number;
}

interface ExerciseProgress {
  exerciseId: string;
  sets: ExerciseSet[];
  currentSet: number;
  completed: boolean;
  allSetsCompleted: boolean;
}

// Componente de cronômetro principal do treino
function WorkoutMainTimer({
  isActive,
  onTimeUpdate,
}: {
  isActive: boolean;
  onTimeUpdate: (seconds: number) => void;
}) {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive) {
      interval = setInterval(() => {
        setSeconds((prev) => prev + 1);
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive]);

  useEffect(() => {
    onTimeUpdate(seconds);
  }, [seconds, onTimeUpdate]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, "0")}:${secs
        .toString()
        .padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  return (
    <Card className="sticky top-4 z-10 bg-gradient-to-r from-blue-50 to-purple-50 border-blue-200 shadow-lg">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-blue-700">
          <Timer className="h-6 w-6" />
          Tempo Total do Treino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-mono font-bold text-blue-600 text-center mb-2">
          {formatTime(seconds)}
        </div>
        {isActive && (
          <div className="flex items-center justify-center gap-2 text-sm text-blue-600">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            Treino em andamento
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// Componente de cronômetro de descanso
function RestTimer({
  isActive,
  duration,
  onComplete,
  onSkip,
  setsRemaining,
}: {
  isActive: boolean;
  duration: number;
  onComplete: () => void;
  onSkip: () => void;
  setsRemaining: number;
}) {
  const [timeLeft, setTimeLeft] = useState(duration);

  useEffect(() => {
    if (isActive && timeLeft > 0) {
      const timer = setTimeout(() => {
        setTimeLeft(timeLeft - 1);
      }, 1000);
      return () => clearTimeout(timer);
    } else if (timeLeft === 0 && isActive) {
      onComplete();
    }
  }, [isActive, timeLeft, onComplete]);

  useEffect(() => {
    if (isActive) {
      setTimeLeft(duration);
    }
  }, [isActive, duration]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const progress = ((duration - timeLeft) / duration) * 100;

  if (!isActive) return null;

  return (
    <Card className="bg-gradient-to-r from-orange-50 to-red-50 border-orange-200 shadow-lg animate-pulse">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center justify-between text-lg text-orange-700">
          <div className="flex items-center gap-2">
            <Coffee className="h-6 w-6" />
            Tempo de Descanso
          </div>
          <Badge variant="secondary" className="bg-orange-100 text-orange-700">
            {setsRemaining} séries restantes
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-mono font-bold text-orange-600 text-center mb-3">
          {formatTime(timeLeft)}
        </div>
        <Progress value={progress} className="h-3 mb-3" />
        <div className="flex justify-between items-center">
          <div className="text-sm text-orange-600">
            {timeLeft === 0 ? "Descanso concluído!" : "Descansando..."}
          </div>
          <Button
            onClick={onSkip}
            variant="outline"
            size="sm"
            className="border-orange-300 text-orange-600 hover:bg-orange-50"
          >
            Pular Descanso
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}

// Função para obter o nome em português do dia da semana
function getWeekdayName(weekday: string | null) {
  const weekdays: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
  };
  return weekday ? weekdays[weekday] || weekday : "Não definido";
}

export function StudentWorkoutExecution({
  workoutId,
  student,
  onBack,
}: StudentWorkoutExecutionProps) {
  const [workoutStarted, setWorkoutStarted] = useState(false);
  const [workoutDuration, setWorkoutDuration] = useState(0);
  const [exerciseProgress, setExerciseProgress] = useState<
    Record<string, ExerciseProgress>
  >({});
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState(0);
  const [isResting, setIsResting] = useState(false);
  const [currentRestDuration, setCurrentRestDuration] = useState(60);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    exerciseName: string;
  } | null>(null);
  const [collapsedExercises, setCollapsedExercises] = useState<
    Record<string, boolean>
  >({});
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar detalhes do treino
  const { data: workout, isLoading: workoutLoading } = useQuery<any>({
    queryKey: [`/api/workouts/${workoutId}`],
    enabled: !!workoutId,
  });

  // Buscar exercícios do treino
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<
    Exercise[]
  >({
    queryKey: [`/api/exercises/${workoutId}`],
    enabled: !!workoutId,
  });

  // Mutation para salvar sessão de treino
  const saveWorkoutSessionMutation = useMutation({
    mutationFn: async (data: { sessionData: any; historyData: any[] }) => {
      const { sessionData, historyData } = data;

      const response = await fetch("/api/workout-sessions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(sessionData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao salvar sessão do treino");
      }

      const session = await response.json();

      for (const history of historyData) {
        const historyResponse = await fetch("/api/exercise-weight-change", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            ...history,
            workoutSessionId: session.id,
          }),
          credentials: "include",
        });

        if (!historyResponse.ok) {
          console.error(
            "Erro ao salvar histórico de exercício:",
            history.exerciseName
          );
        }
      }

      return session;
    },
    onSuccess: () => {
      toast({
        title: "Treino finalizado!",
        description: "Seus resultados foram salvos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-history"] });
      queryClient.invalidateQueries({
        queryKey: [`/api/workout-sessions/student/${student.id}`],
      });
      setWorkoutCompleted(true);
    },
  });

  // Inicializar progresso dos exercícios
  useEffect(() => {
    if (exercises.length > 0) {
      const initialProgress: Record<string, ExerciseProgress> = {};
      exercises.forEach((exercise) => {
        initialProgress[exercise.id] = {
          exerciseId: exercise.id,
          sets: Array.from({ length: exercise.sets || 3 }, (_, index) => ({
            setNumber: index + 1,
            weight: exercise.weight?.toString() || "",
            reps: exercise.reps || "",
            completed: false,
          })),
          currentSet: 0,
          completed: false,
          allSetsCompleted: false,
        };
      });
      setExerciseProgress(initialProgress);
    }
  }, [exercises]);

  const handleStartWorkout = () => {
    setWorkoutStarted(true);
    toast({
      title: "Treino iniciado!",
      description: "Boa sorte com seu treino!",
    });
  };

  const handleCompleteSet = (exerciseId: string, setIndex: number) => {
    setExerciseProgress((prev) => {
      const updated = { ...prev };
      const exercise = updated[exerciseId];
      if (exercise) {
        exercise.sets[setIndex].completed = true;

        // Verificar se todas as séries foram completadas
        const allSetsCompleted = exercise.sets.every((set) => set.completed);
        exercise.allSetsCompleted = allSetsCompleted;

        if (allSetsCompleted) {
          exercise.completed = true;
        }
      }
      return updated;
    });
  };

  // useEffect para mostrar toast quando exercício é completado
  useEffect(() => {
    Object.entries(exerciseProgress).forEach(([exerciseId, progress]) => {
      if (progress.completed && progress.allSetsCompleted) {
        const exercise = exercises.find((e) => e.id === exerciseId);
        if (exercise) {
          // Só mostra toast uma vez por exercício
          const toastShown = sessionStorage.getItem(`toast-${exerciseId}`);
          if (!toastShown) {
            toast({
              title: "Exercício concluído!",
              description: `${exercise.name} finalizado com sucesso!`,
            });
            sessionStorage.setItem(`toast-${exerciseId}`, "true");
          }
        }
      }
    });
  }, [exerciseProgress, exercises, toast]);

  const handleStartRest = (
    duration: number,
    exerciseId: string,
    setIndex: number
  ) => {
    setIsResting(true);
    setCurrentRestDuration(duration);

    // Marcar a série como completa antes do descanso
    handleCompleteSet(exerciseId, setIndex);
  };

  const handleCompleteRest = () => {
    setIsResting(false);
    toast({
      title: "Descanso concluído!",
      description: "Pronto para a próxima série!",
    });
  };

  const handleSkipRest = () => {
    setIsResting(false);
  };

  // Função para toggle do collapse de exercícios
  const toggleExerciseCollapse = (exerciseId: string) => {
    setCollapsedExercises((prev) => ({
      ...prev,
      [exerciseId]: !prev[exerciseId],
    }));
  };

  // Auto-collapse quando todas as séries estão completas
  useEffect(() => {
    const newCollapsed: Record<string, boolean> = {};
    Object.values(exerciseProgress).forEach((progress) => {
      if (progress.allSetsCompleted) {
        newCollapsed[progress.exerciseId] = true;
      }
    });
    setCollapsedExercises((prev) => ({ ...prev, ...newCollapsed }));
  }, [exerciseProgress]);

  const handleUpdateSetData = (
    exerciseId: string,
    setIndex: number,
    field: "weight" | "reps",
    value: string
  ) => {
    setExerciseProgress((prev) => {
      const updated = { ...prev };
      const exercise = updated[exerciseId];
      if (exercise && exercise.sets[setIndex]) {
        exercise.sets[setIndex][field] = value;
      }
      return updated;
    });
  };

  const handleFinishWorkout = () => {
    const completedExercises = Object.values(exerciseProgress).filter(
      (progress) => progress.completed
    );

    if (completedExercises.length === 0) {
      toast({
        title: "Aviso",
        description:
          "Complete pelo menos um exercício antes de finalizar o treino.",
        variant: "destructive",
      });
      return;
    }

    // Preparar dados da sessão
    const sessionData = {
      workoutId,
      studentId: student.id,
      duration: Math.floor(workoutDuration / 60), // em minutos
      exercisePerformances: Object.values(exerciseProgress)
        .filter((progress) => progress.completed)
        .map((progress) => {
          const completedSets = progress.sets.filter((set) => set.completed);
          const maxWeight =
            completedSets.length > 0
              ? completedSets
                  .map((set) => parseFloat(set.weight) || 0)
                  .reduce((max, weight) => Math.max(max, weight), 0)
              : 0;

          return {
            exerciseId: progress.exerciseId,
            actualSets: completedSets.length,
            actualReps: completedSets.map((set) => set.reps).join(","),
            actualWeight: maxWeight.toString(),
            completed: true,
          };
        }),
    };

    // Preparar dados do histórico de cada exercício
    const historyData = Object.values(exerciseProgress)
      .filter((progress) => progress.completed)
      .map((progress) => {
        const exercise = exercises.find((ex) => ex.id === progress.exerciseId);
        const completedSets = progress.sets.filter((set) => set.completed);
        const maxWeight =
          completedSets.length > 0
            ? completedSets
                .map((set) => parseFloat(set.weight) || 0)
                .reduce((max, weight) => Math.max(max, weight), 0)
            : 0;

        return {
          studentId: student.id,
          exerciseId: progress.exerciseId,
          exerciseName: exercise?.name || "Exercício",
          sets: completedSets.length,
          reps: completedSets.map((set) => set.reps).join(","),
          currentWeight: maxWeight.toString(),
          comments: null,
        };
      });

    saveWorkoutSessionMutation.mutate({ sessionData, historyData });
  };

  const openVideo = (videoUrl: string, exerciseName: string) => {
    setSelectedVideo({ url: videoUrl, exerciseName });
  };

  // Calcular estatísticas
  const totalExercises = exercises.length;
  const completedExercises = Object.values(exerciseProgress).filter(
    (progress) => progress.completed
  ).length;
  const totalSets = exercises.reduce(
    (sum, exercise) => sum + (exercise.sets || 3),
    0
  );
  const completedSets = Object.values(exerciseProgress).reduce(
    (sum, progress) =>
      sum + progress.sets.filter((set) => set.completed).length,
    0
  );

  // Calcular séries restantes para o exercício atual
  const getCurrentSetsRemaining = (exerciseId: string) => {
    const progress = exerciseProgress[exerciseId];
    if (!progress) return 0;
    return progress.sets.filter((set) => !set.completed).length;
  };

  if (workoutLoading || exercisesLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (workoutCompleted) {
    return (
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        <Card className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl text-green-700 flex items-center justify-center gap-2">
              <CheckCircle2 className="h-8 w-8" />
              Treino Concluído!
            </CardTitle>
            <CardDescription className="text-lg text-green-600">
              Parabéns! Você finalizou seu treino com sucesso.
            </CardDescription>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-blue-600">
                  {Math.floor(workoutDuration / 60)}
                </div>
                <div className="text-sm text-muted-foreground">Minutos</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-green-600">
                  {completedExercises}
                </div>
                <div className="text-sm text-muted-foreground">Exercícios</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-purple-600">
                  {completedSets}
                </div>
                <div className="text-sm text-muted-foreground">Séries</div>
              </div>
              <div className="bg-white rounded-lg p-4 shadow-sm">
                <div className="text-2xl font-bold text-orange-600">
                  {Math.round((completedSets / totalSets) * 100)}%
                </div>
                <div className="text-sm text-muted-foreground">Concluído</div>
              </div>
            </div>
            <Button onClick={onBack} className="mt-6">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Voltar ao Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button variant="ghost" onClick={onBack} className="mb-4">
          <ArrowLeft className="h-4 w-4 mr-2" />
          Voltar
        </Button>

        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">
            {workout?.name}
          </h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {getWeekdayName(workout?.weekday)}
            </div>
            <div className="flex items-center gap-1">
              <Dumbbell className="h-4 w-4" />
              {workout?.category}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!workoutStarted ? (
            <Button
              onClick={handleStartWorkout}
              className="bg-green-600 hover:bg-green-700"
            >
              <Play className="h-4 w-4 mr-2" />
              Iniciar Treino
            </Button>
          ) : (
            <Button onClick={handleFinishWorkout} variant="destructive">
              <Square className="h-4 w-4 mr-2" />
              Finalizar Treino
            </Button>
          )}
        </div>
      </div>

      {/* Stats e Timer */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <WorkoutMainTimer
          isActive={workoutStarted && !workoutCompleted}
          onTimeUpdate={setWorkoutDuration}
        />

        <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="flex items-center gap-2 text-lg text-green-700">
              <Target className="h-6 w-6" />
              Progresso
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Exercícios</span>
                <span className="font-semibold">
                  {completedExercises}/{totalExercises}
                </span>
              </div>
              <Progress
                value={(completedExercises / totalExercises) * 100}
                className="h-2"
              />
              <div className="flex justify-between text-sm">
                <span>Séries</span>
                <span className="font-semibold">
                  {completedSets}/{totalSets}
                </span>
              </div>
              <Progress
                value={(completedSets / totalSets) * 100}
                className="h-2"
              />
            </div>
          </CardContent>
        </Card>

        {isResting && (
          <RestTimer
            isActive={isResting}
            duration={currentRestDuration}
            onComplete={handleCompleteRest}
            onSkip={handleSkipRest}
            setsRemaining={getCurrentSetsRemaining(
              exercises[currentExerciseIndex]?.id
            )}
          />
        )}
      </div>

      {/* Exercícios */}
      <div className="space-y-6">
        {exercises.map((exercise, exerciseIndex) => {
          const progress = exerciseProgress[exercise.id];
          if (!progress) return null;

          return (
            <Card
              key={exercise.id}
              className={`${
                progress.allSetsCompleted
                  ? "bg-gradient-to-r from-green-50 to-emerald-50 border-green-200"
                  : "bg-white border-gray-200"
              } shadow-md transition-all duration-300`}
            >
              <CardHeader
                className="cursor-pointer"
                onClick={() => toggleExerciseCollapse(exercise.id)}
              >
                <div className="flex items-center justify-between">
                  <CardTitle className="flex items-center gap-3">
                    {progress.allSetsCompleted ? (
                      <CheckCircle2 className="h-6 w-6 text-green-600" />
                    ) : (
                      <div className="w-6 h-6 rounded-full border-2 border-gray-300 flex items-center justify-center text-xs font-bold">
                        {exerciseIndex + 1}
                      </div>
                    )}
                    {exercise.name}
                    {progress.allSetsCompleted && (
                      <Badge
                        variant="secondary"
                        className="bg-green-100 text-green-700"
                      >
                        Concluído
                      </Badge>
                    )}
                  </CardTitle>

                  <div className="flex items-center gap-2">
                    {exercise.videoUrl && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          openVideo(exercise.videoUrl!, exercise.name);
                        }}
                        className="border-blue-300 text-blue-600 hover:bg-blue-50"
                      >
                        <PlayCircle className="h-4 w-4 mr-1" />
                        Ver Vídeo
                      </Button>
                    )}
                    {exercise.restTime && (
                      <Badge
                        variant="outline"
                        className="border-orange-300 text-orange-600"
                      >
                        Descanso: {Math.floor(exercise.restTime / 60)}:
                        {(exercise.restTime % 60).toString().padStart(2, "0")}
                      </Badge>
                    )}
                    {collapsedExercises[exercise.id] ? (
                      <ChevronDown className="h-5 w-5 text-gray-500" />
                    ) : (
                      <ChevronUp className="h-5 w-5 text-gray-500" />
                    )}
                  </div>
                </div>
                {exercise.notes && (
                  <CardDescription className="text-muted-foreground">
                    {exercise.notes}
                  </CardDescription>
                )}
              </CardHeader>

              {!collapsedExercises[exercise.id] && (
                <CardContent>
                  <div className="space-y-4">
                    {progress.sets.map((set, setIndex) => (
                      <div
                        key={setIndex}
                        className={`flex items-center gap-4 p-4 rounded-lg border ${
                          set.completed
                            ? "bg-green-50 border-green-200"
                            : "bg-gray-50 border-gray-200"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-[80px]">
                          {set.completed ? (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          ) : (
                            <div className="w-5 h-5 rounded-full border-2 border-gray-400"></div>
                          )}
                          <span className="font-medium text-sm">
                            Série {set.setNumber}
                          </span>
                        </div>

                        <div className="flex items-center gap-4 flex-1">
                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">
                              Peso (kg)
                            </label>
                            <Input
                              type="number"
                              value={set.weight}
                              onChange={(e) =>
                                handleUpdateSetData(
                                  exercise.id,
                                  setIndex,
                                  "weight",
                                  e.target.value
                                )
                              }
                              placeholder={exercise.weight?.toString() || "0"}
                              className="w-20 h-8 text-center"
                              disabled={set.completed}
                            />
                          </div>

                          <div className="flex items-center gap-2">
                            <label className="text-xs font-medium text-gray-600">
                              Repetições
                            </label>
                            <Input
                              type="text"
                              value={set.reps}
                              onChange={(e) =>
                                handleUpdateSetData(
                                  exercise.id,
                                  setIndex,
                                  "reps",
                                  e.target.value
                                )
                              }
                              placeholder={exercise.reps || "0"}
                              className="w-20 h-8 text-center"
                              disabled={set.completed}
                            />
                          </div>

                          {!set.completed && workoutStarted && (
                            <Button
                              onClick={() => {
                                if (
                                  exercise.restTime &&
                                  exercise.restTime > 0
                                ) {
                                  handleStartRest(
                                    exercise.restTime,
                                    exercise.id,
                                    setIndex
                                  );
                                } else {
                                  handleCompleteSet(exercise.id, setIndex);
                                }
                              }}
                              className="bg-blue-600 hover:bg-blue-700"
                              disabled={!set.weight || !set.reps}
                            >
                              {exercise.restTime
                                ? "Concluir & Descansar"
                                : "Concluir Série"}
                            </Button>
                          )}

                          {set.completed && (
                            <div className="text-sm text-green-600 font-medium">
                              ✓ {set.weight}kg × {set.reps} reps
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Modal de vídeo */}
      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo.url}
          exerciseName={selectedVideo.exerciseName}
        />
      )}
    </div>
  );
}
