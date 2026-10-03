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
import { zoomInOut } from "@remotion/transitions/zoom-in-out";
import { Easing, isHtmlInCanvasSupported } from "remotion";

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

function normalizeSceneTransition(
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
      // Prefer Remotion's built-in pixel-accurate zoom, but it's an
      // HTML-in-canvas (WebGL) presentation that THROWS in browsers without
      // the experimental `canvas-draw-element` support (Firefox, Safari,
      // Chrome without the flag). Remotion's own `isHtmlInCanvasSupported()`
      // tells us when it's safe; otherwise fall back to the DOM-transform zoom
      // below, which runs everywhere (studio Player + in-browser export).
      return isHtmlInCanvasSupported()
        ? zoomInOut({})
        : zoomPresentation(t.zoomMode ?? "in");
    default:
      // Render as a zero-frame fade — TransitionSeries still requires a
      // presentation, but with durationInFrames=0 nothing animates.
      return fade();
  }
}

/**
 * Fallback zoom presentation — used only when Remotion's built-in `zoomInOut`
 * can't run (no HTML-in-canvas support). A subtle continuous camera push.
 * Crucially, BOTH clips stay at scale >= 1 for the whole
 * window so neither ever exposes its edges (a clip scaled below 1 reveals the
 * empty area behind it, which reads as an ugly black border — the old bug).
 *
 * "in": the camera keeps pushing forward through the cut. The outgoing clip
 * scales up from 1 -> 1+AMT as it fades out; the incoming clip starts already
 * pushed in at 1+AMT and settles back to 1 as it fades in. Because the visible
 * clip is at scale 1 at each boundary (outgoing at progress 0, incoming at
 * progress 1) and only ever larger in between, the motion is seamless and
 * full-frame the entire time.
 *
 * "out": the mirror — the incoming clip pushes in from 1+AMT while the outgoing
 * holds, giving a gentle pull-into-the-new-scene feel.
 */
const ZOOM_AMOUNT = 0.12;

function zoomPresentation(mode: "in" | "out"): AnyTransitionPresentation {
  const ZoomComponent: React.FC<{
    children: React.ReactNode;
    presentationProgress: number;
    presentationDirection: "entering" | "exiting";
  }> = ({ children, presentationProgress, presentationDirection }) => {
    const p = presentationProgress;
    let scale: number;
    let opacity: number;

    if (presentationDirection === "entering") {
      // Incoming starts pushed in and settles to rest at scale 1.
      scale = 1 + ZOOM_AMOUNT * (1 - p);
      opacity = p;
    } else if (mode === "in") {
      // Outgoing keeps pushing forward as it fades — continuous camera move.
      scale = 1 + ZOOM_AMOUNT * p;
      opacity = 1 - p;
    } else {
      // "out": outgoing holds at rest and just fades, letting the incoming push.
      scale = 1;
      opacity = 1 - p;
    }

    return (
      <div
        style={{
          position: "absolute",
          inset: 0,
          opacity,
          transform: `scale(${scale})`,
          transformOrigin: "center center",
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
