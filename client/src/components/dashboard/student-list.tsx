import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import type { Student } from "@shared/schema";

export default function StudentList() {
  const { isAuthenticated } = useAuth();

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  const recentStudents = students?.slice(0, 5) || [];

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-green-100 text-green-800";
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case "active":
        return "Ativo";
      case "inactive":
        return "Inativo";
      case "suspended":
        return "Suspenso";
      default:
        return "Ativo";
    }
  };

  return (
    <Card className="bg-white rounded-xl shadow-sm border border-gray-100">
      <CardHeader className="border-b border-gray-100">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">
            Alunos Recentes
          </CardTitle>
          <Button variant="link" className="text-primary hover:text-blue-700 text-sm font-medium">
            Ver todos <i className="fas fa-arrow-right ml-1"></i>
          </Button>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center space-x-4 py-3 animate-pulse">
                <div className="w-12 h-12 bg-gray-200 rounded-full"></div>
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-200 rounded w-32"></div>
                  <div className="h-3 bg-gray-200 rounded w-24"></div>
                  <div className="h-3 bg-gray-200 rounded w-40"></div>
                </div>
                <div className="w-16 h-6 bg-gray-200 rounded"></div>
              </div>
            ))}
          </div>
        ) : recentStudents.length === 0 ? (
          <div className="text-center py-8">
            <i className="fas fa-users text-gray-400 text-3xl mb-3"></i>
            <p className="text-gray-600">Nenhum aluno cadastrado</p>
            <p className="text-sm text-gray-500">Adicione seus primeiros alunos</p>
          </div>
        ) : (
          <div className="space-y-4">
            {recentStudents.map((student) => (
              <div 
                key={student.id} 
                className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0"
              >
                <div className="flex items-center space-x-4">
                  <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                    <i className="fas fa-user text-white"></i>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900" data-testid={`text-recent-student-${student.id}`}>
                      {student.name}
                    </p>
                    <p className="text-sm text-gray-600">
                      {student.goal || "Objetivo não definido"}
                    </p>
                    <p className="text-xs text-gray-500">
                      Cadastrado em {new Date(student.createdAt!).toLocaleDateString('pt-BR')}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-3">
                  <Badge className={getStatusColor(student.status || "active")}>
                    {getStatusText(student.status || "active")}
                  </Badge>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    data-testid={`button-edit-recent-student-${student.id}`}
                  >
                    <i className="fas fa-edit text-gray-400 hover:text-primary"></i>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
