import { neon } from "@neondatabase/serverless";
import { drizzle } from "drizzle-orm/neon-http";
import * as schema from "./schema";

type Db = ReturnType<typeof drizzle<typeof schema>>;

let client: Db | null = null;

/**
 * Drizzle client over Neon's serverless HTTP driver — safe in Vercel/edge.
 *
 * Created lazily on first use so that importing this module (directly or via
 * `lib/components.ts`) never requires `DATABASE_URL` at module load. Only the
 * forks feature talks to the database; every other surface (/captions, /memes,
 * /split, /studio) must keep working without a database configured.
 */
export function getDb(): Db {
  if (client) return client;
  const connectionString = process.env.DATABASE_URL?.trim();
  if (!connectionString) {
    throw new Error(
      "DATABASE_URL is not set (Neon Postgres connection string). It is required for saving and loading forked components.",
    );
  }
  client = drizzle(neon(connectionString), { schema });
  return client;
}

export * from "./schema";
