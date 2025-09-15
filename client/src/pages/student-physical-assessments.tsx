import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Camera, TrendingUp } from "lucide-react";
import type { Student } from "@shared/schema";

interface StudentPhysicalAssessmentsProps {
  student: Student;
}

export function StudentPhysicalAssessments({
  student,
}: StudentPhysicalAssessmentsProps) {
  // Buscar avaliações físicas do aluno
  const { data: assessments, isLoading: assessmentsLoading } = useQuery({
    queryKey: ["/api/physical-assessments/student", student.id],
    enabled: !!student.id,
  });

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
            {assessments.map((assessment: any) => (
              <Card
                key={assessment.id}
                className="hover:shadow-md transition-shadow"
              >
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span className="text-lg">
                      Avaliação #{assessment.id.slice(-4)}
                    </span>
                    <Badge variant="outline">
                      {new Date(assessment.createdAt).toLocaleDateString()}
                    </Badge>
                  </CardTitle>
                  <CardDescription>
                    <div className="flex items-center gap-1">
                      <CalendarDays className="h-4 w-4" />
                      {new Date(assessment.createdAt).toLocaleDateString(
                        "pt-BR"
                      )}
                    </div>
                  </CardDescription>
                </CardHeader>

                <CardContent>
                  <div className="space-y-3">
                    {/* Measurements */}
                    {assessment.measurements && (
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        {assessment.measurements.weight && (
                          <div>
                            <span className="text-muted-foreground">Peso:</span>
                            <span className="font-semibold ml-1">
                              {assessment.measurements.weight}kg
                            </span>
                          </div>
                        )}
                        {assessment.measurements.height && (
                          <div>
                            <span className="text-muted-foreground">
                              Altura:
                            </span>
                            <span className="font-semibold ml-1">
                              {assessment.measurements.height}cm
                            </span>
                          </div>
                        )}
                        {assessment.measurements.bodyFat && (
                          <div>
                            <span className="text-muted-foreground">
                              Gordura:
                            </span>
                            <span className="font-semibold ml-1">
                              {assessment.measurements.bodyFat}%
                            </span>
                          </div>
                        )}
                        {assessment.measurements.muscleMass && (
                          <div>
                            <span className="text-muted-foreground">
                              Massa:
                            </span>
                            <span className="font-semibold ml-1">
                              {assessment.measurements.muscleMass}kg
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Photos count */}
                    {assessment.photos && assessment.photos.length > 0 && (
                      <div className="flex items-center gap-2 text-sm text-muted-foreground pt-2 border-t">
                        <Camera className="h-4 w-4" />
                        <span>
                          {assessment.photos.length} foto(s) de evolução
                        </span>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
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
    </div>
  );
}
