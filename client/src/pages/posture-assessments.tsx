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
import { useToast } from "@/hooks/use-toast";
import { PostureAssessmentCreationForm } from "@/components/posture-assessment-creation-form";
import { PostureAssessmentEditForm } from "@/components/posture-assessment-edit-form";
import { PhotoWithGrid, JointObservation } from "@/components/photo-with-grid";
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
  photoType: "front" | "back" | "side_left" | "side_right";
  markerX?: number;
  markerY?: number;
}

interface Student {
  id: string;
  name: string;
  email?: string;
}

export function PostureAssessments() {
  const [selectedStudentId, setSelectedStudentId] = useState<string>("");
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingAssessment, setEditingAssessment] =
    useState<PostureAssessmentData | null>(null);
  const [selectedAssessment, setSelectedAssessment] =
    useState<PostureAssessmentData | null>(null);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  // Fetch students
  const { data: students = [] } = useQuery<Student[]>({
    queryKey: ["students"],
    queryFn: async () => {
      const response = await fetch("/api/students", {
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch students");
      return response.json();
    },
  });

  // Fetch posture assessments for selected student
  const { data: assessments = [], isLoading } = useQuery<
    PostureAssessmentData[]
  >({
    queryKey: ["posture-assessments", selectedStudentId],
    queryFn: async () => {
      if (!selectedStudentId) return [];
      const response = await fetch(
        `/api/students/${selectedStudentId}/posture-assessments`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to fetch posture assessments");
      return response.json();
    },
    enabled: !!selectedStudentId,
  });

  // Delete assessment mutation
  const deleteAssessmentMutation = useMutation({
    mutationFn: async (assessmentId: string) => {
      const response = await fetch(`/api/posture-assessments/${assessmentId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to delete assessment");
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["posture-assessments"] });
    },
  });

  const handleCreateAssessment = () => {
    queryClient.invalidateQueries({ queryKey: ["posture-assessments"] });
    setIsCreateDialogOpen(false);
  };

  const handleEditAssessment = (assessment: PostureAssessmentData) => {
    setEditingAssessment(assessment);
    setIsEditDialogOpen(true);
  };

  const handleUpdateAssessment = () => {
    queryClient.invalidateQueries({ queryKey: ["posture-assessments"] });
    setIsEditDialogOpen(false);
    setEditingAssessment(null);
  };

  const handleDeleteAssessment = (assessmentId: string) => {
    deleteAssessmentMutation.mutate(assessmentId);
  };

  // Fetch photos for selected assessment
  const { data: selectedPhotos = [] } = useQuery<PosturePhoto[]>({
    queryKey: ["posture-photos", selectedAssessment?.id],
    queryFn: async () => {
      if (!selectedAssessment) return [];
      console.log(
        "[PHOTOS QUERY] Fetching photos for assessment:",
        selectedAssessment.id
      );
      const response = await fetch(
        `/api/posture-assessments/${selectedAssessment.id}/photos`,
        { credentials: "include" }
      );
      console.log("[PHOTOS QUERY] Response status:", response.status);
      if (!response.ok) {
        console.error(
          "[PHOTOS QUERY] Failed:",
          response.status,
          response.statusText
        );
        return [];
      }
      const data = await response.json();
      console.log("[PHOTOS QUERY] Received photos:", data);
      return data;
    },
    enabled: !!selectedAssessment,
  });

  // Fetch observations for selected assessment
  const { data: selectedObservations = [] } = useQuery<PostureObservation[]>({
    queryKey: ["posture-observations", selectedAssessment?.id],
    queryFn: async () => {
      if (!selectedAssessment) return [];
      console.log(
        "[OBSERVATIONS QUERY] Fetching observations for assessment:",
        selectedAssessment.id
      );
      const response = await fetch(
        `/api/posture-assessments/${selectedAssessment.id}/observations`,
        { credentials: "include" }
      );
      console.log("[OBSERVATIONS QUERY] Response status:", response.status);
      if (!response.ok) {
        console.error(
          "[OBSERVATIONS QUERY] Failed:",
          response.status,
          response.statusText
        );
        return [];
      }
      const data = await response.json();
      console.log("[OBSERVATIONS QUERY] Received observations:", data);
      return data;
    },
    enabled: !!selectedAssessment,
  });

  // Fetch data for editing
  const { data: editingPhotos = [] } = useQuery<PosturePhoto[]>({
    queryKey: ["posture-photos", editingAssessment?.id],
    queryFn: async () => {
      if (!editingAssessment) return [];
      const response = await fetch(
        `/api/posture-assessments/${editingAssessment.id}/photos`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!editingAssessment,
  });

  const { data: editingObservations = [] } = useQuery<PostureObservation[]>({
    queryKey: ["posture-observations", editingAssessment?.id],
    queryFn: async () => {
      if (!editingAssessment) return [];
      const response = await fetch(
        `/api/posture-assessments/${editingAssessment.id}/observations`,
        { credentials: "include" }
      );
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!editingAssessment,
  });

  const handleDownloadPDF = async (assessmentId: string) => {
    try {
      const response = await fetch(
        `/api/posture-assessments/${assessmentId}/pdf`,
        {
          credentials: "include",
        }
      );
      if (!response.ok) throw new Error("Failed to generate PDF");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `avaliacao-postural-${assessmentId}.pdf`;
      link.click();
      window.URL.revokeObjectURL(url);
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
              <PostureAssessmentCreationForm
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
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {students.map((student) => (
              <Card
                key={student.id}
                className={`cursor-pointer transition-all ${
                  selectedStudentId === student.id
                    ? "ring-2 ring-blue-500 bg-blue-50"
                    : "hover:shadow-md"
                }`}
                onClick={() => setSelectedStudentId(student.id)}
              >
                <CardContent className="pt-4">
                  <div className="flex items-center space-x-3">
                    <User className="w-8 h-8 text-gray-500" />
                    <div>
                      <h3 className="font-medium">{student.name}</h3>
                      {student.email && (
                        <p className="text-sm text-gray-500">{student.email}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
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
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                Editar Avaliação - {editingAssessment.title}
              </DialogTitle>
            </DialogHeader>
            <PostureAssessmentEditForm
              assessmentId={editingAssessment.id}
              initialTitle={editingAssessment.title}
              initialNotes={editingAssessment.notes}
              photos={editingPhotos}
              observations={editingObservations}
              onSave={handleUpdateAssessment}
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

              {/* Fotos Posturais com Observações */}
              {selectedPhotos.length > 0 && (
                <div className="space-y-6">
                  <h3 className="font-medium mb-4">Fotos Posturais</h3>
                  {selectedPhotos.map((photo) => {
                    const PHOTO_TYPE_LABELS: Record<string, string> = {
                      front: "Frontal",
                      back: "Posterior",
                      side_left: "Lateral Esquerda",
                      side_right: "Lateral Direita",
                    };

                    const photoObservations: JointObservation[] =
                      selectedObservations
                        .filter((obs) => obs.photoType === photo.photoType)
                        .map((obs) => ({
                          id: obs.id,
                          joint: obs.joint,
                          observation: obs.observation,
                          severity: obs.severity,
                          x: obs.markerX || 0.5,
                          y: obs.markerY || 0.5,
                        }));

                    return (
                      <Card key={photo.id}>
                        <CardHeader>
                          <CardTitle>
                            Foto {PHOTO_TYPE_LABELS[photo.photoType]}
                          </CardTitle>
                        </CardHeader>
                        <CardContent>
                          <PhotoWithGrid
                            imageUrl={photo.photoUrl}
                            photoType={photo.photoType}
                            observations={photoObservations}
                            onObservationsChange={() => {}}
                            readOnly={true}
                          />
                        </CardContent>
                      </Card>
                    );
                  })}
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
