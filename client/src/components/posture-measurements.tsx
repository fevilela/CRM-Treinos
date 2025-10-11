import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { PostureMeasurement } from "@shared/schema";

interface PostureMeasurementsProps {
  measurements: PostureMeasurement[];
}

// Tradução dos tipos de medição
const measurementTypeLabels: Record<string, string> = {
  head_vertical_alignment: "Alinhamento vertical da cabeça",
  head_horizontal_level: "Nivelamento horizontal da cabeça",
  shoulders_horizontal_level: "Nivelamento horizontal dos ombros",
  trunk_vertical_alignment: "Alinhamento vertical do tronco",
  pelvis_horizontal_level: "Nivelamento horizontal da pelve",
  femur_horizontal_level: "Nivelamento horizontal do fêmur",
  tibia_horizontal_level: "Nivelamento horizontal da tíbia",
  knees_valgus_varus_symmetry: "Simetria do alinhamento valgo/varo dos joelhos",
};

// Tradução dos status
const statusLabels: Record<string, string> = {
  acceptable: "Aceitável",
  moderate: "Moderado",
  severe: "Elevado",
};

// Cores dos badges baseadas no status
const statusColors: Record<string, string> = {
  acceptable: "bg-green-500 hover:bg-green-600",
  moderate: "bg-yellow-500 hover:bg-yellow-600",
  severe: "bg-red-500 hover:bg-red-600",
};

// Cores de fundo do card baseadas no status
const statusBgColors: Record<string, string> = {
  acceptable:
    "bg-green-50 dark:bg-green-950/20 border-green-200 dark:border-green-900",
  moderate:
    "bg-yellow-50 dark:bg-yellow-950/20 border-yellow-200 dark:border-yellow-900",
  severe: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900",
};

export function PostureMeasurements({
  measurements,
}: PostureMeasurementsProps) {
  if (!measurements || measurements.length === 0) {
    return (
      <Card data-testid="card-no-measurements">
        <CardContent className="py-6">
          <p
            className="text-center text-muted-foreground"
            data-testid="text-no-measurements"
          >
            Nenhuma medição registrada ainda
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {measurements.map((measurement) => (
        <Card
          key={measurement.id}
          className={statusBgColors[measurement.status]}
          data-testid={`card-measurement-${measurement.measurementType}`}
        >
          <CardHeader className="pb-3">
            <div className="flex items-start justify-between">
              <CardTitle className="text-base font-medium">
                {measurementTypeLabels[measurement.measurementType] ||
                  measurement.measurementType}
              </CardTitle>
              <Badge
                className={`${statusColors[measurement.status]} text-white`}
                data-testid={`badge-status-${measurement.measurementType}`}
              >
                {statusLabels[measurement.status]}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex items-baseline gap-2">
                <span
                  className="text-3xl font-bold"
                  data-testid={`text-value-${measurement.measurementType}`}
                >
                  {measurement.value.toFixed(1)}°
                </span>
                {measurement.leftValue !== null &&
                  measurement.rightValue !== null && (
                    <span
                      className="text-sm text-muted-foreground"
                      data-testid={`text-asymmetry-${measurement.measurementType}`}
                    >
                      (E: {measurement.leftValue.toFixed(1)}° / D:{" "}
                      {measurement.rightValue.toFixed(1)}°)
                    </span>
                  )}
              </div>
              {measurement.photoType && (
                <p
                  className="text-xs text-muted-foreground"
                  data-testid={`text-photo-type-${measurement.measurementType}`}
                >
                  Vista:{" "}
                  {measurement.photoType === "front"
                    ? "Frontal"
                    : measurement.photoType === "back"
                    ? "Posterior"
                    : measurement.photoType === "side_left"
                    ? "Lateral Esquerda"
                    : "Lateral Direita"}
                </p>
              )}
              {measurement.notes && (
                <p
                  className="text-sm mt-2"
                  data-testid={`text-notes-${measurement.measurementType}`}
                >
                  {measurement.notes}
                </p>
              )}
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
