import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import * as schema from "@shared/schema";
import "dotenv/config";

const { Pool } = pg;

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL must be set. Did you forget to provision a database?",
  );
}

const getPoolConfig = () => {
  const config: any = {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false }
  };

  if (process.env.DATABASE_URL?.includes('pooler.supabase.com')) {
    try {
      const url = new URL(process.env.DATABASE_URL);
      config.user = decodeURIComponent(url.username);
      config.password = decodeURIComponent(url.password);
      config.host = url.hostname;
      config.port = parseInt(url.port);
      config.database = url.pathname.slice(1);
      delete config.connectionString;
    } catch (e) {
      console.error("Failed to parse DATABASE_URL");
    }
  }
  return config;
};

export const pool = new Pool(getPoolConfig());
export const db = drizzle(pool, { schema });