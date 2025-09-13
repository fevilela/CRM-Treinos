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
  Timer,
  CheckCircle,
  Clock,
  Coffee,
  ChevronDown,
  ChevronUp,
  Square,
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
  isResting?: boolean;
}

interface ExerciseProgress {
  exerciseId: string;
  sets: ExerciseSet[];
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
    <Card className="bg-white border-gray-200">
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
          <div className="mt-1 text-xs text-gray-600 flex items-center justify-center gap-1">
            <div className="w-1.5 h-1.5 bg-primary rounded-full"></div>
            Em andamento
          </div>
        )}
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
  const [currentSetIndex, setCurrentSetIndex] = useState(0);
  const [restTimers, setRestTimers] = useState<
    Record<
      string,
      { startedAt: number; duration: number; autoAdvanced?: boolean }
    >
  >({});
  const [workoutCompleted, setWorkoutCompleted] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Buscar detalhes do treino
  const { data: workout, isLoading: workoutLoading } = useQuery<any>({
    queryKey: [`/api/workouts/${workoutId}`],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/${workoutId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workout: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!workoutId,
  });

  // Buscar exercícios do treino
  const { data: exercises = [], isLoading: exercisesLoading } = useQuery<
    Exercise[]
  >({
    queryKey: [`/api/exercises/${workoutId}`],
    queryFn: async () => {
      const response = await fetch(`/api/exercises/${workoutId}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch exercises: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!workoutId,
    retry: 3,
    retryDelay: 1000,
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

  // Mutation para rastrear mudanças de peso
  const trackWeightChangeMutation = useMutation({
    mutationFn: async (changeData: any) => {
      const response = await fetch("/api/exercise-weight-change", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changeData),
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error("Erro ao rastrear mudança de peso");
      }

      return response.json();
    },
    onSuccess: (data) => {
      // Mostrar notificação visual da mudança de peso
      if (data.hasChange) {
        toast({
          title: `${data.changeSymbol} Mudança de peso detectada!`,
          description: `Peso anterior: ${data.previousWeight}kg → Atual: ${data.weight}kg`,
          variant: "default",
        });
      }
      queryClient.invalidateQueries({ queryKey: ["/api/workout-history"] });
    },
  });

  // Função para avançar para próxima série (lógica simplificada e robusta)
  const advanceToNextSet = () => {
    if (!exercises.length) return;

    // Use um estado combinado para evitar problemas de closure
    setCurrentSetIndex((prevSetIndex) => {
      setCurrentExerciseIndex((prevExerciseIndex) => {
        const currentExercise = exercises[prevExerciseIndex];
        const totalSetsInCurrentExercise = currentExercise?.sets || 3;

        // Se não é a última série do exercício atual
        if (prevSetIndex < totalSetsInCurrentExercise - 1) {
          // Mantém exercício, só avança série
          return prevExerciseIndex;
        }
        // Se é a última série, avançar para o próximo exercício
        else if (prevExerciseIndex < exercises.length - 1) {
          return prevExerciseIndex + 1;
        }

        // Se é o último exercício e última série, não avança
        return prevExerciseIndex;
      });

      // Lógica do setIndex
      const currentExercise = exercises[currentExerciseIndex];
      const totalSetsInCurrentExercise = currentExercise?.sets || 3;

      // Se não é a última série do exercício atual
      if (prevSetIndex < totalSetsInCurrentExercise - 1) {
        return prevSetIndex + 1;
      }
      // Se é a última série, resetar para 0 (próximo exercício)
      else {
        return 0;
      }
    });
  };

  // Função para iniciar timer de descanso para uma série específica
  const startRestTimer = (
    exerciseId: string,
    setIndex: number,
    restTime: number
  ) => {
    const key = `${exerciseId}-${setIndex}`;
    setRestTimers((prev) => ({
      ...prev,
      [key]: {
        startedAt: Date.now(),
        duration: restTime,
      },
    }));
  };

  // Função para parar timer de descanso
  const stopRestTimer = (exerciseId: string, setIndex: number) => {
    const key = `${exerciseId}-${setIndex}`;
    setRestTimers((prev) => {
      const updated = { ...prev };
      delete updated[key];
      return updated;
    });
  };

  // Função para calcular tempo restante do timer (sem side effects)
  const getTimeLeft = (key: string) => {
    const timer = restTimers[key];
    if (!timer) return 0;

    const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
    return Math.max(0, timer.duration - elapsed);
  };

  // Timer global que atualiza todos os timers de descanso e faz auto-advance
  useEffect(() => {
    if (Object.keys(restTimers).length === 0) return;

    const interval = setInterval(() => {
      setRestTimers((prevTimers) => {
        const updatedTimers = { ...prevTimers };
        let shouldAdvance = false;
        let advanceKey = "";

        // Verificar cada timer
        Object.keys(updatedTimers).forEach((key) => {
          const timer = updatedTimers[key];
          if (!timer) return;

          const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
          const timeLeft = Math.max(0, timer.duration - elapsed);

          // Se o tempo acabou e ainda não fez auto-advance
          if (timeLeft === 0 && !timer.autoAdvanced) {
            // Verificar se a série está realmente completa antes de avançar
            const [exerciseId, setIndexStr] = key.split("-");
            const setIndex = parseInt(setIndexStr);
            const progress = exerciseProgress[exerciseId];
            const currentSet = progress?.sets[setIndex];

            // Só avança se a série estiver marcada como completa
            if (currentSet?.completed) {
              timer.autoAdvanced = true; // Marcar como processado
              shouldAdvance = true;
              advanceKey = key;
            }
          }
        });

        // Executar auto-advance fora do loop se necessário
        if (shouldAdvance) {
          const [exerciseId, setIndex] = advanceKey.split("-");

          // Cleanup timer
          delete updatedTimers[advanceKey];

          // Schedule advance for next tick to avoid state update during render
          setTimeout(() => {
            advanceToNextSet();
            toast({
              title: "Descanso concluído!",
              description: "Próxima série liberada automaticamente.",
            });
          }, 50);
        }

        return updatedTimers;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimers, advanceToNextSet, toast]);

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
      description: "Boa sorte no seu treino!",
    });
  };

  const completeSet = (
    exerciseId: string,
    setIndex: number,
    weight: string,
    reps: string
  ) => {
    const exercise = exercises.find((e) => e.id === exerciseId);

    // Rastrear mudança de peso quando série é completada
    if (student?.id && exercise && weight) {
      trackWeightChangeMutation.mutate({
        studentId: student.id,
        exerciseId,
        exerciseName: exercise.name,
        sets: exercise.sets || 3,
        reps,
        currentWeight: weight,
        workoutSessionId: null, // Será definido quando o treino for salvo
        comments: null,
      });
    }

    setExerciseProgress((prev) => {
      const updated = { ...prev };
      updated[exerciseId].sets[setIndex] = {
        ...updated[exerciseId].sets[setIndex],
        weight,
        reps,
        completed: true,
      };

      // Check if all sets for this exercise are completed
      const allSetsCompleted = updated[exerciseId].sets.every(
        (set) => set.completed
      );
      if (allSetsCompleted) {
        updated[exerciseId].completed = true;
      }

      return updated;
    });

    toast({
      title: "Série concluída!",
      description: `Série ${setIndex + 1} do ${exercise?.name} foi registrada.`,
    });

    // Verificar se é a última série do último exercício
    const isLastExercise = currentExerciseIndex === exercises.length - 1;
    const totalSetsInCurrentExercise = exercise?.sets || 3;
    const isLastSetOfExercise = setIndex === totalSetsInCurrentExercise - 1;

    if (isLastExercise && isLastSetOfExercise) {
      // Workout completado - não iniciar descanso nem avançar
      return;
    }

    // Iniciar timer de descanso se não for a última série
    if (exercise?.restTime && !isLastSetOfExercise) {
      startRestTimer(exerciseId, setIndex, exercise.restTime);
    } else {
      // Se não tem descanso, avançar imediatamente
      advanceToNextSet();
    }
  };

  const completeWorkout = async () => {
    // Salvar dados do treino
    const workoutData = {
      studentId: student.id,
      workoutId,
      duration: workoutDuration,
      exercises: Object.values(exerciseProgress).map((progress) => ({
        exerciseId: progress.exerciseId,
        sets: progress.sets,
      })),
    };

    try {
      await saveWorkoutSessionMutation.mutateAsync(workoutData);
      setWorkoutCompleted(true);
    } catch (error) {
      console.error("Error completing workout:", error);
      toast({
        title: "Erro",
        description: "Erro ao finalizar treino. Tente novamente.",
        variant: "destructive",
      });
    }
  };

  if (exercisesLoading || workoutLoading) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <div className="text-center py-6">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (workoutCompleted) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="text-center py-6">
          <CardHeader>
            <CheckCircle className="h-10 w-10 text-primary mx-auto mb-3" />
            <CardTitle className="text-lg">Parabéns!</CardTitle>
            <CardDescription>
              Você concluiu seu treino com sucesso!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack}>Voltar ao Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-4 max-w-4xl space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={onBack}
          className="flex items-center gap-2"
        >
          <ArrowLeft className="h-4 w-4" />
          Voltar
        </Button>
        <h1 className="text-lg font-semibold">{workout?.name || "Treino"}</h1>
        <div></div>
      </div>

      {/* Timer Principal */}
      <WorkoutMainTimer
        isActive={workoutStarted && !workoutCompleted}
        onTimeUpdate={setWorkoutDuration}
      />

      {/* Botão Iniciar Treino */}
      {!workoutStarted && (
        <Card>
          <CardContent className="text-center py-6">
            <Button onClick={startWorkout} className="flex items-center gap-2">
              <Play className="h-5 w-5" />
              Iniciar Treino
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Interface Minimalista - Uma Série por Vez */}
      {workoutStarted && exercises.length > 0 && (
        <div className="space-y-6">
          {/* Indicador de Progresso */}
          <Card className="bg-white border-gray-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-base font-medium text-gray-900">
                    Exercício {currentExerciseIndex + 1} de {exercises.length}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {exercises[currentExerciseIndex]?.name}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-base font-medium text-gray-900">
                    Série {currentSetIndex + 1} de{" "}
                    {exercises[currentExerciseIndex]?.sets || 3}
                  </h3>
                  <p className="text-sm text-gray-600">
                    {exercises[currentExerciseIndex]?.weight &&
                      `${exercises[currentExerciseIndex].weight}kg • `}
                    {exercises[currentExerciseIndex]?.reps} reps
                    {exercises[currentExerciseIndex]?.restTime &&
                      ` • ${exercises[currentExerciseIndex].restTime}s rest`}
                  </p>
                </div>
              </div>

              {/* Barra de Progresso Geral */}
              <div className="mt-4">
                {(() => {
                  // Calcular total de séries e séries completadas de forma precisa
                  const totalSets = exercises.reduce(
                    (sum, ex) => sum + (ex.sets || 3),
                    0
                  );
                  const completedSets =
                    exercises
                      .slice(0, currentExerciseIndex)
                      .reduce((sum, ex) => sum + (ex.sets || 3), 0) +
                    currentSetIndex;
                  const progressPercentage =
                    totalSets > 0
                      ? Math.round((completedSets / totalSets) * 100)
                      : 0;

                  return (
                    <>
                      <div className="flex justify-between text-xs text-gray-600 mb-1">
                        <span>Progresso do Treino</span>
                        <span>{progressPercentage}%</span>
                      </div>
                      <Progress value={progressPercentage} className="h-2" />
                    </>
                  );
                })()}
              </div>
            </CardContent>
          </Card>

          {/* Série Atual */}
          {(() => {
            const currentExercise = exercises[currentExerciseIndex];
            const progress = exerciseProgress[currentExercise?.id];
            const currentSet = progress?.sets[currentSetIndex];

            if (!currentExercise || !progress || !currentSet) return null;

            return (
              <Card className="bg-white border border-gray-200">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-base text-gray-900">
                    {currentExercise.name}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    Série {currentSet.setNumber}
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <SetInput
                    set={currentSet}
                    exercise={currentExercise}
                    exerciseId={currentExercise.id}
                    setIndex={currentSetIndex}
                    onComplete={completeSet}
                    disabled={currentSet.completed}
                    restTimeLeft={getTimeLeft(
                      `${currentExercise.id}-${currentSetIndex}`
                    )}
                    studentId={student?.id || null}
                    onStartRest={() =>
                      startRestTimer(
                        currentExercise.id,
                        currentSetIndex,
                        currentExercise.restTime || 60
                      )
                    }
                    onStopRest={() => {
                      stopRestTimer(currentExercise.id, currentSetIndex);
                      advanceToNextSet();
                    }}
                  />
                </CardContent>
              </Card>
            );
          })()}
        </div>
      )}

      {/* Botão Finalizar Treino - só aparece quando TODOS os exercícios estão completos */}
      {workoutStarted &&
        Object.values(exerciseProgress).length > 0 &&
        Object.values(exerciseProgress).every((p) => p.completed) && (
          <Card className="bg-white border-gray-200">
            <CardContent className="text-center py-6">
              <Button
                onClick={completeWorkout}
                variant="default"
                className="bg-primary hover:bg-primary/90 text-white"
              >
                <CheckCircle className="h-5 w-5 mr-2" />
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
  restTimeLeft,
  onStartRest,
  onStopRest,
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
  restTimeLeft?: number;
  onStartRest: () => void;
  onStopRest: () => void;
  studentId: string | null;
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
    <div className="bg-white border border-gray-200 text-gray-900 p-4 rounded-lg min-h-[120px] relative">
      {/* Header com nome do exercício, vídeo e botão concluir */}
      <div className="flex justify-between items-start mb-4">
        <div className="flex flex-col gap-2">
          <h3 className="text-gray-900 text-base font-semibold">
            {exercise.name}
          </h3>
          {/* Indicador de mudança de peso */}
          {weight && (
            <WeightChangeIndicator
              studentId={studentId}
              exerciseId={exerciseId}
              currentWeight={weight}
            />
          )}
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
              placeholder={exercise.weight?.toString() || "20"}
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
              placeholder={exercise.reps || "12-15"}
              className="bg-white border border-gray-300 text-gray-900 text-center text-sm font-medium w-16 h-10"
            />
          </div>
        </div>
      )}

      {/* Quando série está completa */}
      {disabled && (
        <div className="flex justify-center items-center mb-4">
          <div className="text-center border border-gray-200 rounded-lg p-3 w-full bg-gray-50">
            <CheckCircle className="h-5 w-5 text-primary mx-auto mb-1" />
            <p className="text-gray-900 font-medium text-sm">
              Série {setIndex + 1} Completa
            </p>
            {weight && reps && (
              <p className="text-xs text-gray-600 mt-1">
                {weight}kg × {reps} repetições
              </p>
            )}
          </div>
        </div>
      )}

      {/* Timer de descanso ativo */}
      {restTimeLeft && restTimeLeft > 0 && (
        <div className="mb-4">
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 text-center">
            <div className="flex items-center justify-center gap-2 mb-1">
              <Coffee className="h-4 w-4 text-orange-600" />
              <span className="text-gray-900 font-medium text-sm">
                Descanso
              </span>
            </div>
            <div className="text-base font-mono font-semibold text-orange-600 mb-2">
              {Math.floor(restTimeLeft / 60)}:
              {(restTimeLeft % 60).toString().padStart(2, "0")}
            </div>
            <Progress
              value={
                (((exercise.restTime || 60) - restTimeLeft) /
                  (exercise.restTime || 60)) *
                100
              }
              className="h-1 max-w-xs mx-auto"
            />
          </div>
        </div>
      )}

      {/* Footer com descanso */}
      <div className="flex justify-start items-center mt-auto">
        <div className="text-left">
          {/* Botão de descanso */}
          {disabled &&
            exercise.restTime &&
            (!restTimeLeft || restTimeLeft === 0) && (
              <Button
                variant="ghost"
                onClick={onStartRest}
                className="text-primary hover:text-primary/80 hover:bg-primary/10 px-0"
              >
                <Coffee className="h-4 w-4 mr-2" />
                Descanso
              </Button>
            )}

          {/* Timer de descanso ativo */}
          {restTimeLeft && restTimeLeft > 0 && (
            <Button
              variant="ghost"
              onClick={onStopRest}
              className="text-primary hover:text-primary/80 hover:bg-primary/10 px-0"
            >
              <Square className="h-4 w-4 mr-2" />
              Parar Descanso
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
