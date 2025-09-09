import React, { useState, useCallback, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Trash2, Upload, Eye, Plus } from "lucide-react";

interface AssessmentPhoto {
  id: string;
  assessmentId: string;
  studentId: string;
  photoType: string;
  photoUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType: string;
  uploadedAt: string;
}

interface BodyPhotoGalleryProps {
  assessmentId?: string;
  studentId?: string;
  photos?: AssessmentPhoto[];
  onPhotoAdd?: (photo: AssessmentPhoto) => void;
  onPhotoRemove?: (photoId: string) => void;
  onPhotoView?: (photo: AssessmentPhoto) => void;
  measurements?: any; // Keep for compatibility
  interactive?: boolean;
}

const BODY_PARTS = [
  { value: "front", label: "Vista Frontal" },
  { value: "back", label: "Vista das Costas" },
  { value: "side", label: "Lateral" },
  { value: "other", label: "Outros" },
];

export default function BodyPhotoGallery({
  assessmentId,
  studentId,
  photos = [],
  onPhotoAdd,
  onPhotoRemove,
  onPhotoView,
  measurements,
  interactive = true,
}: BodyPhotoGalleryProps) {
  const [selectedBodyPart, setSelectedBodyPart] = useState<string>("front");
  const [loadedPhotos, setLoadedPhotos] = useState<AssessmentPhoto[]>(photos);
  const [viewingPhoto, setViewingPhoto] = useState<AssessmentPhoto | null>(
    null
  );
  const [uploadingFile, setUploadingFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Load photos from API when assessment ID changes
  useEffect(() => {
    if (assessmentId) {
      loadAssessmentPhotos();
    }
  }, [assessmentId]);

  const loadAssessmentPhotos = async () => {
    if (!assessmentId) return;

    setIsLoading(true);
    try {
      const response = await fetch(`/api/assessment-photos/${assessmentId}`, {
        credentials: "include",
      });

      if (response.ok) {
        const photos = await response.json();
        setLoadedPhotos(photos);
      }
    } catch (error) {
      console.error("Erro ao carregar fotos:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (file && file.type.startsWith("image/")) {
        setUploadingFile(file);
      }
    },
    []
  );

  const handlePhotoUpload = useCallback(async () => {
    if (!uploadingFile || !assessmentId || !studentId) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append("photo", uploadingFile);
      formData.append("assessmentId", assessmentId);
      formData.append("studentId", studentId);
      formData.append("photoType", selectedBodyPart);

      const response = await fetch("/api/assessment-photos", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      if (response.ok) {
        const newPhoto = await response.json();
        setLoadedPhotos((prev) => [...prev, newPhoto]);
        onPhotoAdd?.(newPhoto);
        setUploadingFile(null);

        // Reset file input
        const fileInput = document.getElementById(
          "photo-upload"
        ) as HTMLInputElement;
        if (fileInput) fileInput.value = "";
      } else {
        const errorData = await response.json();
        console.error("Erro no upload:", errorData.message);
      }
    } catch (error) {
      console.error("Erro ao fazer upload da foto:", error);
    } finally {
      setIsUploading(false);
    }
  }, [uploadingFile, assessmentId, studentId, selectedBodyPart, onPhotoAdd]);

  const handlePhotoDelete = useCallback(
    async (photoId: string) => {
      try {
        const response = await fetch(`/api/assessment-photos/${photoId}`, {
          method: "DELETE",
          credentials: "include",
        });

        if (response.ok) {
          setLoadedPhotos((prev) =>
            prev.filter((photo) => photo.id !== photoId)
          );
          onPhotoRemove?.(photoId);
        }
      } catch (error) {
        console.error("Erro ao deletar foto:", error);
      }
    },
    [onPhotoRemove]
  );

  const groupedPhotos = loadedPhotos.reduce((acc, photo) => {
    if (!acc[photo.photoType]) {
      acc[photo.photoType] = [];
    }
    acc[photo.photoType].push(photo);
    return acc;
  }, {} as Record<string, AssessmentPhoto[]>);

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">
              📸 Galeria de Fotos do Corpo
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Armazene e visualize fotos do progresso corporal
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            {loadedPhotos.length} foto{loadedPhotos.length !== 1 ? "s" : ""}
          </Badge>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Upload Section */}
        {interactive && (
          <Card className="border-dashed border-2 border-gray-300 bg-gray-50">
            <CardContent className="p-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label
                    htmlFor="body-part-select"
                    className="text-sm font-medium"
                  >
                    Tipo de Foto
                  </Label>
                  <select
                    id="body-part-select"
                    value={selectedBodyPart}
                    onChange={(e) => setSelectedBodyPart(e.target.value)}
                    className="w-full mt-1 p-2 border border-gray-300 rounded-md text-sm"
                  >
                    {BODY_PARTS.map((part) => (
                      <option key={part.value} value={part.value}>
                        {part.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <Label htmlFor="photo-upload" className="text-sm font-medium">
                    Selecionar Foto
                  </Label>
                  <Input
                    id="photo-upload"
                    type="file"
                    accept="image/*"
                    onChange={handleFileSelect}
                    className="mt-1"
                  />
                </div>

                <div className="flex items-end">
                  <Button
                    onClick={handlePhotoUpload}
                    disabled={
                      !uploadingFile ||
                      isUploading ||
                      !assessmentId ||
                      !studentId
                    }
                    className="w-full"
                  >
                    <Upload className="w-4 h-4 mr-2" />
                    {isUploading ? "Enviando..." : "Enviar Foto"}
                  </Button>
                </div>

                {!assessmentId && studentId && (
                  <div className="mt-3 p-3 bg-amber-50 border border-amber-200 rounded-md">
                    <p className="text-sm text-amber-800">
                      💡 <strong>Dica:</strong> Salve a avaliação primeiro para
                      poder adicionar fotos
                    </p>
                  </div>
                )}
              </div>

              {uploadingFile && (
                <div className="mt-3 p-3 bg-blue-50 border border-blue-200 rounded-md">
                  <p className="text-sm text-blue-800">
                    <strong>Foto selecionada:</strong> {uploadingFile.name}
                  </p>
                  <p className="text-xs text-blue-600 mt-1">
                    Será salva como:{" "}
                    {
                      BODY_PARTS.find((p) => p.value === selectedBodyPart)
                        ?.label
                    }
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Photos Display */}
        {isLoading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Carregando fotos...</p>
          </div>
        ) : loadedPhotos.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">Nenhuma foto foi adicionada ainda.</p>
            {interactive && (
              <p className="text-xs text-gray-400 mt-1">
                Use o formulário acima para adicionar fotos do progresso
                corporal.
              </p>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {BODY_PARTS.map((bodyPart) => {
              const photosForPart = groupedPhotos[bodyPart.value] || [];
              if (photosForPart.length === 0) return null;

              return (
                <div key={bodyPart.value}>
                  <div className="flex items-center gap-2 mb-3">
                    <h3 className="font-semibold text-gray-700">
                      {bodyPart.label}
                    </h3>
                    <Badge variant="outline" className="text-xs">
                      {photosForPart.length}
                    </Badge>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
                    {photosForPart.map((photo) => (
                      <Card key={photo.id} className="overflow-hidden">
                        <div className="aspect-square bg-gray-100 relative">
                          <img
                            src={photo.photoUrl}
                            alt={photo.fileName}
                            className="w-full h-full object-cover"
                          />
                          <div className="absolute inset-0 bg-black bg-opacity-0 hover:bg-opacity-40 transition-all duration-200 flex items-center justify-center">
                            <div className="opacity-0 hover:opacity-100 transition-opacity duration-200 flex gap-2">
                              <Button
                                size="sm"
                                variant="secondary"
                                onClick={() => {
                                  setViewingPhoto(photo);
                                  onPhotoView?.(photo);
                                }}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {interactive && (
                                <Button
                                  size="sm"
                                  variant="destructive"
                                  onClick={() => handlePhotoDelete(photo.id)}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </div>
                        </div>
                        <CardContent className="p-2">
                          <p className="text-xs text-gray-600 truncate">
                            {photo.fileName}
                          </p>
                          <p className="text-xs text-gray-400">
                            {new Date(photo.uploadedAt).toLocaleDateString()}
                          </p>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Photo Viewer Dialog */}
        <Dialog
          open={!!viewingPhoto}
          onOpenChange={(open) => !open && setViewingPhoto(null)}
        >
          <DialogContent className="max-w-4xl max-h-[90vh] p-0">
            {viewingPhoto && (
              <>
                <DialogHeader className="p-6 pb-4">
                  <DialogTitle className="text-lg font-semibold">
                    {viewingPhoto.fileName}
                  </DialogTitle>
                  <p className="text-sm text-gray-600">
                    {
                      BODY_PARTS.find((p) => p.value === viewingPhoto.photoType)
                        ?.label
                    }{" "}
                    • {new Date(viewingPhoto.uploadedAt).toLocaleDateString()}
                  </p>
                </DialogHeader>
                <div className="px-6 pb-6 flex justify-center">
                  <img
                    src={viewingPhoto.photoUrl}
                    alt={viewingPhoto.fileName}
                    className="max-w-full max-h-[60vh] object-contain rounded shadow-lg"
                  />
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </CardContent>
    </Card>
  );
}
