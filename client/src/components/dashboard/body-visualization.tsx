import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BodyVisualizationProps {
  assessment?: {
    currentWeight?: number;
    currentHeight?: number;
    bmi?: number;
    waistCirc?: string | null;
    hipCirc?: string | null;
    chestCirc?: string | null;
    rightArmContractedCirc?: string | null;
    rightArmRelaxedCirc?: string | null;
    leftArmContractedCirc?: string | null;
    leftArmRelaxedCirc?: string | null;
    rightThighCirc?: string | null;
    leftThighCirc?: string | null;
    rightCalfCirc?: string | null;
    leftCalfCirc?: string | null;
    bodyFatPercentage?: string | null;
    leanMass?: string | null;
    fatMass?: string | null;
    waistHipRatio?: string | null;
    waistHipRatioClassification?: string | null;
    tricepsSkinFold?: string | null;
    subscapularSkinFold?: string | null;
    axillaryMidSkinFold?: string | null;
    pectoralSkinFold?: string | null;
    suprailiacSkinFold?: string | null;
    abdominalSkinFold?: string | null;
    thighSkinFold?: string | null;
    bodyWater?: string | null;
    bloodPressure?: string | null;
    restingHeartRate?: string | null;
    oxygenSaturation?: string | null;
    subjectiveEffortPerception?: string | null;
    maxPushUps?: string | null;
    maxSquats?: string | null;
    maxSitUps?: string | null;
    plankTime?: string | null;
    cardioTest?: string | null;
    cardioTestResult?: string | null;
    flexibility?: string | null;
    postureAssessment?: string | null;
    balanceCoordination?: string | null;
    additionalNotes?: string | null;
    gender?: string;
  };
  interactive?: boolean;
}

export default function BodyVisualization({
  assessment,
  interactive = true,
}: BodyVisualizationProps) {
  const [selectedGender, setSelectedGender] = useState<"male" | "female">(
    "male"
  );
  const [selectedPart, setSelectedPart] = useState<string | null>(null);

  const getBMICategory = (bmi: number) => {
    if (bmi < 18.5)
      return { category: "Abaixo do peso", color: "bg-blue-100 text-blue-800" };
    if (bmi < 25)
      return { category: "Peso normal", color: "bg-green-100 text-green-800" };
    if (bmi < 30)
      return { category: "Sobrepeso", color: "bg-yellow-100 text-yellow-800" };
    return { category: "Obesidade", color: "bg-red-100 text-red-800" };
  };

  const getBodyFatClassification = (
    bodyFat: number,
    gender: "male" | "female"
  ) => {
    if (gender === "male") {
      if (bodyFat < 6)
        return {
          category: "Essencial",
          color: "bg-blue-100 text-blue-800",
          type: "male-essential" as const,
        };
      if (bodyFat < 14)
        return {
          category: "Atleta",
          color: "bg-green-100 text-green-800",
          type: "male-athlete" as const,
        };
      if (bodyFat < 18)
        return {
          category: "Fitness",
          color: "bg-emerald-100 text-emerald-800",
          type: "male-fitness" as const,
        };
      if (bodyFat < 25)
        return {
          category: "Média",
          color: "bg-yellow-100 text-yellow-800",
          type: "male-average" as const,
        };
      return {
        category: "Obesidade",
        color: "bg-red-100 text-red-800",
        type: "male-obese" as const,
      };
    } else {
      if (bodyFat < 14)
        return {
          category: "Essencial",
          color: "bg-blue-100 text-blue-800",
          type: "female-essential" as const,
        };
      if (bodyFat < 21)
        return {
          category: "Atleta",
          color: "bg-green-100 text-green-800",
          type: "female-athlete" as const,
        };
      if (bodyFat < 25)
        return {
          category: "Fitness",
          color: "bg-emerald-100 text-emerald-800",
          type: "female-fitness" as const,
        };
      if (bodyFat < 32)
        return {
          category: "Média",
          color: "bg-yellow-100 text-yellow-800",
          type: "female-average" as const,
        };
      return {
        category: "Obesidade",
        color: "bg-red-100 text-red-800",
        type: "female-obese" as const,
      };
    }
  };

  const bodyParts = {
    chest: { label: "Tórax", value: assessment?.chestCirc },
    rightArmContracted: {
      label: "Braço D (Cont.)",
      value: assessment?.rightArmContractedCirc,
    },
    rightArmRelaxed: {
      label: "Braço D (Rlx.)",
      value: assessment?.rightArmRelaxedCirc,
    },
    leftArmContracted: {
      label: "Braço E (Cont.)",
      value: assessment?.leftArmContractedCirc,
    },
    leftArmRelaxed: {
      label: "Braço E (Rlx.)",
      value: assessment?.leftArmRelaxedCirc,
    },
    waist: { label: "Cintura", value: assessment?.waistCirc },
    hip: { label: "Quadril", value: assessment?.hipCirc },
    rightThigh: { label: "Coxa D", value: assessment?.rightThighCirc },
    leftThigh: { label: "Coxa E", value: assessment?.leftThighCirc },
    rightCalf: { label: "Pant D", value: assessment?.rightCalfCirc },
    leftCalf: { label: "Pant E", value: assessment?.leftCalfCirc },
  };

  const MaleBodySVG = () => (
    <svg viewBox="0 0 200 400" className="w-full h-full">
      {/* Cabeça */}
      <circle
        cx="100"
        cy="40"
        r="25"
        fill="#f3f4f6"
        stroke="#374151"
        strokeWidth="2"
      />

      {/* Pescoço */}
      <rect
        x="90"
        y="60"
        width="20"
        height="20"
        fill="#f3f4f6"
        stroke="#374151"
        strokeWidth="2"
      />

      {/* Peito/Tronco */}
      <rect
        x="70"
        y="80"
        width="60"
        height="80"
        rx="10"
        fill={selectedPart === "chest" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "chest" ? null : "chest")
        }
      />

      {/* Braços */}
      <rect
        x="40"
        y="90"
        width="25"
        height="60"
        rx="12"
        fill={selectedPart === "arm" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive && setSelectedPart(selectedPart === "arm" ? null : "arm")
        }
      />
      <rect
        x="135"
        y="90"
        width="25"
        height="60"
        rx="12"
        fill={selectedPart === "arm" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive && setSelectedPart(selectedPart === "arm" ? null : "arm")
        }
      />

      {/* Cintura */}
      <rect
        x="75"
        y="160"
        width="50"
        height="30"
        rx="5"
        fill={selectedPart === "waist" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "waist" ? null : "waist")
        }
      />

      {/* Abdômen */}
      <rect
        x="80"
        y="190"
        width="40"
        height="40"
        rx="5"
        fill={selectedPart === "abdomen" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "abdomen" ? null : "abdomen")
        }
      />

      {/* Quadril */}
      <rect
        x="75"
        y="230"
        width="50"
        height="35"
        rx="8"
        fill={selectedPart === "hip" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive && setSelectedPart(selectedPart === "hip" ? null : "hip")
        }
      />

      {/* Coxas */}
      <rect
        x="80"
        y="265"
        width="18"
        height="70"
        rx="9"
        fill={selectedPart === "thigh" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "thigh" ? null : "thigh")
        }
      />
      <rect
        x="102"
        y="265"
        width="18"
        height="70"
        rx="9"
        fill={selectedPart === "thigh" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "thigh" ? null : "thigh")
        }
      />

      {/* Panturrilhas */}
      <rect
        x="82"
        y="335"
        width="14"
        height="50"
        rx="7"
        fill={selectedPart === "calf" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "calf" ? null : "calf")
        }
      />
      <rect
        x="104"
        y="335"
        width="14"
        height="50"
        rx="7"
        fill={selectedPart === "calf" ? "#dbeafe" : "#f3f4f6"}
        stroke="#374151"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "calf" ? null : "calf")
        }
      />

      {/* Pés */}
      <ellipse
        cx="89"
        cy="395"
        rx="12"
        ry="8"
        fill="#f3f4f6"
        stroke="#374151"
        strokeWidth="2"
      />
      <ellipse
        cx="111"
        cy="395"
        rx="12"
        ry="8"
        fill="#f3f4f6"
        stroke="#374151"
        strokeWidth="2"
      />
    </svg>
  );

  const FemaleBodySVG = () => (
    <svg viewBox="0 0 200 400" className="w-full h-full">
      {/* Cabeça */}
      <circle
        cx="100"
        cy="40"
        r="25"
        fill="#fef7ff"
        stroke="#7c2d92"
        strokeWidth="2"
      />

      {/* Pescoço */}
      <rect
        x="90"
        y="60"
        width="20"
        height="20"
        fill="#fef7ff"
        stroke="#7c2d92"
        strokeWidth="2"
      />

      {/* Peito/Tronco (formato mais curvilíneo) */}
      <path
        d="M 70 80 Q 65 100 70 120 L 70 150 Q 70 160 80 160 L 120 160 Q 130 160 130 150 L 130 120 Q 135 100 130 80 Z"
        fill={selectedPart === "chest" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "chest" ? null : "chest")
        }
      />

      {/* Braços */}
      <rect
        x="40"
        y="90"
        width="25"
        height="60"
        rx="12"
        fill={selectedPart === "arm" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive && setSelectedPart(selectedPart === "arm" ? null : "arm")
        }
      />
      <rect
        x="135"
        y="90"
        width="25"
        height="60"
        rx="12"
        fill={selectedPart === "arm" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive && setSelectedPart(selectedPart === "arm" ? null : "arm")
        }
      />

      {/* Cintura (mais estreita) */}
      <rect
        x="80"
        y="160"
        width="40"
        height="25"
        rx="5"
        fill={selectedPart === "waist" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "waist" ? null : "waist")
        }
      />

      {/* Abdômen */}
      <rect
        x="82"
        y="185"
        width="36"
        height="35"
        rx="5"
        fill={selectedPart === "abdomen" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "abdomen" ? null : "abdomen")
        }
      />

      {/* Quadril (mais largo) */}
      <path
        d="M 70 220 Q 65 235 70 250 L 70 255 Q 70 265 80 265 L 120 265 Q 130 265 130 255 L 130 250 Q 135 235 130 220 Z"
        fill={selectedPart === "hip" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive && setSelectedPart(selectedPart === "hip" ? null : "hip")
        }
      />

      {/* Coxas */}
      <rect
        x="80"
        y="265"
        width="18"
        height="70"
        rx="9"
        fill={selectedPart === "thigh" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "thigh" ? null : "thigh")
        }
      />
      <rect
        x="102"
        y="265"
        width="18"
        height="70"
        rx="9"
        fill={selectedPart === "thigh" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "thigh" ? null : "thigh")
        }
      />

      {/* Panturrilhas */}
      <rect
        x="82"
        y="335"
        width="14"
        height="50"
        rx="7"
        fill={selectedPart === "calf" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "calf" ? null : "calf")
        }
      />
      <rect
        x="104"
        y="335"
        width="14"
        height="50"
        rx="7"
        fill={selectedPart === "calf" ? "#f3e8ff" : "#fef7ff"}
        stroke="#7c2d92"
        strokeWidth="2"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "calf" ? null : "calf")
        }
      />

      {/* Pés */}
      <ellipse
        cx="89"
        cy="395"
        rx="12"
        ry="8"
        fill="#fef7ff"
        stroke="#7c2d92"
        strokeWidth="2"
      />
      <ellipse
        cx="111"
        cy="395"
        rx="12"
        ry="8"
        fill="#fef7ff"
        stroke="#7c2d92"
        strokeWidth="2"
      />
    </svg>
  );

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center justify-between">
          <span>📊 Visualização Corporal</span>
          {interactive && (
            <div className="flex gap-2">
              <Button
                variant={selectedGender === "male" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGender("male")}
              >
                👨 Masculino
              </Button>
              <Button
                variant={selectedGender === "female" ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedGender("female")}
              >
                👩 Feminino
              </Button>
            </div>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Visualização corporal */}
          <div className="space-y-4">
            <div className="relative bg-gray-50 rounded-lg p-4 min-h-[400px]">
              <div className="w-full h-[400px] flex items-center justify-center">
                {selectedGender === "male" ? (
                  <MaleBodySVG />
                ) : (
                  <FemaleBodySVG />
                )}
              </div>
              {interactive && (
                <p className="text-xs text-gray-500 text-center mt-2">
                  Clique nas partes do corpo para ver as medidas
                </p>
              )}
            </div>
          </div>

          {/* Informações e medidas */}
          <div className="space-y-4">
            {/* Dados gerais */}
            {assessment && (
              <div className="grid grid-cols-2 gap-4">
                {assessment.currentWeight && (
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <p className="text-sm text-gray-600">Peso</p>
                    <p className="text-lg font-semibold text-blue-600">
                      {assessment.currentWeight.toFixed(1)} kg
                    </p>
                  </div>
                )}
                {assessment.currentHeight && (
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <p className="text-sm text-gray-600">Altura</p>
                    <p className="text-lg font-semibold text-green-600">
                      {assessment.currentHeight.toFixed(0)} cm
                    </p>
                  </div>
                )}
                {assessment.bmi && (
                  <div className="col-span-2 text-center p-3 bg-purple-50 rounded-lg">
                    <p className="text-sm text-gray-600">IMC</p>
                    <div className="flex items-center justify-center gap-2">
                      <p className="text-lg font-semibold text-purple-600">
                        {assessment.bmi.toFixed(1)}
                      </p>
                      <Badge className={getBMICategory(assessment.bmi).color}>
                        {getBMICategory(assessment.bmi).category}
                      </Badge>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Circunferências */}
            <div className="space-y-3">
              <h4 className="font-semibold text-gray-700">
                Circunferências (cm)
              </h4>
              <div className="grid gap-2">
                {Object.entries(bodyParts).map(([key, part]) => (
                  <div
                    key={key}
                    className={`flex justify-between items-center p-2 rounded border transition-colors ${
                      selectedPart === key
                        ? "bg-blue-50 border-blue-200"
                        : "bg-gray-50 hover:bg-gray-100"
                    } ${interactive ? "cursor-pointer" : ""}`}
                    onClick={() =>
                      interactive &&
                      setSelectedPart(selectedPart === key ? null : key)
                    }
                  >
                    <span className="text-sm font-medium">{part.label}</span>
                    <span className="text-sm text-gray-600">
                      {part.value ? `${part.value.toFixed(1)} cm` : "-"}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Composição corporal */}
            {assessment &&
              (assessment.bodyFatPercentage ||
                assessment.leanMass ||
                assessment.fatMass) && (
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-700">
                    Composição Corporal
                  </h4>
                  <div className="grid gap-2">
                    {assessment.bodyFatPercentage && (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center p-2 bg-orange-50 rounded">
                          <span className="text-sm font-medium">% Gordura</span>
                          <span className="text-sm text-orange-600 font-semibold">
                            {parseFloat(assessment.bodyFatPercentage).toFixed(
                              1
                            )}
                            %
                          </span>
                        </div>
                        {assessment.gender && (
                          <div className="flex justify-center">
                            <Badge
                              className={
                                getBodyFatClassification(
                                  parseFloat(assessment.bodyFatPercentage),
                                  assessment.gender as "male" | "female"
                                ).color
                              }
                            >
                              {
                                getBodyFatClassification(
                                  parseFloat(assessment.bodyFatPercentage),
                                  assessment.gender as "male" | "female"
                                ).category
                              }
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    {assessment.leanMass && (
                      <div className="flex justify-between items-center p-2 bg-green-50 rounded">
                        <span className="text-sm font-medium">
                          Massa Livre de Gord.
                        </span>
                        <span className="text-sm text-green-600 font-semibold">
                          {parseFloat(assessment.leanMass).toFixed(1)} kg
                        </span>
                      </div>
                    )}
                    {assessment.fatMass && (
                      <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm font-medium">Massa Gorda</span>
                        <span className="text-sm text-red-600 font-semibold">
                          {parseFloat(assessment.fatMass).toFixed(1)} kg
                        </span>
                      </div>
                    )}
                    {assessment.waistHipRatio && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                          <span className="text-sm font-medium">RCQ</span>
                          <span className="text-sm text-purple-600 font-semibold">
                            {parseFloat(assessment.waistHipRatio).toFixed(2)}
                          </span>
                        </div>
                        {assessment.waistHipRatioClassification && (
                          <div className="flex justify-center">
                            <Badge variant="outline" className="text-xs">
                              {assessment.waistHipRatioClassification}
                            </Badge>
                          </div>
                        )}
                      </div>
                    )}
                    {assessment.bodyWater && (
                      <div className="flex justify-between items-center p-2 bg-blue-50 rounded">
                        <span className="text-sm font-medium">% Água</span>
                        <span className="text-sm text-blue-600 font-semibold">
                          {parseFloat(assessment.bodyWater).toFixed(1)}%
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              )}
          </div>
        </div>

        {/* Parte selecionada */}
        {selectedPart && interactive && (
          <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <h4 className="font-semibold text-blue-800 mb-2">
              {bodyParts[selectedPart as keyof typeof bodyParts]?.label}
            </h4>
            <p className="text-sm text-blue-700">
              Medida atual:{" "}
              <span className="font-semibold">
                {bodyParts[selectedPart as keyof typeof bodyParts]?.value
                  ? `${bodyParts[
                      selectedPart as keyof typeof bodyParts
                    ].value?.toFixed(1)} cm`
                  : "Não informado"}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
