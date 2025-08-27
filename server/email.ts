import nodemailer from 'nodemailer';

// Configure transporter for Gmail
let transporter: nodemailer.Transporter | null = null;

// Initialize Nodemailer with Gmail SMTP
const gmailUser = process.env.GMAIL_USER; // sua conta Gmail
const gmailPass = process.env.GMAIL_APP_PASSWORD; // senha de app do Gmail

if (gmailUser && gmailPass) {
  transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: gmailUser,
      pass: gmailPass, // Use uma senha de app, não a senha normal
    },
  });
  console.log('Gmail configurado para:', gmailUser);
} else {
  console.log('Gmail não configurado. Configure GMAIL_USER e GMAIL_APP_PASSWORD nas variáveis de ambiente.');
  console.log('Emails serão mostrados no console durante desenvolvimento.');
}

interface EmailParams {
  to: string;
  from: string;
  subject: string;
  text?: string;
  html?: string;
}

export async function sendEmail(params: EmailParams): Promise<boolean> {
  if (!transporter) {
    console.log('=== EMAIL DE DESENVOLVIMENTO ===');
    console.log('Para:', params.to);
    console.log('De:', params.from);
    console.log('Assunto:', params.subject);
    console.log('Conteúdo HTML:');
    console.log(params.html || params.text);
    console.log('================================');
    return true; // Simula sucesso em desenvolvimento
  }

  try {
    await transporter.sendMail({
      from: params.from,
      to: params.to,
      subject: params.subject,
      text: params.text,
      html: params.html,
    });
    console.log(`Email enviado com sucesso para: ${params.to}`);
    return true;
  } catch (error) {
    console.error('Erro ao enviar email:', error);
    return false;
  }
}

export function generateInviteEmail(studentName: string, inviteToken: string, trainerName: string): { subject: string; html: string } {
  const baseUrl = process.env.FRONTEND_URL || 'http://localhost:3000';
  const inviteUrl = `${baseUrl}/student/setup-password?token=${inviteToken}`;
  
  return {
    subject: `Convite para CRM Treinos MP - ${trainerName}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h1 style="color: #2563eb;">Convite para CRM Treinos MP</h1>
        
        <p>Olá <strong>${studentName}</strong>,</p>
        
        <p>Você foi convidado pelo seu personal trainer <strong>${trainerName}</strong> para acessar o sistema CRM Treinos MP.</p>
        
        <p>Para começar a usar o sistema e acessar seus treinos, clique no botão abaixo para criar sua senha:</p>
        
        <div style="text-align: center; margin: 30px 0;">
          <a href="${inviteUrl}" 
             style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
            Criar Minha Senha
          </a>
        </div>
        
        <p>Ou copie e cole este link no seu navegador:</p>
        <p style="background-color: #f3f4f6; padding: 10px; border-radius: 4px; word-break: break-all;">
          ${inviteUrl}
        </p>
        
        <p>Com o acesso ao sistema, você poderá:</p>
        <ul>
          <li>Ver seus treinos do dia</li>
          <li>Acompanhar seu progresso</li>
          <li>Registrar os pesos utilizados nos exercícios</li>
          <li>Ver o tempo gasto nos exercícios</li>
        </ul>
        
        <p>Se você não solicitou este convite, pode ignorar este email.</p>
        
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;">
        <p style="color: #6b7280; font-size: 14px;">
          Este convite é válido por 7 dias. Caso tenha dúvidas, entre em contato com seu personal trainer.
        </p>
      </div>
    `
  };
}