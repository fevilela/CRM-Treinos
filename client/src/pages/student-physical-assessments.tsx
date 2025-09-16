import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  CalendarDays,
  Camera,
  TrendingUp,
  Eye,
  Download,
  FileText,
  Scale,
  Heart,
} from "lucide-react";
import BodyPhotoGallery from "@/components/dashboard/body-photo-gallery";
import type { Student, PhysicalAssessment } from "@shared/schema";

interface StudentPhysicalAssessmentsProps {
  student: Student;
}

export function StudentPhysicalAssessments({
  student,
}: StudentPhysicalAssessmentsProps) {
  const [viewingAssessment, setViewingAssessment] =
    useState<PhysicalAssessment | null>(null);

  // Buscar avaliações físicas do aluno
  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/physical-assessments/student", student.id],
    queryFn: async () => {
      const response = await fetch(
        `/api/students/${student.id}/physical-assessments`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) {
        throw new Error(`Failed to fetch assessments: ${response.status}`);
      }
      return response.json();
    },
    enabled: !!student.id,
  });

  const handleViewAssessment = (assessment: PhysicalAssessment) => {
    setViewingAssessment(assessment);
  };

  const handleCloseViewModal = () => {
    setViewingAssessment(null);
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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Avaliações Físicas
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe suas avaliações físicas e evolução corporal
        </p>
      </div>

      {/* Assessments */}
      <div className="space-y-6">
        {assessmentsLoading ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-muted-foreground">Carregando avaliações...</p>
            </div>
          </div>
        ) : Array.isArray(assessments) && assessments.length ? (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {assessments.map((assessment: any) => {
              const bmiInfo = assessment.bmi
                ? getBMICategory(Number(assessment.bmi))
                : null;

              return (
                <Card
                  key={assessment.id}
                  className="hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => handleViewAssessment(assessment)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-lg">
                          Avaliação #{assessment.id.slice(-4)}
                        </CardTitle>
                        <p className="text-sm text-gray-500">
                          {formatDate(
                            assessment.assessmentDate || assessment.createdAt
                          )}
                        </p>
                      </div>
                      <div className="flex flex-col gap-1">
                        {assessment.profession && (
                          <Badge variant="outline" className="text-xs">
                            {assessment.profession}
                          </Badge>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="text-xs"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleViewAssessment(assessment);
                          }}
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Ver Detalhes
                        </Button>
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
                                {Number(assessment.currentWeight).toFixed(1)}kg
                              </span>
                              <span className="text-gray-500 mx-1">•</span>
                              <span className="font-medium">
                                {Number(assessment.currentHeight).toFixed(0)}cm
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
        ) : (
          <Card className="text-center py-12">
            <CardContent>
              <TrendingUp className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma avaliação realizada
              </h3>
              <p className="text-gray-500">
                Suas avaliações físicas aparecerão aqui quando forem realizadas
                pelo seu personal trainer.
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Modal de Visualização Detalhada */}
      {viewingAssessment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-7xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h2 className="text-2xl font-bold">Minha Avaliação Física</h2>
                  <p className="text-gray-600">
                    {formatDate(
                      viewingAssessment.assessmentDate ||
                        viewingAssessment.createdAt
                    )}
                  </p>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    onClick={async () => {
                      try {
                        const response = await fetch(
                          `/api/physical-assessments/${viewingAssessment.id}/analysis-pdf`,
                          {
                            credentials: "include",
                          }
                        );

                        if (!response.ok) {
                          throw new Error("Falha ao gerar PDF");
                        }

                        // Get filename from response headers
                        const contentDisposition = response.headers.get(
                          "Content-Disposition"
                        );
                        const filename = contentDisposition
                          ? contentDisposition
                              .split("filename=")[1]
                              ?.replace(/"/g, "")
                          : "minha_analise_progresso.pdf";

                        // Convert response to blob and download
                        const blob = await response.blob();
                        const url = window.URL.createObjectURL(blob);
                        const a = document.createElement("a");
                        a.href = url;
                        a.download = filename;
                        document.body.appendChild(a);
                        a.click();
                        document.body.removeChild(a);
                        window.URL.revokeObjectURL(url);
                      } catch (error) {
                        console.error("Erro ao baixar PDF:", error);
                        alert("Erro ao gerar PDF de análise. Tente novamente.");
                      }
                    }}
                  >
                    <Download className="h-4 w-4 mr-2" />
                    Baixar Análise PDF
                  </Button>
                  <Button variant="outline" onClick={handleCloseViewModal}>
                    ✕ Fechar
                  </Button>
                </div>
              </div>

              {/* Galeria de Fotos - Permitir upload pelo aluno */}
              <BodyPhotoGallery
                assessmentId={viewingAssessment.id}
                studentId={student.id}
                measurements={{
                  currentWeight: viewingAssessment.currentWeight
                    ? Number(viewingAssessment.currentWeight)
                    : undefined,
                  currentHeight: viewingAssessment.currentHeight
                    ? Number(viewingAssessment.currentHeight)
                    : undefined,
                  bmi: viewingAssessment.bmi
                    ? Number(viewingAssessment.bmi)
                    : undefined,
                }}
                interactive={true} // Permitir que o aluno faça upload de fotos
              />

              {/* Informações da Avaliação - Somente Leitura */}
              <div className="mt-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {/* Dados Antropométricos */}
                {(viewingAssessment.currentWeight ||
                  viewingAssessment.currentHeight) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg flex items-center gap-2">
                        <Scale className="h-5 w-5" />
                        Dados Antropométricos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {viewingAssessment.currentWeight && (
                        <p className="text-sm">
                          <strong>Peso:</strong>{" "}
                          {Number(viewingAssessment.currentWeight).toFixed(1)}{" "}
                          kg
                        </p>
                      )}
                      {viewingAssessment.currentHeight && (
                        <p className="text-sm">
                          <strong>Altura:</strong>{" "}
                          {Number(viewingAssessment.currentHeight).toFixed(0)}{" "}
                          cm
                        </p>
                      )}
                      {viewingAssessment.bmi && (
                        <p className="text-sm">
                          <strong>IMC:</strong>{" "}
                          {Number(viewingAssessment.bmi).toFixed(1)}
                          {(() => {
                            const bmiInfo = getBMICategory(
                              Number(viewingAssessment.bmi)
                            );
                            return (
                              <Badge
                                className={`ml-2 text-xs ${bmiInfo.color}`}
                              >
                                {bmiInfo.category}
                              </Badge>
                            );
                          })()}
                        </p>
                      )}
                      {viewingAssessment.bodyFatPercentage && (
                        <p className="text-sm">
                          <strong>% Gordura:</strong>{" "}
                          {Number(viewingAssessment.bodyFatPercentage).toFixed(
                            1
                          )}
                          %
                        </p>
                      )}
                      {viewingAssessment.leanMass && (
                        <p className="text-sm">
                          <strong>Massa Magra:</strong>{" "}
                          {Number(viewingAssessment.leanMass).toFixed(1)} kg
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Objetivos */}
                {viewingAssessment.primaryGoal && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">🎯 Objetivos</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm">{viewingAssessment.primaryGoal}</p>
                      {viewingAssessment.specificDeadline && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Prazo:</strong>{" "}
                          {viewingAssessment.specificDeadline}
                        </p>
                      )}
                      {viewingAssessment.targetBodyPart && (
                        <p className="text-sm text-gray-600 mt-2">
                          <strong>Foco:</strong>{" "}
                          {viewingAssessment.targetBodyPart}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Dados Clínicos */}
                {(viewingAssessment.bloodPressure ||
                  viewingAssessment.restingHeartRate ||
                  viewingAssessment.oxygenSaturation) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        🩺 Dados Clínicos
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {viewingAssessment.bloodPressure && (
                        <p className="text-sm">
                          <strong>Pressão Arterial:</strong>{" "}
                          {viewingAssessment.bloodPressure}
                        </p>
                      )}
                      {viewingAssessment.restingHeartRate && (
                        <p className="text-sm">
                          <strong>FC Repouso:</strong>{" "}
                          {viewingAssessment.restingHeartRate} bpm
                        </p>
                      )}
                      {viewingAssessment.oxygenSaturation && (
                        <p className="text-sm">
                          <strong>Saturação O²:</strong>{" "}
                          {Number(viewingAssessment.oxygenSaturation).toFixed(
                            1
                          )}
                          %
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Circunferências */}
                {(viewingAssessment.chestCirc ||
                  viewingAssessment.waistCirc ||
                  viewingAssessment.hipCirc) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        📏 Circunferências
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {viewingAssessment.chestCirc && (
                        <p className="text-sm">
                          <strong>Tórax:</strong>{" "}
                          {Number(viewingAssessment.chestCirc).toFixed(1)} cm
                        </p>
                      )}
                      {viewingAssessment.waistCirc && (
                        <p className="text-sm">
                          <strong>Cintura:</strong>{" "}
                          {Number(viewingAssessment.waistCirc).toFixed(1)} cm
                        </p>
                      )}
                      {viewingAssessment.hipCirc && (
                        <p className="text-sm">
                          <strong>Quadril:</strong>{" "}
                          {Number(viewingAssessment.hipCirc).toFixed(1)} cm
                        </p>
                      )}
                      {viewingAssessment.waistHipRatio && (
                        <p className="text-sm">
                          <strong>RCQ:</strong>{" "}
                          {Number(viewingAssessment.waistHipRatio).toFixed(2)}
                        </p>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Histórico Médico */}
                {(viewingAssessment.healthDiagnoses ||
                  viewingAssessment.medications ||
                  viewingAssessment.injuriesSurgeries) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        📋 Histórico Médico
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {viewingAssessment.healthDiagnoses && (
                        <div>
                          <strong className="text-sm">Diagnósticos:</strong>
                          <p className="text-sm text-gray-600">
                            {viewingAssessment.healthDiagnoses}
                          </p>
                        </div>
                      )}
                      {viewingAssessment.medications && (
                        <div>
                          <strong className="text-sm">Medicações:</strong>
                          <p className="text-sm text-gray-600">
                            {viewingAssessment.medications}
                          </p>
                        </div>
                      )}
                      {viewingAssessment.injuriesSurgeries && (
                        <div>
                          <strong className="text-sm">Lesões/Cirurgias:</strong>
                          <p className="text-sm text-gray-600">
                            {viewingAssessment.injuriesSurgeries}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}

                {/* Atividade Física */}
                {(viewingAssessment.pastActivities ||
                  viewingAssessment.currentActivities ||
                  viewingAssessment.activityLevel) && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">
                        🏃‍♂️ Atividade Física
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="space-y-2">
                      {viewingAssessment.activityLevel && (
                        <p className="text-sm">
                          <strong>Nível de Atividade:</strong>{" "}
                          {viewingAssessment.activityLevel === "sedentary"
                            ? "Sedentário"
                            : viewingAssessment.activityLevel === "moderate"
                            ? "Moderado"
                            : "Muito Ativo"}
                        </p>
                      )}
                      {viewingAssessment.pastActivities && (
                        <div>
                          <strong className="text-sm">
                            Atividades Passadas:
                          </strong>
                          <p className="text-sm text-gray-600">
                            {viewingAssessment.pastActivities}
                          </p>
                        </div>
                      )}
                      {viewingAssessment.currentActivities && (
                        <div>
                          <strong className="text-sm">
                            Atividades Atuais:
                          </strong>
                          <p className="text-sm text-gray-600">
                            {viewingAssessment.currentActivities}
                          </p>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
