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
import { useEffect, useReducer, useState } from "react";
import {
  applyPreset,
  DEFAULT_EXPORT_OPTIONS,
  EXPORT_PRESETS,
  type ExportFps,
  type ExportOptions,
  type ExportPreset,
} from "../lib/export-options";
import { buildExportZip, downloadBlob } from "../lib/export-zip";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onStart: (options: ExportOptions) => void;
  /**
   * Optional WYSIWYG render path — runs through real headless Chromium on AWS
   * Lambda (`/api/render/lambda`), so `backdrop-filter` glass / WebGL / bundled
   * fonts match the Player exactly without tying up the user's machine. When
   * provided, an "exact" button is shown alongside the in-browser one. Receives
   * the same export options (resolution scale / fps / bitrate) as the in-browser
   * render.
   */
  onStartServer?: (options: ExportOptions) => void;
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
    description: "Half resolution, 6 Mbps. Best for quick previews.",
  },
  balanced: {
    title: "Balanced",
    description: "Full resolution, 16 Mbps, tight keyframes. Recommended.",
  },
  high: {
    title: "High quality",
    description:
      "Full resolution, 50 Mbps, all-intra. Eliminates encoder shimmer on static text — best for typography-heavy reels.",
  },
  uhd4k: {
    title: "4K (UHD)",
    description:
      "2× resolution (3840×2160 for 1080p projects), 80 Mbps, 60fps. Slowest render; ideal for YouTube masters.",
  },
};

// The four zip fields below are one async packaging operation — they only
// ever change together (start / finish / fail), so they share a reducer.
type ZipState = {
  busy: boolean;
  error: string | null;
  startedAt: number | null;
  finishedAt: number | null;
};

type ZipAction =
  | { type: "start"; startedAt: number }
  | { type: "finish"; finishedAt: number }
  | { type: "fail"; finishedAt: number; error: string };

const INITIAL_ZIP: ZipState = {
  busy: false,
  error: null,
  startedAt: null,
  finishedAt: null,
};

function zipReducer(state: ZipState, action: ZipAction): ZipState {
  switch (action.type) {
    case "start":
      return {
        busy: true,
        error: null,
        startedAt: action.startedAt,
        finishedAt: null,
      };
    case "finish":
      return { ...state, busy: false, finishedAt: action.finishedAt };
    case "fail":
      return {
        ...state,
        busy: false,
        error: action.error,
        finishedAt: action.finishedAt,
      };
    default:
      return state;
  }
}

export function ExportSettingsModal({
  open,
  onOpenChange,
  onStart,
  onStartServer,
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
  const [zip, dispatchZip] = useReducer(zipReducer, INITIAL_ZIP);
  const zipElapsedMs = useTicker(zip.startedAt, zip.finishedAt, zip.busy);

  async function handleDownloadZip() {
    dispatchZip({ type: "start", startedAt: Date.now() });
    try {
      const blob = await buildExportZip({ project });
      const stamp = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
      downloadBlob(blob, `motion-studio-render-${stamp}.zip`);
      dispatchZip({ type: "finish", finishedAt: Date.now() });
      // Leave the modal open briefly so the user sees the final time before
      // it disappears. They can close it manually too.
      window.setTimeout(() => onOpenChange(false), 1500);
    } catch (err) {
      dispatchZip({
        type: "fail",
        finishedAt: Date.now(),
        error: err instanceof Error ? err.message : String(err),
      });
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

        {/* Frame rate. 120fps doubles temporal sampling — perceptibly
            smoother on ProMotion (120Hz) displays. 60fps matches most
            social platforms' upload caps. */}
        <div className="flex items-center justify-between rounded-lg border border-border p-3">
          <div>
            <div className="text-[13px] font-medium leading-tight">
              Frame rate
            </div>
            <p className="text-[11px] text-muted-foreground">
              {options.fps === 120
                ? "120fps — smoother motion on ProMotion (120Hz) displays. ~2× render time."
                : options.fps === 30
                  ? "30fps — smallest file, fine for platforms that re-encode."
                  : "60fps — standard, good balance of smoothness and file size."}
            </p>
          </div>
          <div className="flex shrink-0 gap-1 rounded-md bg-muted p-0.5">
            {([30, 60, 120] as ExportFps[]).map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => patch("fps", f)}
                className={`rounded px-2.5 py-1 text-[12px] font-medium transition ${
                  options.fps === f
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
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
                  max={2}
                  step={0.05}
                  value={options.scale}
                  onChange={(e) =>
                    patch(
                      "scale",
                      Math.max(0.25, Math.min(2, Number(e.target.value))),
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
          {zip.error && (
            <p className="mt-2 text-[11px] text-red-500">{zip.error}</p>
          )}
          <Button
            variant="outline"
            size="sm"
            className="mt-3 w-full"
            onClick={handleDownloadZip}
            disabled={zip.busy}
          >
            {zip.busy
              ? `Packaging… ${formatElapsed(zipElapsedMs)}`
              : zip.finishedAt && !zip.error
                ? `Downloaded · packaged in ${formatElapsed(zipElapsedMs)}`
                : "Download fast renderer (zip)"}
          </Button>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          {onStartServer && (
            <Button
              variant="secondary"
              onClick={() => {
                onStartServer(options);
                onOpenChange(false);
              }}
              disabled={zip.busy}
              title="Render in the cloud on AWS Lambda via real Chromium — pixel-identical to the preview (glass, blur, WebGL, fonts). Doesn't use your machine."
            >
              Render exact (Chromium)
            </Button>
          )}
          <Button
            onClick={() => {
              onStart(options);
              onOpenChange(false);
            }}
            disabled={zip.busy}
          >
            Start render in browser
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function useTicker(
  startedAt: number | null,
  finishedAt: number | null,
  ticking: boolean,
): number {
  const [, force] = useState(0);
  useEffect(() => {
    if (!ticking || startedAt == null || finishedAt != null) return;
    const id = window.setInterval(() => force((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, [ticking, startedAt, finishedAt]);
  if (startedAt == null) return 0;
  return (finishedAt ?? Date.now()) - startedAt;
}

function formatElapsed(ms: number): string {
  if (ms < 0) return "0.0s";
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60_000);
  const sec = Math.round((ms % 60_000) / 1000);
  return `${min}m ${sec}s`;
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
