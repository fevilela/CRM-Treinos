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
    <Card className="sticky top-4 z-10 bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Timer className="h-5 w-5 text-green-600" />
          Tempo Total do Treino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="text-4xl font-mono font-bold text-green-600 text-center">
          {formatTime(seconds)}
        </div>
        {isActive && (
          <div className="mt-2 text-sm text-green-600 flex items-center justify-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Treino em andamento
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
          variant: data.changeType === "increase" ? "default" : "destructive",
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
        <div className="text-center py-8">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
          <p className="mt-2">Carregando treino...</p>
        </div>
      </div>
    );
  }

  if (workoutCompleted) {
    return (
      <div className="container mx-auto p-4 max-w-4xl">
        <Card className="text-center py-8">
          <CardHeader>
            <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
            <CardTitle className="text-2xl">Parabéns!</CardTitle>
            <CardDescription>
              Você concluiu seu treino com sucesso!
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onBack} size="lg">
              Voltar ao Dashboard
            </Button>
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
        <h1 className="text-xl font-bold">{workout?.name || "Treino"}</h1>
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
          <CardContent className="text-center py-8">
            <Button
              onClick={startWorkout}
              size="lg"
              className="flex items-center gap-2"
            >
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
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="py-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-blue-900">
                    Exercício {currentExerciseIndex + 1} de {exercises.length}
                  </h3>
                  <p className="text-sm text-blue-600">
                    {exercises[currentExerciseIndex]?.name}
                  </p>
                </div>
                <div className="text-right">
                  <h3 className="text-lg font-semibold text-blue-900">
                    Série {currentSetIndex + 1} de{" "}
                    {exercises[currentExerciseIndex]?.sets || 3}
                  </h3>
                  <p className="text-sm text-blue-600">
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
                      <div className="flex justify-between text-xs text-blue-600 mb-1">
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
              <Card className="bg-white shadow-lg border-2 border-gray-200">
                <CardHeader className="text-center pb-6">
                  <CardTitle className="text-2xl text-gray-800">
                    {currentExercise.name}
                  </CardTitle>
                  <CardDescription className="text-lg">
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
          <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
            <CardContent className="text-center py-6">
              <Button
                onClick={completeWorkout}
                size="lg"
                variant="default"
                className="bg-green-600 hover:bg-green-700"
              >
                <Square className="h-5 w-5 mr-2" />
                Finalizar Treino Completo
              </Button>
              <p className="text-sm text-green-600 mt-2">
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
        return { symbol: "↗", color: "text-green-400", bg: "bg-green-600/20" };
      case "decrease":
        return { symbol: "↘", color: "text-red-400", bg: "bg-red-600/20" };
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
    <div className="bg-black text-white p-6 rounded-lg min-h-[200px] relative">
      {/* Header com nome do exercício, vídeo e botão concluir */}
      <div className="flex justify-between items-start mb-8">
        <div className="flex flex-col gap-2">
          <h3 className="text-red-500 text-lg font-bold">{exercise.name}</h3>
          {/* Indicador de mudança de peso */}
          <WeightChangeIndicator
            studentId={studentId}
            exerciseId={exerciseId}
            currentWeight={weight}
          />
        </div>
        <div className="flex gap-3 items-center">
          <Button
            variant="ghost"
            size="sm"
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10"
          >
            Vídeo
          </Button>
          {!disabled && (
            <Button
              onClick={handleComplete}
              disabled={!weight || !reps}
              size="sm"
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Concluir
            </Button>
          )}
        </div>
      </div>

      {/* Área principal com os campos */}
      {!disabled && (
        <div className="flex justify-center items-center gap-8 mb-8">
          {/* Peso */}
          <div className="text-center">
            <label className="block text-sm mb-2">Peso</label>
            <Input
              type="number"
              value={weight}
              onChange={(e) => setWeight(e.target.value)}
              placeholder={exercise.weight?.toString() || "0"}
              className="bg-gray-800 border-gray-600 text-white text-center text-xl font-bold w-20 h-12"
            />
          </div>

          {/* Série */}
          <div className="text-center">
            <label className="block text-sm mb-2">Série</label>
            <div className="bg-gray-800 border border-gray-600 rounded-md p-3 text-xl font-bold w-20 h-12 flex items-center justify-center">
              {setIndex + 1}
            </div>
          </div>

          {/* Repetições */}
          <div className="text-center">
            <label className="block text-sm mb-2">Repetições</label>
            <Input
              value={reps}
              onChange={(e) => setReps(e.target.value)}
              placeholder={exercise.reps || "0"}
              className="bg-gray-800 border-gray-600 text-white text-center text-xl font-bold w-20 h-12"
            />
          </div>
        </div>
      )}

      {/* Quando série está completa */}
      {disabled && (
        <div className="flex justify-center items-center mb-8">
          <div className="text-center bg-green-600/20 border border-green-500 rounded-lg p-6 w-full">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-green-300 font-semibold text-lg">
              Série {setIndex + 1} Completa!
            </p>
            <p className="text-sm text-green-400 mt-1">
              {weight}kg × {reps} repetições
            </p>
          </div>
        </div>
      )}

      {/* Timer de descanso ativo - versão compacta no layout escuro */}
      {restTimeLeft && restTimeLeft > 0 && (
        <div className="mb-8">
          <div className="bg-orange-600/20 border border-orange-500 rounded-lg p-4 text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Coffee className="h-5 w-5 text-orange-400" />
              <span className="text-orange-300 font-semibold">Descanso</span>
            </div>
            <div className="text-2xl font-mono font-bold text-orange-400 mb-2">
              {Math.floor(restTimeLeft / 60)}:
              {(restTimeLeft % 60).toString().padStart(2, "0")}
            </div>
            <Progress
              value={
                (((exercise.restTime || 60) - restTimeLeft) /
                  (exercise.restTime || 60)) *
                100
              }
              className="h-2 max-w-xs mx-auto"
            />
          </div>
        </div>
      )}

      {/* Footer com descanso e finalizar */}
      <div className="flex justify-between items-center mt-auto">
        <div className="text-left">
          {/* Botão de descanso */}
          {disabled &&
            exercise.restTime &&
            (!restTimeLeft || restTimeLeft === 0) && (
              <Button
                variant="ghost"
                onClick={onStartRest}
                className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-0"
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
              className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-0"
            >
              <Square className="h-4 w-4 mr-2" />
              Parar Descanso
            </Button>
          )}
        </div>

        <div className="text-right">
          {/* Botão Finalizar - sempre visível no canto inferior direito */}
          <Button
            variant="ghost"
            className="text-red-500 hover:text-red-400 hover:bg-red-500/10 px-0"
          >
            Finalizar
          </Button>
        </div>
      </div>
    </div>
  );
}
