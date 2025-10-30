import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  CalendarDays,
  Camera,
  TrendingUp,
  Scale,
  Ruler,
  ScanFace,
} from "lucide-react";
import type { Student } from "@shared/schema";
import BodyMeasurementsForm from "@/components/body-measurements-form";
import BodyAvatarComparison from "@/components/body-avatar-comparison";

interface StudentBodyEvolutionProps {
  student: Student;
}

export function StudentBodyEvolution({ student }: StudentBodyEvolutionProps) {
  const [selectedTab, setSelectedTab] = useState("overview");

  const { data: bodyMeasurements, isLoading: measurementsLoading } = useQuery({
    queryKey: ["/api/body-measurements/student", student.id],
    enabled: !!student.id,
  });

  const { data: evolutionPhotos, isLoading: photosLoading } = useQuery({
    queryKey: ["/api/evolution-photos/student", student.id],
    enabled: !!student.id,
  });

  const mockBeforeMeasurements = {
    height: 170,
    weight: 85,
    chest: 100,
    waist: 95,
    hips: 105,
    shoulders: 45,
    arms: 35,
    thighs: 65,
    date: "2024-01-01",
  };

  const mockAfterMeasurements = {
    height: 170,
    weight: 78,
    chest: 95,
    waist: 85,
    hips: 98,
    shoulders: 46,
    arms: 36,
    thighs: 60,
    date: new Date().toISOString(),
  };

  const handleSaveMeasurements = (measurements: any) => {
    console.log("Salvar medidas:", measurements);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
          Evolução Corporal
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Acompanhe sua evolução física através de medidas, fotos e avatar 3D
        </p>
      </div>

      <Tabs
        value={selectedTab}
        onValueChange={setSelectedTab}
        className="space-y-6"
      >
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Visão Geral</TabsTrigger>
          <TabsTrigger value="scanner">
            <ScanFace className="h-4 w-4 mr-2" />
            Scanner 3D
          </TabsTrigger>
          <TabsTrigger value="comparison">Antes/Depois</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Latest Measurements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Scale className="h-5 w-5" />
                Medidas Corporais Recentes
              </CardTitle>
              <CardDescription>
                Suas últimas medidas registradas
              </CardDescription>
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma medida registrada
                  </h3>
                  <p className="text-gray-500">
                    Suas medidas corporais aparecerão aqui quando forem
                    registradas.
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
                    <div
                      key={photo.id}
                      className="relative group cursor-pointer"
                    >
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
                  <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Nenhuma foto de evolução
                  </h3>
                  <p className="text-gray-500">
                    Suas fotos de progresso aparecerão aqui quando forem
                    adicionadas pelo seu personal trainer.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {Array.isArray(bodyMeasurements) && bodyMeasurements.length > 4 && (
            <Card>
              <CardHeader>
                <CardTitle>Histórico de Medidas</CardTitle>
                <CardDescription>
                  Todas as suas medidas registradas
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {bodyMeasurements.slice(4).map((measurement: any) => (
                    <div
                      key={measurement.id}
                      className="flex items-center justify-between p-3 border rounded hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                          <Ruler className="h-4 w-4 text-blue-600 dark:text-blue-400" />
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
        </TabsContent>

        <TabsContent value="scanner" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ScanFace className="h-5 w-5" />
                Scanner Corporal Virtual
              </CardTitle>
              <CardDescription>
                Insira suas medidas para gerar um avatar 3D personalizado
              </CardDescription>
            </CardHeader>
            <CardContent>
              <BodyMeasurementsForm
                onSave={handleSaveMeasurements}
                showPreview={true}
              />
            </CardContent>
          </Card>

          <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
            <h3 className="font-semibold text-blue-900 dark:text-blue-100 mb-2">
              Como funciona o Scanner 3D
            </h3>
            <ul className="space-y-2 text-sm text-blue-800 dark:text-blue-200">
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>
                  Insira suas medidas corporais nos campos do formulário
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>
                  O avatar 3D é gerado automaticamente com base nas medidas
                </span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>Use o mouse para rotacionar e zoom no modelo 3D</span>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-blue-500">•</span>
                <span>
                  Salve suas medidas para acompanhar a evolução ao longo do
                  tempo
                </span>
              </li>
            </ul>
          </div>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-6">
          <BodyAvatarComparison
            beforeMeasurements={mockBeforeMeasurements}
            afterMeasurements={mockAfterMeasurements}
          />

          <div className="bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 className="font-semibold text-green-900 dark:text-green-100 mb-2">
              Visualização Antes/Depois
            </h3>
            <p className="text-sm text-green-800 dark:text-green-200">
              Compare sua evolução corporal através dos avatares 3D lado a lado.
              As diferenças entre as medidas são destacadas com cores e
              percentuais para facilitar o acompanhamento do seu progresso.
            </p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}
