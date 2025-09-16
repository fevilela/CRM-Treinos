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
import { Progress } from "@/components/ui/progress";
import { Calendar, Dumbbell, TrendingUp, Play } from "lucide-react";
import { StudentWorkoutExecution } from "@/components/student-workout-execution";
import { VideoModal } from "@/components/modals/video-modal";
import type { Student } from "@shared/schema";

interface StudentDashboardProps {
  student: Student;
  onLogout: () => void;
}

export function StudentDashboard({ student }: StudentDashboardProps) {
  const [selectedWorkout, setSelectedWorkout] = useState<string | null>(null);
  const [showWorkoutExecution, setShowWorkoutExecution] = useState(false);
  const [workoutTimer, setWorkoutTimer] = useState(0);
  const [timerInterval, setTimerInterval] = useState<NodeJS.Timeout | null>(
    null
  );
  const [selectedVideo, setSelectedVideo] = useState<{
    url: string;
    exerciseName: string;
  } | null>(null);

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

  // Buscar sessões concluídas
  const { data: workoutSessions, isLoading: sessionsLoading } = useQuery({
    queryKey: [`/api/workout-sessions/student/${student.id}`],
    enabled: !!student.id,
  });

  const stats = {
    totalWorkouts: Array.isArray(workouts) ? workouts.length : 0,
    completedSessions: Array.isArray(workoutSessions)
      ? workoutSessions.length
      : 0,
    weeklyGoal: 3,
    currentWeekSessions: 2,
  };

  const progressPercentage =
    (stats.currentWeekSessions / stats.weeklyGoal) * 100;

  const handleStartWorkout = (workoutId: string) => {
    setSelectedWorkout(workoutId);
    setShowWorkoutExecution(true);
    // Start workout timer
    setWorkoutTimer(0);
    const interval = setInterval(() => {
      setWorkoutTimer((prev) => prev + 1);
    }, 1000);
    setTimerInterval(interval);
  };

  const handleBackFromWorkout = () => {
    setSelectedWorkout(null);
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
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Bem-vindo, {student.name}!
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Seus treinos e progresso
        </p>
      </div>

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
            <CardTitle className="text-sm font-medium">Meta Semanal</CardTitle>
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
            <CardTitle className="text-sm font-medium">Status</CardTitle>
          </CardHeader>
          <CardContent>
            <Badge
              variant={student.status === "active" ? "default" : "secondary"}
              data-testid="badge-status"
            >
              {student.status === "active" ? "Ativo" : "Inativo"}
            </Badge>
          </CardContent>
        </Card>
      </div>

      {/* Quick Action - Go to Workouts */}
      <Card data-testid="card-quick-actions">
        <CardHeader>
          <CardTitle>Acesso Rápido</CardTitle>
          <CardDescription>
            Navegue rapidamente para suas seções favoritas
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => (window.location.href = "/student/workouts")}
            >
              <Dumbbell className="h-6 w-6" />
              <span>Meus Treinos</span>
            </Button>
            <Button
              variant="outline"
              className="h-20 flex-col space-y-2"
              onClick={() => (window.location.href = "/student/progress")}
            >
              <TrendingUp className="h-6 w-6" />
              <span>Meu Progresso</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Recent Activity */}
      <Card data-testid="card-recent-activity">
        <CardHeader>
          <CardTitle>Atividade Recente</CardTitle>
          <CardDescription>Suas últimas sessões de treino</CardDescription>
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
                    <p className="font-medium">{session.exerciseName}</p>
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

      {/* Video Modal */}
      {selectedVideo && (
        <VideoModal
          isOpen={!!selectedVideo}
          onClose={() => setSelectedVideo(null)}
          videoUrl={selectedVideo?.url || ""}
          exerciseName={selectedVideo?.exerciseName || ""}
        />
      )}
    </div>
  );
}
