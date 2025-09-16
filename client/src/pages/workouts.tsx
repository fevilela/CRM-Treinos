import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { apiRequest, queryClient } from "@/lib/queryClient";
import { isUnauthorizedError } from "@/lib/authUtils";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import WorkoutModal from "@/components/modals/workout-modal";
import type { Workout, Student } from "@shared/schema";

export default function Workouts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const { data: workouts, isLoading: workoutsLoading } = useQuery<Workout[]>({
    queryKey: ["/api/workouts"],
    enabled: isAuthenticated,
  });

  const { data: students } = useQuery<Student[]>({
    queryKey: ["/api/students"],
    enabled: isAuthenticated,
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      await apiRequest("DELETE", `/api/workouts/${workoutId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/workouts"] });
      toast({
        title: "Sucesso",
        description: "Treino removido com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Não autorizado",
          description: "Você foi deslogado. Redirecionando...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.reload();
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao remover treino",
        variant: "destructive",
      });
    },
  });

  const filteredWorkouts =
    workouts?.filter((workout) =>
      workout.name.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const getStudentName = (studentId: string) => {
    const student = students?.find((s) => s.id === studentId);
    return student?.name || "Aluno não encontrado";
  };

  const getCategoryLabel = (category: string) => {
    const categories = {
      "chest-triceps": "Peito/Tríceps",
      "back-biceps": "Costas/Bíceps",
      legs: "Pernas",
      shoulders: "Ombros",
      cardio: "Cardio",
      "full-body": "Corpo Inteiro",
    };
    return categories[category as keyof typeof categories] || category;
  };

  const getCategoryColor = (category: string) => {
    const colors = {
      "chest-triceps": "bg-blue-100 text-blue-800",
      "back-biceps": "bg-green-100 text-green-800",
      legs: "bg-purple-100 text-purple-800",
      shoulders: "bg-yellow-100 text-yellow-800",
      cardio: "bg-red-100 text-red-800",
      "full-body": "bg-gray-100 text-gray-800",
    };
    return (
      colors[category as keyof typeof colors] || "bg-gray-100 text-gray-800"
    );
  };

  const handleCreateWorkout = () => {
    setSelectedWorkout(null);
    setIsModalOpen(true);
  };

  const handleEditWorkout = (workout: Workout) => {
    setSelectedWorkout(workout);
    setIsModalOpen(true);
  };

  const handleDeleteWorkout = (workoutId: string) => {
    if (window.confirm("Tem certeza que deseja remover este treino?")) {
      deleteWorkoutMutation.mutate(workoutId);
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
    <div className="min-h-screen bg-gray-50">
      <Header
        title="Treinos"
        subtitle="Crie e gerencie fichas de treino personalizadas"
      />

      <main className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div className="flex-1 max-w-md">
            <Input
              placeholder="Buscar treinos..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              data-testid="input-search-workouts"
            />
          </div>
          <Button
            onClick={handleCreateWorkout}
            data-testid="button-create-workout"
          >
            <i className="fas fa-plus mr-2"></i>
            Novo Treino
          </Button>
        </div>

        {workoutsLoading ? (
          <div className="flex justify-center items-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
              <p className="mt-2 text-gray-600">Carregando treinos...</p>
            </div>
          </div>
        ) : filteredWorkouts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {workouts?.length === 0
                  ? "Nenhum treino cadastrado"
                  : "Nenhum treino encontrado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {workouts?.length === 0
                  ? "Comece criando seu primeiro treino personalizado"
                  : "Tente ajustar os termos de busca"}
              </p>
              {workouts?.length === 0 && (
                <Button
                  onClick={handleCreateWorkout}
                  data-testid="button-create-first-workout"
                >
                  <i className="fas fa-plus mr-2"></i>
                  Criar Primeiro Treino
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredWorkouts.map((workout) => (
              <Card
                key={workout.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle
                      className="text-lg"
                      data-testid={`text-workout-name-${workout.id}`}
                    >
                      {workout.name}
                    </CardTitle>
                    <Badge className={getCategoryColor(workout.category)}>
                      {getCategoryLabel(workout.category)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3 mb-4">
                    <div className="flex items-center text-sm text-gray-600">
                      <i className="fas fa-user mr-2 w-4"></i>
                      <span>{getStudentName(workout.studentId)}</span>
                    </div>

                    {workout.description && (
                      <div className="flex items-start text-sm text-gray-600">
                        <i className="fas fa-align-left mr-2 w-4 mt-0.5"></i>
                        <span>{workout.description}</span>
                      </div>
                    )}

                    <div className="flex items-center text-sm text-gray-600">
                      <i className="fas fa-clock mr-2 w-4"></i>
                      <span>
                        Criado em{" "}
                        {new Date(workout.createdAt!).toLocaleDateString(
                          "pt-BR"
                        )}
                      </span>
                    </div>

                    <div className="flex items-center text-sm text-gray-600 mb-2">
                      <i className="fas fa-dumbbell mr-2 w-4"></i>
                      <span data-testid={`text-exercise-count-${workout.id}`}>
                        {(workout as any).exercises?.length || 0} exercício(s)
                      </span>
                    </div>

                    <div className="flex items-center">
                      <Badge
                        variant={workout.isActive ? "default" : "secondary"}
                      >
                        {workout.isActive ? "Ativo" : "Inativo"}
                      </Badge>
                    </div>
                  </div>

                  <div className="flex justify-end space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleEditWorkout(workout)}
                      data-testid={`button-edit-workout-${workout.id}`}
                    >
                      <i className="fas fa-edit mr-1"></i>
                      Editar
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteWorkout(workout.id)}
                      className="text-red-600 border-red-200 hover:bg-red-50"
                      disabled={deleteWorkoutMutation.isPending}
                      data-testid={`button-delete-workout-${workout.id}`}
                    >
                      <i className="fas fa-trash mr-1"></i>
                      {deleteWorkoutMutation.isPending ? "..." : "Remover"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>

      <WorkoutModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedWorkout(null);
        }}
        workout={selectedWorkout}
      />
    </div>
  );
}
