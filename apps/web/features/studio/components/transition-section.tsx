"use client";

import {
  DEFAULT_SCENE_TRANSITION,
  resolveTransition,
  SCENE_TRANSITION_OPTIONS,
  type SceneTransition,
  type SceneTransitionKind,
  TRANSITION_DIRECTION_OPTIONS,
} from "@workspace/compositions/transitions";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";

type Props = {
  /** Per-clip override, if any. */
  transition: SceneTransition | undefined;
  /** Project-wide default applied when no override is set. */
  projectDefault: SceneTransition | undefined;
  /** True if this is the first clip — transitions are ignored. */
  isFirst: boolean;
  fps: number;
  clipDurationInFrames: number;
  onChange: (transition: SceneTransition | undefined) => void;
};

const SUPPORTS_DIRECTION_KINDS = new Set<SceneTransitionKind>(
  SCENE_TRANSITION_OPTIONS.filter((o) => o.supportsDirection).map(
    (o) => o.value,
  ),
);

export function TransitionSection({
  transition,
  projectDefault,
  isFirst,
  fps,
  clipDurationInFrames,
  onChange,
}: Props) {
  const effective = resolveTransition({
    clipTransition: transition,
    projectDefault,
    index: isFirst ? 0 : 1,
  });
  // A clip's frame count can briefly be non-finite while it's being created
  // (e.g. a freshly added background scene), which would hand the Radix
  // Slider a NaN `max`. Guard it to a finite floor of 1.
  const safeClipFrames = Number.isFinite(clipDurationInFrames)
    ? clipDurationInFrames
    : 2;
  const maxDuration = Math.max(
    1,
    Math.min(120, Math.floor(safeClipFrames / 2)),
  );
  // The resolved duration (often the project default of 14) can exceed this
  // clip's own max. Feeding the Slider an out-of-range value makes Radix loop
  // its internal clamp and trips React's max-update-depth guard, so clamp it
  // into [1, maxDuration] before it ever reaches the Slider.
  const sliderValue = Math.min(
    maxDuration,
    Math.max(1, effective.durationInFrames || 1),
  );
  const durationSecValue = effective.durationInFrames / fps;
  const supportsDirection = SUPPORTS_DIRECTION_KINDS.has(effective.kind);
  const isZoom = effective.kind === "zoom";
  const timingKind = effective.timing?.kind ?? "linear";

  function patch(next: Partial<SceneTransition>) {
    onChange({ ...effective, ...next });
  }

  return (
    <div className="space-y-3 px-5 py-4">
      {transition !== undefined && (
        <div className="flex items-center justify-end">
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="rounded-md px-2 py-1 text-[11px] font-medium text-muted-foreground outline-none hover:bg-muted hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring/50"
          >
            Reset to project default
          </button>
        </div>
      )}
      {isFirst && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          First clip — transitions are not applied. Use an effect for an on-clip
          entrance.
        </p>
      )}
      {!isFirst && (
        <>
          <div className="space-y-1.5">
            <Label htmlFor="transition-kind" className="text-[12px]">
              Style
            </Label>
            <Select
              value={effective.kind}
              onValueChange={(v) =>
                onChange({
                  ...effective,
                  kind: v as SceneTransitionKind,
                  durationInFrames:
                    effective.durationInFrames ||
                    DEFAULT_SCENE_TRANSITION.durationInFrames,
                })
              }
            >
              <SelectTrigger id="transition-kind">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {SCENE_TRANSITION_OPTIONS.map((o) => (
                  <SelectItem key={o.value} value={o.value}>
                    {o.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {supportsDirection && (
            <div className="space-y-1.5">
              <Label htmlFor="transition-direction" className="text-[12px]">
                Direction
              </Label>
              <Select
                value={effective.direction ?? "from-right"}
                onValueChange={(v) =>
                  patch({ direction: v as SceneTransition["direction"] })
                }
              >
                <SelectTrigger id="transition-direction">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRANSITION_DIRECTION_OPTIONS.map((o) => (
                    <SelectItem key={o.value} value={o.value}>
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {isZoom && (
            <div className="space-y-1.5">
              <Label htmlFor="transition-zoom" className="text-[12px]">
                Zoom direction
              </Label>
              <Select
                value={effective.zoomMode ?? "in"}
                onValueChange={(v) => patch({ zoomMode: v as "in" | "out" })}
              >
                <SelectTrigger id="transition-zoom">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="in">Zoom in</SelectItem>
                  <SelectItem value="out">Zoom out</SelectItem>
                </SelectContent>
              </Select>
            </div>
          )}

          {effective.kind !== "none" && (
            <>
              <div className="space-y-1.5">
                <Label htmlFor="transition-timing" className="text-[12px]">
                  Curve
                </Label>
                <Select
                  value={timingKind}
                  onValueChange={(v) =>
                    patch({
                      timing:
                        v === "spring"
                          ? { kind: "spring" }
                          : { kind: "linear" },
                    })
                  }
                >
                  <SelectTrigger id="transition-timing">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="linear">Smooth ease</SelectItem>
                    <SelectItem value="spring">Spring</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <div className="flex items-baseline justify-between">
                  <Label htmlFor="transition-duration" className="text-[12px]">
                    Duration
                  </Label>
                  <span className="font-mono text-[10px] text-muted-foreground">
                    {durationSecValue.toFixed(2)}s ·{" "}
                    {effective.durationInFrames} frames
                  </span>
                </div>
                <Slider
                  id="transition-duration"
                  min={1}
                  max={maxDuration}
                  step={1}
                  value={[sliderValue]}
                  onValueChange={([v]) => {
                    if (v === undefined) return;
                    patch({
                      durationInFrames: Math.max(
                        1,
                        Math.min(maxDuration, Math.round(v)),
                      ),
                    });
                  }}
                />
              </div>
            </>
          )}

          {transition === undefined && (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              Using the project default. Edit any field above to override it for
              this clip only.
            </p>
          )}
        </>
      )}
    </div>
  );
}
