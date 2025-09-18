import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Tipos para eventos do Google Calendar
export interface GoogleCalendarEvent {
  id: string;
  summary: string;
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  attendees?: Array<{ email: string }>;
  location?: string;
}

export interface CreateEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  location?: string;
}

// Configuração OAuth2
export class GoogleCalendarService {
  private oauth2Client: any;
  private calendar: any;

  constructor(clientId: string, clientSecret: string, redirectUri: string) {
    this.oauth2Client = new google.auth.OAuth2(
      clientId,
      clientSecret,
      redirectUri
    );

    this.calendar = google.calendar({ version: "v3", auth: this.oauth2Client });
  }

  // Gerar URL de autorização
  generateAuthUrl(): string {
    const scopes = [
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ];

    return this.oauth2Client.generateAuthUrl({
      access_type: "offline",
      scope: scopes,
      prompt: "consent",
    });
  }

  // Trocar código de autorização por tokens
  async getTokensFromCode(authCode: string): Promise<any> {
    try {
      const { tokens } = await this.oauth2Client.getToken(authCode);
      this.oauth2Client.setCredentials(tokens);
      return tokens;
    } catch (error) {
      throw new Error(`Falha na troca de tokens: ${error}`);
    }
  }

  // Configurar tokens salvos
  setTokens(tokens: any): void {
    this.oauth2Client.setCredentials(tokens);
  }

  // Verificar se os tokens estão válidos
  async verifyTokens(): Promise<boolean> {
    try {
      const tokenInfo = await this.oauth2Client.getTokenInfo(
        this.oauth2Client.credentials.access_token
      );
      return !!tokenInfo;
    } catch (error) {
      return false;
    }
  }

  // Atualizar tokens se necessário
  async refreshTokensIfNeeded(): Promise<void> {
    try {
      const { credentials } = await this.oauth2Client.refreshAccessToken();
      this.oauth2Client.setCredentials(credentials);
    } catch (error) {
      throw new Error("Falha ao atualizar tokens do Google Calendar");
    }
  }

  // Listar eventos do calendário
  async listEvents(maxResults: number = 10): Promise<GoogleCalendarEvent[]> {
    try {
      await this.refreshTokensIfNeeded();

      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: new Date().toISOString(),
        maxResults,
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Erro ao buscar eventos do Google Calendar:", error);
      throw new Error("Falha ao buscar eventos do Google Calendar");
    }
  }

  // Criar novo evento
  async createEvent(eventData: CreateEventData): Promise<GoogleCalendarEvent> {
    try {
      await this.refreshTokensIfNeeded();

      const event = {
        summary: eventData.title,
        description: eventData.description,
        start: {
          dateTime: eventData.startTime,
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: "America/Sao_Paulo",
        },
        attendees: eventData.attendees?.map((email) => ({ email })),
        location: eventData.location,
      };

      const response = await this.calendar.events.insert({
        calendarId: "primary",
        resource: event,
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao criar evento no Google Calendar:", error);
      throw new Error("Falha ao criar evento no Google Calendar");
    }
  }

  // Atualizar evento existente
  async updateEvent(
    eventId: string,
    eventData: Partial<CreateEventData>
  ): Promise<GoogleCalendarEvent> {
    try {
      await this.refreshTokensIfNeeded();

      const event: any = {};

      if (eventData.title) event.summary = eventData.title;
      if (eventData.description) event.description = eventData.description;
      if (eventData.startTime) {
        event.start = {
          dateTime: eventData.startTime,
          timeZone: "America/Sao_Paulo",
        };
      }
      if (eventData.endTime) {
        event.end = {
          dateTime: eventData.endTime,
          timeZone: "America/Sao_Paulo",
        };
      }
      if (eventData.attendees) {
        event.attendees = eventData.attendees.map((email) => ({ email }));
      }
      if (eventData.location) event.location = eventData.location;

      const response = await this.calendar.events.update({
        calendarId: "primary",
        eventId,
        resource: event,
      });

      return response.data;
    } catch (error) {
      console.error("Erro ao atualizar evento no Google Calendar:", error);
      throw new Error("Falha ao atualizar evento no Google Calendar");
    }
  }

  // Deletar evento
  async deleteEvent(eventId: string): Promise<void> {
    try {
      await this.refreshTokensIfNeeded();

      await this.calendar.events.delete({
        calendarId: "primary",
        eventId,
      });
    } catch (error) {
      console.error("Erro ao deletar evento no Google Calendar:", error);
      throw new Error("Falha ao deletar evento no Google Calendar");
    }
  }

  // Buscar eventos em um período específico
  async getEventsInRange(
    startDate: Date,
    endDate: Date
  ): Promise<GoogleCalendarEvent[]> {
    try {
      await this.refreshTokensIfNeeded();

      const response = await this.calendar.events.list({
        calendarId: "primary",
        timeMin: startDate.toISOString(),
        timeMax: endDate.toISOString(),
        singleEvents: true,
        orderBy: "startTime",
      });

      return response.data.items || [];
    } catch (error) {
      console.error("Erro ao buscar eventos do Google Calendar:", error);
      throw new Error("Falha ao buscar eventos do Google Calendar");
    }
  }
}

// Exportar instância singleton configurada com variáveis de ambiente
export function createGoogleCalendarService(): GoogleCalendarService {
  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  const redirectUri =
    process.env.GOOGLE_REDIRECT_URI ||
    "http://localhost:3000/api/auth/google/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do Google Calendar não configuradas");
  }

  return new GoogleCalendarService(clientId, clientSecret, redirectUri);
}
