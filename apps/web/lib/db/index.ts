import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error("DATABASE_URL is not set (Neon Postgres connection string).");
}

const sql = neon(connectionString);

/** Drizzle client over Neon's serverless HTTP driver — safe in Vercel/edge. */
export const db = drizzle(sql, { schema });

export * from "./schema";
