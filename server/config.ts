import dotenv from "dotenv";

// Carrega variáveis do arquivo .env
dotenv.config();

export const config = {
  // Configurações do servidor
  // Usa porta 3000 por padrão (local), mas permite override via env (ex: 5000 no Replit)
  port: parseInt(process.env.PORT || "3000"),
  host: process.env.HOST || "0.0.0.0",

  // Trust proxy (1 para Replit que usa proxy/load balancer)
  trustProxy: process.env.TRUST_PROXY
    ? process.env.TRUST_PROXY === "true"
      ? true
      : parseInt(process.env.TRUST_PROXY)
    : 1,

  // URL base da aplicação
  baseUrl:
    process.env.APP_BASE_URL ||
    `http://${process.env.REPL_ID ? "0.0.0.0" : "localhost"}:${
      process.env.PORT || "3000"
    }`,

  // CORS - usa domínio específico do Replit ou localhost
  allowedOrigin:
    process.env.ALLOWED_ORIGIN ||
    (process.env.REPLIT_DEV_DOMAIN
      ? `https://${process.env.REPLIT_DEV_DOMAIN}`
      : `http://localhost:${process.env.PORT || "3000"}`),

  // Google Calendar
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET,
    redirectUri:
      process.env.GOOGLE_REDIRECT_URI ||
      `${
        process.env.APP_BASE_URL ||
        `http://${process.env.REPL_ID ? "0.0.0.0" : "localhost"}:${
          process.env.PORT || "3000"
        }`
      }/api/auth/google/callback`,
  },

  // Ambiente
  isDevelopment: process.env.NODE_ENV !== "production",
  isProduction: process.env.NODE_ENV === "production",
};

// Validação para Google Calendar
export function validateGoogleConfig() {
  if (!config.google.clientId || !config.google.clientSecret) {
    throw new Error(
      "Credenciais do Google Calendar não configuradas. " +
        "Defina GOOGLE_CLIENT_ID e GOOGLE_CLIENT_SECRET nas variáveis de ambiente."
    );
  }
}

export default config;
