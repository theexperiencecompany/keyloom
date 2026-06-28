import { and, eq, lt, sql } from "drizzle-orm";
import { generateApiKey } from "./api-keys";
import { findActiveDodoSubscription, PLANS } from "./billing";
import {
  type ApiKey,
  apiKeys,
  db,
  type Subscription,
  subscriptions,
  type User,
  users,
} from "./db";

/** Free-tier defaults applied on first sign-in (before any Dodo subscription). */
const FREE_PLAN = { plan: "free", renderQuota: 3 } as const;

/**
 * Ensure just the `users` row exists — a single round-trip. Use for paths that
 * only need the FK target (e.g. saving a forked component), not the full
 * subscription provisioning that `ensureAccount` does.
 */
export async function ensureUserRow(
  userId: string,
  email: string,
): Promise<void> {
  await db.insert(users).values({ id: userId, email }).onConflictDoNothing();
}

/** Upsert the signed-in WorkOS user, and ensure they have a subscription row
 *  (free tier on first sight). Idempotent — safe to call on every sign-in. */
export async function ensureAccount(
  userId: string,
  email: string,
): Promise<void> {
  await db
    .insert(users)
    .values({ id: userId, email })
    .onConflictDoUpdate({ target: users.id, set: { email } });

  const existing = await getSubscription(userId);
  if (!existing) {
    await db.insert(subscriptions).values({
      userId,
      status: "active", // free tier is usable immediately
      plan: FREE_PLAN.plan,
      renderQuota: FREE_PLAN.renderQuota,
    });
  }
}

export async function getSubscription(
  userId: string,
): Promise<Subscription | null> {
  const rows = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const rows = await db
    .select()
    .from(users)
    .where(eq(users.email, email))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * Applies a subscription change from a billing webhook. Updates the user's
 * subscription row in place, or inserts one if (unexpectedly) absent. `patch`
 * carries status/plan/quota/period and Dodo ids.
 */
export async function applySubscription(
  userId: string,
  patch: Partial<typeof subscriptions.$inferInsert>,
): Promise<void> {
  const updated = await db
    .update(subscriptions)
    .set({ ...patch, updatedAt: new Date() })
    .where(eq(subscriptions.userId, userId))
    .returning({ id: subscriptions.id });
  if (updated.length === 0) {
    await db.insert(subscriptions).values({ userId, ...patch });
  }
}

export async function listApiKeys(userId: string): Promise<ApiKey[]> {
  return db
    .select()
    .from(apiKeys)
    .where(and(eq(apiKeys.userId, userId), eq(apiKeys.revoked, false)));
}

/** Mints a new key, persists its hash, and returns the full secret ONCE. */
export async function createApiKey(
  userId: string,
  name = "default",
): Promise<{ fullKey: string; prefix: string }> {
  const { fullKey, prefix, keyHash } = generateApiKey();
  await db.insert(apiKeys).values({ userId, name, prefix, keyHash });
  return { fullKey, prefix };
}

export async function revokeApiKey(
  userId: string,
  keyId: string,
): Promise<void> {
  await db
    .update(apiKeys)
    .set({ revoked: true })
    .where(and(eq(apiKeys.id, keyId), eq(apiKeys.userId, userId)));
}

export type ConsumeResult = {
  ok: boolean;
  remaining: number;
  reason?: string;
};

/**
 * Atomically claims one render against the user's quota. Returns ok:false with
 * a reason when there's no active subscription or the quota is exhausted. The
 * `lt(rendersUsed, renderQuota)` guard makes the increment race-safe.
 */
export async function consumeRender(userId: string): Promise<ConsumeResult> {
  const sub = await getSubscription(userId);
  if (!sub) {
    return {
      ok: false,
      remaining: 0,
      reason: "No subscription on this account.",
    };
  }
  if (sub.status !== "active" && sub.status !== "trialing") {
    return {
      ok: false,
      remaining: 0,
      reason: `Subscription is ${sub.status} — renders are paused.`,
    };
  }

  const updated = await db
    .update(subscriptions)
    .set({
      rendersUsed: sql`${subscriptions.rendersUsed} + 1`,
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(subscriptions.id, sub.id),
        lt(subscriptions.rendersUsed, subscriptions.renderQuota),
      ),
    )
    .returning();

  if (updated.length === 0) {
    return {
      ok: false,
      remaining: 0,
      reason: `Render quota reached (${sub.renderQuota}/${sub.renderQuota} this period). Upgrade your plan for more.`,
    };
  }
  const row = updated[0]!;
  return { ok: true, remaining: row.renderQuota - row.rendersUsed };
}

/**
 * Verify-on-return: ask Dodo directly whether this user has an active
 * subscription and upgrade them to Pro if so — so the account page reflects a
 * successful payment immediately, without depending on a webhook. Idempotent
 * and safe to call on every /account load:
 *   - skips the Dodo call entirely if already Pro/active,
 *   - never downgrades here (cancellations come through the webhook),
 *   - resets the usage counter only on the first transition into Pro.
 * Silently no-ops if billing isn't configured or Dodo is unreachable.
 */
export async function reconcileProFromDodo(
  userId: string,
  email: string,
): Promise<void> {
  const current = await getSubscription(userId);
  if (current?.plan === PLANS.pro.plan && current.status === "active") return;

  let active: Awaited<ReturnType<typeof findActiveDodoSubscription>>;
  try {
    active = await findActiveDodoSubscription({ userId, email });
  } catch {
    return; // billing not configured / Dodo unreachable — leave state as-is
  }
  if (!active) return;

  await applySubscription(userId, {
    status: "active",
    plan: PLANS.pro.plan,
    renderQuota: PLANS.pro.renderQuota,
    rendersUsed: 0, // fresh Pro period
    dodoSubscriptionId: active.subscriptionId,
    ...(active.customerId ? { dodoCustomerId: active.customerId } : {}),
    ...(active.periodEnd ? { periodEnd: active.periodEnd } : {}),
  });
}
