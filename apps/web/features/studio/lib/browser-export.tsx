"use client";

/**
 * In-browser MP4 exporter. Slow but works offline.
 *
 * Per-frame:
 *   1. Render Remotion's <Thumbnail> at the project's NATIVE resolution
 *      into a persistent React root (no re-create per frame).
 *   2. html2canvas rasterizes the host DOM at the requested output scale.
 *   3. The resulting canvas (already at output size) becomes a VideoFrame
 *      that we feed to WebCodecs VideoEncoder.
 *
 * Requires WebCodecs: Chrome/Edge 94+, Safari 17+, Firefox 130+.
 */

import { Thumbnail } from "@remotion/player";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import type { Project } from "@workspace/compositions/project";
import { projectDuration } from "@workspace/compositions/project";
import html2canvas from "html2canvas-pro";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import type { ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";

import { DEFAULT_EXPORT_OPTIONS, type ExportOptions } from "./export-options";

const IS_DEV = process.env.NODE_ENV !== "production";
const dlog = (...args: unknown[]) => {
  if (IS_DEV) console.info(...args);
};

export type ExportProgressCallback = (progress: number) => void;

type BaseExportOptions = {
  onProgress?: ExportProgressCallback;
  signal?: AbortSignal;
  options?: Partial<ExportOptions>;
};

export type RenderComponentOptions<P extends Record<string, unknown>> =
  BaseExportOptions & {
    component: ComponentType<P>;
    inputProps: P;
    durationInFrames: number;
    fps: number;
    width: number;
    height: number;
  };

export type RenderProjectOptions = BaseExportOptions & {
  project: Project;
};

export function isBrowserExportSupported(): boolean {
  if (typeof window === "undefined") return false;
  const w = window as unknown as {
    VideoEncoder?: unknown;
    VideoFrame?: unknown;
  };
  return (
    typeof w.VideoEncoder !== "undefined" && typeof w.VideoFrame !== "undefined"
  );
}

function resolveOptions(input?: Partial<ExportOptions>): ExportOptions {
  return { ...DEFAULT_EXPORT_OPTIONS, ...input };
}

export async function renderComponentInBrowser<
  P extends Record<string, unknown>,
>(opts: RenderComponentOptions<P>): Promise<Blob> {
  const {
    component,
    inputProps,
    durationInFrames,
    fps,
    width,
    height,
    onProgress,
    signal,
  } = opts;
  const options = resolveOptions(opts.options);

  // Composition stays at native size; html2canvas downscales while rasterizing.
  const scale = Math.min(1, Math.max(0.25, options.scale));
  const encodeWidth = clampEven(Math.round(width * scale));
  const encodeHeight = clampEven(Math.round(height * scale));
  const bitrate = options.bitrate;
  const keyframeInterval =
    options.keyframeIntervalFrames === "auto"
      ? Math.max(1, Math.round(fps))
      : Math.max(1, options.keyframeIntervalFrames);

  dlog("[export-browser] start", {
    nativeWidth: width,
    nativeHeight: height,
    encodeWidth,
    encodeHeight,
    fps,
    durationInFrames,
    bitrate,
    scale,
  });

  if (!isBrowserExportSupported()) {
    throw new Error(
      "Your browser does not support in-browser MP4 export (WebCodecs unavailable). Try the latest Chrome or Edge.",
    );
  }

  const codec = await pickSupportedAvc(encodeWidth, encodeHeight, bitrate, fps);
  if (!codec) {
    throw new Error(
      `No supported H.264 profile for ${encodeWidth}x${encodeHeight}@${fps}fps. Try a lower resolution or enable hardware acceleration.`,
    );
  }

  const host = document.createElement("div");
  host.setAttribute("data-motion-studio-export", "true");
  host.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: -100000px",
    `width: ${width}px`,
    `height: ${height}px`,
    "pointer-events: none",
    "z-index: -1",
    "overflow: hidden",
    "background: #000",
  ].join(";");
  document.body.appendChild(host);
  const root: Root = createRoot(host);

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width: encodeWidth,
      height: encodeHeight,
      frameRate: fps,
    },
    fastStart: "in-memory",
  });

  let encoderError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
      console.error("[export-browser] VideoEncoder error", encoderError);
    },
  });

  try {
    encoder.configure({
      codec,
      width: encodeWidth,
      height: encodeHeight,
      bitrate,
      framerate: fps,
      bitrateMode: "variable",
      latencyMode: "quality",
    });
  } catch (configErr) {
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
    host.remove();
    try {
      encoder.close();
    } catch {
      /* ignore */
    }
    throw new Error(
      `VideoEncoder.configure failed: ${
        configErr instanceof Error ? configErr.message : String(configErr)
      }`,
    );
  }

  const microsPerFrame = Math.round(1_000_000 / fps);

  try {
    for (let frame = 0; frame < durationInFrames; frame++) {
      if (encoderError) throw encoderError;
      if (signal?.aborted) {
        throw new DOMException("Render cancelled by user", "AbortError");
      }

      await renderFrame(root, {
        component,
        inputProps,
        durationInFrames,
        fps,
        width,
        height,
        frame,
        extraPaintWait: options.extraPaintWait,
        firstFrame: frame === 0,
      });

      let canvas: HTMLCanvasElement;
      try {
        canvas = await html2canvas(host, {
          width,
          height,
          windowWidth: width,
          windowHeight: height,
          backgroundColor: "#000000",
          useCORS: true,
          allowTaint: true,
          logging: false,
          scale,
        });
      } catch (rasterErr) {
        throw new Error(
          `Snapshot to canvas failed at frame ${frame}: ${
            rasterErr instanceof Error ? rasterErr.message : String(rasterErr)
          }. Common cause: a tainted cross-origin image in the composition.`,
        );
      }

      try {
        const videoFrame = new VideoFrame(canvas, {
          timestamp: frame * microsPerFrame,
          duration: microsPerFrame,
        });
        encoder.encode(videoFrame, {
          keyFrame: frame % keyframeInterval === 0,
        });
        videoFrame.close();
      } catch (encErr) {
        throw new Error(
          `Encoding frame ${frame} failed: ${
            encErr instanceof Error ? encErr.message : String(encErr)
          }`,
        );
      }

      while (encoder.encodeQueueSize > 30) {
        await new Promise<void>((r) => setTimeout(r, 0));
      }

      onProgress?.((frame + 1) / durationInFrames);
    }

    await encoder.flush();
    if (encoderError) throw encoderError;
    encoder.close();

    muxer.finalize();
    const { buffer } = muxer.target;
    dlog("[export-browser] complete — mp4 bytes:", buffer.byteLength);
    return new Blob([buffer], { type: "video/mp4" });
  } finally {
    try {
      root.unmount();
    } catch {
      /* ignore */
    }
    host.remove();
  }
}

export function renderProjectInBrowser(
  opts: RenderProjectOptions,
): Promise<Blob> {
  const { project, onProgress, signal, options } = opts;
  return renderComponentInBrowser({
    component: ProjectComposition as ComponentType<Record<string, unknown>>,
    inputProps: project as unknown as Record<string, unknown>,
    durationInFrames: projectDuration(project),
    fps: project.fps,
    width: project.width,
    height: project.height,
    signal,
    onProgress,
    options,
  });
}

export function downloadMp4Blob(blob: Blob, filename = "project.mp4"): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ---------------------------------------------------------------------------
// Internals
// ---------------------------------------------------------------------------

type FrameArgs<P extends Record<string, unknown>> = {
  component: ComponentType<P>;
  inputProps: P;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  frame: number;
  extraPaintWait: boolean;
  firstFrame: boolean;
};

function renderFrame<P extends Record<string, unknown>>(
  root: Root,
  args: FrameArgs<P>,
): Promise<void> {
  const {
    component,
    inputProps,
    durationInFrames,
    fps,
    width,
    height,
    frame,
    extraPaintWait,
    firstFrame,
  } = args;

  root.render(
    <Thumbnail
      component={component}
      inputProps={inputProps}
      compositionWidth={width}
      compositionHeight={height}
      durationInFrames={durationInFrames}
      fps={fps}
      frameToDisplay={frame}
      style={{ width, height }}
      acknowledgeRemotionLicense
    />,
  );

  return new Promise<void>((resolve) => {
    requestAnimationFrame(async () => {
      if (firstFrame) {
        const fonts = (document as { fonts?: { ready: Promise<unknown> } })
          .fonts;
        if (fonts?.ready) {
          try {
            await fonts.ready;
          } catch {
            /* ignore */
          }
        }
      }
      if (extraPaintWait) {
        requestAnimationFrame(() => resolve());
      } else {
        resolve();
      }
    });
  });
}

async function pickSupportedAvc(
  width: number,
  height: number,
  bitrate: number,
  fps: number,
): Promise<string | null> {
  const candidates = ["avc1.640028", "avc1.640033", "avc1.4d0028"];
  for (const codec of candidates) {
    try {
      const probe = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        bitrate,
        framerate: fps,
      });
      if (probe.supported) return codec;
    } catch {
      /* try next */
    }
  }
  return null;
}

function clampEven(n: number): number {
  return n % 2 === 0 ? n : n + 1;
}
