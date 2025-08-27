import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Play, Pause, Square, Timer } from "lucide-react";

interface WorkoutTimerProps {
  isActive: boolean;
  onStart: () => void;
  onPause: () => void;
  onStop: () => void;
  onTimeUpdate: (seconds: number) => void;
}

export function WorkoutTimer({
  isActive,
  onStart,
  onPause,
  onStop,
  onTimeUpdate,
}: WorkoutTimerProps) {
  const [seconds, setSeconds] = useState(0);
  const [isRunning, setIsRunning] = useState(false);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isRunning && isActive) {
      interval = setInterval(() => {
        setSeconds((prevSeconds) => {
          const newSeconds = prevSeconds + 1;
          onTimeUpdate(newSeconds);
          return newSeconds;
        });
      }, 1000);
    }

    return () => clearInterval(interval);
  }, [isRunning, isActive, onTimeUpdate]);

  const formatTime = (totalSeconds: number) => {
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const secs = totalSeconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, "0")}:${minutes
        .toString()
        .padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
    }
    return `${minutes.toString().padStart(2, "0")}:${secs
      .toString()
      .padStart(2, "0")}`;
  };

  const handleStart = () => {
    setIsRunning(true);
    onStart();
  };

  const handlePause = () => {
    setIsRunning(false);
    onPause();
  };

  const handleStop = () => {
    setIsRunning(false);
    setSeconds(0);
    onStop();
  };

  return (
    <Card className="sticky top-4 z-10 bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Timer className="h-5 w-5 text-blue-600" />
          Cronômetro do Treino
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-center justify-between">
          <div className="text-3xl font-mono font-bold text-blue-600">
            {formatTime(seconds)}
          </div>

          <div className="flex gap-2">
            {!isRunning ? (
              <Button
                onClick={handleStart}
                size="sm"
                className="bg-green-600 hover:bg-green-700"
                data-testid="button-start-timer"
              >
                <Play className="h-4 w-4 mr-1" />
                Iniciar
              </Button>
            ) : (
              <Button
                onClick={handlePause}
                size="sm"
                variant="outline"
                data-testid="button-pause-timer"
              >
                <Pause className="h-4 w-4 mr-1" />
                Pausar
              </Button>
            )}

            <Button
              onClick={handleStop}
              size="sm"
              variant="destructive"
              data-testid="button-stop-timer"
            >
              <Square className="h-4 w-4 mr-1" />
              Parar
            </Button>
          </div>
        </div>

        {isRunning && (
          <div className="mt-2 text-sm text-green-600 flex items-center gap-1">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            Treino em andamento
          </div>
        )}
      </CardContent>
    </Card>
  );
}
