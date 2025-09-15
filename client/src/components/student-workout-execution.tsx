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
} from "lucide-react";
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
        setSeconds((prev) => {
          const newSeconds = prev + 1;
          onTimeUpdate(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isActive, onTimeUpdate]);

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
    <Card className="sticky top-4 z-10 bg-white border-gray-200 shadow-sm">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Timer className="h-5 w-5 text-primary" />
          Tempo Total do Treino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-lg font-mono font-bold text-primary text-center">
          {formatTime(seconds)}
        </div>
        {isActive && (
          <div className="mt-2 text-sm text-muted-foreground flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-primary rounded-full animate-pulse"></div>
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
}: {
  isActive: boolean;
  duration: number;
  onComplete: () => void;
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
    <Card className="bg-orange-50 border-orange-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg text-orange-700">
          <Coffee className="h-5 w-5" />
          Tempo de Descanso
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-mono font-bold text-orange-600 text-center mb-2">
          {formatTime(timeLeft)}
        </div>
        <Progress value={progress} className="h-2" />
        <div className="mt-2 text-sm text-orange-600 text-center">
          {timeLeft === 0 ? "Descanso concluído!" : "Descansando..."}
        </div>
      </CardContent>
    </Card>
  );
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
  const [manualRestActive, setManualRestActive] = useState(false);
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
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
    mutationFn: async (sessionData: any) => {
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

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Treino finalizado!",
        description: "Seus resultados foram salvos com sucesso.",
      });
      queryClient.invalidateQueries({ queryKey: ["/api/workout-history"] });
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
            weight: "",
            reps: "",
            completed: false,
          })),
          currentSet: 0,
          completed: false,
        };
      });
      setExerciseProgress(initialProgress);
    }
  }, [exercises]);

  const startWorkout = () => {
    setWorkoutStarted(true);
    toast({
      title: "Treino iniciado!",
      description: "Cronômetro ativado. Boa sorte!",
    });
  };

  const completeSet = (
    exerciseId: string,
    setIndex: number,
    weight: string,
    reps: string
  ) => {
    setExerciseProgress((prev) => {
      const updated = { ...prev };
      updated[exerciseId].sets[setIndex] = {
        ...updated[exerciseId].sets[setIndex],
        weight,
        reps,
        completed: true,
      };

      // Verificar se ainda há séries neste exercício
      const incompleteSets = updated[exerciseId].sets.filter(
        (set) => !set.completed
      );

      if (incompleteSets.length > 0) {
        // Iniciar descanso se não for a última série usando o tempo do exercício
        const exercise = exercises.find((e) => e.id === exerciseId);
        const restTime = exercise?.restTime || 60; // Fallback para 60s
        setCurrentRestDuration(restTime);
        setIsResting(true);
      } else {
        // Exercício completo, passar para o próximo
        updated[exerciseId].completed = true;

        // Verificar se há mais exercícios
        const nextExerciseIndex = currentExerciseIndex + 1;
        if (nextExerciseIndex < exercises.length) {
          setCurrentExerciseIndex(nextExerciseIndex);
          toast({
            title: "Exercício concluído!",
            description: `Passando para: ${exercises[nextExerciseIndex]?.name}`,
          });
        } else {
          // Treino completo!
          completeWorkout();
        }
      }

      return updated;
    });
  };

  const completeWorkout = () => {
    setWorkoutCompleted(true);
    setWorkoutStarted(false);

    // Preparar performances dos exercícios no formato correto para o backend
    const performances: any[] = [];
    Object.values(exerciseProgress).forEach((progress) => {
      const completedSets = progress.sets.filter((set) => set.completed);

      if (completedSets.length > 0) {
        // Criar uma performance por exercício com dados agregados
        performances.push({
          exerciseId: progress.exerciseId,
          actualSets: completedSets.length,
          actualReps: completedSets.map((set) => set.reps).join(","), // Exemplo: "12,10,8"
          actualWeight: Math.max(
            ...completedSets.map((set) => parseFloat(set.weight) || 0)
          ), // Peso máximo usado
          exerciseTimeSeconds: null, // Poderemos adicionar isso depois
          restTimeSeconds: currentRestDuration, // Tempo de descanso usado
          completed: true,
        });
      }
    });

    // Salvar sessão do treino
    const sessionData = {
      studentId: student.id,
      workoutId: workoutId,
      duration: Math.ceil(workoutDuration / 60), // Converter para minutos
      notes: `Treino realizado com ${getCompletedSetsCount()} séries completadas`,
      performances: performances, // Backend espera este campo
    };

    saveWorkoutSessionMutation.mutate(sessionData);
  };

  const getTotalSetsRemaining = () => {
    return Object.values(exerciseProgress).reduce((total, progress) => {
      return total + progress.sets.filter((set) => !set.completed).length;
    }, 0);
  };

  const getCompletedSetsCount = () => {
    return Object.values(exerciseProgress).reduce((total, progress) => {
      return total + progress.sets.filter((set) => set.completed).length;
    }, 0);
  };

  const getTotalSetsCount = () => {
    return Object.values(exerciseProgress).reduce((total, progress) => {
      return total + progress.sets.length;
    }, 0);
  };

  if (workoutLoading || exercisesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (workoutCompleted) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="max-w-2xl mx-auto">
          <Card className="bg-green-50 border-green-200">
            <CardHeader className="text-center">
              <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
                <CheckCircle className="h-8 w-8 text-green-600" />
              </div>
              <CardTitle className="text-2xl text-green-700">
                Parabéns! Treino Concluído
              </CardTitle>
              <CardDescription>
                Você completou seu treino em {Math.floor(workoutDuration / 60)}{" "}
                minutos
              </CardDescription>
            </CardHeader>
            <CardContent className="text-center space-y-4">
              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <div className="font-semibold text-gray-700">
                    Séries Completas
                  </div>
                  <div className="text-2xl font-bold text-green-600">
                    {getCompletedSetsCount()}
                  </div>
                </div>
                <div>
                  <div className="font-semibold text-gray-700">Tempo Total</div>
                  <div className="text-2xl font-bold text-green-600">
                    {Math.floor(workoutDuration / 60)}min
                  </div>
                </div>
              </div>
              <Button onClick={onBack} className="w-full">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Voltar aos Treinos
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button variant="outline" onClick={onBack}>
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <h1 className="text-2xl font-bold">
                {workout?.name || "Treino"}
              </h1>
              <p className="text-gray-500">
                {workout?.description || "Treino personalizado"}
              </p>
            </div>
          </div>
          <Badge variant="secondary">{workout?.category || "Treino"}</Badge>
        </div>

        {/* Cronômetro Principal */}
        <WorkoutMainTimer
          isActive={workoutStarted}
          onTimeUpdate={setWorkoutDuration}
        />

        {/* Cronômetro de Descanso */}
        <RestTimer
          isActive={isResting || manualRestActive}
          duration={currentRestDuration}
          onComplete={() => {
            setIsResting(false);
            setManualRestActive(false);
          }}
        />

        {/* Botão de Descanso Manual */}
        {workoutStarted && !isResting && !manualRestActive && (
          <Card>
            <CardContent className="pt-4">
              <Button
                onClick={() => {
                  const currentExercise = exercises[currentExerciseIndex];
                  const restTime = currentExercise?.restTime || 60;
                  setCurrentRestDuration(restTime);
                  setManualRestActive(true);
                }}
                variant="outline"
                className="w-full"
              >
                <Coffee className="h-4 w-4 mr-2" />
                Iniciar Descanso (
                {exercises[currentExerciseIndex]?.restTime || 60}s)
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Progresso Geral */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5" />
              Progresso do Treino
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex justify-between text-sm">
                <span>Séries Completadas</span>
                <span>
                  {getCompletedSetsCount()} / {getTotalSetsCount()}
                </span>
              </div>
              <Progress
                value={
                  getTotalSetsCount()
                    ? (getCompletedSetsCount() / getTotalSetsCount()) * 100
                    : 0
                }
              />
              <div className="text-sm text-gray-600 text-center">
                {getTotalSetsRemaining()} séries restantes
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Botão Iniciar Treino */}
        {!workoutStarted && (
          <Card>
            <CardContent className="pt-6">
              <Button onClick={startWorkout} className="w-full" size="lg">
                <Play className="h-5 w-5 mr-2" />
                Iniciar Treino
              </Button>
            </CardContent>
          </Card>
        )}

        {/* Lista de Exercícios - Mostrar todos */}
        {exercises.map((exercise, exerciseIndex) => {
          const progress = exerciseProgress[exercise.id];
          if (!progress) return null;

          const isCurrentExercise = exerciseIndex === currentExerciseIndex;
          const isCompleted = progress.completed;
          const canInteract =
            workoutStarted && (isCurrentExercise || isCompleted);
          const completedSets = progress.sets.filter(
            (set) => set.completed
          ).length;
          const totalSets = progress.sets.length;

          // Find current incomplete set or last completed set
          const idx = progress.sets.findIndex((s) => !s.completed);
          const setIndex = idx === -1 ? progress.sets.length - 1 : idx;
          const currentSet = progress.sets[setIndex];

          return (
            <Card
              key={exercise.id}
              className="bg-white shadow-sm border border-gray-200"
            >
              <CardHeader className="text-center pb-6">
                <CardTitle className="text-base text-gray-900">
                  {exercise.name}
                </CardTitle>
                <CardDescription className="text-sm">
                  Série {setIndex + 1} de {totalSets}
                </CardDescription>
              </CardHeader>

              {canInteract && (
                <CardContent>
                  <SetInput
                    set={currentSet}
                    exercise={exercise}
                    exerciseId={exercise.id}
                    setIndex={setIndex}
                    onComplete={completeSet}
                    disabled={currentSet.completed}
                    studentId={student?.id || null}
                  />
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Botão Finalizar Treino - só aparece quando TODOS os exercícios estão completos */}
      {workoutStarted &&
        Object.values(exerciseProgress).length > 0 &&
        Object.values(exerciseProgress).every((p) => p.completed) && (
          <Card className="bg-white border-gray-200">
            <CardContent className="text-center py-6">
              <Button
                onClick={completeWorkout}
                variant="default"
                className="bg-primary hover:bg-primary/90"
              >
                <Square className="h-5 w-5 mr-2" />
                Finalizar Treino Completo
              </Button>
              <p className="text-sm text-muted-foreground mt-2">
                Parabéns! Você completou todos os exercícios.
              </p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}

// Hook para buscar histórico de peso de um exercício
function useExerciseWeightHistory(
  studentId: string | null,
  exerciseId: string
) {
  return useQuery({
    queryKey: [`/api/workout-history/${studentId}`, exerciseId],
    queryFn: async () => {
      if (!studentId) return [];
      const response = await fetch(
        `/api/workout-history/${studentId}?exerciseId=${exerciseId}`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!studentId,
    staleTime: 30000, // Cache por 30 segundos
  });
}

// Componente para mostrar mudança de peso com símbolos
function WeightChangeIndicator({
  studentId,
  exerciseId,
  currentWeight,
}: {
  studentId: string | null;
  exerciseId: string;
  currentWeight: string;
}) {
  const { data: history = [] } = useExerciseWeightHistory(
    studentId,
    exerciseId
  );

  if (!history.length || history.length < 2) {
    return null; // Sem histórico suficiente para comparar
  }

  const lastRecord = history[0]; // Mais recente

  if (!lastRecord.changeType || !lastRecord.previousWeight) {
    return null;
  }

  const getSymbolAndColor = (changeType: string) => {
    switch (changeType) {
      case "increase":
        return { symbol: "↗", color: "text-primary", bg: "bg-primary/20" };
      case "decrease":
        return {
          symbol: "↘",
          color: "text-muted-foreground",
          bg: "bg-gray-100",
        };
      case "maintain":
        return { symbol: "→", color: "text-gray-400", bg: "bg-gray-600/20" };
      default:
        return { symbol: "→", color: "text-gray-400", bg: "bg-gray-600/20" };
    }
  };

  const { symbol, color, bg } = getSymbolAndColor(lastRecord.changeType);
  const percentageChange = parseFloat(lastRecord.percentageChange || "0");

  return (
    <div
      className={`inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs ${bg} border border-current/20`}
    >
      <span className={`${color} font-bold text-sm`}>{symbol}</span>
      <span className={`${color} font-medium text-xs`}>
        {lastRecord.previousWeight}→{lastRecord.weight}kg
      </span>
      {percentageChange !== 0 && (
        <span className={`${color} text-xs`}>
          ({percentageChange > 0 ? "+" : ""}
          {percentageChange.toFixed(1)}%)
        </span>
      )}
    </div>
  );
}

// Componente para input de série
function SetInput({
  set,
  exercise,
  exerciseId,
  setIndex,
  onComplete,
  disabled,
  isActive,
  studentId,
}: {
  set: ExerciseSet;
  exercise: Exercise;
  exerciseId: string;
  setIndex: number;
  onComplete: (
    exerciseId: string,
    setIndex: number,
    weight: string,
    reps: string
  ) => void;
  disabled: boolean;
  isActive?: boolean;
  studentId?: string | null;
}) {
  const [weight, setWeight] = useState(
    set.weight || exercise.weight?.toString() || ""
  );
  const [reps, setReps] = useState(set.reps || exercise.reps || "");

  const handleComplete = () => {
    if (weight && reps) {
      onComplete(exerciseId, setIndex, weight, reps);
    }
  };

  return (
    <div className="bg-white border border-gray-200 text-gray-900 p-4 rounded-lg min-h-[120px] relative shadow-sm">
      {/* Header com nome do exercício, vídeo e botão concluir */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-gray-900 text-base font-semibold">
            {exercise.name}
          </h3>
          {/* Indicador de mudança de peso */}
          <WeightChangeIndicator
            studentId={studentId ?? null}
            exerciseId={exerciseId}
            currentWeight={weight}
          />
        </div>
        <div className="flex gap-3 items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground hover:text-primary hover:bg-primary/10"
          >
            Vídeo
          </Button>
          {!disabled && (
            <Button
              onClick={handleComplete}
              disabled={!weight || !reps}
              size="sm"
              className="bg-primary hover:bg-primary/90 text-white"
            >
              Concluir
            </Button>
          )}
        </div>
      </div>

      {/* Área principal com os campos */}
      {!disabled && (
        <div className="flex justify-center items-center gap-4 mb-6">
          {/* Peso */}
          <div className="text-center">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Peso
            </label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={exercise.weight?.toString() || "0"}
              className="bg-white border border-gray-300 text-gray-900 text-center text-sm font-medium w-16 h-10"
            />
          </div>

          {/* Série */}
          <div className="text-center">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Série
            </label>
            <div className="bg-gray-100 border border-gray-300 rounded-md p-2 text-sm font-medium w-16 h-10 flex items-center justify-center">
              {setIndex + 1}
            </div>
          </div>

          {/* Repetições */}
          <div className="text-center">
            <label className="block text-xs font-medium text-gray-600 mb-2">
              Repetições
            </label>
            <Input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={exercise.reps || "0"}
              className="bg-white border border-gray-300 text-gray-900 text-center text-sm font-medium w-16 h-10"
            />
          </div>
        </div>
      )}

      {/* Quando série está completa */}
      {disabled && (
        <div className="flex justify-center items-center mb-4">
          <div className="text-center bg-primary/20 border border-primary rounded-lg p-4 w-full">
            <CheckCircle className="h-8 w-8 text-primary mx-auto mb-2" />
            <p className="text-foreground font-semibold text-base">
              Série {setIndex + 1} Completa!
            </p>
            <p className="text-sm text-muted-foreground mt-1">
              {weight}kg × {reps} repetições
            </p>
          </div>
        </div>
      )}

      {/* Timer de descanso removido temporariamente - funcionalidade em desenvolvimento */}

      {/* Footer com descanso e finalizar */}
      <div className="flex justify-between items-center mt-auto">
        <div className="text-left">
          {/* Funções de descanso removidas temporariamente */}
        </div>
      </div>
    </div>
  );
}
