"use client";

import { Button } from "@workspace/ui/components/button";
import confetti from "canvas-confetti";
import { useEffect, useRef, useState } from "react";
import type { ExportState } from "../hooks/use-export-render";

type Props = {
  state: ExportState;
  onClose: () => void;
  onCancel: () => void;
  onDownload: () => void;
  onRetry?: () => void;
};

export function ExportProgressOverlay({
  state,
  onClose,
  onCancel,
  onDownload,
  onRetry,
}: Props) {
  const phase = state.phase;
  const dismissable = phase === "done" || phase === "error";

  // Fire confetti once when a render completes successfully.
  useEffect(() => {
    if (phase !== "done") return;
    const colors = ["#3b82f6", "#22d3ee", "#a855f7", "#f59e0b", "#ec4899"];
    const fire = (opts: confetti.Options) =>
      confetti({
        particleCount: 90,
        spread: 70,
        startVelocity: 35,
        ticks: 220,
        gravity: 1.1,
        scalar: 0.95,
        colors,
        zIndex: 9999,
        disableForReducedMotion: true,
        ...opts,
      });
    // Two simultaneous bursts from the lower corners — feels celebratory
    // without dominating the modal preview.
    fire({ origin: { x: 0.2, y: 0.8 }, angle: 60 });
    fire({ origin: { x: 0.8, y: 0.8 }, angle: 120 });
    const followUp = setTimeout(() => {
      fire({ origin: { x: 0.5, y: 0.4 }, spread: 100, particleCount: 60 });
    }, 250);
    return () => clearTimeout(followUp);
  }, [phase]);

  // Escape key closes the modal once render is done or errored.
  useEffect(() => {
    if (!dismissable) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [dismissable, onClose]);

  if (phase === "idle") return null;

  const pct = Math.round(state.progress * 100);

  const handleBackdropClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target !== e.currentTarget) return;
    if (dismissable) onClose();
  };

  const isDone = phase === "done";

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Export progress"
      onClick={handleBackdropClick}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
    >
      <div
        className={`w-full ${
          isDone ? "max-w-xl" : "max-w-md"
        } rounded-xl border border-border bg-background p-6 shadow-2xl`}
      >
        <div className="mb-1 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            {phase === "starting" && "Preparing render…"}
            {phase === "rendering" && "Rendering video"}
            {phase === "done" && "Render complete"}
            {phase === "error" && "Render failed"}
          </h2>
          {dismissable && (
            <Button
              variant="ghost"
              size="icon-xs"
              onClick={onClose}
              title="Close"
            >
              ×
            </Button>
          )}
        </div>

        {phase !== "error" && !isDone && (
          <p className="mb-4 text-[12px] text-muted-foreground">
            {phase === "starting" &&
              "Bundling your composition. First render may take longer."}
            {phase === "rendering" && `Encoding frames — ${pct}% complete`}
          </p>
        )}

        {phase === "error" && (
          <ErrorDetails
            message={state.error ?? "Unknown error"}
            stack={state.errorStack ?? null}
          />
        )}

        {isDone && state.blobUrl ? (
          <div className="mb-4 overflow-hidden rounded-lg border border-border bg-black">
            {/* biome-ignore lint/a11y/useMediaCaption: user-generated video, no caption track */}
            <video
              src={state.blobUrl}
              controls
              autoPlay
              loop
              playsInline
              className="block aspect-video w-full bg-black"
            />
          </div>
        ) : (
          <ProgressBar phase={phase} pct={pct} />
        )}

        <div className="mt-3 flex items-center justify-between gap-2">
          <span className="text-[11px] tabular-nums text-muted-foreground">
            {phase === "rendering" ? `${pct}%` : isDone ? state.filename : "—"}
          </span>
          <div className="flex items-center gap-2">
            {(phase === "starting" || phase === "rendering") && (
              <Button variant="outline" size="xs" onClick={onCancel}>
                Cancel
              </Button>
            )}
            {phase === "error" && onRetry && (
              <Button
                size="xs"
                onClick={() => {
                  console.info("[export-overlay] retry clicked");
                  onRetry();
                }}
              >
                Try again
              </Button>
            )}
            {isDone && (
              <Button size="xs" onClick={onDownload}>
                Download MP4
              </Button>
            )}
            {dismissable && (
              <Button variant="outline" size="xs" onClick={onClose}>
                Close
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

function ErrorDetails({
  message,
  stack,
}: {
  message: string;
  stack: string | null;
}) {
  const hint = hintFor(message);
  return (
    <div className="mb-4 space-y-2">
      <p className="break-words text-[12px] font-medium text-red-400">
        {message}
      </p>
      {hint && (
        <p className="break-words text-[11px] text-muted-foreground">{hint}</p>
      )}
      {stack && (
        <details className="rounded border border-border bg-accent/30 p-2 text-[11px]">
          <summary className="cursor-pointer text-muted-foreground">
            Show technical details
          </summary>
          <pre className="mt-1 max-h-40 overflow-auto whitespace-pre-wrap break-words text-[10px] text-muted-foreground">
            {stack}
          </pre>
          <p className="mt-1 text-[10px] text-muted-foreground">
            Open the browser console for full <code>[export]</code> /
            <code>[export-hook]</code> logs.
          </p>
        </details>
      )}
    </div>
  );
}

function hintFor(message: string): string | null {
  const m = message.toLowerCase();
  if (m.includes("webcodecs"))
    return "WebCodecs is required for in-browser MP4 export. Chrome and Edge 94+, Safari 17+, or Firefox 130+ should work.";
  if (m.includes("tainted") || m.includes("cross-origin"))
    return "An image in the composition couldn't be read by canvas (likely a cross-origin URL without CORS). Replace it with a same-origin asset.";
  if (m.includes("isconfigsupported") || m.includes("avc1"))
    return "Your browser refused the H.264 config. Enable hardware acceleration in browser settings, or try Chrome/Edge.";
  if (m.includes("snapshot to canvas"))
    return "The rasterizer failed on a frame. Check the browser console for the underlying html-to-image error.";
  if (m.includes("encoding frame"))
    return "WebCodecs rejected a frame. This usually means the GPU encoder is overloaded — try again, or close other tabs.";
  return null;
}

function ProgressBar({
  phase,
  pct,
}: {
  phase: ExportState["phase"];
  pct: number;
}) {
  const smoothPct = useSmoothPct(pct);
  if (phase === "starting") {
    return (
      <div className="relative h-2 overflow-hidden rounded-full bg-accent">
        <div className="absolute inset-y-0 left-0 w-1/3 animate-pulse rounded-full bg-blue-500" />
      </div>
    );
  }
  if (phase === "error") {
    return <div className="h-2 rounded-full bg-red-500/30" />;
  }
  return (
    <div className="h-2 overflow-hidden rounded-full bg-accent">
      <div
        className="h-full rounded-full bg-blue-500"
        style={{ width: `${Math.max(2, smoothPct)}%` }}
      />
    </div>
  );
}

/**
 * Lerps a displayed percentage toward the real value every animation frame
 * so the bar moves continuously instead of jumping whenever the render
 * emits a progress callback. Closes ~12% of the remaining gap per frame
 * (≈80ms to half, ≈250ms to ~95%) — fast enough to feel responsive, slow
 * enough to keep motion visible.
 */
function useSmoothPct(target: number): number {
  const [display, setDisplay] = useState(target);
  const displayRef = useRef(target);
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      const current = displayRef.current;
      const next = current + (target - current) * 0.12;
      const done = Math.abs(target - next) < 0.05;
      const value = done ? target : next;
      displayRef.current = value;
      setDisplay(value);
      if (!done) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target]);
  return display;
}
