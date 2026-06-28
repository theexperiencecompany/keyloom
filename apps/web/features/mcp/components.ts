import {
  compositions,
  compositionsById,
} from "@workspace/compositions/registry";
import { isAgentVisible } from "@/lib/agent/catalog";
import { resolveCompositionMeta } from "@/lib/composition-meta";
import type { McpComponentSchema, McpComponentSummary } from "./types";

/**
 * Every component the MCP server exposes. Mirrors the studio agent's visibility
 * (`isAgentVisible`) so internal/hidden scenes stay out of the public surface.
 */
export function listComponents(): McpComponentSummary[] {
  return compositions.filter((c) => isAgentVisible(c.id)).map(toSummary);
}

/**
 * Full field contract + defaults + natural dimensions for one component, or
 * null when the id is unknown / not exposed. This is what lets the MCP client's
 * model fill the props correctly before rendering.
 */
export function getComponentSchema(id: string): McpComponentSchema | null {
  if (!isAgentVisible(id)) return null;
  const info = compositionsById[id];
  if (!info) return null;
  // Report the RESOLVED metadata for the default props (runs calculateMetadata),
  // so content-driven compositions show their real default length/dimensions
  // instead of the short static registry fallback.
  const meta = resolveCompositionMeta(info);
  return {
    ...toSummary(info),
    fps: meta.fps,
    width: meta.width,
    height: meta.height,
    durationInFrames: meta.durationInFrames,
    agentNotes: info.agentNotes,
    fields: info.fields,
    defaultProps: info.defaultProps as Record<string, unknown>,
  };
}

type Info = (typeof compositions)[number];

function toSummary(info: Info): McpComponentSummary {
  return {
    id: info.id,
    title: info.title,
    description: info.description,
    category: info.category,
    brandLocked: false,
  };
}
