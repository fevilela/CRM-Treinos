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
import type { Anamnese } from "@shared/schema";

interface AnamneseListItem {
  id: string;
  studentId: string;
  studentName: string;
  assessmentDate: Date;
  primaryGoal: string | null;
  createdAt: Date;
}

export default function Anamneses() {
  const { toast } = useToast();
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAnamnese, setSelectedAnamnese] = useState<Anamnese | null>(
    null
  );

  const { data: anamneses, isLoading } = useQuery<AnamneseListItem[]>({
    queryKey: ["/api/anamneses"],
    enabled: isAuthenticated,
  });

  const deleteAnamneseMutation = useMutation({
    mutationFn: async (anamneseId: string) => {
      await apiRequest("DELETE", `/api/anamneses/${anamneseId}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/anamneses"] });
      toast({
        title: "Sucesso",
        description: "Anamnese removida com sucesso!",
      });
    },
    onError: (error) => {
      if (isUnauthorizedError(error)) {
        toast({
          title: "Unauthorized",
          description: "Você foi desconectado. Faça login novamente...",
          variant: "destructive",
        });
        setTimeout(() => {
          window.location.href = "/api/login";
        }, 500);
        return;
      }
      toast({
        title: "Erro",
        description: "Erro ao remover anamnese",
        variant: "destructive",
      });
    },
  });

  const filteredAnamneses =
    anamneses?.filter((anamnese) =>
      anamnese.studentName?.toLowerCase().includes(searchTerm.toLowerCase())
    ) || [];

  const handleViewAnamnese = async (anamneseId: string) => {
    try {
      const anamnese = await apiRequest<Anamnese>(
        "GET",
        `/api/anamneses/${anamneseId}`
      );
      setSelectedAnamnese(anamnese);
      setIsModalOpen(true);
    } catch (error) {
      toast({
        title: "Erro",
        description: "Erro ao carregar anamnese",
        variant: "destructive",
      });
    }
  };

  const handleCreateAnamnese = () => {
    setSelectedAnamnese(null);
    setIsModalOpen(true);
  };

  const handleDeleteAnamnese = (anamneseId: string) => {
    if (window.confirm("Tem certeza que deseja remover esta anamnese?")) {
      deleteAnamneseMutation.mutate(anamneseId);
    }
  };

  const getGoalLabel = (goal: string | null) => {
    const goalMap: Record<string, string> = {
      weight_loss: "Emagrecimento",
      hypertrophy: "Hipertrofia",
      conditioning: "Condicionamento",
      health: "Saúde",
      other: "Outro",
    };
    return goal ? goalMap[goal] || goal : "Não definido";
  };

  if (authLoading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-6">
        <div className="max-w-7xl mx-auto">
          <div className="flex justify-between items-center mb-6">
            <h1 className="text-3xl font-bold">📋 Anamneses</h1>
            <Button onClick={handleCreateAnamnese}>
              <i className="fas fa-plus mr-2"></i>
              Nova Anamnese
            </Button>
          </div>

          <Card className="mb-6">
            <CardContent className="p-4">
              <Input
                type="text"
                placeholder="🔍 Buscar por aluno..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full"
              />
            </CardContent>
          </Card>

          {filteredAnamneses.length === 0 ? (
            <Card>
              <CardContent className="p-12 text-center">
                <div className="text-gray-400 mb-4">
                  <i className="fas fa-file-medical text-6xl"></i>
                </div>
                <p className="text-gray-600 text-lg">
                  {searchTerm
                    ? "Nenhuma anamnese encontrada com esse filtro"
                    : "Nenhuma anamnese cadastrada ainda"}
                </p>
                <Button onClick={handleCreateAnamnese} className="mt-4">
                  <i className="fas fa-plus mr-2"></i>
                  Criar Primeira Anamnese
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredAnamneses.map((anamnese) => (
                <Card
                  key={anamnese.id}
                  className="hover:shadow-lg transition-shadow"
                >
                  <CardContent className="p-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="font-bold text-lg text-primary mb-1">
                          {anamnese.studentName || "Aluno não encontrado"}
                        </h3>
                        <p className="text-sm text-gray-500">
                          {new Date(anamnese.assessmentDate).toLocaleDateString(
                            "pt-BR"
                          )}
                        </p>
                      </div>
                    </div>

                    <div className="mb-4">
                      <Badge variant="secondary" className="mb-2">
                        {getGoalLabel(anamnese.primaryGoal)}
                      </Badge>
                    </div>

                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex-1"
                        onClick={() => handleViewAnamnese(anamnese.id)}
                      >
                        <i className="fas fa-eye mr-1"></i>
                        Visualizar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDeleteAnamnese(anamnese.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <i className="fas fa-trash"></i>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </main>

      {/* TODO: Adicionar AnamneseModal aqui */}
      {/* <AnamneseModal
        isOpen={isModalOpen}
        onClose={() => {
          setIsModalOpen(false);
          setSelectedAnamnese(null);
        }}
        anamnese={selectedAnamnese}
      /> */}
    </div>
  );
}
