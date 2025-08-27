import { useQuery } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";

interface DashboardStats {
  totalStudents: number;
  activeWorkouts: number;
  adherenceRate: number;
  todaySessions: number;
}

export default function StatsCards() {
  const { isAuthenticated } = useAuth();

  const { data: stats, isLoading } = useQuery<DashboardStats>({
    queryKey: ["/api/dashboard/stats"],
    enabled: isAuthenticated,
  });

  if (isLoading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-3">
                  <div className="h-4 bg-gray-200 rounded w-24"></div>
                  <div className="h-8 bg-gray-200 rounded w-16"></div>
                  <div className="h-3 bg-gray-200 rounded w-32"></div>
                </div>
                <div className="bg-gray-200 p-3 rounded-lg w-12 h-12"></div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = [
    {
      title: "Total de Alunos",
      value: stats?.totalStudents || 0,
      change: "+12%",
      changeText: "vs mês anterior",
      icon: "fas fa-users",
      iconBg: "bg-blue-100",
      iconColor: "text-primary",
      changeColor: "text-green-600",
    },
    {
      title: "Treinos Ativos",
      value: stats?.activeWorkouts || 0,
      change: "+8%",
      changeText: "vs mês anterior",
      icon: "fas fa-clipboard-list",
      iconBg: "bg-green-100",
      iconColor: "text-green-600",
      changeColor: "text-green-600",
    },
    {
      title: "Taxa de Adesão",
      value: `${stats?.adherenceRate || 0}%`,
      change: "+5%",
      changeText: "vs mês anterior",
      icon: "fas fa-chart-line",
      iconBg: "bg-yellow-100",
      iconColor: "text-yellow-600",
      changeColor: "text-green-600",
    },
    {
      title: "Sessões Hoje",
      value: stats?.todaySessions || 0,
      change: "+3",
      changeText: "vs ontem",
      icon: "fas fa-calendar-day",
      iconBg: "bg-purple-100",
      iconColor: "text-purple-600",
      changeColor: "text-green-600",
    },
  ];

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
      {cards.map((card, index) => (
        <Card key={index} className="bg-white rounded-xl shadow-sm border border-gray-100">
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p 
                  className="text-sm font-medium text-gray-600"
                  data-testid={`text-stat-title-${index}`}
                >
                  {card.title}
                </p>
                <p 
                  className="text-3xl font-bold text-gray-900 mt-2"
                  data-testid={`text-stat-value-${index}`}
                >
                  {card.value}
                </p>
                <div className="flex items-center mt-2">
                  <span className={`text-sm font-medium ${card.changeColor}`}>
                    {card.change}
                  </span>
                  <span className="text-gray-500 text-sm ml-1">
                    {card.changeText}
                  </span>
                </div>
              </div>
              <div className={`${card.iconBg} p-3 rounded-lg`}>
                <i className={`${card.icon} ${card.iconColor} text-xl`}></i>
              </div>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
