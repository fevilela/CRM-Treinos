import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useMutation } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { Save } from "lucide-react";
import { PhotoWithGrid, JointObservation } from "@/components/photo-with-grid";

interface PosturePhoto {
  id: string;
  photoType: "front" | "back" | "side_left" | "side_right";
  photoUrl: string;
}

interface PostureObservation {
  id: string;
  joint: string;
  observation: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  photoType: "front" | "back" | "side_left" | "side_right";
}

interface PostureAssessmentEditFormProps {
  assessmentId: string;
  initialTitle: string;
  initialNotes?: string;
  photos: PosturePhoto[];
  observations: PostureObservation[];
  onSave: () => void;
}

const PHOTO_TYPE_LABELS: Record<string, string> = {
  front: "Frontal",
  back: "Posterior",
  side_left: "Lateral Esquerda",
  side_right: "Lateral Direita",
};

export function PostureAssessmentEditForm({
  assessmentId,
  initialTitle,
  initialNotes = "",
  photos,
  observations,
  onSave,
}: PostureAssessmentEditFormProps) {
  const [title, setTitle] = useState(initialTitle);
  const [notes, setNotes] = useState(initialNotes);

  const [photoObservations, setPhotoObservations] = useState<
    Record<string, JointObservation[]>
  >(() => {
    const grouped: Record<string, JointObservation[]> = {};

    observations.forEach((obs) => {
      const photoObs: JointObservation = {
        id: obs.id,
        joint: obs.joint,
        observation: obs.observation,
        severity: obs.severity,
        x: 0.5,
        y: 0.5,
      };

      const photoType = obs.photoType;
      if (!grouped[photoType]) grouped[photoType] = [];
      grouped[photoType].push(photoObs);
    });

    return grouped;
  });

  const { toast } = useToast();

  const updateAssessmentMutation = useMutation({
    mutationFn: async () => {
      const allObservations = Object.entries(photoObservations).flatMap(
        ([photoType, obs]) =>
          obs.map((o) => ({
            joint: o.joint,
            observation: o.observation,
            severity: o.severity,
            photoType,
          }))
      );

      const response = await fetch(`/api/posture-assessments/${assessmentId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          title,
          notes,
          observations: allObservations,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to update assessment");
      }

      return response.json();
    },
    onSuccess: () => {
      toast({
        title: "Avaliação atualizada",
        description: "A avaliação postural foi atualizada com sucesso.",
      });
      onSave();
    },
    onError: (error) => {
      toast({
        title: "Erro ao atualizar",
        description: "Não foi possível atualizar a avaliação postural.",
        variant: "destructive",
      });
      console.error("Error updating assessment:", error);
    },
  });

  const handleObservationsChange = (
    photoType: string,
    observations: JointObservation[]
  ) => {
    setPhotoObservations((prev) => ({
      ...prev,
      [photoType]: observations,
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

    updateAssessmentMutation.mutate();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Informações da Avaliação</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label htmlFor="edit-title" data-testid="label-edit-title">
              Título da Avaliação *
            </Label>
            <Input
              id="edit-title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Avaliação Postural Inicial - Janeiro 2025"
              data-testid="input-edit-title"
              required
            />
          </div>
          <div>
            <Label htmlFor="edit-notes" data-testid="label-edit-notes">
              Observações Gerais
            </Label>
            <Textarea
              id="edit-notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Adicione observações gerais sobre a avaliação..."
              rows={4}
              data-testid="textarea-edit-notes"
            />
          </div>
        </CardContent>
      </Card>

      {photos.map((photo) => (
        <Card key={photo.photoType}>
          <CardHeader>
            <CardTitle>Foto {PHOTO_TYPE_LABELS[photo.photoType]}</CardTitle>
          </CardHeader>
          <CardContent>
            <PhotoWithGrid
              imageUrl={photo.photoUrl}
              photoType={photo.photoType}
              observations={photoObservations[photo.photoType] || []}
              onObservationsChange={(observations) =>
                handleObservationsChange(photo.photoType, observations)
              }
            />
          </CardContent>
        </Card>
      ))}

      <div className="flex justify-end gap-2">
        <Button
          type="submit"
          size="lg"
          disabled={updateAssessmentMutation.isPending}
          data-testid="button-update-assessment"
        >
          <Save className="h-4 w-4 mr-2" />
          {updateAssessmentMutation.isPending
            ? "Salvando..."
            : "Salvar Alterações"}
        </Button>
      </div>
    </form>
  );
}
