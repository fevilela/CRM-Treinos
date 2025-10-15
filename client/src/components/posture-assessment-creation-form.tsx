import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { Upload, Plus, X, Save } from "lucide-react";
import type { PostureAssessment } from "@shared/schema";

interface PostureAssessmentCreationFormProps {
  studentId: string;
  onSave: (assessmentData: any) => void;
}

type PhotoType = "front" | "back" | "side_left" | "side_right";

interface PhotoUpload {
  type: PhotoType;
  file: File | null;
  preview: string | null;
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
    front: { type: "front", file: null, preview: null },
    back: { type: "back", file: null, preview: null },
    side_left: { type: "side_left", file: null, preview: null },
    side_right: { type: "side_right", file: null, preview: null },
  });
  const { toast } = useToast();

  const createAssessmentMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      notes: string;
      photoUploads: PhotoUpload[];
    }) => {
      // First create the assessment
      const response = await apiRequest("POST", "/api/posture-assessments", {
        studentId,
        title: data.title,
        notes: data.notes,
      });

      const assessment = (await response.json()) as PostureAssessment;

      // Then upload photos one by one
      const uploadPromises = data.photoUploads.map(async (photoUpload) => {
        if (!photoUpload.file) return;

        const formData = new FormData();
        formData.append("photo", photoUpload.file);
        formData.append("assessmentId", assessment.id);
        formData.append("photoType", photoUpload.type);

        const response = await fetch("/api/posture-photos", {
          method: "POST",
          body: formData,
          credentials: "include",
        });

        if (!response.ok) {
          throw new Error(`Failed to upload ${photoUpload.type} photo`);
        }

        return response.json();
      });

      await Promise.all(uploadPromises);

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
          },
        }));
      };
      reader.readAsDataURL(file);
    } else {
      setPhotos((prev) => ({
        ...prev,
        [type]: { type, file: null, preview: null },
      }));
    }
  };

  const handleRemovePhoto = (type: PhotoType) => {
    setPhotos((prev) => ({
      ...prev,
      [type]: { type, file: null, preview: null },
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

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <Card>
        <CardHeader>
          <CardTitle>Informações Básicas</CardTitle>
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
              placeholder="Ex: Avaliação Postural Inicial"
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

      {/* Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Fotos Posturais *</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4">
            Adicione fotos do aluno nas diferentes posições. Você poderá marcar
            pontos anatômicos após criar a avaliação.
          </p>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {PHOTO_TYPES.map((photoType) => {
              const photo = photos[photoType.value];
              return (
                <div
                  key={photoType.value}
                  className="border-2 border-dashed border-gray-300 rounded-lg p-4 hover:border-gray-400 transition-colors"
                >
                  <div className="text-sm font-medium mb-2">
                    {photoType.label}
                  </div>
                  {photo.preview ? (
                    <div className="relative">
                      <img
                        src={photo.preview}
                        alt={photoType.label}
                        className="w-full h-48 object-cover rounded-md"
                      />
                      <Button
                        type="button"
                        size="sm"
                        variant="destructive"
                        className="absolute top-2 right-2"
                        onClick={() => handleRemovePhoto(photoType.value)}
                        data-testid={`button-remove-${photoType.value}`}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-48 bg-gray-50 rounded-md">
                      <Upload className="h-8 w-8 text-gray-400 mb-2" />
                      <Input
                        type="file"
                        accept="image/*"
                        onChange={(e) =>
                          handlePhotoSelect(
                            photoType.value,
                            e.target.files?.[0] || null
                          )
                        }
                        className="hidden"
                        id={`photo-${photoType.value}`}
                        data-testid={`input-photo-${photoType.value}`}
                      />
                      <Label
                        htmlFor={`photo-${photoType.value}`}
                        className="cursor-pointer text-sm text-blue-600 hover:text-blue-800"
                      >
                        Selecionar Foto
                      </Label>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Submit Button */}
      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          disabled={createAssessmentMutation.isPending}
          data-testid="button-create-assessment"
        >
          <Save className="h-4 w-4 mr-2" />
          {createAssessmentMutation.isPending
            ? "Criando..."
            : "Criar Avaliação"}
        </Button>
      </div>
    </form>
  );
}
