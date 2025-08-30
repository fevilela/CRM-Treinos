import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Plus, FileText, Activity, Heart, Scale } from "lucide-react";
import { Button } from "@/components/ui/button";
import Header from "@/components/layout/header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import PhysicalAssessmentModal from "@/components/modals/physical-assessment-modal";
import type { PhysicalAssessment, Student } from "@shared/schema";

export default function PhysicalAssessments() {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedAssessment, setSelectedAssessment] =
    useState<PhysicalAssessment | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStudent, setFilterStudent] = useState<string>("all");

  const { data: assessments = [], isLoading: assessmentsLoading } = useQuery<
    PhysicalAssessment[]
  >({
    queryKey: ["/api/physical-assessments"],
  });

  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["/api/students"],
  });

  const filteredAssessments = assessments.filter((assessment) => {
    const matchesSearch =
      assessment.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      students
        .find((s) => s.id === assessment.studentId)
        ?.name.toLowerCase()
        .includes(searchTerm.toLowerCase());
    const matchesStudent =
      filterStudent === "all" || assessment.studentId === filterStudent;
    return matchesSearch && matchesStudent;
  });

  const handleEditAssessment = (assessment: PhysicalAssessment) => {
    setSelectedAssessment(assessment);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedAssessment(null);
  };

  const getStudentName = (studentId: string) => {
    const student = students.find((s) => s.id === studentId);
    return student?.name || "Aluno não encontrado";
  };

  const formatDate = (date: string | Date | null) => {
    if (!date) return "Data não informada";
    return new Date(date).toLocaleDateString("pt-BR");
  };

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5)
      return { category: "Abaixo do peso", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25)
      return { category: "Peso normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30)
      return { category: "Sobrepeso", color: "bg-yellow-100 text-yellow-800" };
    return { category: "Obesidade", color: "bg-red-100 text-red-800" };
  };

  if (assessmentsLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-600">Carregando...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <Header
        title="Avaliações Físicas"
        subtitle="Gerencie avaliações físicas completas dos seus alunos"
      />

      <main className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div></div>
          <Button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2"
            data-testid="button-new-assessment"
          >
            <Plus className="h-4 w-4" />
            Nova Avaliação
          </Button>
        </div>

        {/* Filtros */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Buscar por aluno..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full"
              data-testid="input-search-assessments"
            />
          </div>
          <Select value={filterStudent} onValueChange={setFilterStudent}>
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Filtrar por aluno" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Todos os alunos</SelectItem>
              {students.map((student) => (
                <SelectItem key={student.id} value={student.id}>
                  {student.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Grid de Avaliações */}
        {filteredAssessments.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                Nenhuma avaliação encontrada
              </h3>
              <p className="text-gray-500 mb-4">
                {searchTerm || filterStudent !== "all"
                  ? "Tente ajustar os filtros de busca"
                  : "Comece criando a primeira avaliação física"}
              </p>
              {!searchTerm && filterStudent === "all" && (
                <Button onClick={() => setIsModalOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Nova Avaliação
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredAssessments.map((assessment) => {
              const bmiInfo = assessment.bmi
                ? getBMICategory(Number(assessment.bmi))
                : null;

              return (
                <Card
                  key={assessment.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleEditAssessment(assessment)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          {getStudentName(assessment.studentId)}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {formatDate(assessment.assessmentDate)}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {assessment.profession && (
                          <Badge variant="outline" className="text-xs">
                            {assessment.profession}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-3">
                      {/* Dados antropométricos */}
                      <div className="flex items-center gap-2">
                        <Scale className="h-4 w-4 text-blue-600" />
                        <div className="text-sm">
                          {assessment.currentWeight &&
                          assessment.currentHeight ? (
                            <>
                              <span className="font-medium">
                                {Number(assessment.currentWeight).toFixed(1)}
                                kg
                              </span>
                              <span className="text-gray-500 mx-1">•</span>
                              <span className="font-medium">
                                {Number(assessment.currentHeight).toFixed(0)}
                                cm
                              </span>
                            </>
                          ) : (
                            <span className="text-gray-500">
                              Dados não informados
                            </span>
                          )}
                        </div>
                      </div>

                      {/* IMC */}
                      {bmiInfo && (
                        <div className="flex items-center gap-2">
                          <Heart className="h-4 w-4 text-red-600" />
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-medium">
                              IMC: {Number(assessment.bmi).toFixed(1)}
                            </span>
                            <Badge className={`text-xs ${bmiInfo.color}`}>
                              {bmiInfo.category}
                            </Badge>
                          </div>
                        </div>
                      )}

                      {/* Objetivo Principal */}
                      {assessment.primaryGoal && (
                        <div className="text-sm">
                          <span className="text-gray-500">Objetivo: </span>
                          <span className="font-medium">
                            {assessment.primaryGoal.length > 50
                              ? `${assessment.primaryGoal.substring(0, 50)}...`
                              : assessment.primaryGoal}
                          </span>
                        </div>
                      )}

                      {/* Dados clínicos */}
                      <div className="flex flex-wrap gap-2 pt-2 border-t">
                        {assessment.bloodPressure && (
                          <Badge variant="secondary" className="text-xs">
                            PA: {assessment.bloodPressure}
                          </Badge>
                        )}
                        {assessment.restingHeartRate && (
                          <Badge variant="secondary" className="text-xs">
                            FC: {assessment.restingHeartRate}bpm
                          </Badge>
                        )}
                        {assessment.bodyFatPercentage && (
                          <Badge variant="secondary" className="text-xs">
                            BF:{" "}
                            {Number(assessment.bodyFatPercentage).toFixed(1)}%
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>

      <PhysicalAssessmentModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        assessment={selectedAssessment}
      />
    </div>
  );
}
