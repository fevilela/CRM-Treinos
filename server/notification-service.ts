// Sistema independente de notificação por email
import { sendEmail } from "./email";
import { storage } from "./storage";
import { format, addDays, startOfDay, endOfDay } from "date-fns";
import { ptBR } from "date-fns/locale";

export interface EventNotification {
  studentEmail: string;
  studentName: string;
  trainerName: string;
  event: {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    description?: string;
    type: string;
    location?: string;
  };
}

// Configuração de tipos de evento para notificações
const eventTypeConfig = {
  training: {
    label: "Treino",
    emoji: "💪",
    color: "#3B82F6",
  },
  consultation: {
    label: "Consulta",
    emoji: "🩺",
    color: "#10B981",
  },
  assessment: {
    label: "Avaliação",
    emoji: "📊",
    color: "#8B5CF6",
  },
  personal: {
    label: "Evento",
    emoji: "📅",
    color: "#6B7280",
  },
};

function getEventTypeInfo(type: string) {
  return (
    eventTypeConfig[type as keyof typeof eventTypeConfig] ||
    eventTypeConfig.personal
  );
}

function generateNotificationEmail(notification: EventNotification): {
  subject: string;
  html: string;
  text: string;
} {
  const { studentName, trainerName, event } = notification;
  const eventInfo = getEventTypeInfo(event.type);

  const eventDate = format(event.startTime, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });
  const eventTime = format(event.startTime, "HH:mm", { locale: ptBR });
  const endTime = format(event.endTime, "HH:mm", { locale: ptBR });

  const subject = `${eventInfo.emoji} Lembrete: ${event.title} amanhã às ${eventTime}`;

  const htmlContent = `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lembrete de Evento</title>
      <style>
        body {
          font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          line-height: 1.6;
          color: #374151;
          max-width: 600px;
          margin: 0 auto;
          padding: 20px;
          background-color: #f9fafb;
        }
        .container {
          background-color: white;
          border-radius: 12px;
          padding: 32px;
          box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
        }
        .header {
          text-align: center;
          margin-bottom: 32px;
        }
        .logo {
          font-size: 28px;
          font-weight: bold;
          color: #1f2937;
          margin-bottom: 8px;
        }
        .subtitle {
          color: #6b7280;
          font-size: 14px;
        }
        .event-card {
          background-color: #f8fafc;
          border-left: 4px solid ${eventInfo.color};
          border-radius: 8px;
          padding: 24px;
          margin: 24px 0;
        }
        .event-title {
          font-size: 20px;
          font-weight: 600;
          color: #1f2937;
          margin-bottom: 16px;
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .event-details {
          margin-bottom: 12px;
        }
        .event-detail {
          display: flex;
          align-items: center;
          margin-bottom: 8px;
          font-size: 14px;
        }
        .event-detail strong {
          min-width: 100px;
          color: #374151;
        }
        .description {
          background-color: white;
          padding: 16px;
          border-radius: 6px;
          margin-top: 16px;
          font-style: italic;
          color: #6b7280;
        }
        .footer {
          text-align: center;
          margin-top: 32px;
          padding-top: 24px;
          border-top: 1px solid #e5e7eb;
          color: #6b7280;
          font-size: 14px;
        }
        .trainer-info {
          background-color: #eff6ff;
          border-radius: 8px;
          padding: 16px;
          margin-top: 24px;
        }
        .cta {
          text-align: center;
          margin: 24px 0;
        }
        .cta-text {
          color: #059669;
          font-weight: 500;
        }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="header">
          <div class="logo">💪 CRM Treinos MP</div>
          <div class="subtitle">Sistema de Gestão Personalizada</div>
        </div>

        <h1 style="color: #1f2937; text-align: center; margin-bottom: 8px;">
          Lembrete de ${eventInfo.label}
        </h1>
        <p style="text-align: center; color: #6b7280; margin-bottom: 24px;">
          Olá, ${studentName}! Você tem um compromisso marcado para amanhã.
        </p>

        <div class="event-card">
          <div class="event-title">
            <span>${eventInfo.emoji}</span>
            <span>${event.title}</span>
          </div>
          
          <div class="event-details">
            <div class="event-detail">
              <strong>📅 Data:</strong>
              <span>${eventDate}</span>
            </div>
            <div class="event-detail">
              <strong>🕐 Horário:</strong>
              <span>${eventTime} - ${endTime}</span>
            </div>
            <div class="event-detail">
              <strong>📋 Tipo:</strong>
              <span>${eventInfo.label}</span>
            </div>
            ${
              event.location
                ? `
            <div class="event-detail">
              <strong>📍 Local:</strong>
              <span>${event.location}</span>
            </div>
            `
                : ""
            }
          </div>

          ${
            event.description
              ? `
          <div class="description">
            <strong>Observações:</strong><br>
            ${event.description}
          </div>
          `
              : ""
          }
        </div>

        <div class="trainer-info">
          <div style="font-weight: 600; color: #374151; margin-bottom: 8px;">
            👨‍💼 Personal Trainer
          </div>
          <div style="color: #6b7280;">
            ${trainerName}
          </div>
        </div>

        <div class="cta">
          <div class="cta-text">
            ✅ Lembre-se de estar preparado(a) para o seu ${eventInfo.label.toLowerCase()}!
          </div>
        </div>

        <div class="footer">
          <p>
            Este é um lembrete automático enviado pelo sistema CRM Treinos MP.<br>
            Para dúvidas, entre em contato com seu personal trainer.
          </p>
          <p style="margin-top: 16px; font-size: 12px;">
            <strong>CRM Treinos MP</strong> - Sistema de Gestão para Personal Trainers
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  const textContent = `
🎯 LEMBRETE DE ${eventInfo.label.toUpperCase()}

Olá, ${studentName}!

Você tem um compromisso marcado para amanhã:

${eventInfo.emoji} ${event.title}
📅 Data: ${eventDate}
🕐 Horário: ${eventTime} - ${endTime}
📋 Tipo: ${eventInfo.label}
${event.location ? `📍 Local: ${event.location}` : ""}

${event.description ? `\nObservações:\n${event.description}\n` : ""}

👨‍💼 Personal Trainer: ${trainerName}

✅ Lembre-se de estar preparado(a) para o seu ${eventInfo.label.toLowerCase()}!

---
Este é um lembrete automático enviado pelo sistema CRM Treinos MP.
Para dúvidas, entre em contato com seu personal trainer.

CRM Treinos MP - Sistema de Gestão para Personal Trainers
  `;

  return {
    subject,
    html: htmlContent,
    text: textContent,
  };
}

export async function getUpcomingEventsForNotification(): Promise<
  EventNotification[]
> {
  try {
    // Buscar eventos do dia seguinte
    const tomorrow = addDays(new Date(), 1);
    const startOfTomorrow = startOfDay(tomorrow);
    const endOfTomorrow = endOfDay(tomorrow);

    console.log(
      `[NOTIFICATION] Buscando eventos para: ${format(tomorrow, "dd/MM/yyyy", {
        locale: ptBR,
      })}`
    );

    // Buscar eventos de amanhã que ainda não tiveram lembrete enviado
    const upcomingEvents = await storage.getUpcomingEvents(
      startOfTomorrow,
      endOfTomorrow
    );

    const notifications: EventNotification[] = [];

    for (const event of upcomingEvents) {
      // Pular se já foi enviado lembrete
      if (event.reminderSent) {
        console.log(
          `[NOTIFICATION] Pulando evento ${event.id} - lembrete já enviado`
        );
        continue;
      }

      // Pular eventos sem aluno
      if (!event.studentId) {
        console.log(
          `[NOTIFICATION] Pulando evento ${event.id} - sem aluno associado`
        );
        continue;
      }

      try {
        // Buscar dados do aluno
        const student = await storage.getStudent(event.studentId);
        if (!student) {
          console.log(
            `[NOTIFICATION] Aluno não encontrado para evento ${event.id}`
          );
          continue;
        }

        // Buscar dados do trainer
        const trainer = await storage.getUser(event.personalTrainerId);
        if (!trainer) {
          console.log(
            `[NOTIFICATION] Trainer não encontrado para evento ${event.id}`
          );
          continue;
        }

        notifications.push({
          studentEmail: student.email || "",
          studentName: student.name,
          trainerName: `${trainer.firstName} ${trainer.lastName}`,
          event: {
            id: event.id,
            title: event.title,
            startTime: event.startTime,
            endTime: event.endTime,
            description: event.description || undefined,
            type: event.type,
            location: event.location || undefined,
          },
        });
      } catch (error) {
        console.error(
          `[NOTIFICATION] Erro ao processar evento ${event.id}:`,
          error
        );
      }
    }

    console.log(
      `[NOTIFICATION] ${notifications.length} notificações preparadas`
    );
    return notifications;
  } catch (error) {
    console.error(
      "[NOTIFICATION] Erro ao buscar eventos para notificação:",
      error
    );
    return [];
  }
}

export async function sendEventNotification(
  notification: EventNotification
): Promise<boolean> {
  try {
    const { subject, html, text } = generateNotificationEmail(notification);

    // Enviar notificação para o aluno
    console.log(
      `[NOTIFICATION] Enviando email para aluno ${notification.studentEmail} sobre evento: ${notification.event.title}`
    );

    const studentResult = await sendEmail({
      to: notification.studentEmail,
      from: `"CRM Treinos MP" <${process.env.GMAIL_USER}>`,
      subject,
      html,
      text,
    });

    // Gerar notificação para o professor/trainer
    const trainerSubject = `📅 Lembrete: ${notification.event.title} com ${notification.studentName} amanhã`;
    const trainerHtml = generateTrainerNotificationEmail(notification);

    // Buscar email do trainer
    const event = await storage.getCalendarEvent(notification.event.id);
    if (event) {
      const trainer = await storage.getUser(event.personalTrainerId);
      if (trainer && trainer.email) {
        console.log(
          `[NOTIFICATION] Enviando email para professor ${trainer.email} sobre evento: ${notification.event.title}`
        );

        await sendEmail({
          to: trainer.email,
          from: `"CRM Treinos MP" <${process.env.GMAIL_USER}>`,
          subject: trainerSubject,
          html: trainerHtml,
          text: `Lembrete: ${notification.event.title} com ${
            notification.studentName
          } amanhã às ${format(notification.event.startTime, "HH:mm", {
            locale: ptBR,
          })}.`,
        });
      }
    }

    console.log(
      `[NOTIFICATION] Emails enviados com sucesso para aluno e professor`
    );

    // Marcar como enviado no banco de dados
    await storage.markEventReminderSent(notification.event.id);

    return true;
  } catch (error) {
    console.error(
      `[NOTIFICATION] Erro ao enviar emails para ${notification.studentEmail}:`,
      error
    );
    return false;
  }
}

export async function sendAllEventNotifications(): Promise<{
  success: number;
  failed: number;
  total: number;
}> {
  console.log("[NOTIFICATION] Iniciando processo de envio de notificações");

  const notifications = await getUpcomingEventsForNotification();
  let success = 0;
  let failed = 0;

  for (const notification of notifications) {
    const sent = await sendEventNotification(notification);
    if (sent) {
      success++;
    } else {
      failed++;
    }

    // Pequena pausa entre emails para evitar rate limiting
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  const total = notifications.length;
  console.log(
    `[NOTIFICATION] Processo concluído: ${success} sucesso, ${failed} falhas, ${total} total`
  );

  return { success, failed, total };
}

// Gerar email de notificação para o professor/trainer
function generateTrainerNotificationEmail(
  notification: EventNotification
): string {
  const eventInfo = getEventTypeInfo(notification.event.type);
  const eventDate = format(notification.event.startTime, "EEEE, dd 'de' MMMM", {
    locale: ptBR,
  });
  const eventTime = format(notification.event.startTime, "HH:mm", {
    locale: ptBR,
  });
  const endTime = format(notification.event.endTime, "HH:mm", { locale: ptBR });

  return `
    <!DOCTYPE html>
    <html lang="pt-BR">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Lembrete de Evento - Professor</title>
    </head>
    <body style="font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; background-color: #f4f4f4;">
      <div style="max-width: 600px; margin: 0 auto; background-color: white; padding: 30px; border-radius: 10px; box-shadow: 0 0 20px rgba(0,0,0,0.1);">
        
        <!-- Header -->
        <div style="text-align: center; margin-bottom: 30px;">
          <h1 style="color: ${eventInfo.color}; margin: 0; font-size: 28px;">
            ${eventInfo.emoji} Lembrete de Compromisso
          </h1>
          <p style="color: #666; margin: 10px 0 0 0; font-size: 16px;">CRM Treinos MP - Área do Professor</p>
        </div>

        <!-- Evento Info -->
        <div style="background-color: #f8fafc; padding: 25px; border-radius: 8px; border-left: 4px solid ${
          eventInfo.color
        }; margin-bottom: 25px;">
          <h2 style="color: #1a365d; margin: 0 0 15px 0; font-size: 22px;">
            📅 ${notification.event.title}
          </h2>
          
          <div style="display: grid; gap: 12px;">
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: ${
                eventInfo.color
              }; font-weight: bold;">👤 Aluno:</span>
              <span style="font-weight: bold; color: #2d3748;">${
                notification.studentName
              }</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: ${
                eventInfo.color
              }; font-weight: bold;">📅 Data:</span>
              <span style="color: #2d3748;">${eventDate}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: ${
                eventInfo.color
              }; font-weight: bold;">⏰ Horário:</span>
              <span style="color: #2d3748; font-weight: bold;">${eventTime} - ${endTime}</span>
            </div>
            
            <div style="display: flex; align-items: center; gap: 10px;">
              <span style="color: ${
                eventInfo.color
              }; font-weight: bold;">🎯 Tipo:</span>
              <span style="background-color: ${
                eventInfo.color
              }; color: white; padding: 4px 8px; border-radius: 4px; font-size: 12px; font-weight: bold;">
                ${eventInfo.label}
              </span>
            </div>
          </div>
        </div>

        ${
          notification.event.description
            ? `
        <!-- Descrição -->
        <div style="background-color: #f7fafc; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #2d3748; margin: 0 0 10px 0; font-size: 18px;">📝 Observações:</h3>
          <p style="color: #4a5568; margin: 0; line-height: 1.6;">${notification.event.description}</p>
        </div>
        `
            : ""
        }

        <!-- Ações Sugeridas -->
        <div style="background-color: #edf2f7; padding: 20px; border-radius: 8px; margin-bottom: 25px;">
          <h3 style="color: #2d3748; margin: 0 0 15px 0; font-size: 18px;">💡 Lembrete para amanhã:</h3>
          <ul style="color: #4a5568; margin: 0; padding-left: 20px;">
            <li>Preparar equipamentos e exercícios</li>
            <li>Revisar fichas e progresso do aluno</li>
            <li>Confirmar presença se necessário</li>
            <li>Verificar objetivos da sessão</li>
          </ul>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e2e8f0;">
          <p style="color: #718096; font-size: 14px; margin: 0;">
            <strong>CRM Treinos MP</strong><br>
            Sistema Independente de Gerenciamento para Personal Trainers<br>
            <span style="font-size: 12px;">Este lembrete foi enviado automaticamente 1 dia antes do evento</span>
          </p>
        </div>
      </div>
    </body>
    </html>
  `;
}
