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
import html2canvas from "html2canvas-pro";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";
import type { ComponentType } from "react";
import { createRoot, type Root } from "react-dom/client";

export type ExportProgressCallback = (progress: number) => void;

type BaseExportOptions = {
  onProgress?: ExportProgressCallback;
  /** Override H.264 bitrate. Defaults to 8 Mbps. */
  bitrate?: number;
  /** Cancel the render mid-way. Checked between frames. */
  signal?: AbortSignal;
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
    signal,
  } = options;

  console.info("[export] start", {
    width,
    height,
    fps,
    durationInFrames,
    bitrate,
  });

  if (!isBrowserExportSupported()) {
    throw new Error(
      "Your browser does not support in-browser MP4 export (WebCodecs unavailable). Try the latest Chrome or Edge.",
    );
  }

  // Probe codec support so we fail with a clear message instead of a
  // cryptic "Failed to execute 'configure' on 'VideoEncoder'".
  let avcSupported = false;
  try {
    const probe = await VideoEncoder.isConfigSupported({
      codec: "avc1.640033",
      width,
      height,
      bitrate,
      framerate: fps,
    });
    avcSupported = probe.supported === true;
    console.info("[export] codec probe", probe);
  } catch (probeErr) {
    console.warn("[export] codec probe threw", probeErr);
  }
  if (!avcSupported) {
    throw new Error(
      `H.264 (avc1.640033) at ${width}x${height}@${fps}fps is not supported by this browser's VideoEncoder. Try Chrome/Edge with hardware acceleration enabled.`,
    );
  }

  // ---------------------------------------------------------------------
  // 1. Set up the offscreen mount point.
  //
  // html-to-image serializes the node's inline styles into an SVG <foreignObject>
  // and rasterizes that. If we set `opacity: 0` on the host, the captured SVG
  // is transparent — every frame renders as a black VideoFrame. Instead we
  // shove the host fully off the viewport with `left: -100000px` so it's
  // still painted at full opacity and the rasterizer reads real pixels.
  // ---------------------------------------------------------------------
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
      console.error("[export] VideoEncoder error", encoderError);
    },
  });

  try {
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
    console.info("[export] encoder configured");
  } catch (configErr) {
    console.error("[export] encoder.configure threw", configErr);
    throw new Error(
      `VideoEncoder.configure failed: ${
        configErr instanceof Error ? configErr.message : String(configErr)
      }`,
    );
  }

  // ---------------------------------------------------------------------
  // 3. Frame loop. Remotion's <Thumbnail> renders a single static frame
  //    based on its `frameToDisplay` prop, so we just remount it for each
  //    frame index.
  // ---------------------------------------------------------------------
  const microsPerFrame = Math.round(1_000_000 / fps);

  try {
    for (let frame = 0; frame < durationInFrames; frame++) {
      if (encoderError) throw encoderError;
      if (signal?.aborted) {
        throw new DOMException("Render cancelled by user", "AbortError");
      }

      try {
        await renderFrame(root, {
          component,
          inputProps,
          durationInFrames,
          fps,
          width,
          height,
          frame,
        });
      } catch (renderErr) {
        console.error("[export] renderFrame failed at frame", frame, renderErr);
        throw new Error(
          `Failed to render frame ${frame}/${durationInFrames}: ${
            renderErr instanceof Error ? renderErr.message : String(renderErr)
          }`,
        );
      }

      let canvas: HTMLCanvasElement;
      try {
        // html2canvas-pro walks the DOM and paints each node onto a
        // canvas2d surface directly. Unlike html-to-image's SVG +
        // <foreignObject> approach, it doesn't depend on browsers
        // accepting drawImage of a tainted SVG, which is silently
        // refused in modern Chrome — producing all-black frames.
        canvas = await html2canvas(host, {
          width,
          height,
          windowWidth: width,
          windowHeight: height,
          backgroundColor: "#000000",
          useCORS: true,
          allowTaint: true,
          logging: false,
          scale: 1,
        });
      } catch (rasterErr) {
        console.error("[export] toCanvas failed at frame", frame, rasterErr);
        throw new Error(
          `Snapshot to canvas failed at frame ${frame}: ${
            rasterErr instanceof Error ? rasterErr.message : String(rasterErr)
          }. Common cause: a tainted cross-origin image in the composition.`,
        );
      }

      if (frame === 0 || frame === Math.floor(durationInFrames / 2)) {
        try {
          const ctx = canvas.getContext("2d");
          if (ctx) {
            const cx = Math.floor(canvas.width / 2);
            const cy = Math.floor(canvas.height / 2);
            const px = ctx.getImageData(cx, cy, 1, 1).data;
            const hostRect = host.getBoundingClientRect();
            const firstChild = host.firstElementChild as HTMLElement | null;
            console.info(
              `[export] frame ${frame} center pixel rgba(${px[0]},${px[1]},${px[2]},${px[3]}) | host size=${hostRect.width}x${hostRect.height} pos=${hostRect.left},${hostRect.top} children=${host.children.length} firstChild=<${firstChild?.tagName ?? "none"}> innerSize=${firstChild?.offsetWidth ?? 0}x${firstChild?.offsetHeight ?? 0} html=${host.innerHTML.length}b`,
            );
          }
        } catch (sampleErr) {
          console.warn("[export] pixel sample failed", sampleErr);
        }
      }

      try {
        const videoFrame = new VideoFrame(canvas, {
          timestamp: frame * microsPerFrame,
          duration: microsPerFrame,
        });

        // Force a keyframe once per second so the resulting MP4 has
        // reasonable seek points.
        const keyFrame = frame % fps === 0;
        encoder.encode(videoFrame, { keyFrame });
        videoFrame.close();
      } catch (encErr) {
        console.error("[export] encoder.encode failed at frame", frame, encErr);
        throw new Error(
          `Encoding frame ${frame} failed: ${
            encErr instanceof Error ? encErr.message : String(encErr)
          }`,
        );
      }

      // Crude back-pressure so we don't pile up frames in the encoder
      // queue on a slower machine.
      if (encoder.encodeQueueSize > 30) {
        await waitForQueue(encoder, 10);
      }

      onProgress?.((frame + 1) / durationInFrames);

      if (frame === 0 || frame % Math.max(1, Math.floor(fps)) === 0) {
        console.debug(
          "[export] frame",
          frame + 1,
          "/",
          durationInFrames,
          "queueSize=",
          encoder.encodeQueueSize,
        );
      }
    }

    console.info("[export] flushing encoder");
    await encoder.flush();
    if (encoderError) throw encoderError;
    encoder.close();

    muxer.finalize();
    const { buffer } = muxer.target;
    console.info("[export] complete — mp4 bytes:", buffer.byteLength);
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
  const { project, onProgress, bitrate, signal } = options;
  return renderComponentInBrowser({
    component: ProjectComposition as ComponentType<Record<string, unknown>>,
    inputProps: project as unknown as Record<string, unknown>,
    durationInFrames: projectDuration(project),
    fps: project.fps,
    width: project.width,
    height: project.height,
    signal,
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
