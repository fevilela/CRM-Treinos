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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import WorkoutModal from "@/components/modals/workout-modal";
import type { Workout, Student } from "@shared/schema";

type GroupedWorkout = {
  student: Student;
  workouts: Workout[];
};

export default function Workouts() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedWorkout, setSelectedWorkout] = useState<Workout | null>(null);

  const { data: groupedWorkouts, isLoading: workoutsLoading } = useQuery<
    GroupedWorkout[]
  >({
    queryKey: ["/api/workouts/grouped-by-student"],
    enabled: isAuthenticated,
  });

  const deleteWorkoutMutation = useMutation({
    mutationFn: async (workoutId: string) => {
      await apiRequest("DELETE", `/api/workouts/${workoutId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/workouts/grouped-by-student"],
      });
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

  // Filtrar alunos e treinos baseado no termo de busca
  const filteredGroupedWorkouts =
    groupedWorkouts
      ?.map((group) => {
        const studentMatch = group.student.name
          .toLowerCase()
          .includes(searchTerm.toLowerCase());

        // Se o nome do aluno corresponder, mostrar todos os treinos
        if (studentMatch) {
          return group;
        }

        // Caso contrário, filtrar apenas os treinos que correspondem ao termo de busca
        const filteredWorkouts = group.workouts.filter((workout) =>
          workout.name.toLowerCase().includes(searchTerm.toLowerCase())
        );

        // Só incluir o grupo se tiver treinos correspondentes
        if (filteredWorkouts.length > 0) {
          return {
            ...group,
            workouts: filteredWorkouts,
          };
        }

        return null;
      })
      .filter((group) => group !== null) || [];

  // Contar total de treinos
  const totalWorkouts =
    groupedWorkouts?.reduce(
      (total, group) => total + group.workouts.length,
      0
    ) || 0;

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
        ) : filteredGroupedWorkouts.length === 0 ? (
          <Card>
            <CardContent className="p-8 text-center">
              <i className="fas fa-clipboard-list text-gray-400 text-4xl mb-4"></i>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {totalWorkouts === 0
                  ? "Nenhum treino cadastrado"
                  : "Nenhum treino encontrado"}
              </h3>
              <p className="text-gray-600 mb-4">
                {totalWorkouts === 0
                  ? "Comece criando seu primeiro treino personalizado"
                  : "Tente ajustar os termos de busca"}
              </p>
              {totalWorkouts === 0 && (
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
          <div className="space-y-6">
            <Accordion type="multiple" className="space-y-4">
              {filteredGroupedWorkouts.map((group) => (
                <AccordionItem
                  key={group.student.id}
                  value={group.student.id}
                  className="border border-gray-200 rounded-lg shadow-sm"
                >
                  <AccordionTrigger className="px-6 py-4 hover:no-underline">
                    <div className="flex items-center space-x-4 w-full">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={group.student.profileImage || undefined}
                          alt={group.student.name}
                        />
                        <AvatarFallback>
                          {group.student.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")
                            .toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 text-left">
                        <h3 className="text-lg font-semibold text-gray-900">
                          {group.student.name}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {group.workouts.length} treino(s) cadastrado(s)
                        </p>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Badge
                          variant={
                            group.student.status === "active"
                              ? "default"
                              : "secondary"
                          }
                        >
                          {group.student.status === "active"
                            ? "Ativo"
                            : "Inativo"}
                        </Badge>
                      </div>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-6">
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {group.workouts.map((workout) => (
                        <Card
                          key={workout.id}
                          className="hover:shadow-md transition-shadow"
                        >
                          <CardHeader className="pb-3">
                            <div className="flex items-center justify-between">
                              <CardTitle
                                className="text-base"
                                data-testid={`text-workout-name-${workout.id}`}
                              >
                                {workout.name}
                              </CardTitle>
                              <Badge
                                className={getCategoryColor(workout.category)}
                              >
                                {getCategoryLabel(workout.category)}
                              </Badge>
                            </div>
                          </CardHeader>
                          <CardContent className="pt-0">
                            <div className="space-y-2 mb-4">
                              {workout.description && (
                                <div className="flex items-start text-sm text-gray-600">
                                  <i className="fas fa-align-left mr-2 w-4 mt-0.5 flex-shrink-0"></i>
                                  <span className="line-clamp-2">
                                    {workout.description}
                                  </span>
                                </div>
                              )}

                              <div className="flex items-center text-sm text-gray-600">
                                <i className="fas fa-calendar mr-2 w-4"></i>
                                <span>
                                  {new Date(
                                    workout.createdAt!
                                  ).toLocaleDateString("pt-BR")}
                                </span>
                              </div>

                              <div className="flex items-center justify-between">
                                <Badge
                                  variant={
                                    workout.isActive ? "default" : "secondary"
                                  }
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
                                {deleteWorkoutMutation.isPending
                                  ? "..."
                                  : "Remover"}
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
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
