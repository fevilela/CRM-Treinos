import React, { useState, useMemo, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BodyMeasurements {
  currentWeight?: number;
  currentHeight?: number;
  bmi?: number;
  neck?: number;
  chest?: number;
  chestCirc?: number;
  rightArm?: number;
  leftArm?: number;
  rightArmContractedCirc?: number;
  rightArmRelaxedCirc?: number;
  leftArmContractedCirc?: number;
  leftArmRelaxedCirc?: number;
  waist?: number;
  waistCirc?: number;
  hips?: number;
  hipCirc?: number;
  rightThigh?: number;
  leftThigh?: number;
  rightThighCirc?: number;
  leftThighCirc?: number;
  rightCalf?: number;
  leftCalf?: number;
  rightCalfCirc?: number;
  leftCalfCirc?: number;
  bodyFatPercentage?: number;
  gender?: string;
}

interface BodyPart {
  name: string;
  label: string;
  measurementKey?: keyof BodyMeasurements;
  description: string;
}

// Modelo anatômico realista em SVG
function RealisticBodyDiagram({
  measurements,
  selectedPart,
  onPartClick,
}: {
  measurements?: BodyMeasurements;
  selectedPart: string | null;
  onPartClick: (partName: string) => void;
}) {
  const bodyParts: BodyPart[] = useMemo(
    () => [
      {
        name: "head",
        label: "Cabeça/Pescoço",
        measurementKey: "neck",
        description: "Circunferência do pescoço",
      },
      {
        name: "chest",
        label: "Peito",
        measurementKey: "chestCirc",
        description: "Circunferência do peito",
      },
      {
        name: "waist",
        label: "Cintura",
        measurementKey: "waistCirc",
        description: "Circunferência da cintura",
      },
      {
        name: "hips",
        label: "Quadril",
        measurementKey: "hipCirc",
        description: "Circunferência do quadril",
      },
      {
        name: "rightArm",
        label: "Braço Direito",
        measurementKey: "rightArmContractedCirc",
        description: "Circunferência do braço direito",
      },
      {
        name: "leftArm",
        label: "Braço Esquerdo",
        measurementKey: "leftArmContractedCirc",
        description: "Circunferência do braço esquerdo",
      },
      {
        name: "rightThigh",
        label: "Coxa Direita",
        measurementKey: "rightThighCirc",
        description: "Circunferência da coxa direita",
      },
      {
        name: "leftThigh",
        label: "Coxa Esquerda",
        measurementKey: "leftThighCirc",
        description: "Circunferência da coxa esquerda",
      },
      {
        name: "rightCalf",
        label: "Panturrilha Direita",
        measurementKey: "rightCalfCirc",
        description: "Circunferência da panturrilha direita",
      },
      {
        name: "leftCalf",
        label: "Panturrilha Esquerda",
        measurementKey: "leftCalfCirc",
        description: "Circunferência da panturrilha esquerda",
      },
    ],
    []
  );

  return (
    <div className="flex flex-col items-center">
      <svg
        width="400"
        height="700"
        viewBox="0 0 400 700"
        className="border rounded-lg bg-gradient-to-b from-amber-50 to-orange-100"
        style={{ filter: "drop-shadow(0 4px 6px rgba(0, 0, 0, 0.1))" }}
      >
        <defs>
          <radialGradient id="skinGradient" cx="50%" cy="30%">
            <stop offset="0%" stopColor="#fde4c4" />
            <stop offset="100%" stopColor="#d4a574" />
          </radialGradient>
          <radialGradient id="muscleGradient" cx="30%" cy="30%">
            <stop offset="0%" stopColor="#e8b894" />
            <stop offset="100%" stopColor="#c4956c" />
          </radialGradient>
        </defs>

        {/* Cabeça */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("head")}
        >
          <ellipse
            cx="200"
            cy="60"
            rx="35"
            ry="40"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse cx="190" cy="55" rx="3" ry="4" fill="#654321" />
          <ellipse cx="210" cy="55" rx="3" ry="4" fill="#654321" />
          <ellipse cx="200" cy="65" rx="2" ry="3" fill="#8b4513" />
          <path
            d="M 190 75 Q 200 80 210 75"
            stroke="#8b4513"
            strokeWidth="2"
            fill="none"
          />
          {selectedPart === "head" && (
            <ellipse
              cx="200"
              cy="60"
              rx="35"
              ry="40"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Pescoço */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("head")}
        >
          <ellipse
            cx="200"
            cy="110"
            rx="20"
            ry="25"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="1"
          />
          <path
            d="M 185 105 Q 200 100 215 105 Q 200 120 185 105"
            fill="url(#muscleGradient)"
            opacity="0.6"
          />
          {selectedPart === "head" && (
            <ellipse
              cx="200"
              cy="110"
              rx="20"
              ry="25"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Peito */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("chest")}
        >
          <path
            d="M 160 135 Q 200 125 240 135 L 245 180 Q 200 185 155 180 Z"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="180"
            cy="155"
            rx="18"
            ry="25"
            fill="url(#muscleGradient)"
            opacity="0.8"
          />
          <ellipse
            cx="220"
            cy="155"
            rx="18"
            ry="25"
            fill="url(#muscleGradient)"
            opacity="0.8"
          />
          <line
            x1="200"
            y1="140"
            x2="200"
            y2="175"
            stroke="#8b5a2b"
            strokeWidth="1"
          />
          <rect
            x="190"
            y="165"
            width="20"
            height="12"
            rx="3"
            fill="url(#muscleGradient)"
            opacity="0.6"
          />
          {selectedPart === "chest" && (
            <path
              d="M 160 135 Q 200 125 240 135 L 245 180 Q 200 185 155 180 Z"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Cintura */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("waist")}
        >
          <path
            d="M 155 180 Q 200 185 245 180 L 240 230 Q 200 235 160 230 Z"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <rect
            x="190"
            y="190"
            width="20"
            height="12"
            rx="3"
            fill="url(#muscleGradient)"
            opacity="0.7"
          />
          <rect
            x="190"
            y="205"
            width="20"
            height="12"
            rx="3"
            fill="url(#muscleGradient)"
            opacity="0.7"
          />
          <path
            d="M 175 195 Q 185 200 175 210"
            stroke="#8b5a2b"
            strokeWidth="1"
            fill="none"
          />
          <path
            d="M 225 195 Q 215 200 225 210"
            stroke="#8b5a2b"
            strokeWidth="1"
            fill="none"
          />
          {selectedPart === "waist" && (
            <path
              d="M 155 180 Q 200 185 245 180 L 240 230 Q 200 235 160 230 Z"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Quadril */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("hips")}
        >
          <path
            d="M 160 230 Q 200 235 240 230 L 245 270 Q 200 275 155 270 Z"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          {selectedPart === "hips" && (
            <path
              d="M 160 230 Q 200 235 240 230 L 245 270 Q 200 275 155 270 Z"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Braço direito */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("rightArm")}
        >
          <ellipse
            cx="140"
            cy="145"
            rx="20"
            ry="15"
            fill="url(#muscleGradient)"
          />
          <ellipse
            cx="125"
            cy="180"
            rx="15"
            ry="25"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="125"
            cy="175"
            rx="10"
            ry="20"
            fill="url(#muscleGradient)"
            opacity="0.8"
          />
          <ellipse
            cx="115"
            cy="220"
            rx="12"
            ry="25"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="110"
            cy="250"
            rx="8"
            ry="12"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="1"
          />
          {selectedPart === "rightArm" && (
            <>
              <ellipse
                cx="125"
                cy="180"
                rx="15"
                ry="25"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
              />
              <ellipse
                cx="115"
                cy="220"
                rx="12"
                ry="25"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
              />
            </>
          )}
        </g>

        {/* Braço esquerdo */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("leftArm")}
        >
          <ellipse
            cx="260"
            cy="145"
            rx="20"
            ry="15"
            fill="url(#muscleGradient)"
          />
          <ellipse
            cx="275"
            cy="180"
            rx="15"
            ry="25"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="275"
            cy="175"
            rx="10"
            ry="20"
            fill="url(#muscleGradient)"
            opacity="0.8"
          />
          <ellipse
            cx="285"
            cy="220"
            rx="12"
            ry="25"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="290"
            cy="250"
            rx="8"
            ry="12"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="1"
          />
          {selectedPart === "leftArm" && (
            <>
              <ellipse
                cx="275"
                cy="180"
                rx="15"
                ry="25"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
              />
              <ellipse
                cx="285"
                cy="220"
                rx="12"
                ry="25"
                fill="none"
                stroke="#ef4444"
                strokeWidth="3"
              />
            </>
          )}
        </g>

        {/* Coxa direita */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("rightThigh")}
        >
          <ellipse
            cx="175"
            cy="350"
            rx="20"
            ry="55"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="175"
            cy="340"
            rx="15"
            ry="45"
            fill="url(#muscleGradient)"
            opacity="0.7"
          />
          <line
            x1="175"
            y1="310"
            x2="175"
            y2="380"
            stroke="#8b5a2b"
            strokeWidth="1"
          />
          {selectedPart === "rightThigh" && (
            <ellipse
              cx="175"
              cy="350"
              rx="20"
              ry="55"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Coxa esquerda */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("leftThigh")}
        >
          <ellipse
            cx="225"
            cy="350"
            rx="20"
            ry="55"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="225"
            cy="340"
            rx="15"
            ry="45"
            fill="url(#muscleGradient)"
            opacity="0.7"
          />
          <line
            x1="225"
            y1="310"
            x2="225"
            y2="380"
            stroke="#8b5a2b"
            strokeWidth="1"
          />
          {selectedPart === "leftThigh" && (
            <ellipse
              cx="225"
              cy="350"
              rx="20"
              ry="55"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Panturrilha direita */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("rightCalf")}
        >
          <ellipse
            cx="175"
            cy="450"
            rx="15"
            ry="40"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="175"
            cy="445"
            rx="12"
            ry="35"
            fill="url(#muscleGradient)"
            opacity="0.7"
          />
          {selectedPart === "rightCalf" && (
            <ellipse
              cx="175"
              cy="450"
              rx="15"
              ry="40"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Panturrilha esquerda */}
        <g
          className="cursor-pointer hover:opacity-90 transition-all"
          onClick={() => onPartClick("leftCalf")}
        >
          <ellipse
            cx="225"
            cy="450"
            rx="15"
            ry="40"
            fill="url(#skinGradient)"
            stroke="#8b5a2b"
            strokeWidth="2"
          />
          <ellipse
            cx="225"
            cy="445"
            rx="12"
            ry="35"
            fill="url(#muscleGradient)"
            opacity="0.7"
          />
          {selectedPart === "leftCalf" && (
            <ellipse
              cx="225"
              cy="450"
              rx="15"
              ry="40"
              fill="none"
              stroke="#ef4444"
              strokeWidth="3"
            />
          )}
        </g>

        {/* Pés */}
        <ellipse
          cx="175"
          cy="505"
          rx="12"
          ry="20"
          fill="url(#skinGradient)"
          stroke="#8b5a2b"
          strokeWidth="1"
        />
        <ellipse
          cx="225"
          cy="505"
          rx="12"
          ry="20"
          fill="url(#skinGradient)"
          stroke="#8b5a2b"
          strokeWidth="1"
        />
      </svg>

      <div className="mt-4 text-center">
        <p className="text-sm text-gray-600">
          🖱️ Clique nas partes do corpo para ver as medições antropométricas
        </p>
        {selectedPart && (
          <div className="mt-2 p-3 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-sm font-medium text-red-800">
              🎯 {bodyParts.find((p) => p.name === selectedPart)?.label}
            </p>
            <p className="text-xs text-red-600">
              {bodyParts.find((p) => p.name === selectedPart)?.description}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default function HumanBody3D({
  measurements,
  interactive,
  onPartClick,
}: {
  measurements?: BodyMeasurements;
  interactive?: boolean;
  onPartClick?: (partName: string, measurements?: BodyMeasurements) => void;
}) {
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const handlePartClick = useCallback(
    (partName: string) => {
      setSelectedPart(selectedPart === partName ? null : partName);
      if (onPartClick) {
        onPartClick(partName, measurements);
      }
    },
    [selectedPart, onPartClick, measurements]
  );

  const clearSelection = useCallback(() => {
    setSelectedPart(null);
  }, []);

  const getMeasurementValue = useCallback(
    (partName: string) => {
      if (!measurements) return null;

      const measurementMap: Record<string, keyof BodyMeasurements> = {
        head: "neck",
        chest: "chestCirc",
        waist: "waistCirc",
        hips: "hipCirc",
        rightArm: "rightArmContractedCirc",
        leftArm: "leftArmContractedCirc",
        rightThigh: "rightThighCirc",
        leftThigh: "leftThighCirc",
        rightCalf: "rightCalfCirc",
        leftCalf: "leftCalfCirc",
      };

      const key = measurementMap[partName];
      return key ? measurements[key] : null;
    },
    [measurements]
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-xl font-bold text-gray-800">
              🏋️ Modelo Anatômico Realista
            </CardTitle>
            <p className="text-sm text-gray-600 mt-1">
              Visualização detalhada das medidas antropométricas
            </p>
          </div>
          <div className="flex items-center gap-2">
            {selectedPart && (
              <Button
                variant="outline"
                size="sm"
                onClick={clearSelection}
                className="flex items-center gap-2"
              >
                ✕ Limpar Seleção
              </Button>
            )}
            <Badge variant="secondary" className="text-xs">
              Realista
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="flex flex-col lg:flex-row gap-6">
          <div className="flex-1 flex justify-center">
            <RealisticBodyDiagram
              measurements={measurements}
              selectedPart={selectedPart}
              onPartClick={handlePartClick}
            />
          </div>

          <div className="flex-1 space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">📊 Dados Gerais</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {measurements?.currentWeight && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Peso atual:</span>
                    <span className="text-sm font-medium">
                      {measurements.currentWeight} kg
                    </span>
                  </div>
                )}
                {measurements?.currentHeight && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">Altura:</span>
                    <span className="text-sm font-medium">
                      {measurements.currentHeight} cm
                    </span>
                  </div>
                )}
                {measurements?.bmi && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">IMC:</span>
                    <span className="text-sm font-medium">
                      {measurements.bmi.toFixed(1)}
                    </span>
                  </div>
                )}
                {measurements?.bodyFatPercentage && (
                  <div className="flex justify-between">
                    <span className="text-sm text-gray-600">% Gordura:</span>
                    <span className="text-sm font-medium">
                      {measurements.bodyFatPercentage}%
                    </span>
                  </div>
                )}
              </CardContent>
            </Card>

            {selectedPart && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">
                    🎯 Medição Selecionada
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <h4 className="font-semibold text-red-800">
                      {selectedPart === "head" && "Pescoço"}
                      {selectedPart === "chest" && "Peito"}
                      {selectedPart === "waist" && "Cintura"}
                      {selectedPart === "hips" && "Quadril"}
                      {selectedPart === "rightArm" && "Braço Direito"}
                      {selectedPart === "leftArm" && "Braço Esquerdo"}
                      {selectedPart === "rightThigh" && "Coxa Direita"}
                      {selectedPart === "leftThigh" && "Coxa Esquerda"}
                      {selectedPart === "rightCalf" && "Panturrilha Direita"}
                      {selectedPart === "leftCalf" && "Panturrilha Esquerda"}
                    </h4>

                    {getMeasurementValue(selectedPart) ? (
                      <div className="p-3 bg-green-50 border border-green-200 rounded-lg">
                        <p className="text-lg font-bold text-green-800">
                          {getMeasurementValue(selectedPart)} cm
                        </p>
                        <p className="text-sm text-green-600">
                          Circunferência registrada
                        </p>
                      </div>
                    ) : (
                      <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                        <p className="text-sm text-gray-600">
                          Medição não disponível para esta parte do corpo.
                        </p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">ℹ️ Como usar</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Clique nas partes do corpo para ver medições</li>
                  <li>• Músculos destacados mostram anatomia realista</li>
                  <li>• Bordas vermelhas indicam parte selecionada</li>
                  <li>• Use o botão "Limpar Seleção" para deselecionar</li>
                </ul>
              </CardContent>
            </Card>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
