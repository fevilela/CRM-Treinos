import express, { type Express, type Request, type Response } from "express";
import { createGoogleCalendarService } from "./google-calendar";
import { createOutlookCalendarService } from "./outlook-calendar";
import { isAuthenticated } from "./auth";

// Armazenamento temporário de tokens por usuário (em produção, usar banco de dados)
const userTokens: Map<string, any> = new Map();

export function registerCalendarRoutes(app: Express): void {
  // ============= GOOGLE CALENDAR ROUTES =============

  // Iniciar autenticação com Google Calendar
  app.get(
    "/api/auth/google/calendar",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const googleService = createGoogleCalendarService();
        const authUrl = googleService.generateAuthUrl();

        res.json({
          success: true,
          authUrl,
          message: "Acesse a URL para autorizar o acesso ao Google Calendar",
        });
      } catch (error: any) {
        console.error("Erro ao gerar URL de autorização do Google:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao iniciar autenticação com Google Calendar",
          error: error.message,
        });
      }
    }
  );

  // Callback de autenticação do Google Calendar
  app.get(
    "/api/auth/google/callback",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const { code } = req.query;
        const userId = req.user.id;

        if (!code) {
          return res.status(400).json({
            success: false,
            message: "Código de autorização não encontrado",
          });
        }

        const googleService = createGoogleCalendarService();
        const tokens = await googleService.getTokensFromCode(code as string);

        // Salvar tokens para o usuário (em produção, salvar no banco de dados)
        userTokens.set(`google_${userId}`, tokens);

        res.json({
          success: true,
          message: "Google Calendar conectado com sucesso",
          provider: "google",
        });
      } catch (error: any) {
        console.error("Erro no callback do Google:", error);
        res.status(500).json({
          success: false,
          message: "Falha na autenticação com Google Calendar",
          error: error.message,
        });
      }
    }
  );

  // Listar eventos do Google Calendar
  app.get(
    "/api/calendar/google/events",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const tokens = userTokens.get(`google_${userId}`);

        if (!tokens) {
          return res.status(401).json({
            success: false,
            message: "Google Calendar não está conectado",
          });
        }

        const googleService = createGoogleCalendarService();
        googleService.setTokens(tokens);

        const { maxResults = 50 } = req.query;
        const events = await googleService.listEvents(Number(maxResults));

        res.json({
          success: true,
          events,
          provider: "google",
        });
      } catch (error: any) {
        console.error("Erro ao buscar eventos do Google:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao buscar eventos do Google Calendar",
          error: error.message,
        });
      }
    }
  );

  // Criar evento no Google Calendar
  app.post(
    "/api/calendar/google/events",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const tokens = userTokens.get(`google_${userId}`);

        if (!tokens) {
          return res.status(401).json({
            success: false,
            message: "Google Calendar não está conectado",
          });
        }

        const googleService = createGoogleCalendarService();
        googleService.setTokens(tokens);

        const eventData = req.body;
        const createdEvent = await googleService.createEvent(eventData);

        res.json({
          success: true,
          event: createdEvent,
          provider: "google",
        });
      } catch (error: any) {
        console.error("Erro ao criar evento no Google:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao criar evento no Google Calendar",
          error: error.message,
        });
      }
    }
  );

  // ============= OUTLOOK CALENDAR ROUTES =============

  // Iniciar autenticação com Outlook Calendar
  app.get(
    "/api/auth/outlook/calendar",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const outlookService = createOutlookCalendarService();
        const authUrl = await outlookService.generateAuthUrl();

        res.json({
          success: true,
          authUrl,
          message: "Acesse a URL para autorizar o acesso ao Outlook Calendar",
        });
      } catch (error: any) {
        console.error("Erro ao gerar URL de autorização do Outlook:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao iniciar autenticação com Outlook Calendar",
          error: error.message,
        });
      }
    }
  );

  // Callback de autenticação do Outlook Calendar
  app.get(
    "/api/auth/outlook/callback",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const { code } = req.query;
        const userId = req.user.id;

        if (!code) {
          return res.status(400).json({
            success: false,
            message: "Código de autorização não encontrado",
          });
        }

        const outlookService = createOutlookCalendarService();
        const tokenResponse = await outlookService.getTokensFromCode(
          code as string
        );

        // Salvar tokens para o usuário (em produção, salvar no banco de dados)
        userTokens.set(`outlook_${userId}`, {
          accessToken: tokenResponse.accessToken,
          refreshToken: tokenResponse.refreshToken,
          expiresOn: tokenResponse.expiresOn,
          account: tokenResponse.account,
        });

        res.json({
          success: true,
          message: "Outlook Calendar conectado com sucesso",
          provider: "outlook",
          user: tokenResponse.account?.username,
        });
      } catch (error: any) {
        console.error("Erro no callback do Outlook:", error);
        res.status(500).json({
          success: false,
          message: "Falha na autenticação com Outlook Calendar",
          error: error.message,
        });
      }
    }
  );

  // Listar eventos do Outlook Calendar
  app.get(
    "/api/calendar/outlook/events",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const tokens = userTokens.get(`outlook_${userId}`);

        if (!tokens) {
          return res.status(401).json({
            success: false,
            message: "Outlook Calendar não está conectado",
          });
        }

        const outlookService = createOutlookCalendarService();
        outlookService.setAccessToken(tokens.accessToken);

        const { maxResults = 50 } = req.query;
        const events = await outlookService.listEvents(Number(maxResults));

        res.json({
          success: true,
          events,
          provider: "outlook",
        });
      } catch (error: any) {
        console.error("Erro ao buscar eventos do Outlook:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao buscar eventos do Outlook Calendar",
          error: error.message,
        });
      }
    }
  );

  // Criar evento no Outlook Calendar
  app.post(
    "/api/calendar/outlook/events",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const tokens = userTokens.get(`outlook_${userId}`);

        if (!tokens) {
          return res.status(401).json({
            success: false,
            message: "Outlook Calendar não está conectado",
          });
        }

        const outlookService = createOutlookCalendarService();
        outlookService.setAccessToken(tokens.accessToken);

        const eventData = req.body;
        const createdEvent = await outlookService.createEvent(eventData);

        res.json({
          success: true,
          event: createdEvent,
          provider: "outlook",
        });
      } catch (error: any) {
        console.error("Erro ao criar evento no Outlook:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao criar evento no Outlook Calendar",
          error: error.message,
        });
      }
    }
  );

  // ============= ROUTES UNIFICADAS =============

  // Sincronizar todos os calendários conectados
  app.post(
    "/api/calendar/sync",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const googleTokens = userTokens.get(`google_${userId}`);
        const outlookTokens = userTokens.get(`outlook_${userId}`);

        const results = {
          google: null as any,
          outlook: null as any,
          errors: [] as string[],
        };

        // Buscar eventos do Google Calendar se conectado
        if (googleTokens) {
          try {
            const googleService = createGoogleCalendarService();
            googleService.setTokens(googleTokens);
            const googleEvents = await googleService.listEvents(100);
            results.google = {
              events: googleEvents,
              count: googleEvents.length,
            };
          } catch (error: any) {
            results.errors.push(`Google Calendar: ${error.message}`);
          }
        }

        // Buscar eventos do Outlook Calendar se conectado
        if (outlookTokens) {
          try {
            const outlookService = createOutlookCalendarService();
            outlookService.setAccessToken(outlookTokens.accessToken);
            const outlookEvents = await outlookService.listEvents(100);
            results.outlook = {
              events: outlookEvents,
              count: outlookEvents.length,
            };
          } catch (error: any) {
            results.errors.push(`Outlook Calendar: ${error.message}`);
          }
        }

        res.json({
          success: true,
          message: "Sincronização concluída",
          results,
          connectedServices: {
            google: !!googleTokens,
            outlook: !!outlookTokens,
          },
        });
      } catch (error: any) {
        console.error("Erro na sincronização de calendários:", error);
        res.status(500).json({
          success: false,
          message: "Falha na sincronização de calendários",
          error: error.message,
        });
      }
    }
  );

  // Verificar status das conexões
  app.get(
    "/api/calendar/status",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const googleTokens = userTokens.get(`google_${userId}`);
        const outlookTokens = userTokens.get(`outlook_${userId}`);

        res.json({
          success: true,
          connections: {
            google: {
              connected: !!googleTokens,
              hasRefreshToken: !!googleTokens?.refresh_token,
              expiresAt: googleTokens?.expiry_date,
            },
            outlook: {
              connected: !!outlookTokens,
              hasRefreshToken: !!outlookTokens?.refreshToken,
              expiresAt: outlookTokens?.expiresOn,
              user: outlookTokens?.account?.username,
            },
          },
        });
      } catch (error: any) {
        console.error("Erro ao verificar status dos calendários:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao verificar status dos calendários",
          error: error.message,
        });
      }
    }
  );

  // Desconectar calendário
  app.delete(
    "/api/calendar/:provider/disconnect",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const { provider } = req.params;

        if (provider !== "google" && provider !== "outlook") {
          return res.status(400).json({
            success: false,
            message: "Provedor de calendário inválido",
          });
        }

        const tokenKey = `${provider}_${userId}`;
        const hadConnection = userTokens.has(tokenKey);

        if (hadConnection) {
          userTokens.delete(tokenKey);
        }

        res.json({
          success: true,
          message: `${
            provider === "google" ? "Google" : "Outlook"
          } Calendar desconectado com sucesso`,
          hadConnection,
        });
      } catch (error: any) {
        console.error("Erro ao desconectar calendário:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao desconectar calendário",
          error: error.message,
        });
      }
    }
  );

  // Buscar eventos em período específico (todos os calendários)
  app.get(
    "/api/calendar/events/range",
    isAuthenticated,
    async (req: any, res: Response) => {
      try {
        const userId = req.user.id;
        const { startDate, endDate } = req.query;

        if (!startDate || !endDate) {
          return res.status(400).json({
            success: false,
            message: "startDate e endDate são obrigatórios",
          });
        }

        const start = new Date(startDate as string);
        const end = new Date(endDate as string);

        const googleTokens = userTokens.get(`google_${userId}`);
        const outlookTokens = userTokens.get(`outlook_${userId}`);

        const results = {
          events: [] as any[],
          sources: [] as string[],
          errors: [] as string[],
        };

        // Buscar eventos do Google Calendar
        if (googleTokens) {
          try {
            const googleService = createGoogleCalendarService();
            googleService.setTokens(googleTokens);
            const googleEvents = await googleService.getEventsInRange(
              start,
              end
            );

            const formattedEvents = googleEvents.map((event) => ({
              id: `google_${event.id}`,
              title: event.summary,
              description: event.description,
              start: new Date(event.start.dateTime),
              end: new Date(event.end.dateTime),
              source: "google",
              type: "synced",
              originalId: event.id,
            }));

            results.events.push(...formattedEvents);
            results.sources.push("google");
          } catch (error: any) {
            results.errors.push(`Google Calendar: ${error.message}`);
          }
        }

        // Buscar eventos do Outlook Calendar
        if (outlookTokens) {
          try {
            const outlookService = createOutlookCalendarService();
            outlookService.setAccessToken(outlookTokens.accessToken);
            const outlookEvents = await outlookService.getEventsInRange(
              start,
              end
            );

            const formattedEvents = outlookEvents.map((event) => ({
              id: `outlook_${event.id}`,
              title: event.subject,
              description: event.body?.content,
              start: new Date(event.start.dateTime),
              end: new Date(event.end.dateTime),
              source: "outlook",
              type: "synced",
              originalId: event.id,
            }));

            results.events.push(...formattedEvents);
            results.sources.push("outlook");
          } catch (error: any) {
            results.errors.push(`Outlook Calendar: ${error.message}`);
          }
        }

        res.json({
          success: true,
          events: results.events,
          sources: results.sources,
          errors: results.errors,
          period: { startDate, endDate },
        });
      } catch (error: any) {
        console.error("Erro ao buscar eventos por período:", error);
        res.status(500).json({
          success: false,
          message: "Falha ao buscar eventos por período",
          error: error.message,
        });
      }
    }
  );
}
