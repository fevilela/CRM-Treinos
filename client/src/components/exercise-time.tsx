import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Play, Pause, RotateCcw, Timer } from "lucide-react";

interface ExerciseTimerProps {
  exerciseName: string;
  restTimeSeconds?: number;
  onTimeUpdate?: (exerciseTime: number, restTime: number) => void;
}

export function ExerciseTimer({
  exerciseName,
  restTimeSeconds = 60,
  onTimeUpdate,
}: ExerciseTimerProps) {
  const [exerciseTime, setExerciseTime] = useState(0);
  const [restTime, setRestTime] = useState(0);
  const [isExerciseRunning, setIsExerciseRunning] = useState(false);
  const [isRestRunning, setIsRestRunning] = useState(false);
  const [mode, setMode] = useState<"exercise" | "rest">("exercise");

  const exerciseIntervalRef = useRef<NodeJS.Timeout>();
  const restIntervalRef = useRef<NodeJS.Timeout>();

  // Timer para o exercício
  useEffect(() => {
    if (isExerciseRunning && mode === "exercise") {
      exerciseIntervalRef.current = setInterval(() => {
        setExerciseTime((prev) => {
          const newTime = prev + 1;
          onTimeUpdate?.(newTime, restTime);
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(exerciseIntervalRef.current);
    }

    return () => clearInterval(exerciseIntervalRef.current);
  }, [isExerciseRunning, mode, restTime, onTimeUpdate]);

  // Timer para o descanso
  useEffect(() => {
    if (isRestRunning && mode === "rest") {
      restIntervalRef.current = setInterval(() => {
        setRestTime((prev) => {
          if (prev <= 1) {
            setIsRestRunning(false);
            setMode("exercise");
            setRestTime(0);
            // Notificar que o descanso acabou
            if (
              "Notification" in window &&
              Notification.permission === "granted"
            ) {
              new Notification("Descanso finalizado!", {
                body: "Hora de continuar o exercício.",
                icon: "/favicon.ico",
              });
            }
            return 0;
          }
          const newTime = prev - 1;
          onTimeUpdate?.(exerciseTime, restTimeSeconds - newTime);
          return newTime;
        });
      }, 1000);
    } else {
      clearInterval(restIntervalRef.current);
    }

    return () => clearInterval(restIntervalRef.current);
  }, [isRestRunning, mode, exerciseTime, restTimeSeconds, onTimeUpdate]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const startExercise = () => {
    setIsExerciseRunning(true);
    setIsRestRunning(false);
    setMode("exercise");
  };

  const pauseExercise = () => {
    setIsExerciseRunning(false);
  };

  const startRest = () => {
    setIsExerciseRunning(false);
    setIsRestRunning(true);
    setMode("rest");
    setRestTime(restTimeSeconds);

    // Solicitar permissão para notificações
    if ("Notification" in window && Notification.permission === "default") {
      Notification.requestPermission();
    }
  };

  const resetTimers = () => {
    setIsExerciseRunning(false);
    setIsRestRunning(false);
    setExerciseTime(0);
    setRestTime(0);
    setMode("exercise");
    onTimeUpdate?.(0, 0);
  };

  return (
    <Card className="p-4">
      <div className="flex items-center gap-2 mb-3">
        <Timer className="h-5 w-5 text-blue-600" />
        <h3 className="font-semibold">{exerciseName}</h3>
      </div>

      <div className="space-y-3">
        {/* Timer do exercício */}
        <div className="flex items-center justify-between">
          <span className="text-sm font-medium">Tempo do exercício:</span>
          <span
            className={`text-lg font-mono ${
              isExerciseRunning ? "text-green-600" : "text-gray-600"
            }`}
          >
            {formatTime(exerciseTime)}
          </span>
        </div>

        {/* Timer de descanso */}
        {mode === "rest" && (
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium">Descanso:</span>
            <span className="text-lg font-mono text-orange-600">
              {formatTime(restTime)}
            </span>
          </div>
        )}

        {/* Controles */}
        <div className="flex gap-2">
          {mode === "exercise" && (
            <>
              <Button
                size="sm"
                onClick={isExerciseRunning ? pauseExercise : startExercise}
                className="flex-1"
                data-testid="button-exercise-timer"
              >
                {isExerciseRunning ? (
                  <>
                    <Pause className="h-4 w-4 mr-1" />
                    Pausar
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-1" />
                    Iniciar
                  </>
                )}
              </Button>

              <Button
                size="sm"
                variant="outline"
                onClick={startRest}
                disabled={!isExerciseRunning && exerciseTime === 0}
                data-testid="button-rest-timer"
              >
                Descanso
              </Button>
            </>
          )}

          {mode === "rest" && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => {
                setIsRestRunning(false);
                setMode("exercise");
                setRestTime(0);
              }}
              className="flex-1"
              data-testid="button-skip-rest"
            >
              Pular descanso
            </Button>
          )}

          <Button
            size="sm"
            variant="ghost"
            onClick={resetTimers}
            data-testid="button-reset-timer"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
        </div>

        {/* Indicador de progresso do descanso */}
        {mode === "rest" && restTimeSeconds > 0 && (
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-orange-600 h-2 rounded-full transition-all duration-1000"
              style={{
                width: `${
                  ((restTimeSeconds - restTime) / restTimeSeconds) * 100
                }%`,
              }}
            ></div>
          </div>
        )}
      </div>
    </Card>
  );
}
