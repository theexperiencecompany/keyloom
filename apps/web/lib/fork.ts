"use client";
/**
 * Fork helpers: turn a built-in composition into an editable user copy, and
 * hand a project off to the studio.
 */
import type { Project } from "@workspace/compositions/project";
import { compositionsById } from "@workspace/compositions/registry";
import { compositionSources } from "./generated-sources";
import type { NewUserComponent, UserComponent } from "./user-components";

function clipId(): string {
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID().slice(0, 8);
  }
  return Math.random().toString(36).slice(2, 10);
}

/**
 * Build the payload for a new fork of a built-in composition by copying its
 * source. The server assigns the id; returns null if the base id is unknown or
 * has no captured source. Persist via `createUserComponent`.
 */
export function forkPayload(baseId: string): NewUserComponent | null {
  const source = compositionSources[baseId]?.component;
  const info = compositionsById[baseId];
  if (!source || !info) return null;
  return {
    baseId,
    name: `${info.title} (copy)`,
    code: source,
    exportName: baseId,
  };
}

/** Build a single-clip studio project that renders the given fork. */
export function forkToProject(fork: UserComponent): Project {
  const info = compositionsById[fork.baseId];
  return {
    name: fork.name,
    fps: info?.fps ?? 60,
    width: info?.width ?? 1920,
    height: info?.height ?? 1080,
    clips: [
      {
        id: clipId(),
        compositionId: fork.id,
        props: { ...((info?.defaultProps as Record<string, unknown>) ?? {}) },
        durationInFrames: info?.durationInFrames ?? 150,
      },
    ],
    customComponents: {
      [fork.id]: {
        baseId: fork.baseId,
        name: fork.name,
        code: fork.code,
        ...(fork.exportName ? { exportName: fork.exportName } : {}),
      },
    },
  };
}

/**
 * One-shot handoff to the studio: stash a project in localStorage, then the
 * caller navigates to /studio, where the Builder loads + clears it on mount.
 * Used for forks, whose source code is too large for a URL param.
 */
const STUDIO_OPEN_KEY = "keyloom-studio-open";

export function stashStudioProject(project: Project): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(STUDIO_OPEN_KEY, JSON.stringify(project));
  } catch {
    // storage disabled — the studio just opens empty.
  }
}

/** Read + clear the stashed project (called once by the studio on mount). */
export function takeStashedStudioProject(): Project | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(STUDIO_OPEN_KEY);
    if (!raw) return null;
    window.localStorage.removeItem(STUDIO_OPEN_KEY);
    return JSON.parse(raw) as Project;
  } catch {
    return null;
  }
}
