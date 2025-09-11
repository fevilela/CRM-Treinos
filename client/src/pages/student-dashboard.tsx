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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import {
  Calendar,
  Dumbbell,
  TrendingUp,
  MessageSquare,
  LogOut,
  Play,
} from "lucide-react";
import { StudentWorkoutExecution } from "@/components/student-workout-execution";
import StudentSidebar from "@/components/layout/student-sidebar";
import type { Student } from "@shared/schema";

interface StudentDashboardProps {
  student: Student;
  onLogout: () => void;
}

export function StudentDashboard({ student, onLogout }: StudentDashboardProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showWorkoutExecution, setShowWorkoutExecution] = useState(false);

  // Buscar treinos do aluno
  const { data: workouts, isLoading: workoutsLoading } = useQuery({
    queryKey: ["/api/workouts/student", student.id],
    enabled: !!student.id,
  });

  // Buscar histórico de progresso
  const { data: workoutHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/workout-history", student.id],
    enabled: !!student.id,
  });

  const stats = {
    totalWorkouts: Array.isArray(workouts) ? workouts.length : 0,
    completedSessions: Array.isArray(workoutHistory)
      ? workoutHistory.length
      : 0,
    weeklyGoal: 3,
    currentWeekSessions: 2,
  };

  const progressPercentage =
    (stats.currentWeekSessions / stats.weeklyGoal) * 100;

  const handleStartWorkout = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    setShowWorkoutExecution(true);
  };

  const handleBackFromWorkout = () => {
    setShowWorkoutExecution(false);
    setSelectedWorkout(null);
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
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex">
      {/* Sidebar for Students */}
      <StudentSidebar student={student} onLogout={onLogout} />

      {/* Main Content */}
      <div className="ml-64 flex-1">
        {/* Header */}
        <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                  Bem-vindo, {student.name}!
                </h1>
                <p className="text-gray-600 dark:text-gray-400">
                  Seus treinos e progresso
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="px-4 sm:px-6 lg:px-8 py-8">
          <Tabs defaultValue="overview" className="space-y-6">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="overview" data-testid="tab-overview">
                <TrendingUp className="h-4 w-4 mr-2" />
                Visão Geral
              </TabsTrigger>
              <TabsTrigger value="workouts" data-testid="tab-workouts">
                <Dumbbell className="h-4 w-4 mr-2" />
                Meus Treinos
              </TabsTrigger>
              <TabsTrigger value="progress" data-testid="tab-progress">
                <Calendar className="h-4 w-4 mr-2" />
                Progresso
              </TabsTrigger>
              <TabsTrigger value="comments" data-testid="tab-comments">
                <MessageSquare className="h-4 w-4 mr-2" />
                Comentários
              </TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="space-y-6">
              {/* Stats Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card data-testid="card-total-workouts">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Total de Treinos
                    </CardTitle>
                    <Dumbbell className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-total-workouts"
                    >
                      {stats.totalWorkouts}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-completed-sessions">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Sessões Concluídas
                    </CardTitle>
                    <Calendar className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-completed-sessions"
                    >
                      {stats.completedSessions}
                    </div>
                  </CardContent>
                </Card>

                <Card data-testid="card-weekly-progress">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Meta Semanal
                    </CardTitle>
                    <TrendingUp className="h-4 w-4 text-muted-foreground" />
                  </CardHeader>
                  <CardContent>
                    <div
                      className="text-2xl font-bold"
                      data-testid="text-weekly-progress"
                    >
                      {stats.currentWeekSessions}/{stats.weeklyGoal}
                    </div>
                    <Progress value={progressPercentage} className="mt-2" />
                  </CardContent>
                </Card>

                <Card data-testid="card-status">
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <CardTitle className="text-sm font-medium">
                      Status
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <Badge
                      variant={
                        student.status === "active" ? "default" : "secondary"
                      }
                      data-testid="badge-status"
                    >
                      {student.status === "active" ? "Ativo" : "Inativo"}
                    </Badge>
                  </CardContent>
                </Card>
              </div>

              {/* Recent Activity */}
              <Card data-testid="card-recent-activity">
                <CardHeader>
                  <CardTitle>Atividade Recente</CardTitle>
                  <CardDescription>
                    Suas últimas sessões de treino
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {historyLoading ? (
                    <p>Carregando histórico...</p>
                  ) : Array.isArray(workoutHistory) && workoutHistory.length ? (
                    <div className="space-y-3">
                      {workoutHistory.slice(0, 5).map((session: any) => (
                        <div
                          key={session.id}
                          className="flex items-center justify-between p-3 border rounded"
                          data-testid={`row-session-${session.id}`}
                        >
                          <div>
                            <p className="font-medium">
                              {session.exerciseName}
                            </p>
                            <p className="text-sm text-gray-600">
                              {session.sets} séries × {session.reps} reps •{" "}
                              {session.weight}kg
                            </p>
                          </div>
                          <div className="text-sm text-gray-500">
                            {new Date(session.completedAt).toLocaleDateString()}
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">Nenhuma atividade ainda</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="workouts">
              <Card data-testid="card-my-workouts">
                <CardHeader>
                  <CardTitle>Meus Treinos</CardTitle>
                  <CardDescription>
                    Treinos criados pelo seu personal trainer
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {workoutsLoading ? (
                    <p>Carregando treinos...</p>
                  ) : Array.isArray(workouts) && workouts.length ? (
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {workouts.map((workout: any) => (
                        <Card
                          key={workout.id}
                          className="hover:shadow-md transition-shadow"
                          data-testid={`card-workout-${workout.id}`}
                        >
                          <CardHeader>
                            <CardTitle className="text-lg">
                              {workout.name}
                            </CardTitle>
                            <CardDescription>
                              {workout.description}
                            </CardDescription>
                          </CardHeader>
                          <CardContent>
                            <div className="flex justify-between items-center">
                              <Badge
                                variant="outline"
                                data-testid={`badge-category-${workout.id}`}
                              >
                                {workout.category}
                              </Badge>
                              <Button
                                size="sm"
                                onClick={() => handleStartWorkout(workout.id)}
                                data-testid={`button-start-workout-${workout.id}`}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Iniciar
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-500">
                      Nenhum treino disponível ainda
                    </p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="progress">
              <Card data-testid="card-progress">
                <CardHeader>
                  <CardTitle>Progresso</CardTitle>
                  <CardDescription>
                    Acompanhe sua evolução ao longo do tempo
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Gráficos de progresso serão implementados aqui
                  </p>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="comments">
              <Card data-testid="card-comments">
                <CardHeader>
                  <CardTitle>Comentários</CardTitle>
                  <CardDescription>
                    Suas anotações sobre os treinos
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-500">
                    Sistema de comentários será implementado aqui
                  </p>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
