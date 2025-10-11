import { Point } from "@/components/photo-marker";

/**
 * Calcula o ângulo entre dois pontos em graus
 */
export function calculateAngle(point1: Point, point2: Point): number {
  const deltaX = point2.x - point1.x;
  const deltaY = point2.y - point1.y;
  const angleRadians = Math.atan2(deltaY, deltaX);
  const angleDegrees = (angleRadians * 180) / Math.PI;
  return angleDegrees;
}

/**
 * Calcula o ângulo de inclinação vertical (desvio da linha vertical perfeita)
 */
export function calculateVerticalAlignment(
  topPoint: Point,
  bottomPoint: Point
): number {
  const angle = calculateAngle(topPoint, bottomPoint);
  // Subtrai 90 graus para obter o desvio da vertical (90° = perfeitamente vertical)
  const verticalDeviation = 90 - Math.abs(angle);
  return verticalDeviation;
}

/**
 * Calcula o nivelamento horizontal (desvio da linha horizontal perfeita)
 */
export function calculateHorizontalLevel(
  leftPoint: Point,
  rightPoint: Point
): number {
  const deltaY = rightPoint.y - leftPoint.y;
  const deltaX = rightPoint.x - leftPoint.x;
  const angleRadians = Math.atan2(deltaY, deltaX);
  const angleDegrees = (angleRadians * 180) / Math.PI;
  return angleDegrees;
}

/**
 * Determina o status da medição baseado no valor em graus
 */
export function getMeasurementStatus(
  value: number,
  type: string
): "acceptable" | "moderate" | "severe" {
  const absValue = Math.abs(value);

  // Thresholds baseados em padrões de avaliação postural
  const thresholds: Record<string, { moderate: number; severe: number }> = {
    head_vertical_alignment: { moderate: 5, severe: 10 },
    head_horizontal_level: { moderate: 3, severe: 6 },
    shoulders_horizontal_level: { moderate: 3, severe: 6 },
    trunk_vertical_alignment: { moderate: 5, severe: 10 },
    pelvis_horizontal_level: { moderate: 2, severe: 5 },
    femur_horizontal_level: { moderate: 2, severe: 5 },
    tibia_horizontal_level: { moderate: 3, severe: 6 },
    knees_valgus_varus_symmetry: { moderate: 3, severe: 6 },
  };

  const threshold = thresholds[type] || { moderate: 3, severe: 6 };

  if (absValue >= threshold.severe) {
    return "severe";
  } else if (absValue >= threshold.moderate) {
    return "moderate";
  } else {
    return "acceptable";
  }
}

/**
 * Calcula as medições posturais baseadas nos pontos marcados
 */
export interface MeasurementCalculation {
  measurementType: string;
  value: number;
  status: "acceptable" | "moderate" | "severe";
  photoType: string;
  leftValue?: number;
  rightValue?: number;
  notes?: string;
}

/**
 * Calcula alinhamento vertical da cabeça
 */
export function calculateHeadVerticalAlignment(
  points: Point[],
  photoType: string
): MeasurementCalculation | null {
  const topHead = points.find((p) => p.label === "Topo da cabeça");
  const chin = points.find((p) => p.label === "Queixo");

  if (!topHead || !chin) return null;

  const value = calculateVerticalAlignment(topHead, chin);
  const status = getMeasurementStatus(value, "head_vertical_alignment");

  return {
    measurementType: "head_vertical_alignment",
    value,
    status,
    photoType,
  };
}

/**
 * Calcula nivelamento horizontal da cabeça
 */
export function calculateHeadHorizontalLevel(
  points: Point[],
  photoType: string
): MeasurementCalculation | null {
  const leftEar = points.find((p) => p.label === "Orelha esquerda");
  const rightEar = points.find((p) => p.label === "Orelha direita");

  if (!leftEar || !rightEar) return null;

  const value = calculateHorizontalLevel(leftEar, rightEar);
  const status = getMeasurementStatus(value, "head_horizontal_level");

  return {
    measurementType: "head_horizontal_level",
    value,
    status,
    photoType,
  };
}

/**
 * Calcula nivelamento horizontal dos ombros
 */
export function calculateShouldersHorizontalLevel(
  points: Point[],
  photoType: string
): MeasurementCalculation | null {
  const leftShoulder = points.find((p) => p.label === "Ombro esquerdo");
  const rightShoulder = points.find((p) => p.label === "Ombro direito");

  if (!leftShoulder || !rightShoulder) return null;

  const value = calculateHorizontalLevel(leftShoulder, rightShoulder);
  const status = getMeasurementStatus(value, "shoulders_horizontal_level");

  return {
    measurementType: "shoulders_horizontal_level",
    value,
    status,
    photoType,
  };
}

/**
 * Calcula alinhamento vertical do tronco
 */
export function calculateTrunkVerticalAlignment(
  points: Point[],
  photoType: string
): MeasurementCalculation | null {
  const c7 = points.find((p) => p.label === "C7 (base do pescoço)");
  const pelvis = points.find((p) => p.label === "Centro da pelve");

  if (!c7 || !pelvis) return null;

  const value = calculateVerticalAlignment(c7, pelvis);
  const status = getMeasurementStatus(value, "trunk_vertical_alignment");

  return {
    measurementType: "trunk_vertical_alignment",
    value,
    status,
    photoType,
  };
}

/**
 * Calcula nivelamento horizontal da pelve
 */
export function calculatePelvisHorizontalLevel(
  points: Point[],
  photoType: string
): MeasurementCalculation | null {
  const leftHip = points.find((p) => p.label === "Crista ilíaca esquerda");
  const rightHip = points.find((p) => p.label === "Crista ilíaca direita");

  if (!leftHip || !rightHip) return null;

  const value = calculateHorizontalLevel(leftHip, rightHip);
  const status = getMeasurementStatus(value, "pelvis_horizontal_level");

  return {
    measurementType: "pelvis_horizontal_level",
    value,
    status,
    photoType,
  };
}

/**
 * Calcula nivelamento horizontal do fêmur
 */
export function calculateFemurHorizontalLevel(
  points: Point[],
  photoType: string
): MeasurementCalculation | null {
  const leftKnee = points.find((p) => p.label === "Joelho esquerdo");
  const rightKnee = points.find((p) => p.label === "Joelho direito");

  if (!leftKnee || !rightKnee) return null;

  const value = calculateHorizontalLevel(leftKnee, rightKnee);
  const status = getMeasurementStatus(value, "femur_horizontal_level");

  return {
    measurementType: "femur_horizontal_level",
    value,
    status,
    photoType,
  };
}

/**
 * Calcula nivelamento horizontal da tíbia
 */
export function calculateTibiaHorizontalLevel(
  points: Point[],
  photoType: string
): MeasurementCalculation | null {
  const leftAnkle = points.find((p) => p.label === "Tornozelo esquerdo");
  const rightAnkle = points.find((p) => p.label === "Tornozelo direito");

  if (!leftAnkle || !rightAnkle) return null;

  const value = calculateHorizontalLevel(leftAnkle, rightAnkle);
  const status = getMeasurementStatus(value, "tibia_horizontal_level");

  return {
    measurementType: "tibia_horizontal_level",
    value,
    status,
    photoType,
  };
}

/**
 * Calcula simetria do alinhamento valgo/varo dos joelhos
 */
export function calculateKneesValgusVarusSymmetry(
  points: Point[],
  photoType: string
): MeasurementCalculation | null {
  const leftHip = points.find((p) => p.label === "Quadril esquerdo");
  const leftKnee = points.find((p) => p.label === "Joelho esquerdo");
  const leftAnkle = points.find((p) => p.label === "Tornozelo esquerdo");

  const rightHip = points.find((p) => p.label === "Quadril direito");
  const rightKnee = points.find((p) => p.label === "Joelho direito");
  const rightAnkle = points.find((p) => p.label === "Tornozelo direito");

  if (
    !leftHip ||
    !leftKnee ||
    !leftAnkle ||
    !rightHip ||
    !rightKnee ||
    !rightAnkle
  ) {
    return null;
  }

  // Calcula ângulo para cada perna
  const leftAngle = calculateKneeAngle(leftHip, leftKnee, leftAnkle);
  const rightAngle = calculateKneeAngle(rightHip, rightKnee, rightAnkle);

  // Diferença entre as pernas
  const value = leftAngle - rightAngle;
  const status = getMeasurementStatus(value, "knees_valgus_varus_symmetry");

  return {
    measurementType: "knees_valgus_varus_symmetry",
    value,
    status,
    photoType,
    leftValue: leftAngle,
    rightValue: rightAngle,
  };
}

/**
 * Calcula o ângulo do joelho (para valgo/varo)
 */
function calculateKneeAngle(hip: Point, knee: Point, ankle: Point): number {
  // Vetores
  const v1x = hip.x - knee.x;
  const v1y = hip.y - knee.y;
  const v2x = ankle.x - knee.x;
  const v2y = ankle.y - knee.y;

  // Produto escalar e magnitudes
  const dot = v1x * v2x + v1y * v2y;
  const mag1 = Math.sqrt(v1x * v1x + v1y * v1y);
  const mag2 = Math.sqrt(v2x * v2x + v2y * v2y);

  // Ângulo em radianos e depois em graus
  const angleRadians = Math.acos(dot / (mag1 * mag2));
  const angleDegrees = (angleRadians * 180) / Math.PI;

  // Retorna o desvio da linha reta (180° = reto)
  return 180 - angleDegrees;
}

/**
 * Calcula todas as medições possíveis baseadas nos pontos marcados
 */
export function calculateAllMeasurements(
  points: Point[],
  photoType: string
): MeasurementCalculation[] {
  const measurements: MeasurementCalculation[] = [];

  const calculators = [
    calculateHeadVerticalAlignment,
    calculateHeadHorizontalLevel,
    calculateShouldersHorizontalLevel,
    calculateTrunkVerticalAlignment,
    calculatePelvisHorizontalLevel,
    calculateFemurHorizontalLevel,
    calculateTibiaHorizontalLevel,
    calculateKneesValgusVarusSymmetry,
  ];

  for (const calculator of calculators) {
    const result = calculator(points, photoType);
    if (result) {
      measurements.push(result);
    }
  }

  return measurements;
}
