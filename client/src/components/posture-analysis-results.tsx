import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, AlertTriangle, XCircle, Download } from "lucide-react";

interface PostureDeviation {
  joint: string;
  issue: string;
  severity: "normal" | "mild" | "moderate" | "severe";
  correction: string;
}

interface PostureAnalysisResultsProps {
  analysis: string;
  recommendations: string;
  deviations: PostureDeviation[];
  correctedVisualizationUrl?: string;
  originalPhotos?: Array<{
    type: "front" | "back" | "side_left" | "side_right";
    url: string;
  }>;
}

const severityConfig = {
  normal: { color: "bg-green-100 text-green-800", icon: CheckCircle },
  mild: { color: "bg-yellow-100 text-yellow-800", icon: AlertTriangle },
  moderate: { color: "bg-orange-100 text-orange-800", icon: AlertTriangle },
  severe: { color: "bg-red-100 text-red-800", icon: XCircle },
};

const jointTranslations: Record<string, string> = {
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

export function PostureAnalysisResults({
  analysis,
  recommendations,
  deviations,
  correctedVisualizationUrl,
  originalPhotos,
}: PostureAnalysisResultsProps) {
  return (
    <div className="space-y-6">
      {/* Análise Geral */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-blue-600" />
            Análise Postural Completa
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <p className="text-gray-700 whitespace-pre-wrap leading-relaxed">
              {analysis}
            </p>
          </div>
        </CardContent>
      </Card>

      {/* Comparação Visual: Atual vs Ideal */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Comparação Visual: Postura Atual vs Ideal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Fotos Originais */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-gray-800">
                Postura Atual
              </h3>
              {originalPhotos && originalPhotos.length > 0 ? (
                <div className="grid grid-cols-2 gap-2">
                  {originalPhotos.map((photo) => (
                    <div key={photo.type} className="relative">
                      <img
                        src={photo.url}
                        alt={`Vista ${photo.type}`}
                        className="w-full h-32 object-cover rounded-lg border-2 border-gray-200"
                        style={{
                          backgroundImage: `url("data:image/svg+xml,%3csvg width='100' height='100' xmlns='http://www.w3.org/2000/svg'%3e%3cdefs%3e%3cpattern id='grid' width='8' height='8' patternUnits='userSpaceOnUse'%3e%3cpath d='M 8 0 L 0 0 0 8' fill='none' stroke='%23ddd' stroke-width='0.5'/%3e%3c/pattern%3e%3c/defs%3e%3crect width='100%25' height='100%25' fill='url(%23grid)' /%3e%3c/svg%3e")`,
                          backgroundBlendMode: "overlay",
                        }}
                      />
                      <div className="absolute bottom-1 left-1 bg-black bg-opacity-60 text-white text-xs px-2 py-1 rounded">
                        {photo.type === "front"
                          ? "Frente"
                          : photo.type === "back"
                          ? "Costas"
                          : photo.type === "side_left"
                          ? "Lado Esq."
                          : "Lado Dir."}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="bg-gray-100 rounded-lg p-8 text-center">
                  <p className="text-gray-500">
                    Fotos originais não disponíveis
                  </p>
                </div>
              )}
            </div>

            {/* Visualização Corrigida */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-green-700">
                Postura Ideal (Com Correções)
              </h3>
              {correctedVisualizationUrl ? (
                <div className="relative">
                  <img
                    src={correctedVisualizationUrl}
                    alt="Visualização da Postura Corrigida"
                    className="w-full rounded-lg border-2 border-green-200 shadow-lg"
                  />
                  <div className="absolute bottom-2 right-2">
                    <Button
                      size="sm"
                      variant="outline"
                      className="bg-white bg-opacity-90"
                      onClick={() => {
                        const link = document.createElement("a");
                        link.href = correctedVisualizationUrl;
                        link.download = "postura-corrigida.jpg";
                        link.click();
                      }}
                    >
                      <Download className="w-4 h-4 mr-1" />
                      Baixar
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="bg-gradient-to-br from-blue-50 to-green-50 rounded-lg p-8 text-center border-2 border-dashed border-blue-300">
                  <div className="text-6xl mb-4">👤</div>
                  <p className="text-blue-600 font-medium mb-2">
                    Visualização IA em Processamento
                  </p>
                  <p className="text-sm text-gray-600">
                    A imagem da postura corrigida será gerada pela IA em breve
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Desvios Identificados */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-orange-600" />
            Desvios Posturais Identificados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {deviations.map((deviation, index) => {
              const config = severityConfig[deviation.severity];
              const Icon = config.icon;

              return (
                <div
                  key={index}
                  className="border rounded-lg p-4 hover:shadow-md transition-shadow"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5 text-gray-600" />
                      <h4 className="font-semibold text-gray-800">
                        {jointTranslations[deviation.joint] || deviation.joint}
                      </h4>
                    </div>
                    <Badge className={config.color}>
                      {deviation.severity === "normal"
                        ? "Normal"
                        : deviation.severity === "mild"
                        ? "Leve"
                        : deviation.severity === "moderate"
                        ? "Moderado"
                        : "Severo"}
                    </Badge>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <div>
                      <h5 className="font-medium text-red-700 mb-1">
                        Problema Identificado:
                      </h5>
                      <p className="text-gray-700 text-sm">{deviation.issue}</p>
                    </div>

                    <div>
                      <h5 className="font-medium text-green-700 mb-1">
                        Correção Sugerida:
                      </h5>
                      <p className="text-gray-700 text-sm">
                        {deviation.correction}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}

            {deviations.length === 0 && (
              <div className="text-center py-8">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h3 className="text-xl font-semibold text-green-700 mb-2">
                  Postura Excelente!
                </h3>
                <p className="text-gray-600">
                  Nenhum desvio postural significativo foi identificado.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Recomendações */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-green-600" />
            Recomendações de Correção
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="prose max-w-none">
            <div className="bg-green-50 border-l-4 border-green-400 p-4 rounded-r-lg">
              <p className="text-green-800 whitespace-pre-wrap leading-relaxed">
                {recommendations}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
