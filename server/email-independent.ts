// Sistema de email independente da Replit
// Usando SMTP simples com configuração manual

interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html?: string;
}

// Função para gerar código de verificação de 6 dígitos usando crypto seguro
export async function generateVerificationCode(): Promise<string> {
  const crypto = await import("crypto");
  return crypto.randomInt(0, 1000000).toString().padStart(6, "0");
}

// Função para criar hash do código de verificação
export async function hashVerificationCode(code: string): Promise<string> {
  const bcrypt = await import("bcryptjs");
  return await bcrypt.hash(code, 10);
}

// Função para verificar código de verificação
export async function verifyCode(
  code: string,
  hashedCode: string
): Promise<boolean> {
  const bcrypt = await import("bcryptjs");
  return await bcrypt.compare(code, hashedCode);
}

// Função principal de envio de email usando Gmail SMTP
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    // Usar a função sendEmail do sistema Gmail já existente
    const { sendEmail: sendGmailEmail } = await import("./email");

    // Adaptar parâmetros para o formato esperado pelo sistema Gmail
    const result = await sendGmailEmail({
      to: params.to,
      from: `"CRM Treinos MP" <${process.env.GMAIL_USER}>`,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });

    if (result) {
      console.log("✅ EMAIL ENVIADO COM SUCESSO VIA GMAIL!");
      console.log("Para:", params.to);
      console.log("Assunto:", params.subject);
      return true;
    } else {
      throw new Error("Falha no envio do email via Gmail");
    }
  } catch (error) {
    console.error("❌ Erro ao enviar email via Gmail:", error);

    // Fallback para desenvolvimento - mostrar no console DE FORMA DESTACADA
    console.log("\n🔥🔥🔥 CÓDIGO DE VERIFICAÇÃO (ERRO NO GMAIL) 🔥🔥🔥");
    console.log("📧 Para:", params.to);
    console.log("📝 Assunto:", params.subject);

    // Extrair código do HTML se possível
    const htmlMatch = params.html?.match(/(\d{6})/);
    if (htmlMatch) {
      console.log("🔑 CÓDIGO DE VERIFICAÇÃO:", htmlMatch[1]);
      console.log("🔑 CÓDIGO DE VERIFICAÇÃO:", htmlMatch[1]); // Mostrar duas vezes para destacar
      console.log("🔑 CÓDIGO DE VERIFICAÇÃO:", htmlMatch[1]);
    }

    console.log("💡 Verifique suas credenciais do Gmail");
    console.log("💡 Este código aparece aqui porque houve erro no envio");
    console.log(
      "🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥🔥\n"
    );

    // Retorna TRUE em desenvolvimento para não quebrar o fluxo
    return process.env.NODE_ENV !== "production";
  }
}

// Template para email de código de verificação
export function generateVerificationEmail(
  studentName: string,
  code: string
): { subject: string; html: string } {
  return {
    subject: "Código de Verificação - CRM Treinos MP",
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Código de Verificação</h1>
        
        <p>Olá <strong>${studentName}</strong>,</p>
        
        <p>Você solicitou acesso ao sistema CRM Treinos MP. Use o código abaixo para criar sua senha:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <div style="background-color: #f3f4f6; padding: 20px; border-radius: 8px; display: inline-block;">
            <span style="font-size: 32px; font-weight: bold; color: #2563eb; letter-spacing: 4px;">${code}</span>
          </div>
        </div>
        
        <p><strong>Este código é válido por 15 minutos.</strong></p>
        
        <p>Se você não solicitou este código, pode ignorar este email.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Sistema independente CRM Treinos MP
        </p>
      </div>
    `,
  };
}
