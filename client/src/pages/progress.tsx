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
                      {
                        mockBodyMeasurements[mockBodyMeasurements.length - 1]
                          ?.weight
                      }
                      kg
                    </span>
                    {(() => {
                      const current =
                        mockBodyMeasurements[mockBodyMeasurements.length - 1]
                          ?.weight;
                      const previous =
                        mockBodyMeasurements[mockBodyMeasurements.length - 2]
                          ?.weight;
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
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
              {/* Supino */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Supino (1RM)
                    <Badge variant="outline">kg</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockPerformance[mockPerformance.length - 1]?.benchPress}
                      kg
                    </span>
                    {(() => {
                      const current =
                        mockPerformance[mockPerformance.length - 1]?.benchPress;
                      const previous =
                        mockPerformance[mockPerformance.length - 2]?.benchPress;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            +{Math.abs(current - previous)}kg
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockPerformance}
                    dataKey="benchPress"
                    title="Evolução do Supino"
                    unit="kg"
                    color="#8B5CF6"
                  />
                </CardContent>
              </Card>

              {/* Agachamento */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Agachamento (1RM)
                    <Badge variant="outline">kg</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockPerformance[mockPerformance.length - 1]?.squat}kg
                    </span>
                    {(() => {
                      const current =
                        mockPerformance[mockPerformance.length - 1]?.squat;
                      const previous =
                        mockPerformance[mockPerformance.length - 2]?.squat;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            +{Math.abs(current - previous)}kg
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockPerformance}
                    dataKey="squat"
                    title="Evolução do Agachamento"
                    unit="kg"
                    color="#10B981"
                  />
                </CardContent>
              </Card>

              {/* Levantamento Terra */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Levantamento Terra (1RM)
                    <Badge variant="outline">kg</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockPerformance[mockPerformance.length - 1]?.deadlift}kg
                    </span>
                    {(() => {
                      const current =
                        mockPerformance[mockPerformance.length - 1]?.deadlift;
                      const previous =
                        mockPerformance[mockPerformance.length - 2]?.deadlift;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            +{Math.abs(current - previous)}kg
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockPerformance}
                    dataKey="deadlift"
                    title="Evolução do Levantamento Terra"
                    unit="kg"
                    color="#EF4444"
                  />
                </CardContent>
              </Card>

              {/* Barra Fixa */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Barra Fixa
                    <Badge variant="outline">reps</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockPerformance[mockPerformance.length - 1]?.pullUps}
                    </span>
                    {(() => {
                      const current =
                        mockPerformance[mockPerformance.length - 1]?.pullUps;
                      const previous =
                        mockPerformance[mockPerformance.length - 2]?.pullUps;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            +{Math.abs(current - previous)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockPerformance}
                    dataKey="pullUps"
                    title="Evolução da Barra Fixa"
                    unit=" reps"
                    color="#F59E0B"
                  />
                </CardContent>
              </Card>

              {/* Flexões */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center justify-between">
                    Flexões
                    <Badge variant="outline">reps</Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-2xl font-bold">
                      {mockPerformance[mockPerformance.length - 1]?.pushUps}
                    </span>
                    {(() => {
                      const current =
                        mockPerformance[mockPerformance.length - 1]?.pushUps;
                      const previous =
                        mockPerformance[mockPerformance.length - 2]?.pushUps;
                      const trend = getTrend(current, previous);
                      const TrendIcon = trend.icon;
                      return (
                        <div className={`flex items-center ${trend.color}`}>
                          <TrendIcon className="h-4 w-4 mr-1" />
                          <span className="text-sm">
                            +{Math.abs(current - previous)}
                          </span>
                        </div>
                      );
                    })()}
                  </div>
                  <LineChart
                    data={mockPerformance}
                    dataKey="pushUps"
                    title="Evolução das Flexões"
                    unit=" reps"
                    color="#06B6D4"
                  />
                </CardContent>
              </Card>
            </div>
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
