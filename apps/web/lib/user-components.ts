"use client";
/**
 * Client access to the user's forked components, backed by the DB through
 * `/api/components` (scoped to the signed-in WorkOS user). The component `id`
 * is assigned by the server and is also the clip.compositionId used inside a
 * project's `customComponents`.
 */

export type UserComponent = {
  id: string;
  baseId: string;
  name: string;
  code: string;
  exportName?: string | null;
  createdAt: string;
  updatedAt: string;
};

export type NewUserComponent = {
  baseId: string;
  name: string;
  code: string;
  exportName?: string | null;
};

export async function listUserComponents(): Promise<UserComponent[]> {
  const res = await fetch("/api/components");
  if (!res.ok) return [];
  return (await res.json()) as UserComponent[];
}

export async function getUserComponent(
  id: string,
): Promise<UserComponent | null> {
  const res = await fetch(`/api/components/${encodeURIComponent(id)}`);
  if (!res.ok) return null;
  return (await res.json()) as UserComponent;
}

export async function createUserComponent(
  input: NewUserComponent,
): Promise<UserComponent | null> {
  const res = await fetch("/api/components", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(input),
  });
  if (!res.ok) return null;
  return (await res.json()) as UserComponent;
}

export async function updateUserComponent(
  id: string,
  patch: { name?: string; code?: string },
): Promise<void> {
  await fetch(`/api/components/${encodeURIComponent(id)}`, {
    method: "PATCH",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(patch),
  });
}

export async function removeUserComponent(id: string): Promise<void> {
  await fetch(`/api/components/${encodeURIComponent(id)}`, {
    method: "DELETE",
  });
}
