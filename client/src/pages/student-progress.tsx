import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Calendar, Dumbbell, TrendingUp, Trophy, Target } from "lucide-react";
import type { Student } from "@shared/schema";
import ProgressChart from "@/components/dashboard/progress-chart";

interface StudentProgressProps {
  student: Student;
}

export function StudentProgress({ student }: StudentProgressProps) {
  // Buscar histórico de progresso
  const { data: workoutHistory, isLoading: historyLoading } = useQuery({
    queryKey: ["/api/workout-history", student.id],
    enabled: !!student.id,
  });

  // Buscar estatísticas de progresso
  const { data: progressStats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/progress-stats", student.id],
    enabled: !!student.id,
  });

  const stats = {
    totalSessions: Array.isArray(workoutHistory) ? workoutHistory.length : 0,
    weeklyGoal: 3,
    currentWeekSessions: 2,
    averageWorkoutDuration: 45,
    longestStreak: 5,
    ...(progressStats || {}),
  };

  const progressPercentage =
    (stats.currentWeekSessions / stats.weeklyGoal) * 100;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Meu Progresso
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe sua evolução nos treinos
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Sessões Totais
            </CardTitle>
            <Dumbbell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalSessions}</div>
            <p className="text-xs text-muted-foreground">Treinos concluídos</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Meta Semanal</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.currentWeekSessions}/{stats.weeklyGoal}
            </div>
            <Progress value={progressPercentage} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Duração Média</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats.averageWorkoutDuration}min
            </div>
            <p className="text-xs text-muted-foreground">Por treino</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Maior Sequência
            </CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.longestStreak}</div>
            <p className="text-xs text-muted-foreground">Dias consecutivos</p>
          </CardContent>
        </Card>
      </div>

      {/* Progress Chart */}
      <ProgressChart studentId={student.id} />

      {/* Recent Activity */}
      <Card>
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Suas últimas sessões de treino</CardDescription>
        </CardHeader>
        <CardContent>
          {historyLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Carregando histórico...
                </p>
              </div>
            </div>
          ) : Array.isArray(workoutHistory) && workoutHistory.length ? (
            <div className="space-y-4">
              {workoutHistory.slice(0, 10).map((session: any) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center">
                        <Dumbbell className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-medium">
                          {session.exerciseName || "Treino Completo"}
                        </p>
                        <div className="flex items-center gap-4 text-sm text-muted-foreground">
                          <span>
                            {session.sets} séries × {session.reps} reps
                          </span>
                          {session.weight && <span>{session.weight}kg</span>}
                          <span>{session.duration || 0}min</span>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="mb-1">
                      {new Date(session.completedAt).toLocaleDateString()}
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {new Date(session.completedAt).toLocaleTimeString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhum progresso registrado
              </h3>
              <p className="text-gray-500">
                Complete alguns treinos para ver seu progresso aqui.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
