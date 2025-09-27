import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Upload, X, Camera, Loader2 } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface PosturePhoto {
  file: File;
  preview: string;
  type: "front" | "back" | "side_left" | "side_right";
}

interface JointObservation {
  joint: string;
  observation: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  isCustom: boolean;
}

const PHOTO_TYPES = [
  { key: "front", label: "Frente", icon: "👤" },
  { key: "back", label: "Costas", icon: "🔄" },
  { key: "side_left", label: "Lado Esquerdo", icon: "⬅️" },
  { key: "side_right", label: "Lado Direito", icon: "➡️" },
] as const;

const JOINTS = [
  { key: "head", label: "Cabeça" },
  { key: "neck", label: "Pescoço" },
  { key: "shoulder_left", label: "Ombro Esquerdo" },
  { key: "shoulder_right", label: "Ombro Direito" },
  { key: "spine_cervical", label: "Coluna Cervical" },
  { key: "spine_thoracic", label: "Coluna Torácica" },
  { key: "spine_lumbar", label: "Coluna Lombar" },
  { key: "hip_left", label: "Quadril Esquerdo" },
  { key: "hip_right", label: "Quadril Direito" },
  { key: "knee_left", label: "Joelho Esquerdo" },
  { key: "knee_right", label: "Joelho Direito" },
  { key: "ankle_left", label: "Tornozelo Esquerdo" },
  { key: "ankle_right", label: "Tornozelo Direito" },
] as const;

const PREDEFINED_OBSERVATIONS = {
  head: [
    "Cabeça muito para frente",
    "Inclinação lateral",
    "Extensão excessiva",
  ],
  neck: ["Hiperlordose cervical", "Retificação cervical", "Inclinação lateral"],
  shoulder_left: [
    "Ombro caído",
    "Ombro elevado",
    "Projeção anterior",
    "Rotação interna",
  ],
  shoulder_right: [
    "Ombro caído",
    "Ombro elevado",
    "Projeção anterior",
    "Rotação interna",
  ],
  spine_cervical: ["Hiperlordose", "Retificação", "Escoliose"],
  spine_thoracic: ["Hipercifose", "Retificação", "Escoliose"],
  spine_lumbar: ["Hiperlordose", "Retificação", "Escoliose"],
  hip_left: [
    "Elevação",
    "Inclinação anterior",
    "Inclinação posterior",
    "Rotação",
  ],
  hip_right: [
    "Elevação",
    "Inclinação anterior",
    "Inclinação posterior",
    "Rotação",
  ],
  knee_left: ["Valgismo", "Varismo", "Hiperextensão", "Flexão"],
  knee_right: ["Valgismo", "Varismo", "Hiperextensão", "Flexão"],
  ankle_left: ["Pronação", "Supinação", "Dorsiflexão limitada"],
  ankle_right: ["Pronação", "Supinação", "Dorsiflexão limitada"],
};

interface PostureAssessmentProps {
  studentId: string;
  onSave: (assessment: any) => void;
  initialData?: {
    id?: string;
    title?: string;
    notes?: string;
    photos?: Array<{
      type: "front" | "back" | "side_left" | "side_right";
      url: string;
    }>;
    observations?: Array<{
      joint: string;
      observation: string;
      severity: "normal" | "mild" | "moderate" | "severe";
    }>;
  };
  mode?: "create" | "edit";
}

export function PostureAssessment({
  studentId,
  onSave,
  initialData,
  mode = "create",
}: PostureAssessmentProps) {
  const [photos, setPhotos] = useState<PosturePhoto[]>([]);
  const [title, setTitle] = useState("");
  const [notes, setNotes] = useState("");
  const [observations, setObservations] = useState<JointObservation[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState("");
  const [selectedObservation, setSelectedObservation] = useState("");
  const [customObservation, setCustomObservation] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<
    "normal" | "mild" | "moderate" | "severe"
  >("mild");

  // Load initial data when in edit mode
  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTitle(initialData.title || "");
      setNotes(initialData.notes || "");

      // Load observations
      if (initialData.observations) {
        setObservations(
          initialData.observations.map((obs) => ({
            joint: obs.joint,
            observation: obs.observation,
            severity: obs.severity,
            isCustom: false, // For existing observations, we'll consider them custom
          }))
        );
      }

      // For photos in edit mode, we would need to fetch them from URLs
      // This is a simplified version - in a real app, you might want to
      // convert URLs back to File objects or handle differently
      if (initialData.photos) {
        // Note: This doesn't load actual photos for editing since we'd need
        // to fetch URLs and convert to File objects. For now, we'll just
        // show that photos exist but they'd need to be re-uploaded to edit.
        console.log(
          "Edit mode: Photos exist but need to be re-uploaded for editing"
        );
      }
    }
  }, [mode, initialData]);

  const handleFileUpload = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      photoType: PosturePhoto["type"]
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith("image/")) {
        alert("Por favor, selecione apenas arquivos de imagem.");
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const preview = e.target?.result as string;

        setPhotos((prev) => {
          const filtered = prev.filter((p) => p.type !== photoType);
          return [...filtered, { file, preview, type: photoType }];
        });
      };
      reader.readAsDataURL(file);
    },
    []
  );

  const removePhoto = useCallback((type: PosturePhoto["type"]) => {
    setPhotos((prev) => prev.filter((p) => p.type !== type));
  }, []);

  const addObservation = () => {
    if (!selectedJoint) return;

    const observation = customObservation || selectedObservation;
    if (!observation) return;

    const newObservation: JointObservation = {
      joint: selectedJoint,
      observation,
      severity: selectedSeverity,
      isCustom: !!customObservation,
    };

    setObservations((prev) => {
      const filtered = prev.filter((obs) => obs.joint !== selectedJoint);
      return [...filtered, newObservation];
    });

    // Reset form
    setSelectedJoint("");
    setSelectedObservation("");
    setCustomObservation("");
    setSelectedSeverity("mild");
  };

  const removeObservation = (joint: string) => {
    setObservations((prev) => prev.filter((obs) => obs.joint !== joint));
  };

  const getPhotoByType = (type: PosturePhoto["type"]) => {
    return photos.find((p) => p.type === type);
  };

  const canAnalyze = photos.length === 4 && title.trim();

  const handleAnalyze = async () => {
    if (!canAnalyze) return;

    setIsAnalyzing(true);
    try {
      // Convert images to base64
      const imagePromises = photos.map(async (photo) => {
        return new Promise<{ type: string; base64: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1]; // Remove data:image/jpeg;base64, prefix
            resolve({ type: photo.type, base64 });
          };
          reader.readAsDataURL(photo.file);
        });
      });

      const images = await Promise.all(imagePromises);

      const assessmentData = {
        ...(mode === "edit" && initialData?.id && { id: initialData.id }),
        studentId,
        title,
        notes,
        images,
        observations: observations.map((obs) => ({
          joint: obs.joint,
          observation: obs.observation,
          severity: obs.severity,
          isCustom: obs.isCustom,
        })),
      };

      await onSave(assessmentData);
    } catch (error) {
      console.error("Erro ao analisar postura:", error);
      alert("Erro ao analisar postura. Tente novamente.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Nova Avaliação Postural</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <Label htmlFor="title">Título da Avaliação</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ex: Avaliação Inicial - Janeiro 2025"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes">Observações Gerais</Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Observações gerais sobre o aluno..."
              rows={3}
            />
          </div>
        </CardContent>
      </Card>

      {/* Upload de Fotos */}
      <Card>
        <CardHeader>
          <CardTitle>Fotos Posturais</CardTitle>
          <p className="text-sm text-muted-foreground">
            Faça upload de 4 fotos: frente, costas, lado esquerdo e lado direito
          </p>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {PHOTO_TYPES.map((photoType) => {
              const photo = getPhotoByType(photoType.key);
              return (
                <div key={photoType.key} className="space-y-2">
                  <Label className="text-sm font-medium flex items-center gap-2">
                    <span className="text-lg">{photoType.icon}</span>
                    {photoType.label}
                  </Label>
                  <div className="relative">
                    {photo ? (
                      <div className="relative group">
                        <img
                          src={photo.preview}
                          alt={photoType.label}
                          className="w-full h-32 object-cover rounded-lg border-2 border-dashed border-green-300"
                          style={{
                            backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='10' height='10' patternUnits='userSpaceOnUse'%3e%3cpath d='M 10 0 L 0 0 0 10' fill='none' stroke='%23ddd' stroke-width='1'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23grid)' /%3e%3c/svg%3e")`,
                            backgroundBlendMode: "overlay",
                          }}
                        />
                        <Button
                          size="sm"
                          variant="destructive"
                          className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
                          onClick={() => removePhoto(photoType.key)}
                        >
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                    ) : (
                      <label className="cursor-pointer">
                        <div className="w-full h-32 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors">
                          <Camera className="w-8 h-8 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            Clique para enviar
                          </span>
                        </div>
                        <input
                          type="file"
                          accept="image/*"
                          className="hidden"
                          onChange={(e) => handleFileUpload(e, photoType.key)}
                        />
                      </label>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Observações por Articulação */}
      <Card>
        <CardHeader>
          <CardTitle>Observações por Articulação</CardTitle>
          <p className="text-sm text-muted-foreground">
            Adicione observações específicas para cada articulação
          </p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="space-y-2">
              <Label>Articulação</Label>
              <Select value={selectedJoint} onValueChange={setSelectedJoint}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione..." />
                </SelectTrigger>
                <SelectContent>
                  {JOINTS.map((joint) => (
                    <SelectItem key={joint.key} value={joint.key}>
                      {joint.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedJoint && (
              <div className="space-y-2">
                <Label>Observação Pré-definida</Label>
                <Select
                  value={selectedObservation}
                  onValueChange={setSelectedObservation}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Escolha uma opção..." />
                  </SelectTrigger>
                  <SelectContent>
                    {PREDEFINED_OBSERVATIONS[
                      selectedJoint as keyof typeof PREDEFINED_OBSERVATIONS
                    ]?.map((obs) => (
                      <SelectItem key={obs} value={obs}>
                        {obs}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            <div className="space-y-2">
              <Label>Observação Personalizada</Label>
              <Input
                value={customObservation}
                onChange={(e) => setCustomObservation(e.target.value)}
                placeholder="Ou digite uma observação personalizada..."
                disabled={!selectedJoint}
              />
            </div>

            <div className="space-y-2">
              <Label>Severidade</Label>
              <Select
                value={selectedSeverity}
                onValueChange={(value: any) => setSelectedSeverity(value)}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="mild">Leve</SelectItem>
                  <SelectItem value="moderate">Moderado</SelectItem>
                  <SelectItem value="severe">Severo</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <Button
            onClick={addObservation}
            disabled={
              !selectedJoint || (!selectedObservation && !customObservation)
            }
            className="w-full"
          >
            Adicionar Observação
          </Button>

          {/* Lista de observações adicionadas */}
          {observations.length > 0 && (
            <div className="space-y-2">
              <Label>Observações Adicionadas</Label>
              <div className="space-y-2">
                {observations.map((obs) => {
                  const joint = JOINTS.find((j) => j.key === obs.joint);
                  return (
                    <div
                      key={obs.joint}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <div className="flex-1">
                        <div className="font-medium">{joint?.label}</div>
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
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => removeObservation(obs.joint)}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Botão de Análise */}
      <Card>
        <CardContent className="pt-6">
          <Button
            onClick={handleAnalyze}
            disabled={!canAnalyze || isAnalyzing}
            size="lg"
            className="w-full"
          >
            {isAnalyzing ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                {mode === "edit"
                  ? "Atualizando análise..."
                  : "Analisando com IA..."}
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 mr-2" />
                {mode === "edit"
                  ? "Atualizar Análise"
                  : "Analisar Postura com IA"}
              </>
            )}
          </Button>
          {!canAnalyze && (
            <p className="text-sm text-muted-foreground text-center mt-2">
              {photos.length < 4
                ? `Adicione ${4 - photos.length} foto(s) restante(s)`
                : "Adicione um título para continuar"}
            </p>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
