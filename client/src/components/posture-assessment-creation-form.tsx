import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Upload, X, Save, Image as ImageIcon } from "lucide-react";
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
  id: string;
  type: PhotoType;
  file: File;
  preview: string;
  observations: JointObservation[];
}

const PHOTO_TYPES: { value: PhotoType; label: string }[] = [
  { value: "front", label: "Frontal" },
  { value: "back", label: "Posterior" },
  { value: "side_left", label: "Lateral Esquerda" },
  { value: "side_right", label: "Lateral Direita" },
];

export function PostureAssessmentCreationForm({
  studentId,
  onSave,
}: PostureAssessmentCreationFormProps) {
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [photos, setPhotos] = useState<PhotoUpload[]>([]);
  const [selectedPhotoType, setSelectedPhotoType] =
    useState<PhotoType>("front");
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
        return new Promise<PostureImageData>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => {
            const base64 = (reader.result as string).split(",")[1];
            resolve({
              type: photoUpload.type,
              base64,
            });
          };
          reader.readAsDataURL(photoUpload.file);
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
    onSuccess: (assessment) => {
      toast({
        title: "Avaliação criada",
        description: "A avaliação postural foi criada com sucesso.",
      });
      onSave(assessment);
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

  const handlePhotoSelect = (file: File) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const newPhoto: PhotoUpload = {
        id: Math.random().toString(36).substr(2, 9),
        type: selectedPhotoType,
        file,
        preview: reader.result as string,
        observations: [],
      };
      setPhotos((prev) => [...prev, newPhoto]);
    };
    reader.readAsDataURL(file);
  };

  const handleObservationsChange = (
    photoId: string,
    observations: JointObservation[]
  ) => {
    setPhotos((prev) =>
      prev.map((photo) =>
        photo.id === photoId ? { ...photo, observations } : photo
      )
    );
  };

  const handleRemovePhoto = (photoId: string) => {
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId));
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

    if (photos.length === 0) {
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
      photoUploads: photos,
    });
  };

  const totalObservations = photos.reduce(
    (acc, p) => acc + p.observations.length,
    0
  );

  const getPhotoTypeLabel = (type: PhotoType) => {
    return PHOTO_TYPES.find((pt) => pt.value === type)?.label || type;
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
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

      {/* Upload único com seletor de tipo */}
      <Card>
        <CardHeader>
          <CardTitle>Adicionar Fotos Posturais</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="photo-type">Tipo de Foto</Label>
              <Select
                value={selectedPhotoType}
                onValueChange={(value) =>
                  setSelectedPhotoType(value as PhotoType)
                }
              >
                <SelectTrigger id="photo-type" data-testid="select-photo-type">
                  <SelectValue placeholder="Selecione o tipo de foto" />
                </SelectTrigger>
                <SelectContent>
                  {PHOTO_TYPES.map((type) => (
                    <SelectItem key={type.value} value={type.value}>
                      {type.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="upload-photo" className="block mb-2">
                Selecionar Foto
              </Label>
              <Label htmlFor="upload-photo" className="cursor-pointer">
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-blue-400 transition-colors">
                  <Upload className="h-10 w-10 text-gray-400 mx-auto mb-2" />
                  <div className="text-sm text-muted-foreground">
                    Clique para selecionar a foto{" "}
                    {getPhotoTypeLabel(selectedPhotoType).toLowerCase()}
                  </div>
                </div>
              </Label>
              <Input
                id="upload-photo"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) {
                    handlePhotoSelect(file);
                    e.target.value = "";
                  }
                }}
                data-testid="input-upload-photo"
              />
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            💡 Dica: Selecione o tipo de foto e clique para fazer upload. Você
            pode adicionar múltiplas fotos de diferentes ângulos.
          </p>
        </CardContent>
      </Card>

      {/* Fotos adicionadas aparecem abaixo */}
      {photos.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">
            Fotos Adicionadas ({photos.length})
          </h3>
          {photos.map((photo) => (
            <Card key={photo.id}>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <ImageIcon className="h-5 w-5" />
                    <CardTitle className="text-base">
                      Foto {getPhotoTypeLabel(photo.type)}
                    </CardTitle>
                  </div>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemovePhoto(photo.id)}
                    data-testid={`button-remove-${photo.id}`}
                  >
                    <X className="h-4 w-4 mr-1" />
                    Remover
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <PhotoWithGrid
                  imageUrl={photo.preview}
                  photoType={photo.type}
                  observations={photo.observations}
                  onObservationsChange={(observations) =>
                    handleObservationsChange(photo.id, observations)
                  }
                />
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>Resumo da Avaliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 dark:bg-blue-950 rounded-lg">
              <div className="text-sm font-medium text-blue-600 dark:text-blue-400">
                Fotos
              </div>
              <div className="text-3xl font-bold text-blue-700 dark:text-blue-300">
                {photos.length}
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
          </div>
        </CardContent>
      </Card>

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
