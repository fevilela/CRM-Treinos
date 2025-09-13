import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { X, ExternalLink } from "lucide-react";

interface VideoModalProps {
  isOpen: boolean;
  onClose: () => void;
  videoUrl: string;
  exerciseName: string;
}

export function VideoModal({
  isOpen,
  onClose,
  videoUrl,
  exerciseName,
}: VideoModalProps) {
  const [videoError, setVideoError] = useState(false);

  const isYouTube =
    videoUrl.includes("youtube.com") || videoUrl.includes("youtu.be");
  const isVimeo = videoUrl.includes("vimeo.com");

  const getEmbedUrl = (url: string) => {
    if (isYouTube) {
      const videoId = url.includes("watch?v=")
        ? url.split("watch?v=")[1]?.split("&")[0]
        : url.split("youtu.be/")[1]?.split("?")[0];
      return `https://www.youtube.com/embed/${videoId}`;
    }

    if (isVimeo) {
      const videoId = url.split("vimeo.com/")[1]?.split("?")[0];
      return `https://player.vimeo.com/video/${videoId}`;
    }

    return url;
  };

  const handleOpenExternal = () => {
    window.open(videoUrl, "_blank");
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0 bg-black">
        <DialogHeader className="absolute top-2 right-2 z-10">
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleOpenExternal}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <ExternalLink className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="text-white hover:bg-white/20 rounded-full"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="relative w-full h-full min-h-[400px]">
          <DialogTitle className="sr-only">
            Vídeo do exercício: {exerciseName}
          </DialogTitle>

          {!videoError && (isYouTube || isVimeo) ? (
            <iframe
              src={getEmbedUrl(videoUrl)}
              className="w-full h-full min-h-[400px] rounded-lg"
              allowFullScreen
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              onError={() => setVideoError(true)}
            />
          ) : !videoError ? (
            <video
              src={videoUrl}
              controls
              className="w-full h-full min-h-[400px] rounded-lg"
              onError={() => setVideoError(true)}
            >
              Seu navegador não suporta reprodução de vídeo.
            </video>
          ) : (
            <div className="flex flex-col items-center justify-center h-full min-h-[400px] text-white">
              <h3 className="text-lg font-semibold mb-2">
                Não foi possível carregar o vídeo
              </h3>
              <p className="text-sm text-gray-300 mb-4">
                O vídeo pode estar em um formato não suportado ou indisponível.
              </p>
              <Button
                onClick={handleOpenExternal}
                variant="outline"
                className="text-white border-white hover:bg-white hover:text-black"
              >
                <ExternalLink className="h-4 w-4 mr-2" />
                Abrir em nova aba
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
