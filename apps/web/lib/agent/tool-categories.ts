import {
  BrushIcon,
  DeleteIcon,
  EditIcon,
  PlusSignIcon,
  SearchIcon,
  SparklesIcon,
  ToolsIcon,
  VideoReplayIcon,
  WorkflowCircleIcon,
} from "@hugeicons/core-free-icons";
import type { IconSvgElement } from "@hugeicons/react";

/**
 * Motion-Studio tool category map for the agent panel's ToolCallsSection.
 *
 * Each studio agent tool maps to a category (build / discovery / edit /
 * style / delete / list). The ToolCallsSection stacks one icon per
 * *unique* category, so picking a small, coherent palette here keeps the
 * collapsed header readable instead of becoming a wall of icons.
 *
 * Shape mirrors the gaia tool-icons registry — `icon` is a HugeIcons
 * IconSvgElement, plus a paired bg/icon color so each chip stays visually
 * distinct against the muted bubble background.
 */

export type IconConfig = {
  icon: IconSvgElement;
  bgClass: string;
  iconClass: string;
};

const CATEGORY_ICONS: Record<string, IconConfig> = {
  build: {
    icon: WorkflowCircleIcon,
    bgClass: "bg-violet-500/20",
    iconClass: "text-violet-300",
  },
  discovery: {
    icon: SearchIcon,
    bgClass: "bg-indigo-500/20",
    iconClass: "text-indigo-300",
  },
  edit: {
    icon: EditIcon,
    bgClass: "bg-emerald-500/20",
    iconClass: "text-emerald-300",
  },
  add: {
    icon: PlusSignIcon,
    bgClass: "bg-sky-500/20",
    iconClass: "text-sky-300",
  },
  style: {
    icon: BrushIcon,
    bgClass: "bg-pink-500/20",
    iconClass: "text-pink-300",
  },
  delete: {
    icon: DeleteIcon,
    bgClass: "bg-red-500/20",
    iconClass: "text-red-300",
  },
  list: {
    icon: VideoReplayIcon,
    bgClass: "bg-amber-500/20",
    iconClass: "text-amber-300",
  },
  general: {
    icon: ToolsIcon,
    bgClass: "bg-zinc-500/20",
    iconClass: "text-zinc-300",
  },
  agent: {
    icon: SparklesIcon,
    bgClass: "bg-fuchsia-500/20",
    iconClass: "text-fuchsia-300",
  },
};

/**
 * Maps every tool the agent can call to a category. Keep in sync with
 * `lib/agent/tools.ts`.
 *
 * Each entry pairs a tool name with:
 *   - category: one of CATEGORY_ICONS keys above (drives the icon/color)
 *   - message:  what to render as the per-call label in the expanded view
 *               (a verb phrase, not the function name)
 */
type ToolMapEntry = {
  category: keyof typeof CATEGORY_ICONS;
  message: (input: Record<string, unknown>) => string;
};

const TOOL_MAP: Record<string, ToolMapEntry> = {
  buildProject: {
    category: "build",
    message: () => "Built the project",
  },
  clearProject: {
    category: "delete",
    message: () => "Cleared the timeline",
  },
  listScenesInCategory: {
    category: "discovery",
    message: (input) => `Browsed ${String(input.category ?? "scene")} scenes`,
  },
  getSceneDetails: {
    category: "discovery",
    message: (input) => `Inspected ${String(input.compositionId ?? "scene")}`,
  },
  listClips: {
    category: "list",
    message: () => "Read the timeline",
  },
  addClip: {
    category: "add",
    message: (input) => `Added ${String(input.compositionId ?? "clip")}`,
  },
  updateClipProps: {
    category: "edit",
    message: () => "Updated clip content",
  },
  updateClipStyle: {
    category: "style",
    message: () => "Restyled a clip",
  },
  updateClipDuration: {
    category: "edit",
    message: (input) => `Set duration to ${input.durationInFrames ?? "?"}f`,
  },
  deleteClip: {
    category: "delete",
    message: () => "Removed a clip",
  },
};

export function getToolMeta(toolName: string): {
  category: string;
  message: string;
  rawCategory: keyof typeof CATEGORY_ICONS;
} {
  const entry = TOOL_MAP[toolName];
  if (!entry) {
    return {
      category: "general",
      rawCategory: "general",
      message: formatToolName(toolName),
    };
  }
  return {
    category: entry.category,
    rawCategory: entry.category,
    message: entry.message({}),
  };
}

export function toolMessageFor(
  toolName: string,
  input: Record<string, unknown>,
): string {
  const entry = TOOL_MAP[toolName];
  if (!entry) return formatToolName(toolName);
  return entry.message(input);
}

export function getCategoryIcon(category: string): IconConfig {
  return CATEGORY_ICONS[category] ?? CATEGORY_ICONS.general!;
}

export function formatToolName(name: string): string {
  return name
    .replace(/([A-Z])/g, " $1")
    .replace(/_/g, " ")
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase());
}
