import dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Carrega variáveis do arquivo .env
dotenv.config();

// Configuração SSL apenas para desenvolvimento
if (process.env.NODE_ENV === "development") {
  // Ignorar verificação SSL APENAS em desenvolvimento
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = "0";
  neonConfig.pipelineTLS = false;
}

// Configuração WebSocket
neonConfig.webSocketConstructor = ws;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?"
  );
}

export const pool = new Pool({ connectionString: process.env.DATABASE_URL });
export const db = drizzle({ client: pool, schema });
