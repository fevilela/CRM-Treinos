import { ConfidentialClientApplication } from "@azure/msal-node";
import { Client } from "@microsoft/microsoft-graph-client";

// Tipos para eventos do Outlook Calendar
export interface OutlookCalendarEvent {
  id: string;
  subject: string;
  body?: {
    content: string;
    contentType: string;
  };
  start: {
    dateTime: string;
    timeZone: string;
  };
  end: {
    dateTime: string;
    timeZone: string;
  };
  attendees?: Array<{
    emailAddress: {
      address: string;
      name?: string;
    };
  }>;
  location?: {
    displayName: string;
  };
}

export interface CreateEventData {
  title: string;
  description?: string;
  startTime: string;
  endTime: string;
  attendees?: string[];
  location?: string;
}

// Configuração MSAL
export class OutlookCalendarService {
  private msalApp: ConfidentialClientApplication;
  private accessToken?: string;

  constructor(
    clientId: string,
    clientSecret: string,
    tenantId: string,
    redirectUri: string
  ) {
    const msalConfig = {
      auth: {
        clientId,
        authority: `https://login.microsoftonline.com/${tenantId}`,
        clientSecret,
      },
      system: {
        loggerOptions: {
          loggerCallback: (
            loglevel: any,
            message: string,
            containsPii: boolean
          ) => {
            if (!containsPii) {
              console.log(message);
            }
          },
          piiLoggingEnabled: false,
        },
      },
    };

    this.msalApp = new ConfidentialClientApplication(msalConfig);
  }

  // Gerar URL de autorização
  async generateAuthUrl(): Promise<string> {
    const authCodeUrlParameters = {
      scopes: [
        "https://graph.microsoft.com/Calendars.Read",
        "https://graph.microsoft.com/Calendars.ReadWrite",
        "https://graph.microsoft.com/User.Read",
      ],
      redirectUri:
        process.env.OUTLOOK_REDIRECT_URI ||
        "http://localhost:3000/api/auth/outlook/callback",
    };

    const response = await this.msalApp.getAuthCodeUrl(authCodeUrlParameters);
    return response;
  }

  // Trocar código de autorização por tokens
  async getTokensFromCode(authCode: string): Promise<any> {
    try {
      const tokenRequest = {
        code: authCode,
        scopes: [
          "https://graph.microsoft.com/Calendars.Read",
          "https://graph.microsoft.com/Calendars.ReadWrite",
          "https://graph.microsoft.com/User.Read",
        ],
        redirectUri:
          process.env.OUTLOOK_REDIRECT_URI ||
          "http://localhost:3000/api/auth/outlook/callback",
      };

      const response = await this.msalApp.acquireTokenByCode(tokenRequest);
      this.accessToken = response.accessToken;
      return response;
    } catch (error) {
      throw new Error(`Falha na troca de tokens do Outlook: ${error}`);
    }
  }

  // Configurar token de acesso
  setAccessToken(accessToken: string): void {
    this.accessToken = accessToken;
  }

  // Criar cliente do Microsoft Graph
  private getGraphClient(): Client {
    if (!this.accessToken) {
      throw new Error("Token de acesso não configurado");
    }

    return Client.init({
      authProvider: (done) => {
        done(null, this.accessToken ?? null); // Usa null caso seja undefined
      },
    });
  }

  // Listar eventos do calendário
  async listEvents(maxResults: number = 10): Promise<OutlookCalendarEvent[]> {
    try {
      const graphClient = this.getGraphClient();

      // Buscar eventos dos últimos 6 meses até 6 meses no futuro
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(now.getMonth() - 6);
      const sixMonthsFromNow = new Date(now);
      sixMonthsFromNow.setMonth(now.getMonth() + 6);

      console.log(
        `[OUTLOOK] Buscando eventos de ${sixMonthsAgo.toISOString()} até ${sixMonthsFromNow.toISOString()}`
      );

      const events = await graphClient
        .api("/me/calendar/events")
        .select("id,subject,body,start,end,attendees,location")
        .filter(
          `start/dateTime ge '${sixMonthsAgo.toISOString()}' and end/dateTime le '${sixMonthsFromNow.toISOString()}'`
        )
        .orderby("start/dateTime")
        .top(maxResults)
        .get();

      const eventList = events.value || [];
      console.log(`[OUTLOOK] Encontrados ${eventList.length} eventos`);
      if (eventList.length > 0) {
        console.log(
          `[OUTLOOK] Primeiro evento: ${eventList[0].subject} - ${eventList[0].start?.dateTime}`
        );
        console.log(
          `[OUTLOOK] Último evento: ${
            eventList[eventList.length - 1].subject
          } - ${eventList[eventList.length - 1].start?.dateTime}`
        );
      }

      return eventList;
    } catch (error) {
      console.error("Erro ao buscar eventos do Outlook Calendar:", error);
      throw new Error("Falha ao buscar eventos do Outlook Calendar");
    }
  }

  // Criar novo evento
  async createEvent(eventData: CreateEventData): Promise<OutlookCalendarEvent> {
    try {
      const graphClient = this.getGraphClient();

      const event = {
        subject: eventData.title,
        body: eventData.description
          ? {
              contentType: "HTML",
              content: eventData.description,
            }
          : undefined,
        start: {
          dateTime: eventData.startTime,
          timeZone: "America/Sao_Paulo",
        },
        end: {
          dateTime: eventData.endTime,
          timeZone: "America/Sao_Paulo",
        },
        location: eventData.location
          ? {
              displayName: eventData.location,
            }
          : undefined,
        attendees: eventData.attendees?.map((email) => ({
          emailAddress: {
            address: email,
            name: email.split("@")[0], // Nome básico baseado no email
          },
        })),
      };

      const createdEvent = await graphClient
        .api("/me/calendar/events")
        .post(event);

      return createdEvent;
    } catch (error) {
      console.error("Erro ao criar evento no Outlook Calendar:", error);
      throw new Error("Falha ao criar evento no Outlook Calendar");
    }
  }

  // Atualizar evento existente
  async updateEvent(
    eventId: string,
    eventData: Partial<CreateEventData>
  ): Promise<OutlookCalendarEvent> {
    try {
      const graphClient = this.getGraphClient();

      const event: any = {};

      if (eventData.title) event.subject = eventData.title;
      if (eventData.description) {
        event.body = {
          contentType: "HTML",
          content: eventData.description,
        };
      }
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
      if (eventData.location) {
        event.location = {
          displayName: eventData.location,
        };
      }
      if (eventData.attendees) {
        event.attendees = eventData.attendees.map((email) => ({
          emailAddress: {
            address: email,
            name: email.split("@")[0],
          },
        }));
      }

      const updatedEvent = await graphClient
        .api(`/me/calendar/events/${eventId}`)
        .patch(event);

      return updatedEvent;
    } catch (error) {
      console.error("Erro ao atualizar evento no Outlook Calendar:", error);
      throw new Error("Falha ao atualizar evento no Outlook Calendar");
    }
  }

  // Deletar evento
  async deleteEvent(eventId: string): Promise<void> {
    try {
      const graphClient = this.getGraphClient();

      await graphClient.api(`/me/calendar/events/${eventId}`).delete();
    } catch (error) {
      console.error("Erro ao deletar evento no Outlook Calendar:", error);
      throw new Error("Falha ao deletar evento no Outlook Calendar");
    }
  }

  // Buscar eventos em um período específico
  async getEventsInRange(
    startDate: Date,
    endDate: Date
  ): Promise<OutlookCalendarEvent[]> {
    try {
      const graphClient = this.getGraphClient();

      const events = await graphClient
        .api("/me/calendar/events")
        .select("id,subject,body,start,end,attendees,location")
        .filter(
          `start/dateTime ge '${startDate.toISOString()}' and end/dateTime le '${endDate.toISOString()}'`
        )
        .orderby("start/dateTime")
        .get();

      return events.value || [];
    } catch (error) {
      console.error("Erro ao buscar eventos do Outlook Calendar:", error);
      throw new Error("Falha ao buscar eventos do Outlook Calendar");
    }
  }

  // Obter informações do usuário
  async getUserInfo(): Promise<any> {
    try {
      const graphClient = this.getGraphClient();

      const user = await graphClient
        .api("/me")
        .select("displayName,mail,userPrincipalName")
        .get();

      return user;
    } catch (error) {
      console.error("Erro ao obter informações do usuário:", error);
      throw new Error("Falha ao obter informações do usuário");
    }
  }
}

// Exportar instância singleton configurada com variáveis de ambiente
export function createOutlookCalendarService(): OutlookCalendarService {
  const clientId = process.env.OUTLOOK_CLIENT_ID;
  const clientSecret = process.env.OUTLOOK_CLIENT_SECRET;
  const tenantId = process.env.OUTLOOK_TENANT_ID || "common";
  const redirectUri =
    process.env.OUTLOOK_REDIRECT_URI ||
    "http://localhost:3000/api/auth/outlook/callback";

  if (!clientId || !clientSecret) {
    throw new Error("Credenciais do Outlook Calendar não configuradas");
  }

  return new OutlookCalendarService(
    clientId,
    clientSecret,
    tenantId,
    redirectUri
  );
}
