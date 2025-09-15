import { useQuery } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CalendarDays, Camera, TrendingUp, Scale, Ruler } from "lucide-react";
import type { Student } from "@shared/schema";

interface StudentBodyEvolutionProps {
  student: Student;
}

export function StudentBodyEvolution({ student }: StudentBodyEvolutionProps) {
  // Buscar medidas corporais do aluno
  const { data: bodyMeasurements, isLoading: measurementsLoading } = useQuery({
    queryKey: ["/api/body-measurements/student", student.id],
    enabled: !!student.id,
  });

  // Buscar fotos de evolução
  const { data: evolutionPhotos, isLoading: photosLoading } = useQuery({
    queryKey: ["/api/evolution-photos/student", student.id],
    enabled: !!student.id,
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Evolução Corporal
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe sua evolução física através de medidas e fotos
        </p>
      </div>

      {/* Latest Measurements */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Scale className="h-5 w-5" />
            Medidas Corporais Recentes
          </CardTitle>
          <CardDescription>Suas últimas medidas registradas</CardDescription>
        </CardHeader>
        <CardContent>
          {measurementsLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Carregando medidas...
                </p>
              </div>
            </div>
          ) : Array.isArray(bodyMeasurements) && bodyMeasurements.length ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {bodyMeasurements.slice(0, 4).map((measurement: any) => (
                <div
                  key={measurement.id}
                  className="p-4 border rounded-lg bg-gradient-to-br from-blue-50 to-indigo-50"
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-blue-700">
                      {measurement.bodyPart}
                    </span>
                    <Badge variant="outline" className="text-xs">
                      {new Date(measurement.createdAt).toLocaleDateString()}
                    </Badge>
                  </div>
                  <div className="text-2xl font-bold text-blue-900">
                    {measurement.value}
                  </div>
                  <div className="text-xs text-blue-600">
                    {measurement.unit}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Ruler className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma medida registrada
              </h3>
              <p className="text-gray-500">
                Suas medidas corporais aparecerão aqui quando forem registradas.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Evolution Photos */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="h-5 w-5" />
            Galeria de Evolução
          </CardTitle>
          <CardDescription>Fotos do seu progresso físico</CardDescription>
        </CardHeader>
        <CardContent>
          {photosLoading ? (
            <div className="flex items-center justify-center py-8">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
                <p className="text-sm text-muted-foreground">
                  Carregando fotos...
                </p>
              </div>
            </div>
          ) : Array.isArray(evolutionPhotos) && evolutionPhotos.length ? (
            <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
              {evolutionPhotos.map((photo: any) => (
                <div key={photo.id} className="relative group cursor-pointer">
                  <div className="aspect-square overflow-hidden rounded-lg border bg-gray-100">
                    <img
                      src={photo.photoUrl}
                      alt={`Evolução - ${photo.bodyPart}`}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-200"
                    />
                  </div>
                  <div className="absolute bottom-2 left-2 right-2">
                    <div className="bg-black/70 text-white px-2 py-1 rounded text-xs">
                      {photo.bodyPart}
                    </div>
                  </div>
                  <div className="mt-2">
                    <Badge variant="outline" className="text-xs">
                      {new Date(photo.uploadedAt).toLocaleDateString()}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-8">
              <Camera className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                Nenhuma foto de evolução
              </h3>
              <p className="text-gray-500">
                Suas fotos de progresso aparecerão aqui quando forem adicionadas
                pelo seu personal trainer.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Measurements History */}
      {Array.isArray(bodyMeasurements) && bodyMeasurements.length > 4 && (
        <Card>
          <CardHeader>
            <CardTitle>Histórico de Medidas</CardTitle>
            <CardDescription>Todas as suas medidas registradas</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {bodyMeasurements.slice(4).map((measurement: any) => (
                <div
                  key={measurement.id}
                  className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                      <Ruler className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <p className="font-medium">{measurement.bodyPart}</p>
                      <p className="text-sm text-muted-foreground">
                        {measurement.value} {measurement.unit}
                      </p>
                    </div>
                  </div>
                  <Badge variant="outline">
                    {new Date(measurement.createdAt).toLocaleDateString()}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
