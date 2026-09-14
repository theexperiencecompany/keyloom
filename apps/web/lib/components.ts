import { and, desc, eq } from "drizzle-orm";
import { getDb } from "./db";
import { type UserComponentRow, userComponents, users } from "./db/schema";

export type CreateComponentInput = {
  name: string;
  baseId: string;
  code: string;
  exportName?: string | null;
};

export type UpdateComponentPatch = {
  name?: string;
  code?: string;
};

/**
 * Ensure the `users` row exists — it is the FK target for `user_components`.
 * Idempotent; call before inserting a fork for a user.
 */
export async function ensureUserRow(
  userId: string,
  email: string,
): Promise<void> {
  await getDb()
    .insert(users)
    .values({ id: userId, email })
    .onConflictDoNothing();
}

/** All of a user's forked components, newest-edited first. */
export function listComponents(userId: string): Promise<UserComponentRow[]> {
  return getDb()
    .select()
    .from(userComponents)
    .where(eq(userComponents.userId, userId))
    .orderBy(desc(userComponents.updatedAt));
}

/** One component, scoped to its owner (returns null if not theirs). */
export async function getComponent(
  userId: string,
  id: string,
): Promise<UserComponentRow | null> {
  const rows = await getDb()
    .select()
    .from(userComponents)
    .where(and(eq(userComponents.id, id), eq(userComponents.userId, userId)))
    .limit(1);
  return rows[0] ?? null;
}

export async function createComponent(
  userId: string,
  input: CreateComponentInput,
): Promise<UserComponentRow> {
  const [row] = await getDb()
    .insert(userComponents)
    .values({
      userId,
      name: input.name,
      baseId: input.baseId,
      code: input.code,
      exportName: input.exportName ?? null,
    })
    .returning();
  if (!row) throw new Error("Failed to create component");
  return row;
}

export async function updateComponent(
  userId: string,
  id: string,
  patch: UpdateComponentPatch,
): Promise<UserComponentRow | null> {
  const rows = await getDb()
    .update(userComponents)
    .set({ ...patch, updatedAt: new Date() })
    .where(and(eq(userComponents.id, id), eq(userComponents.userId, userId)))
    .returning();
  return rows[0] ?? null;
}

export async function deleteComponent(
  userId: string,
  id: string,
): Promise<void> {
  await getDb()
    .delete(userComponents)
    .where(and(eq(userComponents.id, id), eq(userComponents.userId, userId)));
}
