import { useEffect, useRef, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader } from "lucide-react";

declare global {
  interface Window {
    Chart: any;
  }
}

interface ExerciseProgressData {
  exerciseName: string;
  exerciseId: string;
  weeklyData: Array<{
    week: string;
    weekNumber: number;
    year: number;
    weight: number;
    previousWeight: number | null;
    changeType: string | null;
    percentageChange: number | null;
    date: string;
  }>;
}

interface ProgressChartProps {
  studentId: string;
}

export default function ProgressChart({ studentId }: ProgressChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [selectedExerciseId, setSelectedExerciseId] = useState<string>("");
  const [chartLoaded, setChartLoaded] = useState(false);

  const { data: progressData, isLoading } = useQuery<ExerciseProgressData[]>({
    queryKey: ["/api/progress/exercise-weekly", studentId],
    enabled: !!studentId,
  });

  // Load Chart.js dynamically
  useEffect(() => {
    if (!window.Chart) {
      const script = document.createElement("script");
      script.src = "https://cdn.jsdelivr.net/npm/chart.js";
      script.onload = () => setChartLoaded(true);
      document.head.appendChild(script);
    } else {
      setChartLoaded(true);
    }
  }, []);

  // Selecionar o primeiro exercício automaticamente quando os dados carregarem
  useEffect(() => {
    if (progressData && progressData.length > 0 && !selectedExerciseId) {
      setSelectedExerciseId(progressData[0].exerciseId);
    }
  }, [progressData, selectedExerciseId]);

  // Atualizar o gráfico quando os dados ou exercício selecionado mudarem
  useEffect(() => {
    if (
      !chartLoaded ||
      !chartRef.current ||
      !window.Chart ||
      !progressData ||
      !selectedExerciseId
    ) {
      return;
    }

    const selectedExercise = progressData.find(
      (ex) => ex.exerciseId === selectedExerciseId
    );

    // Destruir gráfico existente sempre
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    // Se não há dados para o exercício selecionado, limpar o canvas e retornar
    if (!selectedExercise || selectedExercise.weeklyData.length === 0) {
      const ctx = chartRef.current.getContext("2d");
      if (ctx) {
        ctx.clearRect(0, 0, chartRef.current.width, chartRef.current.height);
        ctx.font = "14px sans-serif";
        ctx.fillStyle = "#9CA3AF";
        ctx.textAlign = "center";
        ctx.fillText(
          "Nenhum dado disponível para este exercício",
          chartRef.current.width / 2,
          chartRef.current.height / 2
        );
      }
      return;
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Preparar dados para o gráfico
    const labels = selectedExercise.weeklyData.map((d) => d.week);
    const weights = selectedExercise.weeklyData.map((d) => d.weight);

    chartInstanceRef.current = new window.Chart(ctx, {
      type: "line",
      data: {
        labels: labels,
        datasets: [
          {
            label: `Carga (kg) - ${selectedExercise.exerciseName}`,
            data: weights,
            borderColor: "#3B82F6",
            backgroundColor: "rgba(59, 130, 246, 0.1)",
            tension: 0.4,
            fill: true,
            pointRadius: 5,
            pointHoverRadius: 7,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: true,
            position: "top",
          },
          tooltip: {
            callbacks: {
              label: function (context: any) {
                const dataPoint =
                  selectedExercise.weeklyData[context.dataIndex];
                let label = `Carga: ${context.parsed.y} kg`;

                if (dataPoint.previousWeight !== null) {
                  label += `\nAnterior: ${dataPoint.previousWeight} kg`;
                }

                if (dataPoint.percentageChange !== null) {
                  const sign = dataPoint.percentageChange > 0 ? "+" : "";
                  label += `\nMudança: ${sign}${dataPoint.percentageChange.toFixed(
                    1
                  )}%`;
                }

                return label;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: "Carga (kg)",
            },
          },
          x: {
            title: {
              display: true,
              text: "Semana",
            },
          },
        },
      },
    });

    return () => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.destroy();
      }
    };
  }, [chartLoaded, progressData, selectedExerciseId]);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Evolução de Carga por Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <Loader
              className="h-8 w-8 animate-spin text-blue-500"
              data-testid="loader-progress"
            />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!progressData || progressData.length === 0) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Evolução de Carga por Semana
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64 w-full flex items-center justify-center">
            <p
              className="text-gray-500 dark:text-gray-400"
              data-testid="text-no-data"
            >
              Nenhum dado de progresso disponível ainda
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100">
            Evolução de Carga por Semana
          </CardTitle>
          <Select
            value={selectedExerciseId}
            onValueChange={setSelectedExerciseId}
          >
            <SelectTrigger className="w-[250px]" data-testid="select-exercise">
              <SelectValue placeholder="Selecione um exercício" />
            </SelectTrigger>
            <SelectContent>
              {progressData.map((exercise) => (
                <SelectItem
                  key={exercise.exerciseId}
                  value={exercise.exerciseId}
                  data-testid={`select-item-${exercise.exerciseId}`}
                >
                  {exercise.exerciseName}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-64 w-full">
          <canvas
            ref={chartRef}
            className="w-full h-full"
            data-testid="chart-progress"
          />
        </div>
      </CardContent>
    </Card>
  );
}
