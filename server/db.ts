import dotenv from "dotenv";
import { Pool, neonConfig } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-serverless";
import ws from "ws";
import * as schema from "@shared/schema";

// Carrega variáveis do arquivo .env
dotenv.config();

neonConfig.webSocketConstructor = ws;

// Use environment DATABASE_URL directly
const DATABASE_URL =
  process.env.DATABASE_URL ||
  "postgresql://postgres:password@helium/heliumdb?sslmode=disable";

export const pool = new Pool({ connectionString: DATABASE_URL });
export const db = drizzle({ client: pool, schema });
