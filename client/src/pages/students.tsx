import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import StudentModal from "@/components/modals/student-modal";
import type { Student } from "@shared/schema";

export default function Students() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);

  const { data: students, isLoading } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  const deleteStudentMutation = useMutation({
    mutationFn: async (studentId: string) => {
      await apiRequest("DELETE", `/api/students/${studentId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/students"] });
      toast({
        title: "Sucesso",
        description: "Aluno removido com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "You are logged out. Logging in again...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao remover aluno",
        variant: "destructive",
      });
    },
  });

  const filteredStudents =
    students?.filter((student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleEditStudent = (student: Student) => {
    setSelectedStudent(student);
    setIsModalOpen(true);
  };

  const handleCreateStudent = () => {
    setSelectedStudent(null);
    setIsModalOpen(true);
  };

  const handleDeleteStudent = (studentId: string) => {
    if (window.confirm("Tem certeza que deseja remover este aluno?")) {
      deleteStudentMutation.mutate(studentId);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-gray-100 text-gray-800";
      case "suspended":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
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
        return status;
    }
  };

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
        title="Alunos"
        subtitle="Gerencie seus alunos e acompanhe o progresso"
      />

      <main className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar alunos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-students"
            />
          </div>
          <Button
            onClick={handleCreateStudent}
            data-testid="button-create-student"
          >
            <i className="fas fa-plus mr-2"></i>
            Novo Aluno
          </Button>
        </div>

        {isLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando alunos...</p>
            </div>
          </div>
        ) : filteredStudents.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-users text-gray-400 text-4xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {students?.length === 0
                  ? "Nenhum aluno cadastrado"
                  : "Nenhum aluno encontrado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {students?.length === 0
                  ? "Comece adicionando seu primeiro aluno ao sistema"
                  : "Tente ajustar os termos de busca"}
              </p>
              {students?.length === 0 && (
                <Button
                  onClick={handleCreateStudent}
                  data-testid="button-create-first-student"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Adicionar Primeiro Aluno
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredStudents.map((student) => (
              <Card
                key={student.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardContent className="p-6">
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="w-12 h-12 bg-primary rounded-full flex items-center justify-center">
                      <i className="fas fa-user text-white"></i>
                    </div>
                    <div className="flex-1">
                      <h3
                        className="font-semibold text-gray-900"
                        data-testid={`text-student-name-${student.id}`}
                      >
                        {student.name}
                      </h3>
                      <p className="text-sm text-gray-600">{student.email}</p>
                    </div>
                    <Badge
                      className={getStatusColor(student.status || "active")}
                    >
                      {getStatusText(student.status || "active")}
                    </Badge>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600 mb-4">
                    {student.goal && (
                      <div className="flex items-center">
                        <i className="fas fa-target mr-2 w-4"></i>
                        <span>{student.goal}</span>
                      </div>
                    )}
                    {student.phone && (
                      <div className="flex items-center">
                        <i className="fas fa-phone mr-2 w-4"></i>
                        <span>{student.phone}</span>
                      </div>
                    )}
                    {student.weight && (
                      <div className="flex items-center">
                        <i className="fas fa-weight mr-2 w-4"></i>
                        <span>{student.weight}kg</span>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditStudent(student)}
                      data-testid={`button-edit-student-${student.id}`}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStudent(student.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={deleteStudentMutation.isPending}
                      data-testid={`button-delete-student-${student.id}`}
                    >
                      <i className="fas fa-trash mr-1"></i>
                      {deleteStudentMutation.isPending ? "..." : "Remover"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <StudentModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedStudent(null);
        }}
        student={selectedStudent}
      />
    </div>
  );
}
