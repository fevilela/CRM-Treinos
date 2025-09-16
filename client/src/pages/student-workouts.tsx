import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Calendar, Dumbbell, Clock } from "lucide-react";
import { StudentWorkoutExecution } from "@/components/student-workout-execution";
import type { Student } from "@shared/schema";

interface StudentWorkoutsProps {
  student: Student;
}

export function StudentWorkouts({ student }: StudentWorkoutsProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showWorkoutExecution, setShowWorkoutExecution] = useState(false);

  // Buscar treinos do aluno
  const { data: workouts, isLoading: workoutsLoading } = useQuery({
    queryKey: ["/api/workouts/student", student.id],
    queryFn: async () => {
      const response = await fetch(`/api/workouts/student/${student.id}`, {
        credentials: "include",
      });

      if (!response.ok) {
        throw new Error(`Failed to fetch workouts: ${response.status}`);
      }

      return response.json();
    },
    enabled: !!student.id,
  });

  // Organizar treinos por dia da semana
  const workoutsByWeekday = useMemo(() => {
    if (!Array.isArray(workouts)) return {};

    const weekdayOrder = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    const organized: Record<string, any[]> = {};

    // Inicializar todos os dias
    weekdayOrder.forEach((day) => {
      organized[day] = [];
    });
    organized["unassigned"] = [];

    // Agrupar treinos por dia da semana
    workouts.forEach((workout: any) => {
      // Normalizar o weekday para minúsculas caso venha diferente
      const normalizedWeekday = workout.weekday?.toLowerCase();

      if (normalizedWeekday && organized[normalizedWeekday]) {
        organized[normalizedWeekday].push(workout);
      } else {
        // Treinos sem dia definido ou com dia inválido vão para unassigned
        organized["unassigned"].push(workout);
      }
    });

    return organized;
  }, [workouts]);

  // Encontrar o primeiro dia com treinos para usar como default
  const defaultTab = useMemo(() => {
    if (!workoutsByWeekday) return "monday";

    // Primeiro, tentar os dias da semana na ordem
    const weekdayOrder = [
      "monday",
      "tuesday",
      "wednesday",
      "thursday",
      "friday",
      "saturday",
      "sunday",
    ];
    for (const day of weekdayOrder) {
      if (workoutsByWeekday[day]?.length > 0) {
        return day;
      }
    }

    // Se não houver treinos nos dias da semana, usar unassigned se tiver treinos
    if (workoutsByWeekday["unassigned"]?.length > 0) {
      return "unassigned";
    }

    // Fallback para monday
    return "monday";
  }, [workoutsByWeekday]);

  const weekdayLabels: Record<string, string> = {
    monday: "Segunda-feira",
    tuesday: "Terça-feira",
    wednesday: "Quarta-feira",
    thursday: "Quinta-feira",
    friday: "Sexta-feira",
    saturday: "Sábado",
    sunday: "Domingo",
    unassigned: "Sem dia definido",
  };

  const handleStartWorkout = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    setShowWorkoutExecution(true);
  };

  const handleBackFromWorkout = () => {
    setSelectedWorkout(null);
    setShowWorkoutExecution(false);
  };

  if (showWorkoutExecution && selectedWorkout) {
    return (
      <StudentWorkoutExecution
        workoutId={selectedWorkout}
        student={{
          id: student.id,
          name: student.name,
          email: student.email || "",
        }}
        onBack={handleBackFromWorkout}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Meus Treinos
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Treinos organizados por dia da semana
        </p>
      </div>

      {/* Loading State */}
      {workoutsLoading ? (
        <div className="flex items-center justify-center py-12">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Carregando treinos...</p>
          </div>
        </div>
      ) : Array.isArray(workouts) && workouts.length ? (
        /* Tabs por dia da semana */
        <Tabs defaultValue={defaultTab} className="w-full">
          <TabsList
            className={`grid w-full mb-6 ${
              workoutsByWeekday.unassigned?.length > 0
                ? "grid-cols-8"
                : "grid-cols-7"
            }`}
          >
            {Object.entries(weekdayLabels)
              .slice(0, 7)
              .map(([key, label]) => {
                const hasWorkouts = workoutsByWeekday[key]?.length > 0;
                return (
                  <TabsTrigger
                    key={key}
                    value={key}
                    className={`text-xs px-2 ${
                      hasWorkouts ? "font-semibold" : "opacity-60"
                    }`}
                  >
                    {label.split("-")[0]}
                    {hasWorkouts && (
                      <Badge
                        variant="secondary"
                        className="ml-1 h-5 w-5 p-0 text-xs"
                      >
                        {workoutsByWeekday[key].length}
                      </Badge>
                    )}
                  </TabsTrigger>
                );
              })}
            {/* Tab para treinos sem dia definido */}
            {workoutsByWeekday.unassigned?.length > 0 && (
              <TabsTrigger
                value="unassigned"
                className="text-xs px-2 font-semibold text-orange-600"
              >
                S/dia
                <Badge
                  variant="secondary"
                  className="ml-1 h-5 w-5 p-0 text-xs bg-orange-100 text-orange-600"
                >
                  {workoutsByWeekday.unassigned.length}
                </Badge>
              </TabsTrigger>
            )}
          </TabsList>

          {Object.entries(weekdayLabels)
            .slice(0, 7)
            .map(([day, dayLabel]) => (
              <TabsContent key={day} value={day} className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <Calendar className="h-5 w-5 text-primary" />
                  <h2 className="text-xl font-semibold">{dayLabel}</h2>
                </div>

                {workoutsByWeekday[day]?.length > 0 ? (
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {workoutsByWeekday[day].map((workout: any) => (
                      <Card
                        key={workout.id}
                        className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary"
                        data-testid={`card-workout-${workout.id}`}
                      >
                        <CardHeader>
                          <div className="flex items-start justify-between">
                            <div>
                              <CardTitle className="text-lg">
                                {workout.name}
                              </CardTitle>
                              <CardDescription className="mt-1">
                                {workout.description}
                              </CardDescription>
                            </div>
                            <Badge
                              variant="outline"
                              className="border-primary text-primary"
                              data-testid={`badge-category-${workout.id}`}
                            >
                              {workout.category}
                            </Badge>
                          </div>
                        </CardHeader>

                        <CardContent>
                          <div className="space-y-4">
                            {/* Workout Info */}
                            <div className="flex items-center justify-between text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Dumbbell className="h-4 w-4" />
                                {workout.exercises?.length || 0} exercícios
                              </div>
                              <div className="flex items-center gap-1">
                                <Clock className="h-4 w-4" />
                                {Math.round(
                                  (workout.exercises?.length || 0) * 3
                                )}{" "}
                                min
                              </div>
                            </div>

                            {/* Action Button */}
                            <Button
                              onClick={() => handleStartWorkout(workout.id)}
                              className="w-full bg-gradient-to-r from-primary to-primary/80 hover:from-primary/90 hover:to-primary/70"
                              data-testid={`button-start-workout-${workout.id}`}
                            >
                              <Play className="h-4 w-4 mr-2" />
                              Iniciar Treino
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                ) : (
                  <Card className="text-center py-8">
                    <CardContent>
                      <Dumbbell className="h-8 w-8 text-muted-foreground mx-auto mb-3" />
                      <h3 className="text-base font-medium text-gray-700 mb-1">
                        Nenhum treino para {dayLabel.toLowerCase()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Você tem um dia livre hoje!
                      </p>
                    </CardContent>
                  </Card>
                )}
              </TabsContent>
            ))}

          {/* Tab para treinos sem dia definido */}
          {workoutsByWeekday.unassigned?.length > 0 && (
            <TabsContent value="unassigned" className="space-y-4">
              <div className="flex items-center gap-2 mb-4">
                <Calendar className="h-5 w-5 text-orange-500" />
                <h2 className="text-xl font-semibold">
                  Treinos sem dia definido
                </h2>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                {workoutsByWeekday.unassigned.map((workout: any) => (
                  <Card
                    key={workout.id}
                    className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-orange-500"
                    data-testid={`card-workout-${workout.id}`}
                  >
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">
                            {workout.name}
                          </CardTitle>
                          <CardDescription className="mt-1">
                            {workout.description}
                          </CardDescription>
                        </div>
                        <Badge
                          variant="outline"
                          className="border-orange-500 text-orange-500"
                        >
                          {workout.category}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        <div className="flex items-center justify-between text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Dumbbell className="h-4 w-4" />
                            {workout.exercises?.length || 0} exercícios
                          </div>
                          <div className="flex items-center gap-1">
                            <Clock className="h-4 w-4" />
                            {Math.round(
                              (workout.exercises?.length || 0) * 3
                            )}{" "}
                            min
                          </div>
                        </div>

                        <Button
                          onClick={() => handleStartWorkout(workout.id)}
                          className="w-full bg-gradient-to-r from-orange-500 to-orange-400 hover:from-orange-600 hover:to-orange-500"
                          data-testid={`button-start-workout-${workout.id}`}
                        >
                          <Play className="h-4 w-4 mr-2" />
                          Iniciar Treino
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </TabsContent>
          )}
        </Tabs>
      ) : (
        /* Estado vazio */
        <Card className="text-center py-12">
          <CardContent>
            <Dumbbell className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              Nenhum treino disponível
            </h3>
            <p className="text-gray-500">
              Seu personal trainer ainda não criou treinos para você.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
