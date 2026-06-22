import {
  compositions,
  compositionsById,
} from "@workspace/compositions/registry";
import { isAgentVisible } from "@/lib/agent/catalog";
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
  return {
    ...toSummary(info),
    fps: info.fps,
    width: info.width,
    height: info.height,
    durationInFrames: info.durationInFrames,
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
