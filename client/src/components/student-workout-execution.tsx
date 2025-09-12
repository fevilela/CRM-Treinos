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
  const [expandedExercises, setExpandedExercises] = useState<Set<string>>(
    new Set()
  );
  const [restTimers, setRestTimers] = useState<
    Record<string, { startedAt: number; duration: number }>
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

  // Função para expandir/colapsar exercícios
  const toggleExerciseExpansion = (exerciseId: string) => {
    const newExpanded = new Set(expandedExercises);
    if (newExpanded.has(exerciseId)) {
      newExpanded.delete(exerciseId);
    } else {
      newExpanded.add(exerciseId);
    }
    setExpandedExercises(newExpanded);
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

  // Função para calcular tempo restante do timer
  const getTimeLeft = (key: string) => {
    const timer = restTimers[key];
    if (!timer) return 0;

    const elapsed = Math.floor((Date.now() - timer.startedAt) / 1000);
    const timeLeft = Math.max(0, timer.duration - elapsed);

    // Auto-remove timer quando chegar a 0
    if (timeLeft === 0) {
      const [exerciseId, setIndex] = key.split("-");
      setTimeout(() => stopRestTimer(exerciseId, parseInt(setIndex)), 100);
    }

    return timeLeft;
  };

  // Timer global que atualiza todos os timers de descanso
  useEffect(() => {
    if (Object.keys(restTimers).length === 0) return;

    const interval = setInterval(() => {
      setRestTimers((prev) => ({ ...prev })); // Force re-render to update timers
    }, 1000);

    return () => clearInterval(interval);
  }, [restTimers]);

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

      // Expandir todos os exercícios por padrão
      const allExerciseIds = new Set(exercises.map((ex) => ex.id));
      setExpandedExercises(allExerciseIds);
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

    // Iniciar timer de descanso se não for a última série do exercício
    const totalSets = exercise?.sets || 3;
    if (setIndex < totalSets - 1 && exercise?.restTime) {
      startRestTimer(exerciseId, setIndex, exercise.restTime);
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

      {/* Lista de Exercícios */}
      <div className="space-y-4">
        {exercises.map((exercise, index) => {
          const progress = exerciseProgress[exercise.id];
          const isExpanded = expandedExercises.has(exercise.id);

          if (!progress) return null;

          const completedSets = progress.sets.filter(
            (set) => set.completed
          ).length;
          const totalSets = progress.sets.length;

          return (
            <Card
              key={exercise.id}
              className={`${
                progress.completed ? "bg-green-50 border-green-200" : ""
              }`}
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {progress.completed ? (
                      <CheckCircle className="h-5 w-5 text-green-600" />
                    ) : (
                      <Clock className="h-5 w-5 text-blue-600" />
                    )}
                    <div>
                      <CardTitle className="text-lg">{exercise.name}</CardTitle>
                      <CardDescription>
                        {exercise.sets} × {exercise.reps} reps
                        {exercise.weight && ` • ${exercise.weight}kg`}
                        {exercise.restTime &&
                          ` • ${exercise.restTime}s descanso`}
                      </CardDescription>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">
                      {completedSets}/{totalSets} séries
                    </Badge>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => toggleExerciseExpansion(exercise.id)}
                    >
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4" />
                      ) : (
                        <ChevronDown className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </div>
              </CardHeader>

              {isExpanded && workoutStarted && (
                <CardContent>
                  <div className="space-y-4">
                    {progress.sets.map((set, setIndex) => (
                      <SetInput
                        key={setIndex}
                        set={set}
                        exercise={exercise}
                        exerciseId={exercise.id}
                        setIndex={setIndex}
                        onComplete={completeSet}
                        disabled={set.completed}
                        restTimeLeft={getTimeLeft(`${exercise.id}-${setIndex}`)}
                        onStartRest={() =>
                          startRestTimer(
                            exercise.id,
                            setIndex,
                            exercise.restTime || 60
                          )
                        }
                        onStopRest={() => stopRestTimer(exercise.id, setIndex)}
                      />
                    ))}
                  </div>
                </CardContent>
              )}
            </Card>
          );
        })}
      </div>

      {/* Botão Finalizar Treino */}
      {workoutStarted &&
        Object.values(exerciseProgress).some((p) => p.completed) && (
          <Card>
            <CardContent className="text-center py-6">
              <Button onClick={completeWorkout} size="lg" variant="default">
                <Square className="h-5 w-5 mr-2" />
                Finalizar Treino
              </Button>
            </CardContent>
          </Card>
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
    <Card
      className={
        disabled ? "bg-green-50 border-green-200" : "bg-blue-50 border-blue-200"
      }
    >
      <CardContent className="p-4">
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h4 className="font-medium">Série {set.setNumber}</h4>
            {disabled && <CheckCircle className="h-4 w-4 text-green-600" />}
          </div>

          {!disabled && (
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Peso (kg)
                </label>
                <Input
                  type="number"
                  value={weight}
                  onChange={(e) => setWeight(e.target.value)}
                  placeholder={exercise.weight?.toString() || "0"}
                />
              </div>
              <div>
                <label className="text-sm font-medium text-gray-700">
                  Repetições
                </label>
                <Input
                  value={reps}
                  onChange={(e) => setReps(e.target.value)}
                  placeholder={exercise.reps || "0"}
                />
              </div>
            </div>
          )}

          {disabled && (
            <div className="text-sm text-gray-600">
              <strong>Realizado:</strong> {set.weight}kg × {set.reps} reps
            </div>
          )}

          {/* Timer de descanso */}
          {restTimeLeft && restTimeLeft > 0 && (
            <div className="bg-orange-100 border border-orange-200 rounded-lg p-3 text-center">
              <div className="flex items-center justify-center gap-2 mb-2">
                <Coffee className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium text-orange-700">
                  Descansando
                </span>
              </div>
              <div className="text-lg font-mono font-bold text-orange-600 mb-2">
                {Math.floor(restTimeLeft / 60)}:
                {(restTimeLeft % 60).toString().padStart(2, "0")}
              </div>
              <Progress
                value={
                  (((exercise.restTime || 60) - restTimeLeft) /
                    (exercise.restTime || 60)) *
                  100
                }
                className="h-2"
              />
              {restTimeLeft === 0 && (
                <div className="text-sm text-orange-600 mt-1">
                  Descanso concluído!
                </div>
              )}
            </div>
          )}

          <div className="flex gap-2">
            {!disabled && (
              <Button
                onClick={handleComplete}
                disabled={!weight || !reps}
                className="flex-1"
              >
                <CheckCircle className="h-4 w-4 mr-2" />
                Concluir Série
              </Button>
            )}

            {!disabled &&
              exercise.restTime &&
              (!restTimeLeft || restTimeLeft === 0) && (
                <Button
                  variant="outline"
                  onClick={onStartRest}
                  className="flex items-center gap-2"
                >
                  <Coffee className="h-4 w-4" />
                  Descanso ({exercise.restTime}s)
                </Button>
              )}

            {restTimeLeft && restTimeLeft > 0 && (
              <Button
                variant="outline"
                onClick={onStopRest}
                className="flex items-center gap-2"
              >
                <Square className="h-4 w-4" />
                Parar Descanso
              </Button>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
