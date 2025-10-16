import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Save, Calculator, Eye } from "lucide-react";
import type { PostureAssessment } from "@shared/schema";
import { PhotoWithGrid, JointObservation } from "@/components/photo-with-grid";
import { PhotoMarker, Point } from "@/components/photo-marker";
import { PostureMeasurements } from "@/components/posture-measurements";
import {
  calculateAllMeasurements,
  MeasurementCalculation,
} from "@/lib/posture-calculations";

interface PostureImageData {
  type: string;
  base64: string;
}

interface PostureAssessmentCreationFormProps {
  studentId: string;
  onSave: (assessmentData: any) => void;
}

type PhotoType = "front" | "back" | "side_left" | "side_right";

interface PhotoUpload {
  type: PhotoType;
  file: File | null;
  preview: string | null;
  observations: JointObservation[];
  points: Point[];
}

const PHOTO_TYPES: { value: PhotoType; label: string }[] = [
  { value: "front", label: "Frontal" },
  { value: "back", label: "Posterior" },
  { value: "side_left", label: "Lateral Esq." },
  { value: "side_right", label: "Lateral Dir." },
];

const anatomicalPointsByPhotoType: Record<string, string[]> = {
  front: [
    "Topo da cabeça",
    "Queixo",
    "Orelha esquerda",
    "Orelha direita",
    "Ombro esquerdo",
    "Ombro direito",
    "C7 (base do pescoço)",
    "Centro da pelve",
    "Crista ilíaca esquerda",
    "Crista ilíaca direita",
    "Joelho esquerdo",
    "Joelho direito",
    "Tornozelo esquerdo",
    "Tornozelo direito",
    "Quadril esquerdo",
    "Quadril direito",
  ],
  side_left: [
    "Topo da cabeça",
    "Queixo",
    "C7 (base do pescoço)",
    "Centro da pelve",
    "Quadril esquerdo",
    "Joelho esquerdo",
    "Tornozelo esquerdo",
  ],
  side_right: [
    "Topo da cabeça",
    "Queixo",
    "C7 (base do pescoço)",
    "Centro da pelve",
    "Quadril direito",
    "Joelho direito",
    "Tornozelo direito",
  ],
  back: [
    "Topo da cabeça",
    "Ombro esquerdo",
    "Ombro direito",
    "Crista ilíaca esquerda",
    "Crista ilíaca direita",
    "Joelho esquerdo",
    "Joelho direito",
    "Tornozelo esquerdo",
    "Tornozelo direito",
  ],
};

export function PostureAssessmentCreationForm({
  studentId,
  onSave,
}: PostureAssessmentCreationFormProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [activeTab, setActiveTab] = useState<PhotoType | "info" | "summary">(
    "info"
  );
  const [photos, setPhotos] = useState<Record<PhotoType, PhotoUpload>>({
    front: {
      type: "front",
      file: null,
      preview: null,
      observations: [],
      points: [],
    },
    back: {
      type: "back",
      file: null,
      preview: null,
      observations: [],
      points: [],
    },
    side_left: {
      type: "side_left",
      file: null,
      preview: null,
      observations: [],
      points: [],
    },
    side_right: {
      type: "side_right",
      file: null,
      preview: null,
      observations: [],
      points: [],
    },
  });
  const [calculatedMeasurements, setCalculatedMeasurements] = useState<
    MeasurementCalculation[]
  >([]);
  const [showMeasurements, setShowMeasurements] = useState(false);
  const { toast } = useToast();

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      notes: string;
      photoUploads: PhotoUpload[];
    }) => {
      const allObservations = data.photoUploads.flatMap((photo) =>
        photo.observations.map((obs) => ({
          ...obs,
          photoType: photo.type,
        }))
      );

      const photoDataPromises = data.photoUploads.map(async (photoUpload) => {
        if (!photoUpload.file) return null;

        return new Promise<PostureImageData>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve({
              type: photoUpload.type,
              base64,
            });
          };
          reader.readAsDataURL(photoUpload.file!);
        });
      });

      const photoDataResults = await Promise.all(photoDataPromises);
      const photos = photoDataResults.filter(
        (p): p is PostureImageData => p !== null
      );

      const response = await fetch("/api/posture-assessments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          studentId,
          title: data.title,
          notes: data.notes,
          photos,
          observations: allObservations,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to create assessment");
      }

      const assessment = (await response.json()) as PostureAssessment;
      return assessment;
    },
    onSuccess: (data) => {
      toast({
        title: "Avaliação criada",
        description: "A avaliação postural foi criada com sucesso.",
      });
      onSave(data);
    },
    onError: (error) => {
      toast({
        title: "Erro ao criar avaliação",
        description: "Não foi possível criar a avaliação postural.",
        variant: "destructive",
      });
      console.error("Error creating assessment:", error);
    },
  });

  const handlePhotoSelect = (type: PhotoType, file: File | null) => {
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setPhotos((prev) => ({
          ...prev,
          [type]: {
            type,
            file,
            preview: reader.result as string,
            observations: prev[type].observations,
            points: prev[type].points,
          },
        }));
        setActiveTab(type);
      };
      reader.readAsDataURL(file);
    } else {
      setPhotos((prev) => ({
        ...prev,
        [type]: {
          type,
          file: null,
          preview: null,
          observations: [],
          points: [],
        },
      }));
    }
  };

  const handleObservationsChange = (
    type: PhotoType,
    observations: JointObservation[]
  ) => {
    setPhotos((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        observations,
      },
    }));
  };

  const handlePointsChange = (type: PhotoType, points: Point[]) => {
    setPhotos((prev) => ({
      ...prev,
      [type]: {
        ...prev[type],
        points,
      },
    }));
  };

  const handleRemovePhoto = (type: PhotoType) => {
    setPhotos((prev) => ({
      ...prev,
      [type]: { type, file: null, preview: null, observations: [], points: [] },
    }));
  };

  const handleCalculateMeasurements = () => {
    const allMeasurements: MeasurementCalculation[] = [];

    for (const photo of Object.values(photos)) {
      if (photo.points.length > 0) {
        const measurements = calculateAllMeasurements(photo.points, photo.type);
        allMeasurements.push(...measurements);
      }
    }

    if (allMeasurements.length === 0) {
      toast({
        title: "Nenhuma medição calculada",
        description:
          "Marque os pontos anatômicos nas fotos para calcular as medições.",
        variant: "destructive",
      });
      return;
    }

    setCalculatedMeasurements(allMeasurements);
    setShowMeasurements(true);
    setActiveTab("summary");
    toast({
      title: "Medições calculadas",
      description: `${allMeasurements.length} medições foram calculadas com sucesso.`,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!title.trim()) {
      toast({
        title: "Título obrigatório",
        description: "Por favor, informe um título para a avaliação.",
        variant: "destructive",
      });
      return;
    }

    const uploadedPhotos = Object.values(photos).filter((p) => p.file !== null);

    if (uploadedPhotos.length === 0) {
      toast({
        title: "Fotos obrigatórias",
        description: "Por favor, adicione pelo menos uma foto postural.",
        variant: "destructive",
      });
      return;
    }

    createAssessmentMutation.mutate({
      title,
      notes,
      photoUploads: uploadedPhotos,
    });
  };

  const totalObservations = Object.values(photos).reduce(
    (acc, p) => acc + p.observations.length,
    0
  );

  const totalPoints = Object.values(photos).reduce(
    (acc, p) => acc + p.points.length,
    0
  );

  const uploadedPhotosCount = Object.values(photos).filter(
    (p) => p.file
  ).length;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as any)}
      >
        <TabsList className="grid w-full grid-cols-6">
          <TabsTrigger value="info" data-testid="tab-info">
            Informações
          </TabsTrigger>
          {PHOTO_TYPES.map((photoType) => (
            <TabsTrigger
              key={photoType.value}
              value={photoType.value}
              data-testid={`tab-${photoType.value}`}
              className="relative"
            >
              {photoType.label}
              {photos[photoType.value].file && (
                <span className="absolute -top-1 -right-1 w-2 h-2 bg-green-500 rounded-full" />
              )}
            </TabsTrigger>
          ))}
          <TabsTrigger value="summary" data-testid="tab-summary">
            Resumo
          </TabsTrigger>
        </TabsList>

        <TabsContent value="info" className="space-y-4 mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Informações da Avaliação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="title" data-testid="label-title">
                  Título da Avaliação *
                </Label>
                <Input
                  id="title"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Ex: Avaliação Postural Inicial - Janeiro 2025"
                  data-testid="input-title"
                  required
                />
              </div>
              <div>
                <Label htmlFor="notes" data-testid="label-notes">
                  Observações Gerais
                </Label>
                <Textarea
                  id="notes"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Adicione observações gerais sobre a avaliação..."
                  rows={4}
                  data-testid="textarea-notes"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {PHOTO_TYPES.map((photoType) => {
          const photo = photos[photoType.value];

          return (
            <TabsContent
              key={photoType.value}
              value={photoType.value}
              className="mt-4"
            >
              <Card>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle>Foto {photoType.label}</CardTitle>
                    {photo.file && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleRemovePhoto(photoType.value)}
                        data-testid={`button-remove-${photoType.value}`}
                      >
                        <X className="h-4 w-4 mr-1" />
                        Remover
                      </Button>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  {!photo.preview ? (
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-12 text-center">
                      <Upload className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                      <Label
                        htmlFor={`upload-${photoType.value}`}
                        className="cursor-pointer"
                      >
                        <div className="text-sm text-muted-foreground mb-4">
                          Clique para fazer upload da foto{" "}
                          {photoType.label.toLowerCase()}
                        </div>
                        <Button type="button" variant="outline" asChild>
                          <span>
                            <Upload className="h-4 w-4 mr-2" />
                            Selecionar Foto
                          </span>
                        </Button>
                      </Label>
                      <Input
                        id={`upload-${photoType.value}`}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handlePhotoSelect(photoType.value, file);
                        }}
                        data-testid={`input-upload-${photoType.value}`}
                      />
                    </div>
                  ) : (
                    <Tabs defaultValue="observations" className="w-full">
                      <TabsList className="grid w-full grid-cols-2">
                        <TabsTrigger value="observations">
                          Observações Posturais
                        </TabsTrigger>
                        <TabsTrigger value="measurements">
                          Pontos para Medições
                        </TabsTrigger>
                      </TabsList>
                      <TabsContent value="observations" className="mt-4">
                        <PhotoWithGrid
                          imageUrl={photo.preview}
                          photoType={photoType.value}
                          observations={photo.observations}
                          onObservationsChange={(observations) =>
                            handleObservationsChange(
                              photoType.value,
                              observations
                            )
                          }
                        />
                      </TabsContent>
                      <TabsContent value="measurements" className="mt-4">
                        <PhotoMarker
                          imageUrl={photo.preview}
                          photoType={photoType.value}
                          points={photo.points}
                          onPointsChange={(points) =>
                            handlePointsChange(photoType.value, points)
                          }
                          availableLabels={
                            anatomicalPointsByPhotoType[photoType.value] || []
                          }
                        />
                      </TabsContent>
                    </Tabs>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          );
        })}

        <TabsContent value="summary" className="mt-4">
          <Card>
            <CardHeader>
              <CardTitle>Resumo da Avaliação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
                  <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                    Fotos
                  </div>
                  <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                    {uploadedPhotosCount}
                  </div>
                </div>
                <div className="text-center p-4 bg-orange-50 dark:bg-orange-950 rounded-lg">
                  <div className="text-sm font-medium text-orange-600 dark:text-orange-400">
                    Observações
                  </div>
                  <div className="text-3xl font-bold text-orange-700 dark:text-orange-300">
                    {totalObservations}
                  </div>
                </div>
                <div className="text-center p-4 bg-purple-50 dark:bg-purple-950 rounded-lg">
                  <div className="text-sm font-medium text-purple-600 dark:text-purple-400">
                    Pontos Marcados
                  </div>
                  <div className="text-3xl font-bold text-purple-700 dark:text-purple-300">
                    {totalPoints}
                  </div>
                </div>
                <div className="text-center p-4 bg-green-50 dark:bg-green-950 rounded-lg">
                  <div className="text-sm font-medium text-green-600 dark:text-green-400">
                    Medições
                  </div>
                  <div className="text-3xl font-bold text-green-700 dark:text-green-300">
                    {calculatedMeasurements.length}
                  </div>
                </div>
              </div>

              {totalPoints > 0 && (
                <Button
                  type="button"
                  onClick={handleCalculateMeasurements}
                  variant="outline"
                  className="w-full"
                  data-testid="button-calculate-measurements"
                >
                  <Calculator className="h-4 w-4 mr-2" />
                  Calcular Medições
                </Button>
              )}

              {showMeasurements && calculatedMeasurements.length > 0 && (
                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Eye className="h-5 w-5" />
                      <CardTitle>Medições Calculadas</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <PostureMeasurements
                      measurements={calculatedMeasurements as any}
                    />
                  </CardContent>
                </Card>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          size="lg"
          disabled={createAssessmentMutation.isPending}
          data-testid="button-create-assessment"
        >
          <Save className="h-4 w-4 mr-2" />
          {createAssessmentMutation.isPending
            ? "Criando..."
            : "Salvar Avaliação Postural"}
        </Button>
      </div>
    </form>
  );
}
