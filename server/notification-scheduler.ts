// Sistema de Notificações Automáticas - CRM Treinos MP
// Este módulo implementa um scheduler interno para envio automático de notificações
// Blueprint: replitmail integration

import { sendAllEventNotifications } from "./notification-service";

interface SchedulerConfig {
  enabled: boolean;
  hour: number; // Hora do dia para envio (0-23)
  minute: number; // Minuto da hora para envio (0-59)
  intervalMinutes?: number; // Intervalo de verificação em minutos (padrão: 60)
}

class NotificationScheduler {
  private intervalId: NodeJS.Timeout | null = null;
  private lastExecutionDate: string | null = null;
  private config: SchedulerConfig;

  constructor(config: SchedulerConfig) {
    this.config = {
      intervalMinutes: 60, // Verificar a cada hora por padrão
      ...config,
    };
  }

  start(): void {
    if (!this.config.enabled) {
      console.log("[SCHEDULER] Notification scheduler is disabled");
      return;
    }

    if (this.intervalId) {
      console.log("[SCHEDULER] Scheduler already running");
      return;
    }

    console.log(
      `[SCHEDULER] Starting notification scheduler - will check every ${this.config.intervalMinutes} minutes`
    );
    console.log(
      `[SCHEDULER] Configured to send notifications at ${this.config.hour
        .toString()
        .padStart(2, "0")}:${this.config.minute.toString().padStart(2, "0")}`
    );

    // Verificar imediatamente na inicialização
    this.checkAndSendNotifications();

    // Configurar intervalo de verificação
    this.intervalId = setInterval(() => {
      this.checkAndSendNotifications();
    }, (this.config.intervalMinutes || 60) * 60 * 1000);
  }

  stop(): void {
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
      console.log("[SCHEDULER] Notification scheduler stopped");
    }
  }

  private async checkAndSendNotifications(): Promise<void> {
    try {
      const now = new Date();
      const currentHour = now.getHours();
      const currentMinute = now.getMinutes();
      const currentDateStr = now.toISOString().split("T")[0]; // YYYY-MM-DD

      // Verificar se é o horário correto para envio
      const isCorrectTime =
        currentHour === this.config.hour &&
        currentMinute >= this.config.minute &&
        currentMinute <
          this.config.minute + (this.config.intervalMinutes || 60);

      // Verificar se já executou hoje
      const alreadyExecutedToday = this.lastExecutionDate === currentDateStr;

      if (!isCorrectTime) {
        // Log apenas uma vez por hora para evitar spam
        if (currentMinute === 0) {
          console.log(
            `[SCHEDULER] Current time: ${currentHour
              .toString()
              .padStart(2, "0")}:${currentMinute
              .toString()
              .padStart(2, "0")} - waiting for ${this.config.hour
              .toString()
              .padStart(2, "0")}:${this.config.minute
              .toString()
              .padStart(2, "0")}`
          );
        }
        return;
      }

      if (alreadyExecutedToday) {
        console.log(
          `[SCHEDULER] Notifications already sent today (${currentDateStr})`
        );
        return;
      }

      console.log(
        `[SCHEDULER] Executing daily notification job at ${now.toISOString()}`
      );

      // Executar o envio de notificações
      const result = await sendAllEventNotifications();

      // Registrar execução bem-sucedida
      this.lastExecutionDate = currentDateStr;

      console.log(
        `[SCHEDULER] Daily notification job completed successfully:`,
        {
          date: currentDateStr,
          time: `${currentHour.toString().padStart(2, "0")}:${currentMinute
            .toString()
            .padStart(2, "0")}`,
          success: result.success,
          failed: result.failed,
          total: result.total,
        }
      );
    } catch (error) {
      console.error("[SCHEDULER] Error in daily notification job:", error);
    }
  }

  getStatus(): {
    running: boolean;
    config: SchedulerConfig;
    lastExecution: string | null;
    nextCheck: string;
  } {
    const now = new Date();
    const nextCheck = new Date(
      now.getTime() + (this.config.intervalMinutes || 60) * 60 * 1000
    );

    return {
      running: this.intervalId !== null,
      config: this.config,
      lastExecution: this.lastExecutionDate,
      nextCheck: nextCheck.toISOString(),
    };
  }
}

// Configuração padrão - pode ser sobrescrita por variáveis de ambiente
const defaultConfig: SchedulerConfig = {
  enabled: process.env.NOTIFICATIONS_SCHEDULER_ENABLED === "true",
  hour: parseInt(process.env.NOTIFICATIONS_HOUR || "20", 10), // 20:00 (8 PM) por padrão
  minute: parseInt(process.env.NOTIFICATIONS_MINUTE || "0", 10), // :00 por padrão
  intervalMinutes: parseInt(
    process.env.NOTIFICATIONS_CHECK_INTERVAL || "60",
    10
  ), // 60 minutos por padrão
};

// Instância singleton do scheduler
export const notificationScheduler = new NotificationScheduler(defaultConfig);

// Função para inicializar o scheduler
export function startNotificationScheduler(): void {
  notificationScheduler.start();
}

// Função para parar o scheduler
export function stopNotificationScheduler(): void {
  notificationScheduler.stop();
}

// Função para obter status do scheduler
export function getSchedulerStatus() {
  return notificationScheduler.getStatus();
}
