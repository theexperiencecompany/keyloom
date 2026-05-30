import type { ClipStyle } from "@workspace/compositions/clip-style";
import type { CompositionCategory } from "@workspace/compositions/schema";
import type { SceneTransition } from "@workspace/compositions/transitions";

/**
 * One slot in a video template — a narrative beat (hook, demo, close)
 * with a fixed category and duration. The agent picks one scene from
 * the slot's category and fills its props; it cannot change the slot's
 * category, duration, or position in the timeline.
 *
 * Pinning duration here is the whole point of templates: it makes
 * "20s ask becomes 8s build" impossible. The total is the sum of
 * every slot's `durationInFrames` (minus transition overlaps).
 */
export type TemplateSlot = {
  /** Slot identifier, unique within a template ("hook", "demo-1"). */
  id: string;
  /** Human-readable role for UI / agent guidance ("Opening hook"). */
  role: string;
  /** Picked scene must be in this category. */
  category: CompositionCategory;
  /** Fixed duration the picked scene will run for. */
  durationInFrames: number;
  /**
   * Free-text guidance shown to the agent when it chooses a scene for
   * this slot ("Short, snappy. Title-card vibe, 2-4 word headline").
   */
  description: string;
};

export type Template = {
  /** Stable id — e.g. "product-launch-20s". */
  id: string;
  /** Display name ("Product launch · 20s"). */
  name: string;
  /** One-line description shown in `listTemplates`. */
  description: string;
  /** When to pick this template (criteria the agent reads). */
  whenToUse: string;
  /** Project fps. Templates pin fps so durations are concrete. */
  fps: number;
  width: number;
  height: number;
  /**
   * Slot list in playback order. The total project duration is the
   * sum of slot durations (transition overlaps are handled by the
   * builder).
   */
  slots: TemplateSlot[];
  /** Shared transition between slots. Default fade if omitted. */
  defaultTransition?: SceneTransition;
};

/**
 * Total runtime if no transitions overlap. Real runtime is slightly
 * less because each non-first transition steals a few frames.
 */
export function templateDurationInFrames(t: Template): number {
  return t.slots.reduce((sum, s) => sum + s.durationInFrames, 0);
}

/** Slot pick the agent submits via the `buildFromTemplate` tool. */
export type TemplateSlotPick = {
  slotId: string;
  compositionId: string;
  props: Record<string, unknown>;
};

/**
 * Shared style applied to every non-brand-locked clip in the resulting
 * project. Keeps the visual palette consistent across slots — the
 * agent decides this once, not per clip.
 */
export type TemplateStyle = ClipStyle;
