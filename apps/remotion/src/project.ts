import type { ClipStyle } from "./clip-style";
import type { ClipEffect } from "./effects/schema";
import {
  DEFAULT_SCENE_TRANSITION,
  normalizeSceneTransition,
  resolveTransition,
  type SceneTransition,
} from "./transitions";

export type Clip = {
  id: string;
  compositionId: string;
  props: Record<string, unknown>;
  durationInFrames: number;
  effects?: ClipEffect[];
  /** Universal visual overrides — see `clip-style.ts`. */
  style?: ClipStyle;
  /**
   * How this clip enters from the previous one. The transition window
   * overlaps the tail of the previous clip with the head of this one, so
   * both are visible simultaneously (no black flash between backgrounds).
   * First clip ignores transitions; non-first clips fall back to the
   * project's `defaultTransition`, then `DEFAULT_SCENE_TRANSITION`.
   */
  transition?: SceneTransition;
};

export type Project = {
  fps: number;
  width: number;
  height: number;
  clips: Clip[];
  /**
   * Project-level transition applied to every non-first clip that doesn't
   * set its own override. Lets the user pick a global "look" (all fades, or
   * all slides) once instead of per-clip.
   */
  defaultTransition?: SceneTransition;
};

export const DEFAULT_PROJECT: Project = {
  fps: 60,
  width: 1920,
  height: 1080,
  clips: [],
  defaultTransition: DEFAULT_SCENE_TRANSITION,
};

/**
 * Total duration accounting for transition overlap. Each non-first
 * transition steals `durationInFrames` from the timeline because the two
 * adjacent clips render simultaneously during the transition window.
 */
export function projectDuration(project: Project): number {
  let total = 0;
  for (let i = 0; i < project.clips.length; i++) {
    const clip = project.clips[i];
    if (!clip) continue;
    total += clip.durationInFrames;
    if (i > 0) {
      const prev = project.clips[i - 1];
      const t = resolveTransition({
        clipTransition: clip.transition,
        projectDefault: project.defaultTransition,
        index: i,
      });
      const maxOverlap = Math.min(
        prev?.durationInFrames ?? t.durationInFrames,
        clip.durationInFrames,
      );
      total -= Math.min(t.durationInFrames, maxOverlap);
    }
  }
  return Math.max(1, total);
}

export { normalizeSceneTransition };
