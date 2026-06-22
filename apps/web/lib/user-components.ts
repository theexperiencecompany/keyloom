"use client";
/**
 * Client-side store for the user's forked components ("My Projects").
 *
 * This is the STORAGE SEAM. Today it's localStorage so the feature works
 * end-to-end without backend work; the public functions below are the exact
 * surface a future DB-backed implementation (the `user_components` table +
 * `/api/components` routes) will replace — callers won't change.
 */

export type UserComponent = {
  /** `custom:`-prefixed id; also the clip.compositionId that references it. */
  id: string;
  /** Composition this was forked from, e.g. "TweetCard". */
  baseId: string;
  /** Display name. */
  name: string;
  /** Editable TSX source. */
  code: string;
  /** Expected named export (defaults to baseId). */
  exportName?: string;
  createdAt: number;
  updatedAt: number;
};

const KEY = "keyloom-user-components-v1";

function read(): UserComponent[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? (parsed as UserComponent[]) : [];
  } catch {
    return [];
  }
}

function write(list: UserComponent[]): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(list));
  } catch {
    // storage disabled / quota — silent (matches studio layout persistence)
  }
}

export function listUserComponents(): UserComponent[] {
  return read().sort((a, b) => b.updatedAt - a.updatedAt);
}

export function getUserComponent(id: string): UserComponent | undefined {
  return read().find((c) => c.id === id);
}

/** Insert or update by id. */
export function saveUserComponent(component: UserComponent): void {
  const list = read();
  const idx = list.findIndex((c) => c.id === component.id);
  if (idx >= 0) list[idx] = component;
  else list.push(component);
  write(list);
}

export function removeUserComponent(id: string): void {
  write(read().filter((c) => c.id !== id));
}
