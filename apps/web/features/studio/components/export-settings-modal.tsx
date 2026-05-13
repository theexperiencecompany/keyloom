"use client";

import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@workspace/ui/components/radio-group";
import { Switch } from "@workspace/ui/components/switch";
import { useState } from "react";

import {
  applyPreset,
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_PRESETS,
  type ExportOptions,
  type ExportPreset,
  type RenderBackend,
} from "../lib/export-options";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (options: ExportOptions) => void;
  initialOptions?: ExportOptions;
  projectWidth: number;
  projectHeight: number;
  durationInFrames: number;
  fps: number;
};

const PRESET_LABELS: Record<
  ExportPreset,
  { title: string; description: string }
> = {
  fast: {
    title: "Fast",
    description: "Half-resolution preview. ~4× faster.",
  },
  balanced: {
    title: "Balanced",
    description: "Full resolution, 8 Mbps. Recommended.",
  },
  high: {
    title: "High quality",
    description: "Full resolution, 16 Mbps.",
  },
};

const RENDERER_LABELS: Record<
  RenderBackend,
  { title: string; description: string }
> = {
  server: {
    title: "Server (Remotion)",
    description: "Headless Chrome + ffmpeg. Much faster, recommended.",
  },
  browser: {
    title: "In-browser (WebCodecs)",
    description: "Runs locally in this tab. Slower; no server needed.",
  },
};

export function ExportSettingsModal({
  open,
  onOpenChange,
  onStart,
  initialOptions,
  projectWidth,
  projectHeight,
  durationInFrames,
  fps,
}: Props) {
  const [options, setOptions] = useState<ExportOptions>(
    initialOptions ?? DEFAULT_EXPORT_OPTIONS,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);

  const encodeWidth = Math.round(projectWidth * options.scale);
  const encodeHeight = Math.round(projectHeight * options.scale);
  const seconds = (durationInFrames / fps).toFixed(1);

  function setPreset(preset: ExportPreset) {
    setOptions(applyPreset(preset, options.renderer));
  }

  function setRenderer(renderer: RenderBackend) {
    setOptions((prev) => ({ ...prev, renderer }));
  }

  function patch<K extends keyof ExportOptions>(
    key: K,
    value: ExportOptions[K],
  ) {
    setOptions((prev) => ({ ...prev, [key]: value }));
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Export video</DialogTitle>
          <DialogDescription>
            {projectWidth}×{projectHeight} · {seconds}s · {fps}fps
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Renderer
          </Label>
          <RadioGroup
            value={options.renderer}
            onValueChange={(v) => setRenderer(v as RenderBackend)}
            className="gap-2"
          >
            {(Object.keys(RENDERER_LABELS) as RenderBackend[]).map((r) => {
              const meta = RENDERER_LABELS[r];
              const checked = options.renderer === r;
              return (
                <label
                  key={r}
                  htmlFor={`renderer-${r}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/40"
                  }`}
                >
                  <RadioGroupItem id={`renderer-${r}`} value={r} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium leading-tight">
                      {meta.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {meta.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </div>

        <div className="space-y-2">
          <Label className="text-[11px] uppercase tracking-wide text-muted-foreground">
            Quality
          </Label>
          <RadioGroup
            value={options.preset}
            onValueChange={(v) => setPreset(v as ExportPreset)}
            className="gap-2"
          >
            {(Object.keys(EXPORT_PRESETS) as ExportPreset[]).map((preset) => {
              const meta = PRESET_LABELS[preset];
              const checked = options.preset === preset;
              return (
                <label
                  key={preset}
                  htmlFor={`preset-${preset}`}
                  className={`flex cursor-pointer items-start gap-3 rounded-lg border p-3 transition ${
                    checked
                      ? "border-primary bg-primary/5"
                      : "border-border hover:bg-accent/40"
                  }`}
                >
                  <RadioGroupItem id={`preset-${preset}`} value={preset} />
                  <div className="flex-1">
                    <div className="text-[13px] font-medium leading-tight">
                      {meta.title}
                    </div>
                    <div className="text-[11px] text-muted-foreground">
                      {meta.description}
                    </div>
                  </div>
                </label>
              );
            })}
          </RadioGroup>
        </div>

        <div className="space-y-3">
          <button
            type="button"
            onClick={() => setShowAdvanced((s) => !s)}
            className="text-[11px] font-medium text-muted-foreground hover:text-foreground"
          >
            {showAdvanced ? "Hide advanced" : "Show advanced"}
          </button>

          {showAdvanced && (
            <div className="space-y-3 rounded-lg border border-dashed border-border p-3">
              <Field
                label="Bitrate (Mbps)"
                hint={`${(options.bitrate / 1_000_000).toFixed(1)} Mbps`}
              >
                <Input
                  type="number"
                  min={1}
                  max={50}
                  step={0.5}
                  value={options.bitrate / 1_000_000}
                  onChange={(e) =>
                    patch(
                      "bitrate",
                      Math.max(1, Number(e.target.value)) * 1_000_000,
                    )
                  }
                />
              </Field>

              <Field
                label="Scale"
                hint={`Encoded ${encodeWidth}×${encodeHeight}`}
              >
                <Input
                  type="number"
                  min={0.25}
                  max={1}
                  step={0.05}
                  value={options.scale}
                  onChange={(e) =>
                    patch(
                      "scale",
                      Math.max(0.25, Math.min(1, Number(e.target.value))),
                    )
                  }
                />
              </Field>

              {options.renderer === "browser" && (
                <div className="flex items-center justify-between">
                  <div>
                    <Label className="text-[12px]">Extra paint wait</Label>
                    <p className="text-[11px] text-muted-foreground">
                      Slower but safer for heavy compositions.
                    </p>
                  </div>
                  <Switch
                    checked={options.extraPaintWait}
                    onCheckedChange={(v) => patch("extraPaintWait", v)}
                  />
                </div>
              )}
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            onClick={() => {
              onStart(options);
              onOpenChange(false);
            }}
          >
            Start render
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <div className="flex-1">
        <Label className="text-[12px]">{label}</Label>
        {hint && <p className="text-[11px] text-muted-foreground">{hint}</p>}
      </div>
      <div className="w-28">{children}</div>
    </div>
  );
}
