import { featureTease10s } from "./feature-tease-10s";
import { productLaunch20s } from "./product-launch-20s";
import { tutorial30s } from "./tutorial-30s";
import type { Template } from "./types";

/**
 * Source of truth for video templates. Add a new template by creating
 * its file, importing it, and pushing it onto the array.
 *
 * Templates are how the agent reliably hits "make me a 20-second
 * video" — duration is pinned by the slot list, narrative is pinned
 * by the slot roles, and the agent only has to pick scenes per slot
 * (plus optionally a project-wide style).
 *
 * Add free-form `buildProject` is still available for asks that don't
 * match any template.
 */
export const TEMPLATES: Template[] = [
  featureTease10s,
  productLaunch20s,
  tutorial30s,
];

export const TEMPLATES_BY_ID: Record<string, Template> = Object.fromEntries(
  TEMPLATES.map((t) => [t.id, t]),
);

export * from "./types";
