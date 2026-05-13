/**
 * Inter-clip transitions. A transition describes how a clip ENTERS from the
 * previous one — the first N frames of the clip play the transition effect.
 *
 * Skipped automatically for the first clip in a project (nothing to come
 * from) unless explicitly set to "fade".
 */
export type SceneTransitionKind =
  | "none"
  | "fade"
  | "swipe-left"
  | "swipe-right"
  | "swipe-up"
  | "swipe-down"
  | "zoom-in"
  | "zoom-out";

export type SceneTransition = {
  kind: SceneTransitionKind;
  /** Length of the transition in frames. Clamped to the clip duration. */
  durationInFrames: number;
};

export const DEFAULT_SCENE_TRANSITION: SceneTransition = {
  kind: "fade",
  durationInFrames: 14,
};

export const SCENE_TRANSITION_OPTIONS: Array<{
  value: SceneTransitionKind;
  label: string;
}> = [
  { value: "none", label: "None (hard cut)" },
  { value: "fade", label: "Fade" },
  { value: "swipe-left", label: "Swipe left" },
  { value: "swipe-right", label: "Swipe right" },
  { value: "swipe-up", label: "Swipe up" },
  { value: "swipe-down", label: "Swipe down" },
  { value: "zoom-in", label: "Zoom in" },
  { value: "zoom-out", label: "Zoom out" },
];
