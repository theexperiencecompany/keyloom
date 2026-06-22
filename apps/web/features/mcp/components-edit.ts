import { validateComponentSource } from "@workspace/compositions/dynamic/validate";
import { compositionsById } from "@workspace/compositions/registry";
import {
  createComponent,
  getComponent,
  listComponents,
  updateComponent,
} from "@/lib/components";
import { compositionSources } from "@/lib/generated-sources";

/**
 * MCP-facing fork/edit operations. These let an external agent (Claude Code,
 * Cursor, …) copy a built-in component and rewrite its code over MCP, scoped to
 * the API key's owner. Reuses the same DB service the web app uses.
 */

/** Fork a built-in composition into an editable, user-owned copy. */
export async function forkComponent(
  userId: string,
  baseId: string,
  name?: string,
) {
  const source = compositionSources[baseId]?.component;
  const info = compositionsById[baseId];
  if (!source || !info) return null;
  const row = await createComponent(userId, {
    baseId,
    name: name?.trim() || `${info.title} (copy)`,
    code: source,
    exportName: baseId,
  });
  return { id: row.id, name: row.name, baseId: row.baseId, code: row.code };
}

/**
 * Read the current source of a component — a user's fork (from the DB) or, as a
 * fallback, a built-in composition's captured source.
 */
export async function readComponentCode(userId: string, id: string) {
  const fork = await getComponent(userId, id);
  if (fork) {
    return {
      id: fork.id,
      baseId: fork.baseId,
      kind: "fork" as const,
      code: fork.code,
    };
  }
  const builtin = compositionSources[id]?.component;
  if (builtin) {
    return { id, baseId: id, kind: "builtin" as const, code: builtin };
  }
  return null;
}

/** Replace a fork's source after validating it transpiles. */
export async function writeComponentCode(
  userId: string,
  id: string,
  code: string,
) {
  const v = validateComponentSource(code);
  if (!v.ok) return { ok: false as const, error: v.error };
  const row = await updateComponent(userId, id, { code });
  if (!row) {
    return {
      ok: false as const,
      error: `No editable component "${id}". Fork one first with fork_component.`,
    };
  }
  return { ok: true as const, id: row.id };
}

/** List the user's forked components. */
export async function listUserForks(userId: string) {
  const rows = await listComponents(userId);
  return rows.map((r) => ({
    id: r.id,
    name: r.name,
    baseId: r.baseId,
    updatedAt: r.updatedAt,
  }));
}
