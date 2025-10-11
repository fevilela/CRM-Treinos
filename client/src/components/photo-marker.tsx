import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Trash2, ZoomIn, ZoomOut, RotateCcw } from "lucide-react";

export interface Point {
  x: number; // Posição X relativa (0 a 1)
  y: number; // Posição Y relativa (0 a 1)
  label: string;
}

interface PhotoMarkerProps {
  imageUrl: string;
  points: Point[];
  onPointsChange: (points: Point[]) => void;
  availableLabels: string[];
  photoType?: string;
}

export function PhotoMarker({
  imageUrl,
  points,
  onPointsChange,
  availableLabels,
  photoType = "front",
}: PhotoMarkerProps) {
  const [currentLabel, setCurrentLabel] = useState<string>(
    availableLabels[0] || ""
  );
  const [zoom, setZoom] = useState(1);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Atualiza o label atual quando os labels disponíveis mudam
  useEffect(() => {
    if (availableLabels.length > 0 && !currentLabel) {
      setCurrentLabel(availableLabels[0]);
    }
  }, [availableLabels, currentLabel]);

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !currentLabel) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    // Verifica se já existe um ponto com este label
    const existingPointIndex = points.findIndex(
      (p) => p.label === currentLabel
    );

    if (existingPointIndex >= 0) {
      // Atualiza o ponto existente
      const newPoints = [...points];
      newPoints[existingPointIndex] = { x, y, label: currentLabel };
      onPointsChange(newPoints);
    } else {
      // Adiciona novo ponto
      onPointsChange([...points, { x, y, label: currentLabel }]);
    }

    // Avança para o próximo label disponível
    const currentIndex = availableLabels.indexOf(currentLabel);
    if (currentIndex < availableLabels.length - 1) {
      setCurrentLabel(availableLabels[currentIndex + 1]);
    }
  };

  const handleRemovePoint = (label: string) => {
    onPointsChange(points.filter((p) => p.label !== label));
  };

  const handleClearAll = () => {
    onPointsChange([]);
    setCurrentLabel(availableLabels[0] || "");
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium">Marcar:</span>
          <select
            value={currentLabel}
            onChange={(e) => setCurrentLabel(e.target.value)}
            className="border rounded px-2 py-1 text-sm bg-background"
            data-testid="select-current-label"
          >
            {availableLabels.map((label) => {
              const hasPoint = points.some((p) => p.label === label);
              return (
                <option key={label} value={label}>
                  {label} {hasPoint ? "✓" : ""}
                </option>
              );
            })}
          </select>
        </div>

        <div className="flex items-center gap-1 ml-auto">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            data-testid="button-zoom-out"
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleResetZoom}
            data-testid="button-reset-zoom"
          >
            <RotateCcw className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            data-testid="button-zoom-in"
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleClearAll}
            disabled={points.length === 0}
            data-testid="button-clear-all"
          >
            <Trash2 className="h-4 w-4 mr-1" />
            Limpar Tudo
          </Button>
        </div>
      </div>

      {/* Imagem com marcadores */}
      <Card>
        <CardContent className="p-4">
          <div
            ref={containerRef}
            className="relative overflow-auto max-h-[600px] border rounded cursor-crosshair"
            onClick={handleImageClick}
            data-testid="container-photo-marker"
          >
            <img
              ref={imageRef}
              src={imageUrl}
              alt={`Foto ${photoType}`}
              className="max-w-full h-auto select-none"
              style={{
                transform: `scale(${zoom})`,
                transformOrigin: "top left",
              }}
              draggable={false}
              data-testid="img-posture-photo"
            />
            {points.map((point, index) => {
              if (!imageRef.current) return null;
              const rect = imageRef.current.getBoundingClientRect();
              const imgWidth = imageRef.current.offsetWidth * zoom;
              const imgHeight = imageRef.current.offsetHeight * zoom;

              return (
                <div
                  key={index}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${point.x * imgWidth}px`,
                    top: `${point.y * imgHeight}px`,
                  }}
                  data-testid={`marker-${point.label}`}
                >
                  <div className="relative">
                    <div className="w-4 h-4 bg-blue-500 rounded-full border-2 border-white shadow-lg" />
                    <div className="absolute top-5 left-1/2 -translate-x-1/2 bg-black/80 text-white text-xs px-2 py-1 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
                      {point.label}
                    </div>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemovePoint(point.label);
                      }}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                      data-testid={`button-remove-${point.label}`}
                    >
                      ×
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de pontos marcados */}
      {points.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 text-sm">Pontos marcados:</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {points.map((point, index) => (
                <div
                  key={index}
                  className="flex items-center justify-between text-xs bg-muted p-2 rounded"
                  data-testid={`point-info-${point.label}`}
                >
                  <span>{point.label}</span>
                  <button
                    onClick={() => handleRemovePoint(point.label)}
                    className="text-red-500 hover:text-red-700 ml-2"
                    data-testid={`button-remove-point-${point.label}`}
                  >
                    <Trash2 className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
