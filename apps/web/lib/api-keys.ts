import { createHash, randomBytes } from "node:crypto";
import { and, eq } from "drizzle-orm";
import {
  type ApiKey,
  apiKeys,
  db,
  type Subscription,
  subscriptions,
  type User,
  users,
} from "./db";

const KEY_PREFIX = "kl_live_";

/** A freshly minted key. `fullKey` is shown to the user ONCE; only `keyHash`
 *  and `prefix` are persisted. */
export type GeneratedKey = {
  fullKey: string;
  prefix: string;
  keyHash: string;
};

export function generateApiKey(): GeneratedKey {
  const secret = randomBytes(24).toString("base64url");
  const fullKey = `${KEY_PREFIX}${secret}`;
  return {
    fullKey,
    prefix: fullKey.slice(0, KEY_PREFIX.length + 4), // e.g. "kl_live_AbC1"
    keyHash: hashKey(fullKey),
  };
}

export function hashKey(fullKey: string): string {
  return createHash("sha256").update(fullKey).digest("hex");
}

export type AuthenticatedKey = {
  user: User;
  subscription: Subscription | null;
  apiKey: ApiKey;
};

/**
 * Resolves a raw `kl_live_…` key to its owner + subscription, or null when the
 * key is malformed, unknown, or revoked. Used by the hosted MCP route to gate
 * every request.
 */
export async function authenticateApiKey(
  fullKey: string | null | undefined,
): Promise<AuthenticatedKey | null> {
  if (!fullKey?.startsWith(KEY_PREFIX)) return null;

  const rows = await db
    .select({ apiKey: apiKeys, user: users, subscription: subscriptions })
    .from(apiKeys)
    .innerJoin(users, eq(users.id, apiKeys.userId))
    .leftJoin(subscriptions, eq(subscriptions.userId, apiKeys.userId))
    .where(
      and(eq(apiKeys.keyHash, hashKey(fullKey)), eq(apiKeys.revoked, false)),
    )
    .limit(1);

  const row = rows[0];
  if (!row) return null;

  // Best-effort last-used stamp; never block auth on it.
  void db
    .update(apiKeys)
    .set({ lastUsedAt: new Date() })
    .where(eq(apiKeys.id, row.apiKey.id))
    .catch(() => {});

  return { user: row.user, subscription: row.subscription, apiKey: row.apiKey };
}
