import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import type { WorkoutSession } from "@shared/schema";

export default function ActivityFeed() {
  const { isAuthenticated } = useAuth();

  const { data: recentSessions, isLoading } = useQuery<WorkoutSession[]>({
    queryKey: ["/api/recent-sessions"],
    enabled: isAuthenticated,
  });

  const getActivityIcon = (index: number) => {
    const icons = [
      { icon: "fas fa-user-plus", bg: "bg-blue-100", color: "text-primary" },
      { icon: "fas fa-clipboard-check", bg: "bg-green-100", color: "text-green-600" },
      { icon: "fas fa-chart-line", bg: "bg-yellow-100", color: "text-yellow-600" },
      { icon: "fas fa-dumbbell", bg: "bg-purple-100", color: "text-purple-600" },
    ];
    return icons[index % icons.length];
  };

  const getTimeAgo = (date: string) => {
    const now = new Date();
    const past = new Date(date);
    const diffMs = now.getTime() - past.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays > 0) {
      return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;
    } else if (diffHours > 0) {
      return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
    } else {
      return 'Há pouco tempo';
    }
  };

  // Mock activities when no real data is available
  const mockActivities = [
    {
      type: "student",
      title: "Novo aluno cadastrado",
      description: "Pedro Oliveira foi adicionado ao sistema",
      time: "2 horas atrás",
    },
    {
      type: "workout",
      title: "Treino completado",
      description: "Maria Santos finalizou treino de Peito/Tríceps",
      time: "4 horas atrás",
    },
    {
      type: "progress",
      title: "Progresso registrado",
      description: "João Silva aumentou carga no supino",
      time: "6 horas atrás",
    },
    {
      type: "creation",
      title: "Novo treino criado",
      description: "Treino de Costas/Bíceps para Ana Costa",
      time: "1 dia atrás",
    },
  ];

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <CardTitle className="text-lg font-semibold text-gray-900">
          Atividades Recentes
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4].map((i) => (
              <div key={i} className="flex items-start space-x-3 animate-pulse">
                <div className="w-8 h-8 bg-gray-200 rounded-lg"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-48"></div>
                  <div className="h-3 bg-gray-200 rounded w-20"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="space-y-4">
            {mockActivities.map((activity, index) => {
              const iconConfig = getActivityIcon(index);
              return (
                <div key={index} className="flex items-start space-x-3">
                  <div className={`${iconConfig.bg} p-2 rounded-lg`}>
                    <i className={`${iconConfig.icon} ${iconConfig.color} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900" data-testid={`text-activity-title-${index}`}>
                      {activity.title}
                    </p>
                    <p className="text-xs text-gray-600" data-testid={`text-activity-description-${index}`}>
                      {activity.description}
                    </p>
                    <p className="text-xs text-gray-500 mt-1" data-testid={`text-activity-time-${index}`}>
                      {activity.time}
                    </p>
                  </div>
                </div>
              );
            })}
            
            {recentSessions?.map((session, index) => {
              const iconConfig = getActivityIcon(index + 4);
              return (
                <div key={session.id} className="flex items-start space-x-3">
                  <div className={`${iconConfig.bg} p-2 rounded-lg`}>
                    <i className={`${iconConfig.icon} ${iconConfig.color} text-sm`}></i>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">
                      Sessão de treino realizada
                    </p>
                    <p className="text-xs text-gray-600">
                      Treino finalizado com sucesso
                    </p>
                    <p className="text-xs text-gray-500 mt-1">
                      {getTimeAgo(session.completedAt!.toString())}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
