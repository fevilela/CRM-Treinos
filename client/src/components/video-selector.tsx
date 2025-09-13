import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { apiRequest } from "@/lib/queryClient";
import { Upload, Link, VideoIcon, X, Check } from "lucide-react";

interface VideoSelectorProps {
  value?: string;
  onChange: (videoUrl: string) => void;
  placeholder?: string;
  className?: string;
}

export function VideoSelector({
  value = "",
  onChange,
  placeholder = "URL do vídeo ou fazer upload",
  className = "",
}: VideoSelectorProps) {
  const [videoUrl, setVideoUrl] = useState(value);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState(
    value.startsWith("/uploads/") ? "upload" : "link"
  );
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleUrlChange = (url: string) => {
    setVideoUrl(url);
    onChange(url);
  };

  const handleFileUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];
    if (!file) return;

    // Check file size (100MB limit)
    const maxSize = 100 * 1024 * 1024; // 100MB
    if (file.size > maxSize) {
      toast({
        title: "Arquivo muito grande",
        description: "O vídeo deve ter no máximo 100MB",
        variant: "destructive",
      });
      return;
    }

    // Check file type
    const allowedTypes = [
      "video/mp4",
      "video/mpeg",
      "video/quicktime",
      "video/webm",
      "video/ogg",
    ];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "Tipo de arquivo não suportado",
        description: "Use arquivos MP4, MPEG, MOV, WebM ou OGG",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);

    try {
      const formData = new FormData();
      formData.append("video", file);

      // Simulate progress since fetch doesn't support upload progress natively
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      const response = await fetch("/api/exercise-videos", {
        method: "POST",
        body: formData,
        credentials: "include",
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.message || "Erro ao fazer upload do vídeo");
      }

      const result = await response.json();
      handleUrlChange(result.videoUrl);

      toast({
        title: "Upload concluído",
        description: "Vídeo enviado com sucesso!",
      });
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Erro no upload",
        description: error.message || "Falha ao fazer upload do vídeo",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
      // Clear the input so the same file can be selected again if needed
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    }
  };

  const clearVideo = () => {
    setVideoUrl("");
    onChange("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const triggerFileSelect = () => {
    fileInputRef.current?.click();
  };

  return (
    <div className={`space-y-3 ${className}`}>
      <div className="flex items-center justify-between">
        <Label className="text-sm font-medium">Vídeo do Exercício</Label>
        {value && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={clearVideo}
            className="text-red-500 hover:text-red-700"
          >
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="link" className="flex items-center gap-2">
            <Link className="h-4 w-4" />
            Link
          </TabsTrigger>
          <TabsTrigger value="upload" className="flex items-center gap-2">
            <Upload className="h-4 w-4" />
            Upload
          </TabsTrigger>
        </TabsList>

        <TabsContent value="link" className="space-y-2">
          <Input
            type="url"
            placeholder="https://youtube.com/watch?v=... ou https://vimeo.com/..."
            value={activeTab === "link" ? videoUrl : ""}
            onChange={(e) => handleUrlChange(e.target.value)}
            className="w-full"
          />
          <p className="text-xs text-gray-500">
            Suporte para YouTube, Vimeo ou links diretos de vídeo
          </p>
        </TabsContent>

        <TabsContent value="upload" className="space-y-2">
          <input
            ref={fileInputRef}
            type="file"
            accept="video/*"
            onChange={handleFileUpload}
            className="hidden"
            disabled={isUploading}
          />

          {!videoUrl.startsWith("/uploads/") ? (
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-gray-400 transition-colors">
              <Button
                type="button"
                variant="outline"
                onClick={triggerFileSelect}
                disabled={isUploading}
                className="w-full"
              >
                {isUploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-current border-r-transparent rounded-full animate-spin mr-2" />
                    Enviando... {uploadProgress}%
                  </>
                ) : (
                  <>
                    <Upload className="h-4 w-4 mr-2" />
                    Selecionar Vídeo
                  </>
                )}
              </Button>
              {isUploading && (
                <div className="mt-3">
                  <div className="bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                </div>
              )}
              <p className="text-xs text-gray-500 mt-2">
                MP4, MOV, WebM até 100MB
              </p>
            </div>
          ) : (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-center justify-center text-green-600">
                <Check className="h-5 w-5 mr-2" />
                <span className="text-sm font-medium">
                  Vídeo enviado com sucesso
                </span>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={triggerFileSelect}
                disabled={isUploading}
                className="w-full mt-2"
              >
                <Upload className="h-4 w-4 mr-2" />
                Trocar vídeo
              </Button>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Video Preview */}
      {value && (
        <div className="flex items-center gap-2 p-2 bg-gray-50 rounded border">
          <VideoIcon className="h-4 w-4 text-blue-600" />
          <span className="text-sm text-gray-700 flex-1 truncate">
            {value.startsWith("/uploads/")
              ? "Vídeo enviado"
              : value.includes("youtube.com") || value.includes("youtu.be")
              ? "YouTube"
              : value.includes("vimeo.com")
              ? "Vimeo"
              : "Link de vídeo"}
          </span>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => window.open(value, "_blank")}
            className="text-blue-600 hover:text-blue-800 px-2"
          >
            Ver
          </Button>
        </div>
      )}
    </div>
  );
}
