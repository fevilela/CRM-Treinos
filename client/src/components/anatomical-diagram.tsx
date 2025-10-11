import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import anatomicalFront from "@assets/stock_images/anatomical_body_diag_f413f654.jpg";
import anatomicalBack from "@assets/stock_images/anatomical_body_diag_8c7df5fd.jpg";
import anatomicalSide from "@assets/stock_images/anatomical_body_diag_8815d377.jpg";

interface Observation {
  joint: string;
  observation: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  photoType?: string;
}

interface AnatomicalDiagramProps {
  observations: Observation[];
  photoType: "front" | "back" | "side_left" | "side_right";
}

const JOINTS_LABELS: Record<string, string> = {
  head: "Cabeça",
  neck: "Pescoço",
  shoulder_left: "Ombro Esquerdo",
  shoulder_right: "Ombro Direito",
  spine_cervical: "Coluna Cervical",
  spine_thoracic: "Coluna Torácica",
  spine_lumbar: "Coluna Lombar",
  hip_left: "Quadril Esquerdo",
  hip_right: "Quadril Direito",
  knee_left: "Joelho Esquerdo",
  knee_right: "Joelho Direito",
  ankle_left: "Tornozelo Esquerdo",
  ankle_right: "Tornozelo Direito",
};

// Posições anatômicas para cada articulação (baseado no diagrama do boneco)
const JOINT_POSITIONS: Record<
  string,
  Record<string, { x: number; y: number; arrowDirection: "left" | "right" }>
> = {
  front: {
    head: { x: 50, y: 8, arrowDirection: "right" },
    neck: { x: 50, y: 16, arrowDirection: "right" },
    shoulder_left: { x: 62, y: 25, arrowDirection: "right" },
    shoulder_right: { x: 38, y: 25, arrowDirection: "left" },
    spine_cervical: { x: 50, y: 16, arrowDirection: "left" },
    spine_thoracic: { x: 50, y: 38, arrowDirection: "left" },
    spine_lumbar: { x: 50, y: 52, arrowDirection: "left" },
    hip_left: { x: 56, y: 58, arrowDirection: "right" },
    hip_right: { x: 44, y: 58, arrowDirection: "left" },
    knee_left: { x: 54, y: 78, arrowDirection: "right" },
    knee_right: { x: 46, y: 78, arrowDirection: "left" },
    ankle_left: { x: 54, y: 93, arrowDirection: "right" },
    ankle_right: { x: 46, y: 93, arrowDirection: "left" },
  },
  back: {
    head: { x: 50, y: 8, arrowDirection: "right" },
    neck: { x: 50, y: 16, arrowDirection: "right" },
    shoulder_left: { x: 38, y: 25, arrowDirection: "left" },
    shoulder_right: { x: 62, y: 25, arrowDirection: "right" },
    spine_cervical: { x: 50, y: 16, arrowDirection: "left" },
    spine_thoracic: { x: 50, y: 38, arrowDirection: "right" },
    spine_lumbar: { x: 50, y: 52, arrowDirection: "right" },
    hip_left: { x: 44, y: 58, arrowDirection: "left" },
    hip_right: { x: 56, y: 58, arrowDirection: "right" },
    knee_left: { x: 46, y: 78, arrowDirection: "left" },
    knee_right: { x: 54, y: 78, arrowDirection: "right" },
    ankle_left: { x: 46, y: 93, arrowDirection: "left" },
    ankle_right: { x: 54, y: 93, arrowDirection: "right" },
  },
  side_left: {
    head: { x: 55, y: 8, arrowDirection: "right" },
    neck: { x: 52, y: 16, arrowDirection: "right" },
    shoulder_left: { x: 48, y: 25, arrowDirection: "left" },
    spine_cervical: { x: 48, y: 16, arrowDirection: "left" },
    spine_thoracic: { x: 42, y: 38, arrowDirection: "left" },
    spine_lumbar: { x: 46, y: 52, arrowDirection: "left" },
    hip_left: { x: 50, y: 58, arrowDirection: "right" },
    knee_left: { x: 50, y: 78, arrowDirection: "right" },
    ankle_left: { x: 50, y: 93, arrowDirection: "right" },
  },
  side_right: {
    head: { x: 45, y: 8, arrowDirection: "left" },
    neck: { x: 48, y: 16, arrowDirection: "left" },
    shoulder_right: { x: 52, y: 25, arrowDirection: "right" },
    spine_cervical: { x: 52, y: 16, arrowDirection: "right" },
    spine_thoracic: { x: 58, y: 38, arrowDirection: "right" },
    spine_lumbar: { x: 54, y: 52, arrowDirection: "right" },
    hip_right: { x: 50, y: 58, arrowDirection: "left" },
    knee_right: { x: 50, y: 78, arrowDirection: "left" },
    ankle_right: { x: 50, y: 93, arrowDirection: "left" },
  },
};

const SEVERITY_COLORS: Record<string, string> = {
  severe: "#DC2626",
  moderate: "#F59E0B",
  mild: "#10B981",
  normal: "#6B7280",
};

export function AnatomicalDiagram({
  observations,
  photoType,
}: AnatomicalDiagramProps) {
  // Mapear tipo de foto para anatomia
  const anatomyType = photoType.startsWith("side") ? photoType : photoType;
  const diagramImage =
    photoType === "front"
      ? anatomicalFront
      : photoType === "back"
      ? anatomicalBack
      : anatomicalSide;

  // Filtrar observações relevantes para este tipo de foto
  const relevantObservations = observations.filter(
    (obs) =>
      !obs.photoType ||
      obs.photoType === photoType ||
      (photoType.startsWith("side") && obs.photoType?.startsWith("side"))
  );

  const photoTypeLabel =
    photoType === "front"
      ? "Visão Frontal"
      : photoType === "back"
      ? "Visão Posterior"
      : photoType === "side_left"
      ? "Visão Lateral Esquerda"
      : "Visão Lateral Direita";

  return (
    <Card data-testid={`anatomical-diagram-${photoType}`}>
      <CardHeader>
        <CardTitle className="text-lg">{photoTypeLabel}</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="relative">
          {/* Diagrama anatômico */}
          <div className="relative w-full max-w-md mx-auto">
            <img
              src={diagramImage}
              alt={`Diagrama anatômico - ${photoTypeLabel}`}
              className="w-full h-auto"
              data-testid={`diagram-image-${photoType}`}
            />

            {/* SVG overlay para setas */}
            <svg
              className="absolute top-0 left-0 w-full h-full pointer-events-none"
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
            >
              {relevantObservations.map((obs, index) => {
                const position = JOINT_POSITIONS[anatomyType]?.[obs.joint];
                if (!position) return null;

                const { x, y, arrowDirection } = position;
                const color = SEVERITY_COLORS[obs.severity] || "#6B7280";

                // Calcular ponto final da seta (para fora do corpo)
                const arrowLength = 15;
                const endX =
                  arrowDirection === "right"
                    ? x + arrowLength
                    : x - arrowLength;

                return (
                  <g key={`${obs.joint}-${index}`}>
                    {/* Linha da seta */}
                    <line
                      x1={x}
                      y1={y}
                      x2={endX}
                      y2={y}
                      stroke={color}
                      strokeWidth="0.8"
                      markerEnd={`url(#arrowhead-${obs.severity}-${index})`}
                    />

                    {/* Definição da ponta da seta */}
                    <defs>
                      <marker
                        id={`arrowhead-${obs.severity}-${index}`}
                        markerWidth="10"
                        markerHeight="10"
                        refX="5"
                        refY="3"
                        orient="auto"
                      >
                        <polygon
                          points="0 0, 6 3, 0 6"
                          fill={color}
                          transform={
                            arrowDirection === "left" ? "rotate(180, 3, 3)" : ""
                          }
                        />
                      </marker>
                    </defs>

                    {/* Círculo no ponto de origem */}
                    <circle cx={x} cy={y} r="1.2" fill={color} />

                    {/* Número da observação */}
                    <circle
                      cx={endX + (arrowDirection === "right" ? 3 : -3)}
                      cy={y}
                      r="2.5"
                      fill={color}
                    />
                    <text
                      x={endX + (arrowDirection === "right" ? 3 : -3)}
                      y={y}
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fill="white"
                      fontSize="2.5"
                      fontWeight="bold"
                    >
                      {index + 1}
                    </text>
                  </g>
                );
              })}
            </svg>
          </div>

          {/* Lista de observações */}
          {relevantObservations.length > 0 && (
            <div className="mt-4 space-y-2">
              <h4 className="font-semibold text-sm text-gray-700">
                Observações:
              </h4>
              {relevantObservations.map((obs, index) => (
                <div
                  key={`${obs.joint}-${index}`}
                  className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg"
                  data-testid={`observation-${index}`}
                >
                  <div
                    className="flex-shrink-0 w-6 h-6 rounded-full flex items-center justify-center text-white text-xs font-bold"
                    style={{
                      backgroundColor: SEVERITY_COLORS[obs.severity],
                    }}
                  >
                    {index + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="font-medium text-sm text-gray-900">
                      {JOINTS_LABELS[obs.joint] || obs.joint}
                    </div>
                    <div className="text-sm text-gray-600">
                      {obs.observation}
                    </div>
                    <Badge
                      variant={
                        obs.severity === "severe"
                          ? "destructive"
                          : obs.severity === "moderate"
                          ? "default"
                          : "secondary"
                      }
                      className="mt-1"
                    >
                      {obs.severity === "normal"
                        ? "Normal"
                        : obs.severity === "mild"
                        ? "Leve"
                        : obs.severity === "moderate"
                        ? "Moderado"
                        : "Severo"}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          )}

          {relevantObservations.length === 0 && (
            <p className="text-sm text-gray-500 text-center mt-4">
              Nenhuma observação registrada para esta vista
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
