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
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Calendar as CalendarIcon,
  Loader,
  TrendingUp,
  Filter,
} from "lucide-react";
import { format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { Calendar } from "@/components/ui/calendar";

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

const CHART_COLORS = [
  "#3B82F6", // blue
  "#EF4444", // red
  "#10B981", // green
  "#F59E0B", // amber
  "#8B5CF6", // purple
  "#EC4899", // pink
  "#14B8A6", // teal
  "#F97316", // orange
];

export default function ProgressChart({ studentId }: ProgressChartProps) {
  const chartRef = useRef<HTMLCanvasElement>(null);
  const chartInstanceRef = useRef<any>(null);
  const [selectedExerciseIds, setSelectedExerciseIds] = useState<string[]>([]);
  const [chartLoaded, setChartLoaded] = useState(false);
  const [viewMode, setViewMode] = useState<"weekly" | "daily">("weekly");
  const [dateFrom, setDateFrom] = useState<Date | undefined>();
  const [dateTo, setDateTo] = useState<Date | undefined>();
  const [showFilters, setShowFilters] = useState(false);

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
    if (
      progressData &&
      progressData.length > 0 &&
      selectedExerciseIds.length === 0
    ) {
      setSelectedExerciseIds([progressData[0].exerciseId]);
    }
  }, [progressData, selectedExerciseIds.length]);

  // Filtrar dados por data
  const getFilteredData = (exercise: ExerciseProgressData) => {
    let data = exercise.weeklyData;

    if (dateFrom || dateTo) {
      data = data.filter((d) => {
        const itemDate = new Date(d.date);
        if (dateFrom && itemDate < dateFrom) return false;
        if (dateTo && itemDate > dateTo) return false;
        return true;
      });
    }

    return data;
  };

  // Toggle seleção de exercício
  const toggleExercise = (exerciseId: string) => {
    setSelectedExerciseIds((prev) =>
      prev.includes(exerciseId)
        ? prev.filter((id) => id !== exerciseId)
        : [...prev, exerciseId]
    );
  };

  // Selecionar todos os exercícios
  const selectAllExercises = () => {
    if (progressData) {
      setSelectedExerciseIds(progressData.map((ex) => ex.exerciseId));
    }
  };

  // Desselecionar todos
  const deselectAllExercises = () => {
    setSelectedExerciseIds([]);
  };

  // Atualizar o gráfico quando os dados ou filtros mudarem
  useEffect(() => {
    if (
      !chartLoaded ||
      !chartRef.current ||
      !window.Chart ||
      !progressData ||
      selectedExerciseIds.length === 0
    ) {
      return;
    }

    // Destruir gráfico existente
    if (chartInstanceRef.current) {
      chartInstanceRef.current.destroy();
      chartInstanceRef.current = null;
    }

    const selectedExercises = progressData.filter((ex) =>
      selectedExerciseIds.includes(ex.exerciseId)
    );

    if (selectedExercises.length === 0) {
      return;
    }

    const ctx = chartRef.current.getContext("2d");
    if (!ctx) return;

    // Criar datasets para cada exercício selecionado
    const datasets = selectedExercises.map((exercise, index) => {
      const filteredData = getFilteredData(exercise);
      const color = CHART_COLORS[index % CHART_COLORS.length];

      return {
        label: exercise.exerciseName,
        data: filteredData.map((d) => ({
          x:
            viewMode === "daily"
              ? new Date(d.date).toLocaleDateString("pt-BR")
              : d.week,
          y: d.weight,
          previousWeight: d.previousWeight,
          percentageChange: d.percentageChange,
          date: new Date(d.date).toLocaleDateString("pt-BR"),
        })),
        borderColor: color,
        backgroundColor: color + "20",
        tension: 0.4,
        fill: false,
        pointRadius: 6,
        pointHoverRadius: 8,
        pointBackgroundColor: color,
        pointBorderColor: "#fff",
        pointBorderWidth: 2,
      };
    });

    chartInstanceRef.current = new window.Chart(ctx, {
      type: "line",
      data: {
        datasets: datasets,
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        interaction: {
          mode: "index",
          intersect: false,
        },
        plugins: {
          legend: {
            display: true,
            position: "top",
            labels: {
              usePointStyle: true,
              padding: 15,
              font: {
                size: 12,
                weight: "500",
              },
            },
          },
          tooltip: {
            backgroundColor: "rgba(0, 0, 0, 0.8)",
            padding: 12,
            titleFont: {
              size: 14,
              weight: "bold",
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: function (context: any) {
                const dataPoint = context.raw;
                let label = `${context.dataset.label}: ${context.parsed.y} kg`;

                if (dataPoint.previousWeight !== null) {
                  label += `\nAnterior: ${dataPoint.previousWeight} kg`;
                }

                if (dataPoint.percentageChange !== null) {
                  const sign = dataPoint.percentageChange > 0 ? "+" : "";
                  label += `\nMudança: ${sign}${dataPoint.percentageChange.toFixed(
                    1
                  )}%`;
                }

                label += `\nData: ${dataPoint.date}`;

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
              font: {
                size: 13,
                weight: "bold",
              },
            },
            grid: {
              color: "rgba(0, 0, 0, 0.05)",
            },
          },
          x: {
            title: {
              display: true,
              text: viewMode === "daily" ? "Data" : "Semana",
              font: {
                size: 13,
                weight: "bold",
              },
            },
            grid: {
              display: false,
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
  }, [
    chartLoaded,
    progressData,
    selectedExerciseIds,
    viewMode,
    dateFrom,
    dateTo,
  ]);

  if (isLoading) {
    return (
      <Card className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução de Carga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full flex items-center justify-center">
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
          <CardTitle className="text-lg font-semibold text-gray-900 dark:text-gray-100 flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            Evolução de Carga
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-96 w-full flex items-center justify-center">
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
    <Card className="bg-gradient-to-br from-white to-blue-50 dark:from-gray-800 dark:to-gray-900 rounded-xl shadow-lg border border-blue-100 dark:border-gray-700">
      <CardHeader>
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-bold text-gray-900 dark:text-gray-100 flex items-center gap-2">
              <TrendingUp className="h-6 w-6 text-blue-600" />
              Evolução de Carga
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2"
            >
              <Filter className="h-4 w-4" />
              Filtros
            </Button>
          </div>

          {showFilters && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              {/* Modo de visualização */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">
                  Modo de Visualização
                </Label>
                <Select
                  value={viewMode}
                  onValueChange={(v: any) => setViewMode(v)}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="weekly">Por Semana</SelectItem>
                    <SelectItem value="daily">Por Data</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Data inicial */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Inicial</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateFrom
                        ? format(dateFrom, "dd/MM/yyyy")
                        : "Selecione..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateFrom}
                      onSelect={setDateFrom}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Data final */}
              <div className="space-y-2">
                <Label className="text-sm font-medium">Data Final</Label>
                <Popover>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className="w-full justify-start text-left font-normal"
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {dateTo ? format(dateTo, "dd/MM/yyyy") : "Selecione..."}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0">
                    <Calendar
                      mode="single"
                      selected={dateTo}
                      onSelect={setDateTo}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>

              {/* Botões de ação */}
              <div className="md:col-span-3 flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    setDateFrom(undefined);
                    setDateTo(undefined);
                  }}
                >
                  Limpar Datas
                </Button>
              </div>
            </div>
          )}

          {/* Seleção de exercícios */}
          <div className="space-y-3 p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Exercícios</Label>
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={selectAllExercises}
                  className="text-xs"
                >
                  Selecionar Todos
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={deselectAllExercises}
                  className="text-xs"
                >
                  Limpar
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 max-h-48 overflow-y-auto">
              {progressData.map((exercise, index) => (
                <div
                  key={exercise.exerciseId}
                  className="flex items-center space-x-2 p-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700"
                >
                  <Checkbox
                    id={exercise.exerciseId}
                    checked={selectedExerciseIds.includes(exercise.exerciseId)}
                    onCheckedChange={() => toggleExercise(exercise.exerciseId)}
                  />
                  <Label
                    htmlFor={exercise.exerciseId}
                    className="text-sm font-normal cursor-pointer flex items-center gap-2"
                  >
                    <div
                      className="w-3 h-3 rounded-full"
                      style={{
                        backgroundColor:
                          CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                    {exercise.exerciseName}
                  </Label>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="h-96 w-full">
          {selectedExerciseIds.length > 0 ? (
            <canvas
              ref={chartRef}
              className="w-full h-full"
              data-testid="chart-progress"
            />
          ) : (
            <div className="h-full flex items-center justify-center">
              <p className="text-gray-500 dark:text-gray-400">
                Selecione pelo menos um exercício para visualizar o gráfico
              </p>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
