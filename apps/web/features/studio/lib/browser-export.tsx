"use client";

/**
 * Fully in-browser MP4 exporter for the Motion Studio.
 *
 * Pipeline:
 *   1. Mount a hidden React tree containing Remotion's <Thumbnail> sized to
 *      the composition's native resolution.
 *   2. For each frame i in [0, durationInFrames), remount the Thumbnail
 *      with `frameToDisplay={i}`, wait for paint, then snapshot the DOM to
 *      a canvas with `html-to-image`.
 *   3. Feed each canvas as a `VideoFrame` into WebCodecs' `VideoEncoder`,
 *      which produces H.264 chunks that we feed into `mp4-muxer`.
 *   4. Finalize the muxer to get an MP4 ArrayBuffer and trigger a download.
 *
 * No server, no ffmpeg.wasm. Requires browser WebCodecs (Chrome, Edge,
 * Safari 17+, Firefox 130+).
 */

import { Thumbnail } from "@remotion/player";
import { ProjectComposition } from "@workspace/compositions/compositions/Project/Project";
import type { Project } from "@workspace/compositions/project";
import { projectDuration } from "@workspace/compositions/project";
import { toCanvas } from "html-to-image";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import type { ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";

export type ExportProgressCallback = (progress: number) => void;

type BaseExportOptions = {
  onProgress?: ExportProgressCallback;
  /** Override H.264 bitrate. Defaults to 8 Mbps. */
  bitrate?: number;
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

const DEFAULT_BITRATE = 8_000_000;

/**
 * True when WebCodecs `VideoEncoder` and `VideoFrame` are available.
 * We can't statically guarantee AVC support without a runtime probe, but
 * `VideoEncoder.isConfigSupported` is async — use `checkAvcSupport()` for
 * the strict check.
 */
export function isBrowserExportSupported(): boolean {
  if (typeof window === "undefined") return false;
  if (
    typeof (window as unknown as { VideoEncoder?: unknown }).VideoEncoder ===
    "undefined"
  ) {
    return false;
  }
  if (
    typeof (window as unknown as { VideoFrame?: unknown }).VideoFrame ===
    "undefined"
  ) {
    return false;
  }
  return true;
}

/**
 * Render any Remotion-compatible component in the browser and return a
 * Blob containing the resulting MP4 file. Throws on unsupported browsers
 * or encoder errors.
 */
export async function renderComponentInBrowser<
  P extends Record<string, unknown>,
>(options: RenderComponentOptions<P>): Promise<Blob> {
  const {
    component,
    inputProps,
    durationInFrames,
    fps,
    width,
    height,
    onProgress,
    bitrate = DEFAULT_BITRATE,
  } = options;

  if (!isBrowserExportSupported()) {
    throw new Error(
      "Your browser does not support in-browser MP4 export (WebCodecs unavailable). Try the latest Chrome or Edge.",
    );
  }

  // ---------------------------------------------------------------------
  // 1. Set up the offscreen mount point.
  //
  // We render at the native pixel dimensions and pin the container off
  // the viewport but still painted. html-to-image needs the node to be
  // laid out. Using `opacity: 0` + `pointer-events: none` rather than
  // `display: none` so children actually render.
  // ---------------------------------------------------------------------
  const host = document.createElement("div");
  host.setAttribute("data-motion-studio-export", "true");
  host.style.cssText = [
    "position: fixed",
    "top: 0",
    "left: 0",
    `width: ${width}px`,
    `height: ${height}px`,
    "pointer-events: none",
    "opacity: 0",
    "z-index: -1",
    "overflow: hidden",
    "contain: strict",
  ].join(";");
  document.body.appendChild(host);
  const root: Root = createRoot(host);

  // ---------------------------------------------------------------------
  // 2. Configure the MP4 muxer + WebCodecs encoder.
  // ---------------------------------------------------------------------
  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: {
      codec: "avc",
      width,
      height,
      frameRate: fps,
    },
    fastStart: "in-memory",
  });

  let encoderError: Error | null = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encoderError = e instanceof Error ? e : new Error(String(e));
    },
  });

  // H.264 High profile, level 5.1 — supports 1080p60 and beyond. Browsers
  // will negotiate down if the exact level isn't supported.
  encoder.configure({
    codec: "avc1.640033",
    width,
    height,
    bitrate,
    framerate: fps,
    bitrateMode: "variable",
    latencyMode: "quality",
  });

  // ---------------------------------------------------------------------
  // 3. Frame loop. Remotion's <Thumbnail> renders a single static frame
  //    based on its `frameToDisplay` prop, so we just remount it for each
  //    frame index.
  // ---------------------------------------------------------------------
  const microsPerFrame = Math.round(1_000_000 / fps);

  try {
    for (let frame = 0; frame < durationInFrames; frame++) {
      if (encoderError) throw encoderError;

      await renderFrame(root, {
        component,
        inputProps,
        durationInFrames,
        fps,
        width,
        height,
        frame,
      });

      const canvas = await toCanvas(host, {
        width,
        height,
        canvasWidth: width,
        canvasHeight: height,
        pixelRatio: 1,
        cacheBust: false,
        skipFonts: false,
      });

      const videoFrame = new VideoFrame(canvas, {
        timestamp: frame * microsPerFrame,
        duration: microsPerFrame,
      });

      // Force a keyframe once per second so the resulting MP4 has
      // reasonable seek points.
      const keyFrame = frame % fps === 0;
      encoder.encode(videoFrame, { keyFrame });
      videoFrame.close();

      // Crude back-pressure so we don't pile up frames in the encoder
      // queue on a slower machine.
      if (encoder.encodeQueueSize > 30) {
        await waitForQueue(encoder, 10);
      }

      onProgress?.((frame + 1) / durationInFrames);
    }

    await encoder.flush();
    if (encoderError) throw encoderError;
    encoder.close();

    muxer.finalize();
    const { buffer } = muxer.target;
    return new Blob([buffer], { type: "video/mp4" });
  } finally {
    try {
      root.unmount();
    } catch {
      // ignore
    }
    host.remove();
  }
}

/**
 * Convenience wrapper that renders the Motion Studio's Project composition
 * with the supplied project state.
 */
export function renderProjectInBrowser(
  options: RenderProjectOptions,
): Promise<Blob> {
  const { project, onProgress, bitrate } = options;
  return renderComponentInBrowser({
    component: ProjectComposition as ComponentType<Record<string, unknown>>,
    inputProps: project as unknown as Record<string, unknown>,
    durationInFrames: projectDuration(project),
    fps: project.fps,
    width: project.width,
    height: project.height,
    onProgress,
    bitrate,
  });
}

/**
 * Trigger a browser download for an MP4 Blob.
 */
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

type FrameMountArgs<P extends Record<string, unknown>> = {
  component: ComponentType<P>;
  inputProps: P;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  frame: number;
};

function renderFrame<P extends Record<string, unknown>>(
  root: Root,
  args: FrameMountArgs<P>,
): Promise<void> {
  const { component, inputProps, durationInFrames, fps, width, height, frame } =
    args;
  return new Promise<void>((resolve) => {
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

    // Wait for two rAFs — first commits React, second commits paint.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => resolve());
    });
  });
}

async function waitForQueue(
  encoder: VideoEncoder,
  threshold: number,
): Promise<void> {
  while (encoder.encodeQueueSize > threshold) {
    await new Promise<void>((r) => setTimeout(r, 0));
  }
}
