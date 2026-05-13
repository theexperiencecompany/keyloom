"use client";

import { ArrowDataTransferHorizontalIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  DEFAULT_SCENE_TRANSITION,
  SCENE_TRANSITION_OPTIONS,
  type SceneTransition,
  type SceneTransitionKind,
  TRANSITION_DIRECTION_OPTIONS,
} from "@workspace/compositions/transitions";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@workspace/ui/components/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@workspace/ui/components/tooltip";

type Props = {
  transition: SceneTransition | undefined;
  fps: number;
  onChange: (transition: SceneTransition | undefined) => void;
};

const SUPPORTS_DIRECTION_KINDS = new Set<SceneTransitionKind>(
  SCENE_TRANSITION_OPTIONS.filter((o) => o.supportsDirection).map(
    (o) => o.value,
  ),
);

const PROJECT_DEFAULT_FALLBACK: SceneTransition = DEFAULT_SCENE_TRANSITION;

export function ProjectTransitionControl({ transition, fps, onChange }: Props) {
  const effective = transition ?? PROJECT_DEFAULT_FALLBACK;
  const durationSec = (effective.durationInFrames / fps).toFixed(2);
  const supportsDirection = SUPPORTS_DIRECTION_KINDS.has(effective.kind);
  const isZoom = effective.kind === "zoom";
  const timingKind = effective.timing?.kind ?? "linear";

  function patch(next: Partial<SceneTransition>) {
    onChange({ ...effective, ...next });
  }

  return (
    <Popover>
      <TooltipProvider>
        <Tooltip>
          <TooltipTrigger asChild>
            <PopoverTrigger asChild>
              <Button variant="ghost" size="icon-sm" aria-label="Transitions">
                <HugeiconsIcon
                  icon={ArrowDataTransferHorizontalIcon}
                  size={14}
                />
              </Button>
            </PopoverTrigger>
          </TooltipTrigger>
          <TooltipContent>
            Default transition · {effective.kind}
            {effective.kind !== "none" ? ` · ${durationSec}s` : ""}
          </TooltipContent>
        </Tooltip>
      </TooltipProvider>
      <PopoverContent align="end" className="w-80 space-y-3 p-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            Project default
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
        <p className="text-[11px] leading-relaxed text-muted-foreground">
          Applies to every non-first clip. Per-clip overrides win.
        </p>

        <div className="space-y-1.5">
          <Label htmlFor="proj-tx-kind" className="text-[12px]">
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
            <SelectTrigger id="proj-tx-kind">
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
            <Label htmlFor="proj-tx-dir" className="text-[12px]">
              Direction
            </Label>
            <Select
              value={effective.direction ?? "from-right"}
              onValueChange={(v) =>
                patch({ direction: v as SceneTransition["direction"] })
              }
            >
              <SelectTrigger id="proj-tx-dir">
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
            <Label htmlFor="proj-tx-zoom" className="text-[12px]">
              Zoom direction
            </Label>
            <Select
              value={effective.zoomMode ?? "in"}
              onValueChange={(v) => patch({ zoomMode: v as "in" | "out" })}
            >
              <SelectTrigger id="proj-tx-zoom">
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
              <Label htmlFor="proj-tx-timing" className="text-[12px]">
                Curve
              </Label>
              <Select
                value={timingKind}
                onValueChange={(v) =>
                  patch({
                    timing:
                      v === "spring" ? { kind: "spring" } : { kind: "linear" },
                  })
                }
              >
                <SelectTrigger id="proj-tx-timing">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="linear">Smooth ease</SelectItem>
                  <SelectItem value="spring">Spring</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="proj-tx-dur" className="text-[12px]">
                Duration ({durationSec}s)
              </Label>
              <Input
                id="proj-tx-dur"
                type="number"
                min={1}
                max={120}
                value={effective.durationInFrames}
                onChange={(e) =>
                  patch({
                    durationInFrames: Math.max(
                      1,
                      Math.min(120, Number(e.target.value)),
                    ),
                  })
                }
              />
            </div>
          </>
        )}
      </PopoverContent>
    </Popover>
  );
}
