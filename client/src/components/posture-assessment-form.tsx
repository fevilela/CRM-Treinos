import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PhotoMarker, Point } from "@/components/photo-marker";
import { PostureMeasurements } from "@/components/posture-measurements";
import {
  calculateAllMeasurements,
  MeasurementCalculation,
} from "@/lib/posture-calculations";
import { Calculator, Save, Eye } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";
import { PostureMeasurement } from "@shared/schema";

interface PosturePhoto {
  id: string;
  photoType: "front" | "back" | "side_left" | "side_right";
  photoUrl: string;
}

interface PostureAssessmentFormProps {
  assessmentId?: string;
  photos?: PosturePhoto[];
  studentId?: string;
  onSave?: (assessmentData: any) => void;
  initialData?: {
    id?: string;
    title?: string;
    notes?: string;
    photos?: { type: string; url: string }[];
    observations?: { joint: string; observation: string; severity: string }[];
  };
  mode?: string;
}

// Labels de pontos anatômicos por tipo de foto
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

export function PostureAssessmentForm({
  assessmentId,
  photos = [],
  studentId,
  onSave,
  initialData,
  mode,
}: PostureAssessmentFormProps) {
  const [pointsByPhoto, setPointsByPhoto] = useState<Record<string, Point[]>>(
    {}
  );
  const [calculatedMeasurements, setCalculatedMeasurements] = useState<
    MeasurementCalculation[]
  >([]);
  const [activeTab, setActiveTab] = useState<string>(
    photos[0]?.photoType || "front"
  );
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const resultsRef = useRef<HTMLDivElement>(null);

  // Fetch existing measurements
  const { data: savedMeasurements = [] } = useQuery<PostureMeasurement[]>({
    queryKey: ["/api/posture-assessments", assessmentId, "measurements"],
    queryFn: async () => {
      const response = await fetch(
        `/api/posture-assessments/${assessmentId}/measurements`
      );
      if (!response.ok) throw new Error("Failed to fetch measurements");
      return response.json();
    },
  });

  // Save measurements mutation
  const saveMeasurementsMutation = useMutation({
    mutationFn: async (measurements: MeasurementCalculation[]) => {
      return apiRequest(
        `/api/posture-assessments/${assessmentId}/measurements/batch`,
        "POST",
        { measurements }
      );
    },
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["/api/posture-assessments", assessmentId, "measurements"],
      });
      toast({
        title: "Medições salvas",
        description: "As medições posturais foram salvas com sucesso.",
      });
    },
    onError: (error) => {
      toast({
        title: "Erro ao salvar",
        description: "Não foi possível salvar as medições.",
        variant: "destructive",
      });
      console.error("Error saving measurements:", error);
    },
  });

  const handlePointsChange = (photoType: string, points: Point[]) => {
    setPointsByPhoto((prev) => ({
      ...prev,
      [photoType]: points,
    }));
  };

  const handleCalculateMeasurements = () => {
    const allMeasurements: MeasurementCalculation[] = [];

    // Calcular medições para cada foto
    for (const photo of photos) {
      const points = pointsByPhoto[photo.photoType] || [];
      if (points.length > 0) {
        const measurements = calculateAllMeasurements(points, photo.photoType);
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
    toast({
      title: "Medições calculadas",
      description: `${allMeasurements.length} medições foram calculadas com sucesso.`,
    });
  };

  const handleSaveMeasurements = () => {
    if (calculatedMeasurements.length === 0) {
      toast({
        title: "Nenhuma medição para salvar",
        description: "Calcule as medições primeiro antes de salvar.",
        variant: "destructive",
      });
      return;
    }

    saveMeasurementsMutation.mutate(calculatedMeasurements);
  };

  const displayMeasurements =
    calculatedMeasurements.length > 0
      ? calculatedMeasurements
      : savedMeasurements;

  // Scroll to results when measurements are calculated
  useEffect(() => {
    if (calculatedMeasurements.length > 0) {
      resultsRef.current?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    }
  }, [calculatedMeasurements]);

  return (
    <div className="space-y-6">
      {/* Header com botões de ação */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Avaliação Postural Automática</CardTitle>
            <div className="flex gap-2">
              <Button
                onClick={handleCalculateMeasurements}
                variant="outline"
                data-testid="button-calculate-measurements"
              >
                <Calculator className="h-4 w-4 mr-2" />
                Calcular Medições
              </Button>
              <Button
                onClick={handleSaveMeasurements}
                disabled={
                  calculatedMeasurements.length === 0 ||
                  saveMeasurementsMutation.isPending
                }
                data-testid="button-save-measurements"
              >
                <Save className="h-4 w-4 mr-2" />
                {saveMeasurementsMutation.isPending
                  ? "Salvando..."
                  : "Salvar Medições"}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Marque os pontos anatômicos nas fotos para calcular automaticamente
            as medições posturais. As medições serão calculadas em graus e
            classificadas por status (aceitável, moderado, elevado).
          </p>
        </CardContent>
      </Card>

      {/* Tabs com fotos para marcação */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-4">
          {photos.map((photo) => (
            <TabsTrigger
              key={photo.photoType}
              value={photo.photoType}
              data-testid={`tab-${photo.photoType}`}
            >
              {photo.photoType === "front"
                ? "Frontal"
                : photo.photoType === "back"
                ? "Posterior"
                : photo.photoType === "side_left"
                ? "Lateral Esquerda"
                : "Lateral Direita"}
            </TabsTrigger>
          ))}
        </TabsList>

        {photos.map((photo) => (
          <TabsContent key={photo.photoType} value={photo.photoType}>
            <PhotoMarker
              imageUrl={photo.photoUrl}
              points={pointsByPhoto[photo.photoType] || []}
              onPointsChange={(points) =>
                handlePointsChange(photo.photoType, points)
              }
              availableLabels={
                anatomicalPointsByPhotoType[photo.photoType] || []
              }
              photoType={photo.photoType}
            />
          </TabsContent>
        ))}
      </Tabs>

      {/* Resultados das medições */}
      {displayMeasurements.length > 0 && (
        <div ref={resultsRef}>
          <Card>
            <CardHeader>
              <div className="flex items-center gap-2">
                <Eye className="h-5 w-5" />
                <CardTitle>
                  Resultados das Medições
                  {calculatedMeasurements.length === 0 && " (Salvos)"}
                </CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <PostureMeasurements measurements={displayMeasurements as any} />
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
