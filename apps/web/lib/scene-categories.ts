import type { CompositionCategory } from "@workspace/compositions/schema";

/** Creator-facing names and signature colors for each scene category. */
export const CATEGORY_LABELS: Record<CompositionCategory, string> = {
  text: "Text",
  social: "Social Media",
  data: "Charts & Data",
  devtools: "Dev Tools",
  marketing: "Marketing",
  layout: "Frames & Mockups",
  captions: "Captions",
  media: "Media",
  background: "Backgrounds",
};

export const CATEGORY_ORDER = Object.keys(
  CATEGORY_LABELS,
) as CompositionCategory[];

export const CATEGORY_COLORS: Record<CompositionCategory, string> = {
  text: "#8b5cf6",
  social: "#ec4899",
  data: "#06b6d4",
  devtools: "#22c55e",
  marketing: "#f59e0b",
  layout: "#64748b",
  captions: "#f43f5e",
  media: "#3b82f6",
  background: "#a1a1aa",
};
