import { and, desc, eq } from "drizzle-orm";
import { db } from "./db";
import { type UserComponentRow, userComponents } from "./db/schema";

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

/** All of a user's forked components, newest-edited first. */
export function listComponents(userId: string): Promise<UserComponentRow[]> {
  return db
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
  const rows = await db
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
  const rows = await db
    .insert(userComponents)
    .values({
      userId,
      name: input.name,
      baseId: input.baseId,
      code: input.code,
      exportName: input.exportName ?? null,
    })
    .returning();
  // biome-ignore lint/style/noNonNullAssertion: insert().returning() yields the row
  return rows[0]!;
}

export async function updateComponent(
  userId: string,
  id: string,
  patch: UpdateComponentPatch,
): Promise<UserComponentRow | null> {
  const rows = await db
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
  await db
    .delete(userComponents)
    .where(and(eq(userComponents.id, id), eq(userComponents.userId, userId)));
}
