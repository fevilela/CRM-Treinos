import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface BodyVisualizationProps {
  assessment?: {
    currentWeight?: number;
    currentHeight?: number;
    bmi?: number;
    waistCirc?: string | number | null;
    hipCirc?: string | number | null;
    chestCirc?: string | number | null;
    rightArmContractedCirc?: string | number | null;
    rightArmRelaxedCirc?: string | number | null;
    leftArmContractedCirc?: string | number | null;
    leftArmRelaxedCirc?: string | number | null;
    rightThighCirc?: string | number | null;
    leftThighCirc?: string | number | null;
    rightCalfCirc?: string | number | null;
    leftCalfCirc?: string | number | null;
    bodyFatPercentage?: string | number | null;
    leanMass?: string | number | null;
    fatMass?: string | number | null;
    waistHipRatio?: string | number | null;
    waistHipRatioClassification?: string | null;
    tricepsSkinFold?: string | number | null;
    subscapularSkinFold?: string | number | null;
    axillaryMidSkinFold?: string | number | null;
    pectoralSkinFold?: string | number | null;
    suprailiacSkinFold?: string | number | null;
    abdominalSkinFold?: string | number | null;
    thighSkinFold?: string | number | null;
    bodyWater?: string | number | null;
    bloodPressure?: string | null;
    restingHeartRate?: string | number | null;
    oxygenSaturation?: string | number | null;
    subjectiveEffortPerception?: string | null;
    maxPushUps?: string | number | null;
    maxSquats?: string | number | null;
    maxSitUps?: string | number | null;
    plankTime?: string | number | null;
    cardioTest?: string | null;
    cardioTestResult?: string | null;
    flexibility?: string | null;
    postureAssessment?: string | null;
    balanceCoordination?: string | null;
    additionalNotes?: string | null;
    gender?: string;
    abdomenCirc?: string | number | null;
    armCirc?: string | number | null;
    thighCirc?: string | number | null;
    calfCirc?: string | number | null;
  };
  interactive?: boolean;
}

export default function BodyVisualization({
  assessment,
  interactive = true,
}: BodyVisualizationProps) {
  const [selectedGender, setSelectedGender] = useState<"male" | "female">(
    (assessment?.gender as "male" | "female") || "male"
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

  const formatValue = (value: string | number | null | undefined): string => {
    if (value === null || value === undefined) return "-";
    if (typeof value === "string") {
      const numValue = parseFloat(value);
      return isNaN(numValue) ? value : numValue.toFixed(1);
    }
    return value.toFixed(1);
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
    abdomen: { label: "Abdômen", value: assessment?.abdomenCirc },
    arm: { label: "Braço", value: assessment?.armCirc },
    thigh: { label: "Coxa", value: assessment?.thighCirc },
    calf: { label: "Panturrilha", value: assessment?.calfCirc },
    rightThigh: { label: "Coxa D", value: assessment?.rightThighCirc },
    leftThigh: { label: "Coxa E", value: assessment?.leftThighCirc },
    rightCalf: { label: "Pant D", value: assessment?.rightCalfCirc },
    leftCalf: { label: "Pant E", value: assessment?.leftCalfCirc },
  };

  const MaleBodySVG = () => (
    <svg viewBox="0 0 200 450" className="w-full h-full">
      {/* Cabeça anatômica */}
      <path
        d="M 100 10 Q 118 12 125 25 Q 127 35 125 45 Q 118 58 100 60 Q 82 58 75 45 Q 73 35 75 25 Q 82 12 100 10 Z"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />

      {/* Cabelo */}
      <path
        d="M 100 10 Q 120 8 128 22 Q 125 15 118 12 Q 100 8 82 12 Q 75 15 72 22 Q 80 8 100 10 Z"
        fill="#8b4513"
        stroke="#654321"
        strokeWidth="1"
      />

      {/* Olhos */}
      <ellipse cx="92" cy="30" rx="3" ry="2" fill="white" />
      <ellipse cx="108" cy="30" rx="3" ry="2" fill="white" />
      <circle cx="92" cy="30" r="1.5" fill="#2563eb" />
      <circle cx="108" cy="30" r="1.5" fill="#2563eb" />

      {/* Nariz */}
      <path d="M 100 35 L 98 40 L 102 40 Z" fill="#f59e0b" />

      {/* Boca */}
      <ellipse cx="100" cy="44" rx="4" ry="1.5" fill="#dc2626" />

      {/* Pescoço anatômico */}
      <path
        d="M 88 58 Q 90 65 92 75 L 108 75 Q 110 65 112 58 Q 108 60 100 60 Q 92 60 88 58 Z"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />

      {/* Músculos do pescoço (esternocleidomastóideo) */}
      <path
        d="M 94 62 Q 96 68 98 73"
        stroke="#e08c4a"
        strokeWidth="1"
        fill="none"
      />
      <path
        d="M 106 62 Q 104 68 102 73"
        stroke="#e08c4a"
        strokeWidth="1"
        fill="none"
      />

      {/* Ombros e deltóides anatômicos */}
      <ellipse
        cx="68"
        cy="88"
        rx="18"
        ry="12"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />
      <ellipse
        cx="132"
        cy="88"
        rx="18"
        ry="12"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />

      {/* Trapézio */}
      <path
        d="M 85 75 Q 100 78 115 75 Q 120 82 118 90 Q 100 85 82 90 Q 80 82 85 75 Z"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />

      {/* Peitorais anatômicos */}
      <path
        d="M 75 90 Q 85 95 95 105 Q 100 108 100 115 Q 95 110 85 108 Q 78 105 75 100 Z"
        fill={selectedPart === "chest" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "chest" ? null : "chest")
        }
      />
      <path
        d="M 125 90 Q 115 95 105 105 Q 100 108 100 115 Q 105 110 115 108 Q 122 105 125 100 Z"
        fill={selectedPart === "chest" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "chest" ? null : "chest")
        }
      />

      {/* Abdominais anatômicos */}
      <rect
        x="85"
        y="115"
        width="30"
        height="12"
        rx="3"
        fill={selectedPart === "abdomen" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "abdomen" ? null : "abdomen")
        }
      />
      <rect
        x="87"
        y="128"
        width="26"
        height="12"
        rx="3"
        fill={selectedPart === "abdomen" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "abdomen" ? null : "abdomen")
        }
      />
      <rect
        x="89"
        y="141"
        width="22"
        height="12"
        rx="3"
        fill={selectedPart === "abdomen" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "abdomen" ? null : "abdomen")
        }
      />

      {/* Linhas dos abdominais */}
      <line
        x1="100"
        y1="115"
        x2="100"
        y2="153"
        stroke="#d97706"
        strokeWidth="1"
        opacity="0.6"
      />
      <line
        x1="90"
        y1="121"
        x2="110"
        y2="121"
        stroke="#d97706"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <line
        x1="91"
        y1="134"
        x2="109"
        y2="134"
        stroke="#d97706"
        strokeWidth="0.8"
        opacity="0.4"
      />
      <line
        x1="93"
        y1="147"
        x2="107"
        y2="147"
        stroke="#d97706"
        strokeWidth="0.8"
        opacity="0.4"
      />

      {/* Cintura anatômica */}
      <path
        d="M 89 153 Q 85 158 85 165 Q 88 170 95 172 L 105 172 Q 112 170 115 165 Q 115 158 111 153 Z"
        fill={selectedPart === "waist" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "waist" ? null : "waist")
        }
      />

      {/* Bíceps direito */}
      <ellipse
        cx="50"
        cy="110"
        rx="11"
        ry="25"
        fill={selectedPart === "rightArmRelaxed" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(
            selectedPart === "rightArmRelaxed" ? null : "rightArmRelaxed"
          )
        }
      />

      {/* Bíceps esquerdo */}
      <ellipse
        cx="150"
        cy="110"
        rx="11"
        ry="25"
        fill={selectedPart === "leftArmRelaxed" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(
            selectedPart === "leftArmRelaxed" ? null : "leftArmRelaxed"
          )
        }
      />

      {/* Definição muscular dos braços */}
      <path
        d="M 45 100 Q 50 105 55 120"
        stroke="#d97706"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />
      <path
        d="M 155 100 Q 150 105 145 120"
        stroke="#d97706"
        strokeWidth="0.8"
        fill="none"
        opacity="0.6"
      />

      {/* Antebraços anatômicos */}
      <path
        d="M 45 135 Q 42 140 40 155 Q 38 165 40 175 Q 42 182 48 184 Q 52 182 54 175 Q 56 165 54 155 Q 52 140 49 135 Z"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />
      <path
        d="M 155 135 Q 158 140 160 155 Q 162 165 160 175 Q 158 182 152 184 Q 148 182 146 175 Q 144 165 146 155 Q 148 140 151 135 Z"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />

      {/* Mãos anatômicas */}
      <ellipse
        cx="44"
        cy="190"
        rx="8"
        ry="12"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />
      <ellipse
        cx="156"
        cy="190"
        rx="8"
        ry="12"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />

      {/* Quadril e glúteos anatômicos */}
      <path
        d="M 85 172 Q 80 180 78 195 Q 76 210 80 225 Q 85 235 95 240 L 105 240 Q 115 235 120 225 Q 124 210 122 195 Q 120 180 115 172 Z"
        fill={selectedPart === "hip" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive && setSelectedPart(selectedPart === "hip" ? null : "hip")
        }
      />

      {/* Coxas anatômicas com definição */}
      <path
        d="M 82 240 Q 75 250 73 270 Q 72 290 75 320 Q 78 340 85 345 Q 92 340 95 320 Q 98 290 97 270 Q 95 250 88 240 Z"
        fill={selectedPart === "rightThigh" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "rightThigh" ? null : "rightThigh")
        }
      />
      <path
        d="M 118 240 Q 125 250 127 270 Q 128 290 125 320 Q 122 340 115 345 Q 108 340 105 320 Q 102 290 103 270 Q 105 250 112 240 Z"
        fill={selectedPart === "leftThigh" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "leftThigh" ? null : "leftThigh")
        }
      />

      {/* Definição muscular das coxas (quadríceps) */}
      <path
        d="M 78 250 Q 85 260 92 320"
        stroke="#d97706"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M 122 250 Q 115 260 108 320"
        stroke="#d97706"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />

      {/* Joelhos anatômicos */}
      <ellipse
        cx="85"
        cy="350"
        rx="8"
        ry="6"
        fill="#e6c090"
        stroke="#d97706"
        strokeWidth="1"
      />
      <ellipse
        cx="115"
        cy="350"
        rx="8"
        ry="6"
        fill="#e6c090"
        stroke="#d97706"
        strokeWidth="1"
      />

      {/* Panturrilhas anatômicas */}
      <path
        d="M 85 355 Q 78 365 76 380 Q 75 395 78 405 Q 82 410 88 408 Q 94 406 96 395 Q 98 380 96 365 Q 94 355 89 352 Z"
        fill={selectedPart === "rightCalf" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "rightCalf" ? null : "rightCalf")
        }
      />
      <path
        d="M 115 355 Q 122 365 124 380 Q 125 395 122 405 Q 118 410 112 408 Q 106 406 104 395 Q 102 380 104 365 Q 106 355 111 352 Z"
        fill={selectedPart === "leftCalf" ? "#dbeafe" : "#fce4b6"}
        stroke="#d97706"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-blue-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "leftCalf" ? null : "leftCalf")
        }
      />

      {/* Definição das panturrilhas */}
      <path
        d="M 80 365 Q 85 375 90 395"
        stroke="#d97706"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M 120 365 Q 115 375 110 395"
        stroke="#d97706"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />

      {/* Pés anatômicos */}
      <path
        d="M 78 408 Q 70 412 68 418 Q 70 425 78 428 Q 88 430 95 428 Q 98 425 96 418 Q 94 412 88 408 Z"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />
      <path
        d="M 122 408 Q 130 412 132 418 Q 130 425 122 428 Q 112 430 105 428 Q 102 425 104 418 Q 106 412 112 408 Z"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1.5"
      />

      {/* Dedos dos pés */}
      <circle
        cx="72"
        cy="420"
        r="2"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle
        cx="76"
        cy="422"
        r="1.5"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle
        cx="80"
        cy="423"
        r="1.5"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle
        cx="84"
        cy="422"
        r="1.5"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle
        cx="88"
        cy="420"
        r="1.5"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />

      <circle
        cx="128"
        cy="420"
        r="2"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle
        cx="124"
        cy="422"
        r="1.5"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle
        cx="120"
        cy="423"
        r="1.5"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle
        cx="116"
        cy="422"
        r="1.5"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />
      <circle
        cx="112"
        cy="420"
        r="1.5"
        fill="#fce4b6"
        stroke="#d97706"
        strokeWidth="1"
      />

      {/* Músculos intercostais */}
      <path
        d="M 85 105 Q 95 108 105 105"
        stroke="#d97706"
        strokeWidth="0.6"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 87 112 Q 95 115 103 112"
        stroke="#d97706"
        strokeWidth="0.6"
        fill="none"
        opacity="0.4"
      />

      {/* Linha alba (linha central do abdômen) */}
      <line
        x1="100"
        y1="115"
        x2="100"
        y2="172"
        stroke="#d97706"
        strokeWidth="1.2"
        opacity="0.7"
      />

      {/* Músculos oblíquos */}
      <path
        d="M 85 125 Q 80 135 82 145"
        stroke="#d97706"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
      <path
        d="M 115 125 Q 120 135 118 145"
        stroke="#d97706"
        strokeWidth="0.8"
        fill="none"
        opacity="0.5"
      />
    </svg>
  );

  const FemaleBodySVG = () => (
    <svg viewBox="0 0 200 450" className="w-full h-full">
      {/* Cabeça anatômica feminina */}
      <path
        d="M 100 10 Q 115 12 122 24 Q 124 34 122 44 Q 115 57 100 59 Q 85 57 78 44 Q 76 34 78 24 Q 85 12 100 10 Z"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />

      {/* Cabelo feminino (mais longo) */}
      <path
        d="M 100 10 Q 125 5 130 20 Q 128 30 125 40 Q 122 50 115 55 Q 100 8 85 55 Q 78 50 75 40 Q 72 30 70 20 Q 75 5 100 10 Z"
        fill="#4a1d96"
        stroke="#3c1558"
        strokeWidth="1"
      />

      {/* Olhos femininos (mais expressivos) */}
      <ellipse cx="91" cy="29" rx="4" ry="2.5" fill="white" />
      <ellipse cx="109" cy="29" rx="4" ry="2.5" fill="white" />
      <circle cx="91" cy="29" r="1.8" fill="#7c3aed" />
      <circle cx="109" cy="29" r="1.8" fill="#7c3aed" />

      {/* Cílios */}
      <path
        d="M 87 27 Q 89 26 91 27"
        stroke="#3c1558"
        strokeWidth="0.8"
        fill="none"
      />
      <path
        d="M 109 27 Q 111 26 113 27"
        stroke="#3c1558"
        strokeWidth="0.8"
        fill="none"
      />

      {/* Sobrancelhas */}
      <path
        d="M 85 25 Q 91 23 95 24"
        stroke="#3c1558"
        strokeWidth="1.2"
        fill="none"
      />
      <path
        d="M 105 24 Q 109 23 115 25"
        stroke="#3c1558"
        strokeWidth="1.2"
        fill="none"
      />

      {/* Nariz feminino (mais delicado) */}
      <path
        d="M 100 34 Q 99 38 100 40 Q 101 38 100 34"
        stroke="#be185d"
        strokeWidth="1"
        fill="none"
      />

      {/* Lábios femininos */}
      <path
        d="M 97 42 Q 100 44 103 42 Q 100 45 97 42"
        fill="#ec4899"
        stroke="#be185d"
        strokeWidth="0.8"
      />

      {/* Pescoço feminino (mais delicado) */}
      <path
        d="M 90 57 Q 92 64 94 73 L 106 73 Q 108 64 110 57 Q 106 59 100 59 Q 94 59 90 57 Z"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />

      {/* Clavículas */}
      <path
        d="M 82 75 Q 100 78 118 75"
        stroke="#be185d"
        strokeWidth="1.2"
        fill="none"
        opacity="0.6"
      />

      {/* Ombros femininos (mais estreitos) */}
      <ellipse
        cx="72"
        cy="85"
        rx="15"
        ry="10"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />
      <ellipse
        cx="128"
        cy="85"
        rx="15"
        ry="10"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />

      {/* Seios anatômicos */}
      <ellipse
        cx="88"
        cy="98"
        rx="10"
        ry="12"
        fill={selectedPart === "chest" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "chest" ? null : "chest")
        }
      />
      <ellipse
        cx="112"
        cy="98"
        rx="10"
        ry="12"
        fill={selectedPart === "chest" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "chest" ? null : "chest")
        }
      />

      {/* Braços femininos */}
      <path
        d="M 65 90 Q 55 100 52 120 Q 50 140 52 155 Q 55 165 62 167 Q 68 165 70 155 Q 72 140 70 120 Q 68 100 67 90 Z"
        fill={selectedPart === "rightArmRelaxed" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(
            selectedPart === "rightArmRelaxed" ? null : "rightArmRelaxed"
          )
        }
      />
      <path
        d="M 135 90 Q 145 100 148 120 Q 150 140 148 155 Q 145 165 138 167 Q 132 165 130 155 Q 128 140 130 120 Q 132 100 133 90 Z"
        fill={selectedPart === "leftArmRelaxed" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(
            selectedPart === "leftArmRelaxed" ? null : "leftArmRelaxed"
          )
        }
      />

      {/* Antebraços femininos */}
      <path
        d="M 58 167 Q 52 170 48 185 Q 46 200 48 210 Q 52 218 58 216 Q 64 214 66 200 Q 68 185 62 170 Z"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />
      <path
        d="M 142 167 Q 148 170 152 185 Q 154 200 152 210 Q 148 218 142 216 Q 136 214 134 200 Q 132 185 138 170 Z"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />

      {/* Mãos femininas */}
      <ellipse
        cx="52"
        cy="222"
        rx="6"
        ry="10"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />
      <ellipse
        cx="148"
        cy="222"
        rx="6"
        ry="10"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />

      {/* Torso feminino */}
      <path
        d="M 78 110 Q 75 125 78 140 Q 82 155 88 162 L 112 162 Q 118 155 122 140 Q 125 125 122 110 Z"
        fill={selectedPart === "chest" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "chest" ? null : "chest")
        }
      />

      {/* Cintura feminina (bem definida) */}
      <path
        d="M 88 162 Q 85 168 85 175 Q 88 182 95 184 L 105 184 Q 112 182 115 175 Q 115 168 112 162 Z"
        fill={selectedPart === "waist" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "waist" ? null : "waist")
        }
      />

      {/* Abdômen feminino */}
      <path
        d="M 95 184 Q 92 190 92 200 Q 95 210 100 212 Q 105 210 108 200 Q 108 190 105 184 Z"
        fill={selectedPart === "abdomen" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "abdomen" ? null : "abdomen")
        }
      />

      {/* Quadril feminino (formato de pêra) */}
      <path
        d="M 92 212 Q 75 220 68 240 Q 65 260 70 275 Q 78 285 90 287 L 110 287 Q 122 285 130 275 Q 135 260 132 240 Q 125 220 108 212 Z"
        fill={selectedPart === "hip" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive && setSelectedPart(selectedPart === "hip" ? null : "hip")
        }
      />

      {/* Coxas femininas (curvilíneas) */}
      <path
        d="M 80 287 Q 72 300 70 325 Q 69 350 72 370 Q 76 385 85 388 Q 94 385 98 370 Q 100 350 99 325 Q 97 300 89 287 Z"
        fill={selectedPart === "rightThigh" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "rightThigh" ? null : "rightThigh")
        }
      />
      <path
        d="M 120 287 Q 128 300 130 325 Q 131 350 128 370 Q 124 385 115 388 Q 106 385 102 370 Q 100 350 101 325 Q 103 300 111 287 Z"
        fill={selectedPart === "leftThigh" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "leftThigh" ? null : "leftThigh")
        }
      />

      {/* Joelhos femininos */}
      <ellipse
        cx="85"
        cy="393"
        rx="7"
        ry="5"
        fill="#f3d4e6"
        stroke="#be185d"
        strokeWidth="1"
      />
      <ellipse
        cx="115"
        cy="393"
        rx="7"
        ry="5"
        fill="#f3d4e6"
        stroke="#be185d"
        strokeWidth="1"
      />

      {/* Panturrilhas femininas (formato elegante) */}
      <path
        d="M 85 398 Q 78 405 76 420 Q 75 435 78 445 Q 82 450 88 448 Q 94 446 96 435 Q 98 420 96 405 Q 94 398 89 395 Z"
        fill={selectedPart === "rightCalf" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "rightCalf" ? null : "rightCalf")
        }
      />
      <path
        d="M 115 398 Q 122 405 124 420 Q 125 435 122 445 Q 118 450 112 448 Q 106 446 104 435 Q 102 420 104 405 Q 106 398 111 395 Z"
        fill={selectedPart === "leftCalf" ? "#f3e8ff" : "#fdf2f8"}
        stroke="#be185d"
        strokeWidth="1.5"
        className={interactive ? "cursor-pointer hover:fill-purple-100" : ""}
        onClick={() =>
          interactive &&
          setSelectedPart(selectedPart === "leftCalf" ? null : "leftCalf")
        }
      />

      {/* Tornozelos */}
      <ellipse
        cx="85"
        cy="453"
        rx="5"
        ry="3"
        fill="#f3d4e6"
        stroke="#be185d"
        strokeWidth="1"
      />
      <ellipse
        cx="115"
        cy="453"
        rx="5"
        ry="3"
        fill="#f3d4e6"
        stroke="#be185d"
        strokeWidth="1"
      />

      {/* Pés femininos anatômicos */}
      <path
        d="M 82 453 Q 72 457 70 463 Q 72 470 82 473 Q 92 475 98 472 Q 100 468 98 463 Q 96 457 88 453 Z"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />
      <path
        d="M 118 453 Q 128 457 130 463 Q 128 470 118 473 Q 108 475 102 472 Q 100 468 102 463 Q 104 457 112 453 Z"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1.5"
      />

      {/* Dedos dos pés femininos */}
      <circle
        cx="74"
        cy="465"
        r="1.8"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />
      <circle
        cx="78"
        cy="467"
        r="1.5"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />
      <circle
        cx="82"
        cy="468"
        r="1.3"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />
      <circle
        cx="86"
        cy="467"
        r="1.2"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />
      <circle
        cx="90"
        cy="465"
        r="1"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />

      <circle
        cx="126"
        cy="465"
        r="1.8"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />
      <circle
        cx="122"
        cy="467"
        r="1.5"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />
      <circle
        cx="118"
        cy="468"
        r="1.3"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />
      <circle
        cx="114"
        cy="467"
        r="1.2"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />
      <circle
        cx="110"
        cy="465"
        r="1"
        fill="#fdf2f8"
        stroke="#be185d"
        strokeWidth="1"
      />

      {/* Linha central do tronco */}
      <line
        x1="100"
        y1="110"
        x2="100"
        y2="212"
        stroke="#be185d"
        strokeWidth="1"
        opacity="0.4"
      />

      {/* Costelas (sutis) */}
      <path
        d="M 85 115 Q 95 118 105 115"
        stroke="#be185d"
        strokeWidth="0.8"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M 87 125 Q 95 128 103 125"
        stroke="#be185d"
        strokeWidth="0.8"
        fill="none"
        opacity="0.3"
      />
      <path
        d="M 89 135 Q 95 138 101 135"
        stroke="#be185d"
        strokeWidth="0.8"
        fill="none"
        opacity="0.3"
      />

      {/* Curvas femininas */}
      <path
        d="M 78 140 Q 85 150 92 165"
        stroke="#be185d"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 122 140 Q 115 150 108 165"
        stroke="#be185d"
        strokeWidth="1"
        fill="none"
        opacity="0.4"
      />

      {/* Definição das coxas */}
      <path
        d="M 75 300 Q 82 315 89 350"
        stroke="#be185d"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 125 300 Q 118 315 111 350"
        stroke="#be185d"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />

      {/* Definição das panturrilhas */}
      <path
        d="M 80 405 Q 85 420 90 440"
        stroke="#be185d"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
      />
      <path
        d="M 120 405 Q 115 420 110 440"
        stroke="#be185d"
        strokeWidth="0.8"
        fill="none"
        opacity="0.4"
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
            <div className="relative bg-gray-50 rounded-lg p-4 min-h-[450px]">
              <div className="w-full h-[450px] flex items-center justify-center">
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
                      {part.value ? `${formatValue(part.value)} cm` : "-"}
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
                            {formatValue(assessment.bodyFatPercentage)}%
                          </span>
                        </div>
                        {assessment.gender && (
                          <div className="flex justify-center">
                            <Badge
                              className={
                                getBodyFatClassification(
                                  parseFloat(
                                    formatValue(assessment.bodyFatPercentage)
                                  ),
                                  assessment.gender as "male" | "female"
                                ).color
                              }
                            >
                              {
                                getBodyFatClassification(
                                  parseFloat(
                                    formatValue(assessment.bodyFatPercentage)
                                  ),
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
                          {formatValue(assessment.leanMass)} kg
                        </span>
                      </div>
                    )}
                    {assessment.fatMass && (
                      <div className="flex justify-between items-center p-2 bg-red-50 rounded">
                        <span className="text-sm font-medium">Massa Gorda</span>
                        <span className="text-sm text-red-600 font-semibold">
                          {formatValue(assessment.fatMass)} kg
                        </span>
                      </div>
                    )}
                    {assessment.waistHipRatio && (
                      <div className="space-y-1">
                        <div className="flex justify-between items-center p-2 bg-purple-50 rounded">
                          <span className="text-sm font-medium">RCQ</span>
                          <span className="text-sm text-purple-600 font-semibold">
                            {formatValue(assessment.waistHipRatio)}
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
                          {formatValue(assessment.bodyWater)}%
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
                  ? `${formatValue(
                      bodyParts[selectedPart as keyof typeof bodyParts].value
                    )} cm`
                  : "Não informado"}
              </span>
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
