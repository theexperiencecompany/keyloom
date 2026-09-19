import type { ClipStyle } from "@workspace/compositions/clip-style";

/**
 * One-click color looks for the scene showcase. Each look sets the three
 * universal clip colors; "Original" clears them so the scene keeps its own
 * palette. Fonts and curated themes are handled separately.
 */
export type SceneLook = {
  id: string;
  label: string;
  style: Pick<ClipStyle, "backgroundColor" | "textColor" | "accentColor">;
};

export const ORIGINAL_LOOK_ID = "original";

export const SCENE_LOOKS: SceneLook[] = [
  { id: ORIGINAL_LOOK_ID, label: "Original", style: {} },
  {
    id: "midnight",
    label: "Midnight",
    style: {
      backgroundColor: "#0b0b10",
      textColor: "#f5f5f7",
      accentColor: "#8b93ff",
    },
  },
  {
    id: "paper",
    label: "Paper",
    style: {
      backgroundColor: "#f6f1e7",
      textColor: "#1c1917",
      accentColor: "#c2410c",
    },
  },
  {
    id: "ocean",
    label: "Ocean",
    style: {
      backgroundColor: "#062a3f",
      textColor: "#e6f6ff",
      accentColor: "#22d3ee",
    },
  },
  {
    id: "blush",
    label: "Blush",
    style: {
      backgroundColor: "#fff1f2",
      textColor: "#4c0519",
      accentColor: "#e11d48",
    },
  },
  {
    id: "forest",
    label: "Forest",
    style: {
      backgroundColor: "#0f2a1f",
      textColor: "#ecfdf5",
      accentColor: "#34d399",
    },
  },
  {
    id: "sunset",
    label: "Sunset",
    style: {
      backgroundColor: "#1a0b2e",
      textColor: "#fdf4ff",
      accentColor: "#fb923c",
    },
  },
  {
    id: "lemon",
    label: "Lemon",
    style: {
      backgroundColor: "#fef9c3",
      textColor: "#1c1917",
      accentColor: "#0f766e",
    },
  },
];

/** The look whose colors exactly match `style`, or null when custom. */
export function matchLook(style: ClipStyle | undefined): string | null {
  const bg = style?.backgroundColor ?? "";
  const text = style?.textColor ?? "";
  const accent = style?.accentColor ?? "";
  const hit = SCENE_LOOKS.find(
    (look) =>
      (look.style.backgroundColor ?? "") === bg &&
      (look.style.textColor ?? "") === text &&
      (look.style.accentColor ?? "") === accent,
  );
  return hit ? hit.id : null;
}
