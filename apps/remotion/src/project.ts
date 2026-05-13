import type { ClipStyle } from "./clip-style";
import type { ClipEffect } from "./effects/schema";
import type { SceneTransition } from "./transitions";

export type Clip = {
  id: string;
  compositionId: string;
  props: Record<string, unknown>;
  durationInFrames: number;
  effects?: ClipEffect[];
  /** Universal visual overrides — see `clip-style.ts`. */
  style?: ClipStyle;
  /**
   * How this clip enters from the previous one. The first
   * transition.durationInFrames frames play the transition. See
   * `transitions.ts`. First clip defaults to no transition; subsequent clips
   * default to a fade.
   */
  transition?: SceneTransition;
};

export type Project = {
  fps: number;
  width: number;
  height: number;
  clips: Clip[];
};

export const DEFAULT_PROJECT: Project = {
  fps: 60,
  width: 1920,
  height: 1080,
  clips: [],
};

export function projectDuration(project: Project): number {
  return Math.max(
    1,
    project.clips.reduce((sum, c) => sum + c.durationInFrames, 0),
  );
}
