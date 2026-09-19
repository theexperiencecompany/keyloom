import type { Project } from "@workspace/compositions/project";
import { parseProjectJson } from "@/features/studio/lib/project-io";

const KEY = "keyloom-scene-preview";

/** Tab-local transfer, read only when Studio is opened with ?from=showcase. */
export function storeSceneProject(storage: Storage, project: Project): void {
  // Let the caller report storage failures before navigating away from edits.
  storage.setItem(KEY, JSON.stringify(project));
}

export function takeSceneProject(storage: Storage): Project | null {
  const raw = storage.getItem(KEY);
  if (!raw) return null;
  storage.removeItem(KEY);
  const result = parseProjectJson(raw);
  return result.ok && result.warnings.length === 0 ? result.project : null;
}
