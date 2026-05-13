"use client";

import type { Project } from "@workspace/compositions/project";
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
import { useState } from "react";
import {
  applyPreset,
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_PRESETS,
  type ExportOptions,
  type ExportPreset,
} from "../lib/export-options";
import { buildExportZip, downloadBlob } from "../lib/export-zip";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (options: ExportOptions) => void;
  initialOptions?: ExportOptions;
  project: Project;
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
    description: "Half resolution, 4 Mbps. Best for quick previews.",
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

export function ExportSettingsModal({
  open,
  onOpenChange,
  onStart,
  initialOptions,
  project,
  projectWidth,
  projectHeight,
  durationInFrames,
  fps,
}: Props) {
  const [options, setOptions] = useState<ExportOptions>(
    initialOptions ?? DEFAULT_EXPORT_OPTIONS,
  );
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [zipBusy, setZipBusy] = useState(false);
  const [zipError, setZipError] = useState<string | null>(null);

  async function handleDownloadZip() {
    setZipBusy(true);
    setZipError(null);
    try {
      const blob = await buildExportZip({ project });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadBlob(blob, `motion-studio-render-${stamp}.zip`);
      onOpenChange(false);
    } catch (err) {
      setZipError(err instanceof Error ? err.message : String(err));
    } finally {
      setZipBusy(false);
    }
  }

  const encodeWidth = Math.round(projectWidth * options.scale);
  const encodeHeight = Math.round(projectHeight * options.scale);
  const seconds = (durationInFrames / fps).toFixed(1);

  function setPreset(preset: ExportPreset) {
    setOptions(applyPreset(preset));
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
            </div>
          )}
        </div>

        <div className="rounded-lg border border-dashed border-border bg-accent/20 p-3">
          <p className="text-[12px] font-medium">Want a much faster render?</p>
          <p className="mt-1 text-[11px] text-muted-foreground">
            Download a self-contained renderer. Runs locally via{" "}
            <code>node render.mjs</code>, uses all your CPU cores. Typically
            5–10× faster than the in-browser export.
          </p>
          {zipError && (
            <p className="mt-2 text-[11px] text-red-500">{zipError}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={handleDownloadZip}
            disabled={zipBusy}
          >
            {zipBusy ? "Packaging…" : "Download fast renderer (zip)"}
          </Button>
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
            disabled={zipBusy}
          >
            Start render in browser
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
