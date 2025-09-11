/**
 * Módulo de Análise Avançada para Relatórios de Avaliação Física
 * Calcula tendências, deltas, projeções e gera insights automáticos
 */

import {
  PhysicalAssessment,
  PhysicalAssessmentHistory,
  Student,
} from "@shared/schema";
// Removido QuickChart por questões de privacidade - dados não devem ser enviados para serviços externos
// Usando implementação local com canvas para geração de gráficos
import { ChartJSNodeCanvas } from "chartjs-node-canvas";

// =====================================================================================
// TIPOS PARA ANÁLISE
// =====================================================================================

export interface MetricTrend {
  metric: string;
  values: { date: string; value: number }[];
  currentValue: number;
  previousValue?: number;
  delta: number;
  deltaPercentage: number;
  trend: "improving" | "worsening" | "stable" | "unknown";
  projection4Weeks: number;
  projection8Weeks: number;
  projection12Weeks: number;
}

export interface AnalysisResult {
  studentInfo: {
    name: string;
    goal: string;
  };
  assessmentInfo: {
    current: PhysicalAssessment;
    previous?: PhysicalAssessmentHistory;
    assessmentDate: string;
    daysSincePrevious?: number;
  };
  metrics: {
    weight: MetricTrend;
    bmi: MetricTrend;
    bodyFat: MetricTrend;
    muscleMass: MetricTrend;
    waistCirc: MetricTrend;
    hipCirc: MetricTrend;
    restingHR: MetricTrend;
    // systolicBP e diastolicBP removidos - campos não existem no schema
  };
  insights: {
    positives: string[];
    negatives: string[];
    recommendations: string[];
  };
  charts: {
    weightEvolution: string; // Base64 image
    bmiEvolution: string;
    bodyComposition: string;
    circumferences: string;
  };
}

// =====================================================================================
// FUNÇÃO PRINCIPAL DE ANÁLISE
// =====================================================================================

export async function analyzePhysicalAssessment(
  currentAssessment: PhysicalAssessment,
  student: Student,
  assessmentHistory: PhysicalAssessmentHistory[]
): Promise<AnalysisResult> {
  // Ordenar histórico por data (mais recente primeiro)
  const sortedHistory = assessmentHistory.sort(
    (a, b) =>
      new Date(b.assessmentDate || new Date()).getTime() -
      new Date(a.assessmentDate || new Date()).getTime()
  );

  const previousAssessment = sortedHistory[0];

  // Calcular métricas de tendência
  const metrics = {
    weight: calculateMetricTrend(
      "weight",
      currentAssessment,
      sortedHistory,
      "currentWeight"
    ),
    bmi: calculateBMITrend(currentAssessment, sortedHistory, student),
    bodyFat: calculateMetricTrend(
      "bodyFat",
      currentAssessment,
      sortedHistory,
      "bodyFatPercentage"
    ),
    muscleMass: calculateMetricTrend(
      "muscleMass",
      currentAssessment,
      sortedHistory,
      "leanMass"
    ),
    waistCirc: calculateMetricTrend(
      "waistCirc",
      currentAssessment,
      sortedHistory,
      "waistCirc"
    ),
    hipCirc: calculateMetricTrend(
      "hipCirc",
      currentAssessment,
      sortedHistory,
      "hipCirc"
    ),
    restingHR: calculateMetricTrend(
      "restingHR",
      currentAssessment,
      sortedHistory,
      "restingHeartRate"
    ),
  };

  // Gerar insights automáticos
  const insights = generateInsights(
    metrics,
    student.goal || "Melhora geral da saúde"
  );

  // Passar objetivo para cálculo de tendências
  metrics.weight.trend = determineTrend(
    "weight",
    metrics.weight.delta,
    student.goal || "Melhora geral da saúde"
  );

  // Gerar gráficos
  const charts = await generateCharts(metrics);

  // Calcular dias desde a avaliação anterior
  const daysSincePrevious = previousAssessment
    ? Math.floor(
        (new Date(currentAssessment.assessmentDate || new Date()).getTime() -
          new Date(previousAssessment.assessmentDate || new Date()).getTime()) /
          (1000 * 60 * 60 * 24)
      )
    : undefined;

  return {
    studentInfo: {
      name: student.name,
      goal: student.goal || "Melhora geral da saúde",
    },
    assessmentInfo: {
      current: currentAssessment,
      previous: previousAssessment,
      assessmentDate: new Date(
        currentAssessment.assessmentDate || new Date()
      ).toLocaleDateString("pt-BR"),
      daysSincePrevious,
    },
    metrics,
    insights,
    charts,
  };
}

// =====================================================================================
// CÁLCULO DE TENDÊNCIAS
// =====================================================================================

function calculateMetricTrend(
  metricName: string,
  current: PhysicalAssessment,
  history: PhysicalAssessmentHistory[],
  fieldName: keyof PhysicalAssessment | keyof PhysicalAssessmentHistory
): MetricTrend {
  // Valor atual
  const currentValue =
    Number(current[fieldName as keyof PhysicalAssessment]) || 0;

  // Construir série temporal
  const values = [];

  // Adicionar valores históricos
  for (const assessment of history.slice().reverse()) {
    const value = Number(
      assessment[fieldName as keyof PhysicalAssessmentHistory]
    );
    if (value) {
      values.push({
        date: new Date(assessment.assessmentDate || new Date()).toISOString(),
        value: value,
      });
    }
  }

  // Adicionar valor atual
  values.push({
    date: new Date(current.assessmentDate || new Date()).toISOString(),
    value: currentValue,
  });

  // Valor anterior
  const previousValue =
    values.length > 1 ? values[values.length - 2].value : undefined;

  // Calcular delta
  const delta = previousValue ? currentValue - previousValue : 0;
  const deltaPercentage = previousValue ? (delta / previousValue) * 100 : 0;

  // Determinar tendência
  const trend = determineTrend(metricName, delta);

  // Calcular projeções usando regressão linear simples
  const projections = calculateProjections(values);

  return {
    metric: metricName,
    values,
    currentValue,
    previousValue,
    delta,
    deltaPercentage,
    trend,
    projection4Weeks: projections.weeks4,
    projection8Weeks: projections.weeks8,
    projection12Weeks: projections.weeks12,
  };
}

function determineTrend(
  metricName: string,
  delta: number,
  goal?: string
): "improving" | "worsening" | "stable" | "unknown" {
  // Métricas onde diminuição é sempre melhoria
  const lowerIsBetter = ["bodyFat", "waistCirc", "hipCirc", "restingHR"];
  // Métricas onde aumento é sempre melhoria
  const higherIsBetter = ["muscleMass"];

  if (Math.abs(delta) < 0.01) return "stable";

  if (lowerIsBetter.includes(metricName)) {
    return delta < 0 ? "improving" : "worsening";
  }

  if (higherIsBetter.includes(metricName)) {
    return delta > 0 ? "improving" : "worsening";
  }

  // Para peso, determinar tendência baseada no objetivo
  if (metricName === "weight" && goal) {
    const goalLower = goal.toLowerCase();

    // Se delta muito pequeno, consideramos estável
    if (Math.abs(delta) < 0.5) return "stable";

    // Objetivos de perda de peso
    if (
      goalLower.includes("emagre") ||
      goalLower.includes("perder peso") ||
      goalLower.includes("diminuir peso") ||
      (goalLower.includes("peso") && goalLower.includes("perder"))
    ) {
      return delta < 0 ? "improving" : "worsening";
    }

    // Objetivos de ganho de peso/massa
    if (
      goalLower.includes("ganhar peso") ||
      goalLower.includes("aumentar peso") ||
      (goalLower.includes("massa") &&
        (goalLower.includes("ganhar") || goalLower.includes("aumentar")))
    ) {
      return delta > 0 ? "improving" : "worsening";
    }

    // Para mudanças grandes sem objetivo claro, considerar que precisa atenção
    if (Math.abs(delta) > 3) {
      return "worsening"; // Mudança muito grande precisa atenção
    }

    return "stable"; // Mudança moderada sem objetivo claro
  }

  return "unknown";
}

function calculateBMITrend(
  current: PhysicalAssessment,
  history: PhysicalAssessmentHistory[],
  student: Student
): MetricTrend {
  // Calcular BMI atual
  const currentWeight = Number(current.currentWeight) || 0;
  const height = Number(current.currentHeight) || Number(student.height) || 0;
  const currentBMI = height > 0 ? currentWeight / (height / 100) ** 2 : 0;

  // Construir série temporal de BMI
  const values = [];

  // Adicionar BMI históricos
  for (const assessment of history.slice().reverse()) {
    const weightHist = Number(assessment.currentWeight) || 0;
    if (weightHist > 0 && height > 0) {
      const bmiHist = weightHist / (height / 100) ** 2;
      values.push({
        date: new Date(assessment.assessmentDate || new Date()).toISOString(),
        value: bmiHist,
      });
    }
  }

  // Adicionar BMI atual
  if (currentBMI > 0) {
    values.push({
      date: new Date(current.assessmentDate || new Date()).toISOString(),
      value: currentBMI,
    });
  }

  // Valor anterior
  const previousValue =
    values.length > 1 ? values[values.length - 2].value : undefined;

  // Calcular delta
  const delta = previousValue ? currentBMI - previousValue : 0;
  const deltaPercentage = previousValue ? (delta / previousValue) * 100 : 0;

  // Determinar tendência (IMC idealmente entre 18.5-24.9)
  let trend: "improving" | "worsening" | "stable" | "unknown" = "stable";
  if (Math.abs(delta) > 0.1) {
    if (currentBMI < 18.5 || currentBMI > 24.9) {
      // Se está fora da faixa normal, movimento em direção ao normal é melhoria
      if (currentBMI < 18.5 && delta > 0)
        trend = "improving"; // Ganho quando abaixo do peso
      else if (currentBMI > 24.9 && delta < 0)
        trend = "improving"; // Perda quando acima do peso
      else trend = "worsening";
    } else {
      // Se está na faixa normal, mudanças pequenas são estáveis
      trend = Math.abs(delta) < 0.5 ? "stable" : "worsening";
    }
  }

  // Calcular projeções
  const projections = calculateProjections(values);

  return {
    metric: "bmi",
    values,
    currentValue: currentBMI,
    previousValue,
    delta,
    deltaPercentage,
    trend,
    projection4Weeks: projections.weeks4,
    projection8Weeks: projections.weeks8,
    projection12Weeks: projections.weeks12,
  };
}

function calculateProjections(values: { date: string; value: number }[]): {
  weeks4: number;
  weeks8: number;
  weeks12: number;
} {
  if (values.length < 2) {
    const lastValue = values[values.length - 1]?.value || 0;
    return { weeks4: lastValue, weeks8: lastValue, weeks12: lastValue };
  }

  // Regressão linear simples
  const n = values.length;
  const dates = values.map((v) => new Date(v.date).getTime());
  const vals = values.map((v) => v.value);

  const sumX = dates.reduce((a, b) => a + b, 0);
  const sumY = vals.reduce((a, b) => a + b, 0);
  const sumXY = dates.reduce((sum, x, i) => sum + x * vals[i], 0);
  const sumXX = dates.reduce((sum, x) => sum + x * x, 0);

  const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  // Projetar para 4, 8 e 12 semanas no futuro
  const lastDate = dates[dates.length - 1];
  const msPerWeek = 7 * 24 * 60 * 60 * 1000;

  const date4Weeks = lastDate + 4 * msPerWeek;
  const date8Weeks = lastDate + 8 * msPerWeek;
  const date12Weeks = lastDate + 12 * msPerWeek;

  return {
    weeks4: slope * date4Weeks + intercept,
    weeks8: slope * date8Weeks + intercept,
    weeks12: slope * date12Weeks + intercept,
  };
}

// =====================================================================================
// GERAÇÃO DE INSIGHTS
// =====================================================================================

function generateInsights(
  metrics: any,
  goal: string
): {
  positives: string[];
  negatives: string[];
  recommendations: string[];
} {
  const positives: string[] = [];
  const negatives: string[] = [];
  const recommendations: string[] = [];

  // Analisar cada métrica
  Object.values(metrics).forEach((metric: any) => {
    if (metric.trend === "improving") {
      positives.push(generatePositiveMessage(metric));
    } else if (metric.trend === "worsening") {
      negatives.push(generateNegativeMessage(metric));
    }
  });

  // Gerar recomendações baseadas no objetivo
  recommendations.push(...generateRecommendations(metrics, goal));

  // Garantir pelo menos 3 de cada
  while (positives.length < 3) {
    positives.push("Mantendo consistência no programa de treinamento.");
  }

  while (negatives.length < 3) {
    negatives.push("Alguns indicadores podem precisar de atenção especial.");
  }

  while (recommendations.length < 3) {
    recommendations.push("Continue seguindo o plano de treino e alimentação.");
  }

  return {
    positives: positives.slice(0, 5),
    negatives: negatives.slice(0, 5),
    recommendations: recommendations.slice(0, 5),
  };
}

function generatePositiveMessage(metric: MetricTrend): string {
  const messages: { [key: string]: string } = {
    weight: `Peso teve mudança de ${metric.delta.toFixed(
      1
    )}kg (${metric.deltaPercentage.toFixed(1)}%)`,
    bmi: `IMC melhorou em ${Math.abs(metric.delta).toFixed(1)} pontos`,
    bodyFat: `Percentual de gordura reduziu ${Math.abs(metric.delta).toFixed(
      1
    )}%`,
    muscleMass: `Massa muscular aumentou ${metric.delta.toFixed(1)}%`,
    waistCirc: `Circunferência da cintura reduziu ${Math.abs(
      metric.delta
    ).toFixed(1)}cm`,
    hipCirc: `Circunferência do quadril reduziu ${Math.abs(
      metric.delta
    ).toFixed(1)}cm`,
    restingHR: `Frequência cardíaca em repouso melhorou ${Math.abs(
      metric.delta
    ).toFixed(0)} bpm`,
    systolicBP: `Pressão sistólica melhorou ${Math.abs(metric.delta).toFixed(
      0
    )} mmHg`,
    diastolicBP: `Pressão diastólica melhorou ${Math.abs(metric.delta).toFixed(
      0
    )} mmHg`,
  };

  return messages[metric.metric] || `${metric.metric} apresentou melhoria`;
}

function generateNegativeMessage(metric: MetricTrend): string {
  const messages: { [key: string]: string } = {
    weight: `Peso teve alteração de ${metric.delta.toFixed(
      1
    )}kg que pode precisar de atenção`,
    bmi: `IMC aumentou ${metric.delta.toFixed(1)} pontos`,
    bodyFat: `Percentual de gordura aumentou ${metric.delta.toFixed(1)}%`,
    muscleMass: `Massa muscular reduziu ${Math.abs(metric.delta).toFixed(1)}%`,
    waistCirc: `Circunferência da cintura aumentou ${metric.delta.toFixed(
      1
    )}cm`,
    hipCirc: `Circunferência do quadril aumentou ${metric.delta.toFixed(1)}cm`,
    restingHR: `Frequência cardíaca em repouso aumentou ${metric.delta.toFixed(
      0
    )} bpm`,
    systolicBP: `Pressão sistólica aumentou ${metric.delta.toFixed(0)} mmHg`,
    diastolicBP: `Pressão diastólica aumentou ${metric.delta.toFixed(0)} mmHg`,
  };

  return messages[metric.metric] || `${metric.metric} precisa de atenção`;
}

function generateRecommendations(metrics: any, goal: string): string[] {
  const recommendations: string[] = [];

  // Recomendações baseadas em tendências específicas
  if (metrics.bodyFat.trend === "worsening") {
    recommendations.push(
      "Considere ajustar a dieta para um déficit calórico controlado"
    );
    recommendations.push(
      "Aumente a intensidade ou frequência dos exercícios cardiovasculares"
    );
  }

  if (metrics.muscleMass.trend === "worsening") {
    recommendations.push(
      "Intensifique o treinamento de força com exercícios compostos"
    );
    recommendations.push(
      "Verifique se a ingestão de proteínas está adequada (1.6-2.2g/kg)"
    );
  }

  if (metrics.restingHR.trend === "worsening") {
    recommendations.push(
      "Inclua mais atividades cardiovasculares de baixa intensidade"
    );
    recommendations.push("Monitore o estresse e qualidade do sono");
  }

  // Recomendações baseadas no objetivo
  if (
    goal.toLowerCase().includes("peso") ||
    goal.toLowerCase().includes("emagrecer")
  ) {
    recommendations.push(
      "Mantenha consistência no déficit calórico de 300-500 kcal/dia"
    );
    recommendations.push(
      "Combine treino de força com atividades cardiovasculares"
    );
  }

  if (
    goal.toLowerCase().includes("ganho") ||
    goal.toLowerCase().includes("muscular")
  ) {
    recommendations.push(
      "Mantenha superávit calórico controlado de 200-400 kcal/dia"
    );
    recommendations.push("Priorize exercícios compostos e progressão de carga");
  }

  // Recomendações gerais
  recommendations.push(
    "Mantenha hidratação adequada (35ml/kg de peso corporal)"
  );
  recommendations.push("Garanta 7-9 horas de sono de qualidade por noite");
  recommendations.push(
    "Monitore o progresso semanalmente, mas avalie mensalmente"
  );

  return recommendations;
}

// =====================================================================================
// GERAÇÃO DE GRÁFICOS
// =====================================================================================

async function generateCharts(metrics: any): Promise<{
  weightEvolution: string;
  bmiEvolution: string;
  bodyComposition: string;
  circumferences: string;
}> {
  const weightChart = await generateLineChart(
    metrics.weight.values,
    "Evolução do Peso (kg)",
    "#3B82F6"
  );

  const bmiChart = await generateLineChart(
    metrics.bmi.values,
    "Evolução do IMC",
    "#10B981"
  );

  const bodyCompositionChart = await generateCompositionChart(metrics);

  const circumferencesChart = await generateCircumferencesChart(metrics);

  return {
    weightEvolution: weightChart,
    bmiEvolution: bmiChart,
    bodyComposition: bodyCompositionChart,
    circumferences: circumferencesChart,
  };
}

async function generateLineChart(
  values: { date: string; value: number }[],
  title: string,
  color: string
): Promise<string> {
  try {
    // IMPLEMENTAÇÃO LOCAL SEGURA - sem envio de dados para serviços externos
    const chartCanvas = new ChartJSNodeCanvas({
      width: 600,
      height: 300,
      backgroundColour: "#ffffff",
    });

    const configuration = {
      type: "line" as const,
      data: {
        labels: values.map((v) => new Date(v.date).toLocaleDateString("pt-BR")),
        datasets: [
          {
            label: title,
            data: values.map((v) => v.value),
            borderColor: color,
            backgroundColor: color + "20",
            fill: true,
            tension: 0.3,
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: title,
            font: { size: 16 },
          },
          legend: {
            display: false,
          },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    };

    const buffer = await chartCanvas.renderToBuffer(configuration);
    return buffer.toString("base64");
  } catch (error) {
    console.error("Error generating chart:", error);
    // Fallback: return placeholder base64 image
    return generatePlaceholderChart(title);
  }
}

async function generateCompositionChart(metrics: any): Promise<string> {
  try {
    // IMPLEMENTAÇÃO LOCAL SEGURA - sem envio de dados para serviços externos
    const chartCanvas = new ChartJSNodeCanvas({
      width: 400,
      height: 300,
      backgroundColour: "#ffffff",
    });

    const bodyFat = metrics.bodyFat.currentValue || 0;
    const muscleMass = metrics.muscleMass.currentValue || 0;
    const other = Math.max(0, 100 - bodyFat - muscleMass);

    const configuration = {
      type: "doughnut" as const,
      data: {
        labels: ["Gordura Corporal", "Massa Muscular", "Outros"],
        datasets: [
          {
            data: [bodyFat, muscleMass, other],
            backgroundColor: ["#EF4444", "#10B981", "#6B7280"],
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: "Composição Corporal Atual (%)",
            font: { size: 16 },
          },
        },
      },
    };

    const buffer = await chartCanvas.renderToBuffer(configuration);
    return buffer.toString("base64");
  } catch (error) {
    console.error("Error generating composition chart:", error);
    return generatePlaceholderChart("Composição Corporal");
  }
}

async function generateCircumferencesChart(metrics: any): Promise<string> {
  try {
    // IMPLEMENTAÇÃO LOCAL SEGURA - sem envio de dados para serviços externos
    const chartCanvas = new ChartJSNodeCanvas({
      width: 500,
      height: 300,
      backgroundColour: "#ffffff",
    });

    const configuration = {
      type: "bar" as const,
      data: {
        labels: ["Cintura (cm)", "Quadril (cm)"],
        datasets: [
          {
            label: "Atual",
            data: [
              metrics.waistCirc.currentValue || 0,
              metrics.hipCirc.currentValue || 0,
            ],
            backgroundColor: "#3B82F6",
          },
          {
            label: "Anterior",
            data: [
              metrics.waistCirc.previousValue || 0,
              metrics.hipCirc.previousValue || 0,
            ],
            backgroundColor: "#94A3B8",
          },
        ],
      },
      options: {
        responsive: false,
        plugins: {
          title: {
            display: true,
            text: "Comparação de Circunferências",
            font: { size: 16 },
          },
        },
        scales: {
          y: {
            beginAtZero: false,
          },
        },
      },
    };

    const buffer = await chartCanvas.renderToBuffer(configuration);
    return buffer.toString("base64");
  } catch (error) {
    console.error("Error generating circumferences chart:", error);
    return generatePlaceholderChart("Circunferências");
  }
}

// Fallback placeholder chart generator
function generatePlaceholderChart(title: string): string {
  // Simple base64 encoded placeholder image (1x1 transparent PNG)
  // In a real scenario, you could generate a simple text-based chart or use a more sophisticated fallback
  const placeholderSVG = `
    <svg width="400" height="300" xmlns="http://www.w3.org/2000/svg">
      <rect width="400" height="300" fill="#f8fafc" stroke="#e2e8f0" stroke-width="2"/>
      <text x="200" y="140" text-anchor="middle" font-family="Arial" font-size="14" fill="#64748b">
        ${title}
      </text>
      <text x="200" y="170" text-anchor="middle" font-family="Arial" font-size="12" fill="#94a3b8">
        Gráfico temporariamente indisponível
      </text>
    </svg>
  `;

  // Convert SVG to base64 (simplified fallback)
  return Buffer.from(placeholderSVG).toString("base64");
}
