import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Save } from "lucide-react";
import type { PostureAssessment } from "@shared/schema";
import { PhotoWithGrid, JointObservation } from "@/components/photo-with-grid";

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
}

const PHOTO_TYPES: { value: PhotoType; label: string }[] = [
  { value: "front", label: "Vista Frontal" },
  { value: "back", label: "Vista Posterior" },
  { value: "side_left", label: "Vista Lateral Esquerda" },
  { value: "side_right", label: "Vista Lateral Direita" },
];

export function PostureAssessmentCreationForm({
  studentId,
  onSave,
}: PostureAssessmentCreationFormProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<Record<PhotoType, PhotoUpload>>({
    front: { type: "front", file: null, preview: null, observations: [] },
    back: { type: "back", file: null, preview: null, observations: [] },
    side_left: {
      type: "side_left",
      file: null,
      preview: null,
      observations: [],
    },
    side_right: {
      type: "side_right",
      file: null,
      preview: null,
      observations: [],
    },
  });
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
          },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setPhotos((prev) => ({
        ...prev,
        [type]: { type, file: null, preview: null, observations: [] },
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

  const handleRemovePhoto = (type: PhotoType) => {
    setPhotos((prev) => ({
      ...prev,
      [type]: { type, file: null, preview: null, observations: [] },
    }));
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Informações básicas */}
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

      {/* Fotos posturais */}
      {PHOTO_TYPES.map((photoType) => {
        const photo = photos[photoType.value];

        return (
          <Card key={photoType.value}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Foto {photoType.label}</span>
                {photo.file && (
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePhoto(photoType.value)}
                    data-testid={`button-remove-${photoType.value}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover Foto
                  </Button>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              {!photo.preview ? (
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
                  <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
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
                <PhotoWithGrid
                  imageUrl={photo.preview}
                  photoType={photoType.value}
                  observations={photo.observations}
                  onObservationsChange={(observations) =>
                    handleObservationsChange(photoType.value, observations)
                  }
                />
              )}
            </CardContent>
          </Card>
        );
      })}

      {/* Resumo */}
      {Object.values(photos).some((p) => p.file) && (
        <Card>
          <CardHeader>
            <CardTitle>Resumo da Avaliação</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <div className="font-medium">Fotos Adicionadas</div>
                <div className="text-2xl font-bold text-blue-600">
                  {Object.values(photos).filter((p) => p.file).length}
                </div>
              </div>
              <div>
                <div className="font-medium">Total de Observações</div>
                <div className="text-2xl font-bold text-orange-600">
                  {totalObservations}
                </div>
              </div>
              <div>
                <div className="font-medium">Problemas Severos</div>
                <div className="text-2xl font-bold text-red-600">
                  {Object.values(photos).reduce(
                    (acc, p) =>
                      acc +
                      p.observations.filter((o) => o.severity === "severe")
                        .length,
                    0
                  )}
                </div>
              </div>
              <div>
                <div className="font-medium">Problemas Moderados</div>
                <div className="text-2xl font-bold text-yellow-600">
                  {Object.values(photos).reduce(
                    (acc, p) =>
                      acc +
                      p.observations.filter((o) => o.severity === "moderate")
                        .length,
                    0
                  )}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Submit Button */}
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
