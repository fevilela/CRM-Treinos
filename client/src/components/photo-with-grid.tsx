import { useState, useRef, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Grid3x3,
  Move,
  Plus,
  Trash2,
  ZoomIn,
  ZoomOut,
  RotateCcw,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

export interface GridConfig {
  offsetX: number;
  offsetY: number;
  cellSize: number;
  opacity: number;
  color: string;
}

export interface JointObservation {
  id: string;
  joint: string;
  observation: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  x: number;
  y: number;
}

interface PhotoWithGridProps {
  imageUrl: string;
  photoType: string;
  observations: JointObservation[];
  onObservationsChange: (observations: JointObservation[]) => void;
  readOnly?: boolean;
}

const JOINT_OPTIONS = [
  { value: "head", label: "Cabeça" },
  { value: "neck", label: "Pescoço" },
  { value: "shoulder_left", label: "Ombro Esquerdo" },
  { value: "shoulder_right", label: "Ombro Direito" },
  { value: "spine_cervical", label: "Coluna Cervical" },
  { value: "spine_thoracic", label: "Coluna Torácica" },
  { value: "spine_lumbar", label: "Coluna Lombar" },
  { value: "hip_left", label: "Quadril Esquerdo" },
  { value: "hip_right", label: "Quadril Direito" },
  { value: "knee_left", label: "Joelho Esquerdo" },
  { value: "knee_right", label: "Joelho Direito" },
  { value: "ankle_left", label: "Tornozelo Esquerdo" },
  { value: "ankle_right", label: "Tornozelo Direito" },
  { value: "custom", label: "Outro (personalizar)" },
];

const SEVERITY_OPTIONS = [
  { value: "normal", label: "Normal", color: "bg-green-500" },
  { value: "mild", label: "Leve", color: "bg-yellow-500" },
  { value: "moderate", label: "Moderado", color: "bg-orange-500" },
  { value: "severe", label: "Severo", color: "bg-red-500" },
];

export function PhotoWithGrid({
  imageUrl,
  photoType,
  observations,
  onObservationsChange,
  readOnly = false,
}: PhotoWithGridProps) {
  // Grade preta automática e fixa
  const [gridConfig, setGridConfig] = useState<GridConfig>({
    offsetX: 0,
    offsetY: 0,
    cellSize: 25, // Grade menor
    opacity: 0.8, // Bem destacada
    color: "#000000", // Grade preta fixa
  });
  const [showGrid] = useState(true); // Grade sempre visível
  const [isDraggingGrid, setIsDraggingGrid] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isAddingObservation, setIsAddingObservation] = useState(false);
  const [newObservation, setNewObservation] = useState<
    Partial<JointObservation>
  >({});
  const [showObservationDialog, setShowObservationDialog] = useState(false);
  const [customJoint, setCustomJoint] = useState("");
  const [isCustomJoint, setIsCustomJoint] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Força re-render quando a imagem carregar para mostrar a grade
  useEffect(() => {
    setImageLoaded(false);
  }, [imageUrl]);

  const handleImageLoad = () => {
    setImageLoaded(true);
  };

  const handleImageClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!imageRef.current || !isAddingObservation || readOnly) return;

    const rect = imageRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width;
    const y = (e.clientY - rect.top) / rect.height;

    setNewObservation({ ...newObservation, x, y });
    setShowObservationDialog(true);
    setIsAddingObservation(false);
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      e.preventDefault();
      setIsDraggingGrid(true);
      setDragStart({ x: e.clientX, y: e.clientY });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingGrid) return;

    const deltaX = e.clientX - dragStart.x;
    const deltaY = e.clientY - dragStart.y;

    setGridConfig((prev) => ({
      ...prev,
      offsetX: prev.offsetX + deltaX,
      offsetY: prev.offsetY + deltaY,
    }));

    setDragStart({ x: e.clientX, y: e.clientY });
  };

  const handleMouseUp = () => {
    setIsDraggingGrid(false);
  };

  const handleJointChange = (value: string) => {
    if (value === "custom") {
      setIsCustomJoint(true);
      setNewObservation({ ...newObservation, joint: "" });
    } else {
      setIsCustomJoint(false);
      setCustomJoint("");
      setNewObservation({ ...newObservation, joint: value });
    }
  };

  const handleSaveObservation = () => {
    const finalJoint = isCustomJoint ? customJoint : newObservation.joint;

    if (
      !finalJoint ||
      !newObservation.observation ||
      !newObservation.severity
    ) {
      return;
    }

    const observation: JointObservation = {
      id: Math.random().toString(36).substr(2, 9),
      joint: finalJoint,
      observation: newObservation.observation,
      severity: newObservation.severity as
        | "normal"
        | "mild"
        | "moderate"
        | "severe",
      x: newObservation.x || 0.5,
      y: newObservation.y || 0.5,
    };

    onObservationsChange([...observations, observation]);
    setShowObservationDialog(false);
    setNewObservation({});
    setCustomJoint("");
    setIsCustomJoint(false);
  };

  const handleRemoveObservation = (id: string) => {
    onObservationsChange(observations.filter((obs) => obs.id !== id));
  };

  const handleZoomIn = () => setZoom(Math.min(zoom + 0.2, 3));
  const handleZoomOut = () => setZoom(Math.max(zoom - 0.2, 0.5));
  const handleResetZoom = () => setZoom(1);

  const renderGrid = () => {
    if (!imageRef.current || !showGrid || !imageLoaded) return null;

    const imgWidth = imageRef.current.offsetWidth * zoom;
    const imgHeight = imageRef.current.offsetHeight * zoom;
    const lines = [];

    // Linhas verticais
    for (
      let x = gridConfig.offsetX % gridConfig.cellSize;
      x < imgWidth;
      x += gridConfig.cellSize
    ) {
      lines.push(
        <line
          key={`v-${x}`}
          x1={x}
          y1={0}
          x2={x}
          y2={imgHeight}
          stroke={gridConfig.color}
          strokeWidth={2}
          opacity={gridConfig.opacity}
        />
      );
    }

    // Linhas horizontais
    for (
      let y = gridConfig.offsetY % gridConfig.cellSize;
      y < imgHeight;
      y += gridConfig.cellSize
    ) {
      lines.push(
        <line
          key={`h-${y}`}
          x1={0}
          y1={y}
          x2={imgWidth}
          y2={y}
          stroke={gridConfig.color}
          strokeWidth={2}
          opacity={gridConfig.opacity}
        />
      );
    }

    return (
      <svg
        className="absolute top-0 left-0 pointer-events-none"
        width={imgWidth}
        height={imgHeight}
        style={{ mixBlendMode: "normal" }}
      >
        {lines}
      </svg>
    );
  };

  const getSeverityColor = (severity: string) => {
    const option = SEVERITY_OPTIONS.find((opt) => opt.value === severity);
    return option?.color || "bg-gray-500";
  };

  const getJointLabel = (jointValue: string) => {
    const option = JOINT_OPTIONS.find((j) => j.value === jointValue);
    return option?.label || jointValue;
  };

  return (
    <div className="space-y-4">
      {/* Controles */}
      <div className="flex flex-wrap items-center gap-2">
        {!readOnly && (
          <Button
            variant={isAddingObservation ? "default" : "outline"}
            size="sm"
            onClick={() => setIsAddingObservation(!isAddingObservation)}
            data-testid="button-add-observation"
          >
            <Plus className="h-4 w-4 mr-2" />
            {isAddingObservation ? "Cancelar" : "Adicionar Observação"}
          </Button>
        )}

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
        </div>
      </div>

      {/* Dica de uso */}
      {!readOnly && (
        <div className="bg-muted/50 border rounded-lg p-3">
          <p className="text-xs text-muted-foreground">
            💡 <strong>Dica:</strong> Segure Alt + clique e arraste sobre a
            imagem para mover a grade, ou use o botão do meio do mouse
          </p>
        </div>
      )}

      {/* Imagem com grade e observações */}
      <Card>
        <CardContent className="p-4">
          <div
            ref={containerRef}
            className="relative overflow-auto max-h-[600px] border rounded"
            style={{
              cursor: isAddingObservation
                ? "crosshair"
                : isDraggingGrid
                ? "grabbing"
                : "default",
            }}
            onClick={handleImageClick}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            data-testid="container-photo-with-grid"
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
              onLoad={handleImageLoad}
              data-testid="img-posture-photo"
            />
            {renderGrid()}
            {/* Marcadores de observações */}
            {observations.map((obs) => {
              if (!imageRef.current) return null;
              const imgWidth = imageRef.current.offsetWidth * zoom;
              const imgHeight = imageRef.current.offsetHeight * zoom;

              return (
                <div
                  key={obs.id}
                  className="absolute -translate-x-1/2 -translate-y-1/2 group"
                  style={{
                    left: `${obs.x * imgWidth}px`,
                    top: `${obs.y * imgHeight}px`,
                  }}
                  data-testid={`observation-marker-${obs.id}`}
                >
                  <div className="relative">
                    <div
                      className={`w-6 h-6 ${getSeverityColor(
                        obs.severity
                      )} rounded-full border-2 border-white shadow-lg flex items-center justify-center text-white text-xs font-bold`}
                    >
                      !
                    </div>
                    <div className="absolute top-8 left-1/2 -translate-x-1/2 bg-black/90 text-white text-xs px-3 py-2 rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-10 min-w-[200px]">
                      <div className="font-bold">
                        {getJointLabel(obs.joint)}
                      </div>
                      <div className="text-gray-300 mt-1">
                        {obs.observation}
                      </div>
                      <div className="text-gray-400 text-xs mt-1">
                        Severidade:{" "}
                        {
                          SEVERITY_OPTIONS.find((s) => s.value === obs.severity)
                            ?.label
                        }
                      </div>
                    </div>
                    {!readOnly && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleRemoveObservation(obs.id);
                        }}
                        className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center"
                        data-testid={`button-remove-observation-${obs.id}`}
                      >
                        ×
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Lista de observações */}
      {observations.length > 0 && (
        <Card>
          <CardContent className="p-4">
            <h4 className="font-medium mb-2 text-sm">Observações marcadas:</h4>
            <div className="space-y-2">
              {observations.map((obs) => (
                <div
                  key={obs.id}
                  className="flex items-start gap-3 p-3 bg-muted rounded-lg"
                  data-testid={`observation-item-${obs.id}`}
                >
                  <div
                    className={`w-4 h-4 ${getSeverityColor(
                      obs.severity
                    )} rounded-full mt-0.5`}
                  />
                  <div className="flex-1">
                    <div className="font-medium text-sm">
                      {getJointLabel(obs.joint)}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      {obs.observation}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Severidade:{" "}
                      {
                        SEVERITY_OPTIONS.find((s) => s.value === obs.severity)
                          ?.label
                      }
                    </div>
                  </div>
                  {!readOnly && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleRemoveObservation(obs.id)}
                      data-testid={`button-delete-observation-${obs.id}`}
                    >
                      <Trash2 className="h-4 w-4 text-red-500" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Dialog para adicionar observação */}
      <Dialog
        open={showObservationDialog}
        onOpenChange={setShowObservationDialog}
      >
        <DialogContent data-testid="dialog-add-observation">
          <DialogHeader>
            <DialogTitle>Adicionar Observação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="joint">Articulação / Região</Label>
              <Select
                value={isCustomJoint ? "custom" : newObservation.joint}
                onValueChange={handleJointChange}
              >
                <SelectTrigger id="joint" data-testid="select-joint">
                  <SelectValue placeholder="Selecione a articulação" />
                </SelectTrigger>
                <SelectContent>
                  {JOINT_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Campo personalizado para articulação */}
            {isCustomJoint && (
              <div>
                <Label htmlFor="custom-joint">Nome da Articulação/Região</Label>
                <Input
                  id="custom-joint"
                  placeholder="Ex: Pé direito, Punho esquerdo..."
                  value={customJoint}
                  onChange={(e) => setCustomJoint(e.target.value)}
                  data-testid="input-custom-joint"
                />
              </div>
            )}

            <div>
              <Label htmlFor="observation">Observação / Problema</Label>
              <Textarea
                id="observation"
                placeholder="Ex: Ombro projetado para frente, rotação interna..."
                value={newObservation.observation || ""}
                onChange={(e) =>
                  setNewObservation({
                    ...newObservation,
                    observation: e.target.value,
                  })
                }
                data-testid="textarea-observation"
                rows={3}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Descreva o problema ou desvio postural observado
              </p>
            </div>
            <div>
              <Label htmlFor="severity">Severidade</Label>
              <Select
                value={newObservation.severity}
                onValueChange={(value) =>
                  setNewObservation({
                    ...newObservation,
                    severity: value as
                      | "normal"
                      | "mild"
                      | "moderate"
                      | "severe",
                  })
                }
              >
                <SelectTrigger id="severity" data-testid="select-severity">
                  <SelectValue placeholder="Selecione a severidade" />
                </SelectTrigger>
                <SelectContent>
                  {SEVERITY_OPTIONS.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-3 h-3 ${option.color} rounded-full`}
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setShowObservationDialog(false);
                setCustomJoint("");
                setIsCustomJoint(false);
              }}
              data-testid="button-cancel-observation"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleSaveObservation}
              disabled={
                !(isCustomJoint ? customJoint : newObservation.joint) ||
                !newObservation.observation ||
                !newObservation.severity
              }
              data-testid="button-save-observation"
            >
              Salvar Observação
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
