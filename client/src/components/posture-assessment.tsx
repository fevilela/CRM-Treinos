import React, { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  Eye,
  Trash2,
  Calendar,
  User,
  Edit,
  Download,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AnatomicalDiagram } from "@/components/anatomical-diagram";
import { PostureAssessmentForm } from "@/components/posture-assessment-form";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

interface PostureAssessmentData {
  id: string;
  title: string;
  studentId: string;
  student?: {
    name: string;
  };
  notes?: string;
  aiAnalysis?: string;
  aiRecommendations?: string;
  createdAt: string;
}

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
  const [isSaving, setIsSaving] = useState(false);
  const [selectedJoint, setSelectedJoint] = useState("");
  const [selectedObservation, setSelectedObservation] = useState("");
  const [customObservation, setCustomObservation] = useState("");
  const [selectedSeverity, setSelectedSeverity] = useState<
    "normal" | "mild" | "moderate" | "severe"
  >("mild");

  useEffect(() => {
    if (mode === "edit" && initialData) {
      setTitle(initialData.title || "");
      setNotes(initialData.notes || "");

      if (initialData.observations) {
        setObservations(
          initialData.observations.map((obs) => ({
            joint: obs.joint,
            observation: obs.observation,
            severity: obs.severity,
            isCustom: false,
          }))
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

  const canSave = photos.length > 0 && title.trim();

  const handleSave = async () => {
    if (!canSave) return;

    setIsSaving(true);
    try {
      const imagePromises = photos.map(async (photo) => {
        return new Promise<{ type: string; base64: string }>((resolve) => {
          const reader = new FileReader();
          reader.onload = () => {
            const result = reader.result as string;
            const base64 = result.split(",")[1];
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
      console.error("Error downloading PDF:", error);
      alert("Erro ao baixar PDF");
    }
  };

  const selectedStudent = students.find((s) => s.id === selectedStudentId);

  const JOINT_LABELS: Record<string, string> = {
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

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Avaliações Posturais</h1>
        {selectedStudentId && (
          <Dialog
            open={isCreateDialogOpen}
            onOpenChange={setIsCreateDialogOpen}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                Nova Avaliação
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>
                  Nova Avaliação Postural - {selectedStudent?.name}
                </DialogTitle>
              </DialogHeader>
              <PostureAssessmentForm
                studentId={selectedStudentId}
                onSave={handleCreateAssessment}
              />
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Student Selection */}
      <Card>
        <CardHeader>
          <CardTitle>Selecionar Aluno</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                        <div className="relative overflow-hidden rounded-lg border-2 border-gray-300">
                          <img
                            src={photo.preview}
                            alt={photoType.label}
                            className="w-full h-96 object-contain bg-gray-50"
                          />
                          <svg
                            className="absolute top-0 left-0 w-full h-full pointer-events-none"
                            style={{ opacity: 3 }}
                          >
                            <defs>
                              <pattern
                                id={`grid-${photoType.key}`}
                                width="20"
                                height="20"
                                patternUnits="userSpaceOnUse"
                              >
                                <path
                                  d="M 20 0 L 0 0 0 20"
                                  fill="none"
                                  stroke="#666"
                                  strokeWidth="0.5"
                                />
                              </pattern>
                            </defs>
                            <rect
                              width="100%"
                              height="100%"
                              fill={`url(#grid-${photoType.key})`}
                            />
                          </svg>
                        </div>
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
                        <div className="w-full h-96 border-2 border-dashed border-gray-300 rounded-lg flex flex-col items-center justify-center hover:border-blue-500 transition-colors bg-gray-50">
                          <Camera className="w-12 h-12 text-gray-400 mb-2" />
                          <span className="text-sm text-gray-500">
                            Clique para enviar foto
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

      {/* Assessments List */}
      {selectedStudentId && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="w-5 h-5" />
              Avaliações de {selectedStudent?.name}
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8">Carregando avaliações...</div>
            ) : assessments.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                Nenhuma avaliação postural encontrada para este aluno.
              </div>
            ) : (
              <div className="space-y-4">
                {assessments.map((assessment) => (
                  <Card key={assessment.id} className="border">
                    <CardContent className="pt-4">
                      <div className="flex items-center justify-between">
                        <div className="space-y-2">
                          <h3 className="font-medium text-lg">
                            {assessment.title}
                          </h3>
                          <div className="flex items-center gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Calendar className="w-4 h-4" />
                              {new Date(
                                assessment.createdAt
                              ).toLocaleDateString("pt-BR")}
                            </div>
                          </div>
                          {assessment.notes && (
                            <p className="text-sm text-gray-600 mt-2">
                              {assessment.notes}
                            </p>
                          )}
                          {assessment.aiAnalysis && (
                            <Badge variant="secondary" className="mt-2">
                              Análise IA Disponível
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSelectedAssessment(assessment)}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            Ver
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditAssessment(assessment)}
                          >
                            <Edit className="w-4 h-4 mr-1" />
                            Editar
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button variant="outline" size="sm">
                                <Trash2 className="w-4 h-4 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent>
                              <AlertDialogHeader>
                                <AlertDialogTitle>
                                  Excluir Avaliação
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Tem certeza que deseja excluir esta avaliação
                                  postural? Esta ação não pode ser desfeita.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel>Cancelar</AlertDialogCancel>
                                <AlertDialogAction
                                  className="bg-red-500 hover:bg-red-600"
                                  onClick={() =>
                                    handleDeleteAssessment(assessment.id)
                                  }
                                >
                                  Excluir
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Edit Assessment Dialog */}
      {editingAssessment && (
        <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Editar Avaliação - {editingAssessment.title}
              </DialogTitle>
            </DialogHeader>
            <PostureAssessmentForm
              studentId={editingAssessment.studentId}
              onSave={handleUpdateAssessment}
              initialData={{
                id: editingAssessment.id,
                title: editingAssessment.title,
                notes: editingAssessment.notes,
                photos: editingPhotos.map((p) => ({
                  type: p.photoType,
                  url: p.photoUrl,
                })),
                observations: editingObservations.map((o) => ({
                  joint: o.joint,
                  observation: o.observation,
                  severity: o.severity,
                })),
              }}
              mode="edit"
            />
          </DialogContent>
        </Dialog>
      )}

      {/* Assessment Details Dialog */}
      {selectedAssessment && (
        <Dialog
          open={!!selectedAssessment}
          onOpenChange={() => setSelectedAssessment(null)}
        >
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <div className="flex items-center justify-between">
                <DialogTitle>{selectedAssessment.title}</DialogTitle>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleDownloadPDF(selectedAssessment.id)}
                >
                  <Download className="w-4 h-4 mr-2" />
                  Baixar PDF
                </Button>
              </div>
            </DialogHeader>
            <div className="space-y-6">
              <div>
                <h3 className="font-medium mb-2">Data da Avaliação</h3>
                <p className="text-gray-600">
                  {new Date(selectedAssessment.createdAt).toLocaleDateString(
                    "pt-BR",
                    {
                      weekday: "long",
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    }
                  )}
                </p>
              </div>

              {selectedAssessment.notes && (
                <div>
                  <h3 className="font-medium mb-2">Observações Gerais</h3>
                  <p className="text-gray-600 whitespace-pre-wrap">
                    {selectedAssessment.notes}
                  </p>
                </div>
              )}

              {/* Diagramas Anatômicos com Observações */}
              {selectedObservations.length > 0 && (
                <div>
                  <h3 className="font-medium mb-4">
                    Análise Postural - Diagramas Anatômicos
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {(
                      ["front", "back", "side_left", "side_right"] as const
                    ).map((photoType) => {
                      const relevantObs = selectedObservations.filter(
                        (obs: any) =>
                          !obs.photoType ||
                          obs.photoType === photoType ||
                          (photoType.startsWith("side") &&
                            obs.photoType?.startsWith("side"))
                      );

                      if (relevantObs.length === 0) return null;

                      return (
                        <AnatomicalDiagram
                          key={photoType}
                          observations={relevantObs}
                          photoType={photoType}
                        />
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Fotos Originais (apenas para referência) */}
              {selectedPhotos.length > 0 && (
                <div>
                  <h3 className="font-medium mb-4">Fotos Originais</h3>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {selectedPhotos.map((photo) => (
                      <div key={photo.id} className="space-y-2">
                        <img
                          src={photo.photoUrl}
                          alt={photo.photoType}
                          className="w-full h-48 object-cover bg-gray-50 rounded-lg border-2 border-gray-300"
                        />
                        <p className="text-sm text-center font-medium">
                          {photo.photoType === "front"
                            ? "Frente"
                            : photo.photoType === "back"
                            ? "Costas"
                            : photo.photoType === "side_left"
                            ? "Lado Esquerdo"
                            : "Lado Direito"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {selectedAssessment.aiAnalysis && (
                <div>
                  <h3 className="font-medium mb-2">Análise da IA</h3>
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedAssessment.aiAnalysis}
                    </p>
                  </div>
                </div>
              )}

              {selectedAssessment.aiRecommendations && (
                <div>
                  <h3 className="font-medium mb-2">Recomendações da IA</h3>
                  <div className="bg-green-50 p-4 rounded-lg">
                    <p className="text-gray-700 whitespace-pre-wrap">
                      {selectedAssessment.aiRecommendations}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
