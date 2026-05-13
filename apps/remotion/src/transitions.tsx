/**
 * Inter-clip transitions. A transition describes how a clip ENTERS from the
 * previous one — both clips render simultaneously during the transition
 * window so backgrounds blend cleanly (no black flash on white→white cuts).
 *
 * Rendering is delegated to `@remotion/transitions`. This module owns the
 * serializable schema, the mapping to presentations/timings, and the
 * project-default fallback.
 *
 * First clip has no transition (nothing to come from). Project-level
 * `defaultTransition` applies to any non-first clip that doesn't set its
 * own override.
 */
import {
  linearTiming,
  springTiming,
  type TransitionPresentation,
  type TransitionTiming,
} from "@remotion/transitions";
import { clockWipe } from "@remotion/transitions/clock-wipe";
import { fade } from "@remotion/transitions/fade";
import { flip } from "@remotion/transitions/flip";
import { iris } from "@remotion/transitions/iris";
import { slide } from "@remotion/transitions/slide";
import { wipe } from "@remotion/transitions/wipe";
import { Easing } from "remotion";

export type SceneTransitionKind =
  | "none"
  | "fade"
  | "slide"
  | "wipe"
  | "flip"
  | "clock-wipe"
  | "iris"
  | "zoom";

export type TransitionDirection =
  | "from-left"
  | "from-right"
  | "from-top"
  | "from-bottom";

export type TransitionTimingConfig =
  | { kind: "linear" }
  | {
      kind: "spring";
      damping?: number;
      mass?: number;
      stiffness?: number;
    };

export type SceneTransition = {
  kind: SceneTransitionKind;
  /** Length of the transition window in frames. Both clips are visible. */
  durationInFrames: number;
  /** For slide/wipe/flip — which side the incoming clip enters from. */
  direction?: TransitionDirection;
  /** For zoom — push in or pull out. Defaults to "in". */
  zoomMode?: "in" | "out";
  /** Timing curve. Defaults to a smooth ease-out. */
  timing?: TransitionTimingConfig;
};

export const DEFAULT_SCENE_TRANSITION: SceneTransition = {
  kind: "fade",
  durationInFrames: 14,
  timing: { kind: "linear" },
};

export const SCENE_TRANSITION_OPTIONS: Array<{
  value: SceneTransitionKind;
  label: string;
  supportsDirection: boolean;
}> = [
  { value: "none", label: "None (hard cut)", supportsDirection: false },
  { value: "fade", label: "Fade", supportsDirection: false },
  { value: "slide", label: "Slide", supportsDirection: true },
  { value: "wipe", label: "Wipe", supportsDirection: true },
  { value: "flip", label: "Flip", supportsDirection: true },
  { value: "clock-wipe", label: "Clock wipe", supportsDirection: false },
  { value: "iris", label: "Iris", supportsDirection: false },
  { value: "zoom", label: "Zoom", supportsDirection: false },
];

export const TRANSITION_DIRECTION_OPTIONS: Array<{
  value: TransitionDirection;
  label: string;
}> = [
  { value: "from-left", label: "From left" },
  { value: "from-right", label: "From right" },
  { value: "from-top", label: "From top" },
  { value: "from-bottom", label: "From bottom" },
];

/**
 * Old projects may store legacy kinds (`swipe-left`, `zoom-in`, etc.).
 * Normalize them on read so the rest of the code only sees the new schema.
 */
type LegacyKind =
  | "swipe-left"
  | "swipe-right"
  | "swipe-up"
  | "swipe-down"
  | "zoom-in"
  | "zoom-out";

const LEGACY_KIND_MAP: Record<LegacyKind, Partial<SceneTransition>> = {
  "swipe-left": { kind: "slide", direction: "from-right" },
  "swipe-right": { kind: "slide", direction: "from-left" },
  "swipe-up": { kind: "slide", direction: "from-bottom" },
  "swipe-down": { kind: "slide", direction: "from-top" },
  "zoom-in": { kind: "zoom", zoomMode: "in" },
  "zoom-out": { kind: "zoom", zoomMode: "out" },
};

export function normalizeSceneTransition(
  t: SceneTransition | undefined,
): SceneTransition | undefined {
  if (!t) return t;
  const legacy = LEGACY_KIND_MAP[t.kind as LegacyKind];
  if (legacy) {
    return {
      durationInFrames: t.durationInFrames,
      timing: t.timing,
      ...legacy,
    } as SceneTransition;
  }
  return t;
}

/**
 * Pick the effective transition for a clip at `index` in the project.
 * First clip: no transition. Otherwise: clip override → project default →
 * `DEFAULT_SCENE_TRANSITION`.
 */
export function resolveTransition({
  clipTransition,
  projectDefault,
  index,
}: {
  clipTransition: SceneTransition | undefined;
  projectDefault: SceneTransition | undefined;
  index: number;
}): SceneTransition {
  if (index === 0) {
    return { kind: "none", durationInFrames: 0 };
  }
  const t =
    normalizeSceneTransition(clipTransition) ??
    normalizeSceneTransition(projectDefault) ??
    DEFAULT_SCENE_TRANSITION;
  if (t.kind === "none") return { kind: "none", durationInFrames: 0 };
  return t;
}

const SMOOTH_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export function toTiming(t: SceneTransition): TransitionTiming {
  const timing = t.timing ??
    DEFAULT_SCENE_TRANSITION.timing ?? { kind: "linear" };
  if (timing.kind === "spring") {
    return springTiming({
      durationInFrames: t.durationInFrames,
      config: {
        damping: timing.damping ?? 200,
        mass: timing.mass ?? 1,
        stiffness: timing.stiffness ?? 200,
      },
    });
  }
  return linearTiming({
    durationInFrames: t.durationInFrames,
    easing: SMOOTH_EASE,
  });
}

export type AnyTransitionPresentation = TransitionPresentation<any>;

export function toPresentation(
  t: SceneTransition,
  dimensions: { width: number; height: number },
): AnyTransitionPresentation {
  switch (t.kind) {
    case "fade":
      return fade();
    case "slide":
      return slide({ direction: t.direction ?? "from-right" });
    case "wipe":
      return wipe({ direction: t.direction ?? "from-right" });
    case "flip":
      return flip({ direction: t.direction ?? "from-right" });
    case "clock-wipe":
      return clockWipe({ width: dimensions.width, height: dimensions.height });
    case "iris":
      return iris({ width: dimensions.width, height: dimensions.height });
    case "zoom":
      return zoomPresentation(t.zoomMode ?? "in");
    default:
      // Render as a zero-frame fade — TransitionSeries still requires a
      // presentation, but with durationInFrames=0 nothing animates.
      return fade();
  }
}

/**
 * Custom zoom presentation — not provided by @remotion/transitions. Incoming
 * clip scales up from 0.85 (zoom-in) or down from 1.18 (zoom-out), while
 * fading in. Outgoing clip stays put and fades out.
 */
function zoomPresentation(mode: "in" | "out"): AnyTransitionPresentation {
  const ZoomComponent: React.FC<{
    children: React.ReactNode;
    presentationProgress: number;
    presentationDirection: "entering" | "exiting";
  }> = ({ children, presentationProgress, presentationDirection }) => {
    const p = presentationProgress;
    if (presentationDirection === "entering") {
      const start = mode === "in" ? 0.85 : 1.18;
      const scale = start + (1 - start) * p;
      return (
        <div
          style={{
            position: "absolute",
            inset: 0,
            opacity: p,
            transform: `scale(${scale})`,
            transformOrigin: "center center",
          }}
        >
          {children}
        </div>
      );
    }
    // Outgoing clip just fades out — leaving zoom motion for the incoming.
    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity: 1 - p,
        }}
      >
        {children}
      </div>
    );
  };

  return {
    component: ZoomComponent,
    props: {},
  } as unknown as AnyTransitionPresentation;
}
