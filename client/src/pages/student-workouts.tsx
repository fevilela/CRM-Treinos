import { useState } from "react";
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
    enabled: !!student.id,
  });

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
          Treinos criados pelo seu personal trainer
        </p>
      </div>

      {/* Workouts Grid */}
      <div className="space-y-6">
        {workoutsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando treinos...</p>
            </div>
          </div>
        ) : Array.isArray(workouts) && workouts.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {workouts.map((workout: any) => (
              <Card
                key={workout.id}
                className="hover:shadow-lg transition-all duration-200 border-l-4 border-l-primary"
                data-testid={`card-workout-${workout.id}`}
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-lg">{workout.name}</CardTitle>
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
                        <Calendar className="h-4 w-4" />
                        {workout.weekday
                          ? (() => {
                              const weekdays: Record<string, string> = {
                                monday: "Segunda",
                                tuesday: "Terça",
                                wednesday: "Quarta",
                                thursday: "Quinta",
                                friday: "Sexta",
                                saturday: "Sábado",
                                sunday: "Domingo",
                              };
                              return (
                                weekdays[workout.weekday] || workout.weekday
                              );
                            })()
                          : "Não definido"}
                      </div>
                      <div className="flex items-center gap-1">
                        <Dumbbell className="h-4 w-4" />
                        {workout.exercises?.length || 0} exercícios
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
    </div>
  );
}
