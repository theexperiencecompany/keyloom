"use client";

import {
  DEFAULT_SCENE_TRANSITION,
  SCENE_TRANSITION_OPTIONS,
  type SceneTransition,
} from "@workspace/compositions/transitions";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";

type Props = {
  transition: SceneTransition | undefined;
  /** True if this is the first clip — transitions default to no transition. */
  isFirst: boolean;
  fps: number;
  clipDurationInFrames: number;
  onChange: (transition: SceneTransition | undefined) => void;
};

export function TransitionSection({
  transition,
  isFirst,
  fps,
  clipDurationInFrames,
  onChange,
}: Props) {
  // Effective transition shown in the UI: explicit override, or the same
  // default the renderer would apply.
  const effective =
    transition ??
    (isFirst
      ? { kind: "none" as const, durationInFrames: 0 }
      : DEFAULT_SCENE_TRANSITION);
  const durationSec = (effective.durationInFrames / fps).toFixed(2);
  const maxDuration = Math.min(120, Math.floor(clipDurationInFrames / 2));

  return (
    <div className="space-y-3 px-5 py-4">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
          Transition in
        </p>
        {transition !== undefined && (
          <button
            type="button"
            onClick={() => onChange(undefined)}
            className="text-[10px] font-medium text-muted-foreground hover:text-foreground"
          >
            Reset
          </button>
        )}
      </div>
      <div className="space-y-1.5">
        <Label htmlFor="transition-kind" className="text-[12px]">
          Style
        </Label>
        <Select
          value={effective.kind}
          onValueChange={(v) =>
            onChange({
              kind: v as SceneTransition["kind"],
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
      {effective.kind !== "none" && (
        <div className="space-y-1.5">
          <Label htmlFor="transition-duration" className="text-[12px]">
            Duration ({durationSec}s)
          </Label>
          <Input
            id="transition-duration"
            type="number"
            min={1}
            max={maxDuration}
            value={effective.durationInFrames}
            onChange={(e) =>
              onChange({
                kind: effective.kind,
                durationInFrames: Math.max(
                  1,
                  Math.min(maxDuration, Number(e.target.value)),
                ),
              })
            }
          />
        </div>
      )}
      {isFirst && (
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          First clip — transitions in from black. Set "None" to keep a hard
          cut-in.
        </p>
      )}
    </div>
  );
}
