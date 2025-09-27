import OpenAI from "openai";

// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

export interface PostureAnalysisResult {
  analysis: string;
  recommendations: string;
  deviations: Array<{
    joint: string;
    issue: string;
    severity: "normal" | "mild" | "moderate" | "severe";
    correction: string;
  }>;
}

export async function analyzePostureImages(
  images: Array<{
    type: "front" | "back" | "side_left" | "side_right";
    base64: string;
  }>,
  observations?: Array<{ joint: string; observation: string; severity: string }>
): Promise<PostureAnalysisResult> {
  try {
    const imageContents = images.map((img) => ({
      type: "image_url" as const,
      image_url: {
        url: `data:image/jpeg;base64,${img.base64}`,
      },
    }));

    const observationsText = observations?.length
      ? `\nObservações manuais do professor:\n${observations
          .map((obs) => `- ${obs.joint}: ${obs.observation} (${obs.severity})`)
          .join("\n")}`
      : "";

    const prompt = `Você é um especialista em análise postural e fisioterapia. Analise as imagens posturais fornecidas (frente, costas, lados) e forneça uma avaliação detalhada.

Considere os seguintes aspectos:
1. Alinhamento da cabeça e pescoço
2. Posição dos ombros (altura, projeção anterior/posterior)
3. Curvatura da coluna vertebral
4. Alinhamento da pelve
5. Posição dos joelhos
6. Alinhamento dos pés e tornozelos

${observationsText}

Responda em formato JSON com a seguinte estrutura:
{
  "analysis": "Análise detalhada da postura atual do indivíduo",
  "recommendations": "Recomendações específicas para correção postural",
  "deviations": [
    {
      "joint": "nome da articulação",
      "issue": "descrição do desvio encontrado",
      "severity": "normal|mild|moderate|severe",
      "correction": "exercício ou correção específica recomendada"
    }
  ]
}

Seja específico e técnico, mas mantenha a linguagem acessível para personal trainers.`;

    const response = await openai.chat.completions.create({
      model: "gpt-5",
      messages: [
        {
          role: "user",
          content: [
            {
              type: "text",
              text: prompt,
            },
            ...imageContents,
          ],
        },
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 2048,
    });

    const result = JSON.parse(response.choices[0].message.content || "{}");
    return result as PostureAnalysisResult;
  } catch (error) {
    console.error("Error analyzing posture images:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error("Falha ao analisar imagens posturais: " + errorMessage);
  }
}

export async function generateCorrectedPostureVisualization(
  originalAnalysis: PostureAnalysisResult
): Promise<{ imageUrl: string }> {
  try {
    const deviationsDescription = originalAnalysis.deviations
      .map((dev) => `${dev.joint}: ${dev.correction}`)
      .join(", ");

    const prompt = `Crie uma ilustração médica em estilo de diagrama que mostre um corpo humano em vista frontal, lateral e posterior com as seguintes correções posturais aplicadas: ${deviationsDescription}. 

O diagrama deve:
- Usar linhas de referência para mostrar o alinhamento ideal
- Destacar as áreas corrigidas com cores diferentes
- Ter um fundo claro e limpo
- Estilo médico/anatômico profissional
- Mostrar a postura corrigida de forma clara e educativa`;

    const response = await openai.images.generate({
      model: "dall-e-3",
      prompt,
      n: 1,
      size: "1024x1024",
      quality: "standard",
    });

    return { imageUrl: response.data[0]?.url || "" };
  } catch (error) {
    console.error("Error generating corrected posture visualization:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    throw new Error(
      "Falha ao gerar visualização da postura corrigida: " + errorMessage
    );
  }
}
