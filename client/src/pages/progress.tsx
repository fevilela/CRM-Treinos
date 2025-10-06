import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CalendarDays, TrendingUp, TrendingDown, Minus } from "lucide-react";

// Dados mockados para exemplo
const mockBodyMeasurements = [
  {
    date: "2024-01-01",
    weight: 75.5,
    bodyFat: 18.2,
    leanMass: 61.8,
    chest: 98,
    waist: 82,
    hips: 95,
    arms: 35,
    thighs: 58,
    calves: 36,
  },
  {
    date: "2024-02-01",
    weight: 74.8,
    bodyFat: 17.5,
    leanMass: 61.7,
    chest: 99,
    waist: 80,
    hips: 94,
    arms: 36,
    thighs: 59,
    calves: 36,
  },
  {
    date: "2024-03-01",
    weight: 74.2,
    bodyFat: 16.8,
    leanMass: 61.7,
    chest: 100,
    waist: 78,
    hips: 93,
    arms: 37,
    thighs: 60,
    calves: 37,
  },
  {
    date: "2024-04-01",
    weight: 73.8,
    bodyFat: 16.2,
    leanMass: 61.8,
    chest: 101,
    waist: 76,
    hips: 92,
    arms: 38,
    thighs: 61,
    calves: 37,
  },
];

const mockPerformance = [
  {
    date: "2024-01-01",
    benchPress: 80,
    squat: 100,
    deadlift: 120,
    pullUps: 8,
    pushUps: 35,
  },
  {
    date: "2024-02-01",
    benchPress: 85,
    squat: 105,
    deadlift: 125,
    pullUps: 10,
    pushUps: 40,
  },
  {
    date: "2024-03-01",
    benchPress: 87,
    squat: 110,
    deadlift: 130,
    pullUps: 12,
    pushUps: 42,
  },
  {
    date: "2024-04-01",
    benchPress: 90,
    squat: 115,
    deadlift: 135,
    pullUps: 14,
    pushUps: 45,
  },
];

const mockHealth = [
  {
    date: "2024-01-01",
    restingHR: 68,
    bloodPressure: "120/80",
    energy: 7,
    sleep: 7.5,
  },
  {
    date: "2024-02-01",
    restingHR: 65,
    bloodPressure: "118/78",
    energy: 8,
    sleep: 8.0,
  },
  {
    date: "2024-03-01",
    restingHR: 63,
    bloodPressure: "115/75",
    energy: 8,
    sleep: 8.2,
  },
  {
    date: "2024-04-01",
    restingHR: 62,
    bloodPressure: "112/72",
    energy: 9,
    sleep: 8.5,
  },
];

export default function Progress() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [selectedStudent, setSelectedStudent] = useState<string>("all");
  const [timeRange, setTimeRange] = useState<string>("6months");

  const { data: students, isLoading: studentsLoading } = useQuery({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  // Get assessment history for selected student
  const { data: assessmentHistory } = useQuery({
    queryKey: [`/api/assessment-history/${selectedStudent}`],
    enabled: isAuthenticated && selectedStudent !== "all",
  });

  // Get weekly workout progress for selected student
  const { data: weeklyProgress } = useQuery({
    queryKey: [`/api/progress/weekly/${selectedStudent}`],
    enabled: isAuthenticated && selectedStudent !== "all",
  });

  // Transform assessment history into chart data format
  const bodyMeasurements =
    assessmentHistory && Array.isArray(assessmentHistory)
      ? assessmentHistory.map((item: any) => ({
          date: item.assessmentDate || item.createdAt,
          weight: parseFloat(item.currentWeight) || 0,
          bodyFat: parseFloat(item.bodyFatPercentage) || 0,
          leanMass:
            item.currentWeight && item.bodyFatPercentage
              ? parseFloat(item.currentWeight) *
                (1 - parseFloat(item.bodyFatPercentage) / 100)
              : 0,
          chest: parseFloat(item.chestCirc) || 0,
          waist: parseFloat(item.waistCirc) || 0,
          hips: parseFloat(item.hipCirc) || 0,
          arms: parseFloat(item.armCirc) || 0,
          thighs: parseFloat(item.thighCirc) || 0,
          calves: parseFloat(item.calfCirc) || 0,
        }))
      : mockBodyMeasurements;

  // Transform weekly workout progress into chart data format
  const groupedWorkoutProgress =
    weeklyProgress && Array.isArray(weeklyProgress)
      ? weeklyProgress.reduce((acc: any, item: any) => {
          if (!acc[item.exerciseName]) {
            acc[item.exerciseName] = [];
          }
          acc[item.exerciseName].push({
            date: new Date(item.week).toISOString().split("T")[0],
            weight: parseFloat(item.avgWeight) || 0,
            reps: Math.round(parseFloat(item.avgReps)) || 0,
            sets: Math.round(parseFloat(item.totalSets)) || 0,
          });
          return acc;
        }, {})
      : {};

  const getTrend = (current: number, previous: number) => {
    if (current > previous)
      return { icon: TrendingUp, color: "text-green-600", direction: "up" };
    if (current < previous)
      return { icon: TrendingDown, color: "text-red-600", direction: "down" };
    return { icon: Minus, color: "text-gray-600", direction: "stable" };
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("pt-BR", {
      month: "short",
      day: "2-digit",
    });
  };

  const LineChart = ({
    data,
    dataKey,
    title,
    unit = "",
    color = "#3B82F6",
  }: any) => (
    <div className="mt-4">
      <h4 className="text-sm font-medium text-gray-700 mb-2">{title}</h4>
      <div className="h-32 flex items-end space-x-2">
        {data.map((item: any, index: number) => {
          const maxValue = Math.max(...data.map((d: any) => d[dataKey]));
          const height = (item[dataKey] / maxValue) * 100;

          return (
            <div key={index} className="flex-1 flex flex-col items-center">
              <div
                className="w-full rounded-t transition-all duration-300 hover:opacity-80"
                style={{
                  height: `${height}%`,
                  backgroundColor: color,
                  minHeight: "4px",
                }}
                title={`${item[dataKey]}${unit} - ${formatDate(item.date)}`}
              />
              <span className="text-xs text-gray-500 mt-1">
                {formatDate(item.date)}
              </span>
            </div>
          );
        })}
      </div>
      <div className="flex justify-between text-xs text-gray-500 mt-2">
        <span>
          Início: {data[0]?.[dataKey]}
          {unit}
        </span>
        <span>
          Atual: {data[data.length - 1]?.[dataKey]}
          {unit}
        </span>
      </div>
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div>
      <Header
        title="Progresso dos Alunos"
        subtitle="Acompanhe a evolução e resultados dos treinos"
      />

      <main className="p-6">
        {/* Filtros */}
        <div className="mb-6 flex flex-wrap gap-4">
          <Select value={selectedStudent} onValueChange={setSelectedStudent}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Selecionar aluno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os alunos</SelectItem>
              {Array.isArray(students) &&
                students.map((student: any) => (
                  <SelectItem key={student.id} value={student.id}>
                    {student.name}
                  </SelectItem>
                ))}
            </SelectContent>
          </Select>

          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-[180px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="1month">Último mês</SelectItem>
              <SelectItem value="3months">Últimos 3 meses</SelectItem>
              <SelectItem value="6months">Últimos 6 meses</SelectItem>
              <SelectItem value="1year">Último ano</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Tabs defaultValue="body" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="body" className="flex items-center gap-2">
              📊 Medidas Corporais
            </TabsTrigger>
            <TabsTrigger
              value="performance"
              className="flex items-center gap-2"
            >
              🏋️‍♂️ Desempenho
            </TabsTrigger>
            <TabsTrigger value="health" className="flex items-center gap-2">
              ❤️ Saúde
            </TabsTrigger>
          </TabsList>

          {/* Aba Medidas Corporais */}
          <TabsContent value="body" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Peso Corporal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Peso Corporal
                    <Badge variant="outline">kg</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {bodyMeasurements[bodyMeasurements.length - 1]?.weight ||
                        "--"}
                      kg
                    </span>
                    {(() => {
                      const current =
                        bodyMeasurements[bodyMeasurements.length - 1]?.weight;
                      const previous =
                        bodyMeasurements[bodyMeasurements.length - 2]?.weight;
                      if (!current || !previous) return null;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {Math.abs(current - previous).toFixed(1)}kg
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={bodyMeasurements}
                    dataKey="weight"
                    title="Evolução do Peso"
                    unit="kg"
                    color="#10B981"
                  />
                </CardContent>
              </Card>

              {/* Gordura Corporal */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Gordura Corporal
                    <Badge variant="outline">%</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {
                        mockBodyMeasurements[mockBodyMeasurements.length - 1]
                          ?.bodyFat
                      }
                      %
                    </span>
                    {(() => {
                      const current =
                        mockBodyMeasurements[mockBodyMeasurements.length - 1]
                          ?.bodyFat;
                      const previous =
                        mockBodyMeasurements[mockBodyMeasurements.length - 2]
                          ?.bodyFat;
                      const trend = getTrend(previous, current); // Inverso para gordura
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {Math.abs(current - previous).toFixed(1)}%
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockBodyMeasurements}
                    dataKey="bodyFat"
                    title="Evolução do % de Gordura"
                    unit="%"
                    color="#EF4444"
                  />
                </CardContent>
              </Card>

              {/* Massa Magra */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Massa Magra
                    <Badge variant="outline">kg</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {
                        mockBodyMeasurements[mockBodyMeasurements.length - 1]
                          ?.leanMass
                      }
                      kg
                    </span>
                    {(() => {
                      const current =
                        mockBodyMeasurements[mockBodyMeasurements.length - 1]
                          ?.leanMass;
                      const previous =
                        mockBodyMeasurements[mockBodyMeasurements.length - 2]
                          ?.leanMass;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {Math.abs(current - previous).toFixed(1)}kg
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockBodyMeasurements}
                    dataKey="leanMass"
                    title="Evolução da Massa Magra"
                    unit="kg"
                    color="#3B82F6"
                  />
                </CardContent>
              </Card>

              {/* Medidas com Fita Métrica */}
              <Card className="lg:col-span-2 xl:col-span-3">
                <CardHeader>
                  <CardTitle className="text-lg">
                    Medidas com Fita Métrica
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                    {[
                      { key: "chest", label: "Peito", color: "#8B5CF6" },
                      { key: "waist", label: "Cintura", color: "#F59E0B" },
                      { key: "hips", label: "Quadril", color: "#EF4444" },
                      { key: "arms", label: "Braço", color: "#10B981" },
                      { key: "thighs", label: "Coxa", color: "#3B82F6" },
                      { key: "calves", label: "Panturrilha", color: "#6B7280" },
                    ].map((measure) => (
                      <div key={measure.key} className="text-center">
                        <h4 className="text-sm font-medium text-gray-700 mb-1">
                          {measure.label}
                        </h4>
                        <div className="text-lg font-bold mb-1">
                          {
                            mockBodyMeasurements[
                              mockBodyMeasurements.length - 1
                            ]?.[
                              measure.key as keyof (typeof mockBodyMeasurements)[0]
                            ]
                          }
                          cm
                        </div>
                        <div className="h-16 flex items-end">
                          {mockBodyMeasurements.map((item, index) => {
                            const maxValue = Math.max(
                              ...mockBodyMeasurements.map(
                                (d) =>
                                  d[measure.key as keyof typeof d] as number
                              )
                            );
                            const height =
                              ((item[
                                measure.key as keyof typeof item
                              ] as number) /
                                maxValue) *
                              100;

                            return (
                              <div
                                key={index}
                                className="flex-1 mx-0.5 rounded-t transition-all duration-300 hover:opacity-80"
                                style={{
                                  height: `${height}%`,
                                  backgroundColor: measure.color,
                                  minHeight: "4px",
                                }}
                                title={`${
                                  item[measure.key as keyof typeof item]
                                }cm - ${formatDate(item.date)}`}
                              />
                            );
                          })}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Aba Desempenho */}
          <TabsContent value="performance" className="space-y-6">
            {selectedStudent === "all" ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Selecione um aluno para visualizar o progresso semanal de
                  treinos
                </p>
              </div>
            ) : Object.keys(groupedWorkoutProgress).length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-500">
                  Nenhum dado de treino disponível ainda
                </p>
                <p className="text-sm text-gray-400 mt-2">
                  Os gráficos aparecerão quando o aluno completar treinos
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {Object.entries(groupedWorkoutProgress).map(
                  ([exerciseName, data]: [string, any]) => {
                    const exerciseData = data as Array<{
                      date: string;
                      weight: number;
                      reps: number;
                      sets: number;
                    }>;
                    const colors = [
                      "#8B5CF6",
                      "#10B981",
                      "#EF4444",
                      "#F59E0B",
                      "#06B6D4",
                      "#3B82F6",
                    ];
                    const colorIndex =
                      Object.keys(groupedWorkoutProgress).indexOf(
                        exerciseName
                      ) % colors.length;
                    const color = colors[colorIndex];

                    return (
                      <Card key={exerciseName}>
                        <CardHeader>
                          <CardTitle className="text-lg">
                            {exerciseName}
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          {/* Carga (Peso) Chart */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Carga Média Semanal
                              </span>
                              <Badge variant="outline">kg</Badge>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xl font-bold">
                                {exerciseData[
                                  exerciseData.length - 1
                                ]?.weight.toFixed(1)}
                                kg
                              </span>
                              {(() => {
                                if (exerciseData.length < 2) return null;
                                const current =
                                  exerciseData[exerciseData.length - 1]?.weight;
                                const previous =
                                  exerciseData[exerciseData.length - 2]?.weight;
                                const trend = getTrend(current, previous);
                                const TrendIcon = trend.icon;
                                return (
                                  <div
                                    className={`flex items-center ${trend.color}`}
                                  >
                                    <TrendIcon className="h-4 w-4 mr-1" />
                                    <span className="text-sm">
                                      {Math.abs(current - previous).toFixed(1)}
                                      kg
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                            <LineChart
                              data={exerciseData}
                              dataKey="weight"
                              title="Evolução Semanal - Carga"
                              unit="kg"
                              color={color}
                            />
                          </div>

                          {/* Repetições Chart */}
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">
                                Repetições Médias Semanais
                              </span>
                              <Badge variant="outline">reps</Badge>
                            </div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-xl font-bold">
                                {exerciseData[exerciseData.length - 1]?.reps}
                              </span>
                              {(() => {
                                if (exerciseData.length < 2) return null;
                                const current =
                                  exerciseData[exerciseData.length - 1]?.reps;
                                const previous =
                                  exerciseData[exerciseData.length - 2]?.reps;
                                const trend = getTrend(current, previous);
                                const TrendIcon = trend.icon;
                                return (
                                  <div
                                    className={`flex items-center ${trend.color}`}
                                  >
                                    <TrendIcon className="h-4 w-4 mr-1" />
                                    <span className="text-sm">
                                      {Math.abs(current - previous)}
                                    </span>
                                  </div>
                                );
                              })()}
                            </div>
                            <LineChart
                              data={exerciseData}
                              dataKey="reps"
                              title="Evolução Semanal - Repetições"
                              unit=" reps"
                              color={color}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    );
                  }
                )}
              </div>
            )}
          </TabsContent>

          {/* Aba Saúde */}
          <TabsContent value="health" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* FC Repouso */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    FC de Repouso
                    <Badge variant="outline">bpm</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockHealth[mockHealth.length - 1]?.restingHR} bpm
                    </span>
                    {(() => {
                      const current =
                        mockHealth[mockHealth.length - 1]?.restingHR;
                      const previous =
                        mockHealth[mockHealth.length - 2]?.restingHR;
                      const trend = getTrend(previous, current); // Inverso - menor é melhor
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {Math.abs(current - previous)} bpm
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockHealth}
                    dataKey="restingHR"
                    title="Evolução da FC de Repouso"
                    unit=" bpm"
                    color="#DC2626"
                  />
                </CardContent>
              </Card>

              {/* Pressão Arterial */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Pressão Arterial</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockHealth[mockHealth.length - 1]?.bloodPressure}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-green-600 border-green-600"
                    >
                      Normal
                    </Badge>
                  </div>
                  <div className="space-y-2">
                    {mockHealth.map((item, index) => (
                      <div key={index} className="flex justify-between text-sm">
                        <span>{formatDate(item.date)}</span>
                        <span className="font-medium">
                          {item.bloodPressure}
                        </span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Energia/Disposição */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Energia/Disposição
                    <Badge variant="outline">/10</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockHealth[mockHealth.length - 1]?.energy}/10
                    </span>
                    {(() => {
                      const current = mockHealth[mockHealth.length - 1]?.energy;
                      const previous =
                        mockHealth[mockHealth.length - 2]?.energy;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {Math.abs(current - previous)} pts
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockHealth}
                    dataKey="energy"
                    title="Evolução da Energia"
                    unit="/10"
                    color="#059669"
                  />
                </CardContent>
              </Card>

              {/* Qualidade do Sono */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Qualidade do Sono
                    <Badge variant="outline">h</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockHealth[mockHealth.length - 1]?.sleep}h
                    </span>
                    {(() => {
                      const current = mockHealth[mockHealth.length - 1]?.sleep;
                      const previous = mockHealth[mockHealth.length - 2]?.sleep;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            {Math.abs(current - previous).toFixed(1)}h
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockHealth}
                    dataKey="sleep"
                    title="Evolução do Sono"
                    unit="h"
                    color="#7C3AED"
                  />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
