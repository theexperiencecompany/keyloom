/**
 * In-browser export. Two paths:
 *
 * 1. `encodePlaythroughToMp4` (preferred) — captures one playthrough of the clip
 *    via `requestVideoFrameCallback` straight into a WebCodecs `VideoEncoder`,
 *    muxed to MP4 with mp4-muxer. Every decoded frame is encoded exactly once
 *    (no dropped frames), there's no per-frame seeking, and no ffmpeg. This is
 *    the fast path that replaces the old "screen recording" approach.
 *
 * 2. `recordCanvas` + `webmToMp4` (fallback) — real-time MediaRecorder capture
 *    of the canvas stream, then WebM→MP4 via ffmpeg.wasm. Used only when the
 *    fast path is unsupported, or when the clip has audio (the WebCodecs path is
 *    video-only for now).
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";
import { ArrayBufferTarget, Muxer } from "mp4-muxer";

// Minimal shape of requestVideoFrameCallback — typed loosely so we don't depend
// on the exact lib.dom version shipping these definitions.
type FrameMeta = { mediaTime: number };
type RVFCVideo = HTMLVideoElement & {
  requestVideoFrameCallback?: (
    cb: (now: number, meta: FrameMeta) => void,
  ) => number;
};

/** True when the browser can encode frames deterministically via WebCodecs. */
export function isWebCodecsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.VideoEncoder === "function" &&
    typeof window.VideoFrame === "function"
  );
}

/** True when the fast frame-callback + WebCodecs export path is available. */
export function isFastExportSupported(): boolean {
  return (
    isWebCodecsSupported() &&
    typeof HTMLVideoElement !== "undefined" &&
    "requestVideoFrameCallback" in HTMLVideoElement.prototype
  );
}

// H.264 profiles to try, best first: High → Main → Baseline. The first one the
// platform reports as supported at our resolution/fps wins.
const H264_CODECS = ["avc1.640028", "avc1.4d0028", "avc1.42e028"];

async function pickH264Codec(
  width: number,
  height: number,
  framerate: number,
  bitrate: number,
): Promise<string | null> {
  for (const codec of H264_CODECS) {
    try {
      const { supported } = await VideoEncoder.isConfigSupported({
        codec,
        width,
        height,
        framerate,
        bitrate,
      });
      if (supported) return codec;
    } catch {
      // isConfigSupported can throw on malformed codec strings — keep trying.
    }
  }
  return null;
}

export type PlaythroughOptions = {
  /** The subject clip. Plays once; each presented frame is captured. */
  video: HTMLVideoElement;
  /** Canvas holding the composited frame (background + subject + caption). */
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  /** Target frame rate — used for keyframe spacing and frame duration. */
  fps: number;
  /** Composite the current video frame onto the canvas (e.g. `layer.draw()`). */
  drawFrame: () => void;
  onProgress?: (fraction: number) => void;
};

/**
 * Play the clip once and encode every presented frame to an H.264 MP4 — no
 * seeking, no ffmpeg. Returns null if the fast path isn't available (caller
 * should fall back to `recordCanvas`).
 */
export async function encodePlaythroughToMp4({
  video,
  canvas,
  width,
  height,
  fps,
  drawFrame,
  onProgress,
}: PlaythroughOptions): Promise<Blob | null> {
  if (!isFastExportSupported()) return null;
  const rvfcVideo = video as RVFCVideo;
  if (!rvfcVideo.requestVideoFrameCallback) return null;

  // Encode at the canvas's REAL pixel size, not the logical 1080x1920. Konva may
  // back the canvas at devicePixelRatio (2-3x on phones/retina); if the encoder
  // dims don't match the frame, the output gets cropped/letterboxed to the wrong
  // aspect. H.264 needs even dimensions, so round down to even.
  const w = (canvas.width || width) & ~1;
  const h = (canvas.height || height) & ~1;

  const bitrate = 8_000_000;
  const codec = await pickH264Codec(w, h, fps, bitrate);
  if (!codec) return null;

  const muxer = new Muxer({
    target: new ArrayBufferTarget(),
    video: { codec: "avc", width: w, height: h },
    fastStart: "in-memory",
  });

  let encodeError: unknown = null;
  const encoder = new VideoEncoder({
    output: (chunk, meta) => muxer.addVideoChunk(chunk, meta),
    error: (e) => {
      encodeError = e;
    },
  });
  encoder.configure({ codec, width: w, height: h, framerate: fps, bitrate });

  const frameDuration = Math.round(1_000_000 / fps); // microseconds
  const keyEvery = Math.max(1, fps * 2); // keyframe every ~2s
  const duration = video.duration || 0;

  try {
    await new Promise<void>((resolve, reject) => {
      let frameIndex = 0;
      let lastTs = -1;
      let done = false;

      const finish = () => {
        if (done) return;
        done = true;
        video.removeEventListener("ended", finish);
        resolve();
      };

      const onFrame = (_now: number, meta: FrameMeta) => {
        if (done) return;
        try {
          if (encodeError) throw encodeError;
          drawFrame();
          // Strictly-increasing microsecond timestamp from the frame's own
          // presentation time, so the MP4 plays back at the right speed.
          let ts = Math.round(meta.mediaTime * 1_000_000);
          if (ts <= lastTs) ts = lastTs + frameDuration;
          lastTs = ts;
          const frame = new VideoFrame(canvas, {
            timestamp: ts,
            duration: frameDuration,
          });
          encoder.encode(frame, { keyFrame: frameIndex % keyEvery === 0 });
          frame.close();
          frameIndex++;
          if (duration) {
            onProgress?.(Math.min(1, meta.mediaTime / duration));
          }
          rvfcVideo.requestVideoFrameCallback?.(onFrame);
        } catch (e) {
          done = true;
          video.removeEventListener("ended", finish);
          reject(e);
        }
      };

      video.addEventListener("ended", finish);
      video.currentTime = 0;
      rvfcVideo.requestVideoFrameCallback?.(onFrame);
      video.play().catch(reject);
    });

    await encoder.flush();
    if (encodeError) throw encodeError;
    muxer.finalize();
    return new Blob([muxer.target.buffer], { type: "video/mp4" });
  } finally {
    if (encoder.state !== "closed") encoder.close();
  }
}

// Single-threaded core — no SharedArrayBuffer, so no COOP/COEP headers needed.
const CORE_BASE = "https://unpkg.com/@ffmpeg/core@0.12.6/dist/umd";

let ffmpegPromise: Promise<FFmpeg> | null = null;

async function getFFmpeg(onLog?: (msg: string) => void): Promise<FFmpeg> {
  if (!ffmpegPromise) {
    ffmpegPromise = (async () => {
      const ffmpeg = new FFmpeg();
      if (onLog) ffmpeg.on("log", ({ message }) => onLog(message));
      await ffmpeg.load({
        coreURL: await toBlobURL(
          `${CORE_BASE}/ffmpeg-core.js`,
          "text/javascript",
        ),
        wasmURL: await toBlobURL(
          `${CORE_BASE}/ffmpeg-core.wasm`,
          "application/wasm",
        ),
      });
      return ffmpeg;
    })();
  }
  return ffmpegPromise;
}

function pickWebmMime(): string {
  const candidates = [
    "video/webm;codecs=vp9,opus",
    "video/webm;codecs=vp8,opus",
    "video/webm",
  ];
  for (const c of candidates) {
    if (MediaRecorder.isTypeSupported(c)) return c;
  }
  return "video/webm";
}

export type RecordOptions = {
  canvas: HTMLCanvasElement;
  /** The subject <video> — drives duration and (optionally) audio. */
  video: HTMLVideoElement;
  fps?: number;
  withAudio?: boolean;
  /** Re-runs the draw loop against the playing video while recording. */
  onTick: () => void;
};

/** Play the clip once, recording the canvas to a WebM blob. */
export function recordCanvas({
  canvas,
  video,
  fps = 30,
  withAudio = true,
  onTick,
}: RecordOptions): Promise<Blob> {
  return new Promise((resolve, reject) => {
    let raf = 0;
    const stream = canvas.captureStream(fps);

    if (withAudio) {
      try {
        const audioStream = (
          video as HTMLVideoElement & { captureStream?: () => MediaStream }
        ).captureStream?.();
        const track = audioStream?.getAudioTracks()[0];
        if (track) stream.addTrack(track);
      } catch {
        // No audio capture available — export silently without it.
      }
    }

    const recorder = new MediaRecorder(stream, {
      mimeType: pickWebmMime(),
      videoBitsPerSecond: 8_000_000,
    });
    const chunks: BlobPart[] = [];
    recorder.ondataavailable = (e) => {
      if (e.data.size > 0) chunks.push(e.data);
    };
    recorder.onerror = (e) => {
      cancelAnimationFrame(raf);
      reject((e as ErrorEvent).error ?? new Error("Recording failed"));
    };
    recorder.onstop = () => {
      cancelAnimationFrame(raf);
      resolve(new Blob(chunks, { type: "video/webm" }));
    };

    const loop = () => {
      onTick();
      raf = requestAnimationFrame(loop);
    };

    const finish = () => {
      video.removeEventListener("ended", finish);
      if (recorder.state !== "inactive") recorder.stop();
    };

    video.addEventListener("ended", finish);
    video.currentTime = 0;
    video.play().then(
      () => {
        recorder.start();
        loop();
      },
      (err) => {
        video.removeEventListener("ended", finish);
        reject(err);
      },
    );
  });
}

/** Convert a captured WebM blob to an H.264/AAC MP4 via ffmpeg.wasm. */
export async function webmToMp4(
  webm: Blob,
  onLog?: (msg: string) => void,
): Promise<Blob> {
  const ffmpeg = await getFFmpeg(onLog);
  await ffmpeg.writeFile("in.webm", await fetchFile(webm));
  await ffmpeg.exec([
    "-i",
    "in.webm",
    "-c:v",
    "libx264",
    "-pix_fmt",
    "yuv420p",
    "-preset",
    "veryfast",
    "-crf",
    "23",
    "-c:a",
    "aac",
    "-movflags",
    "+faststart",
    "out.mp4",
  ]);
  const data = await ffmpeg.readFile("out.mp4");
  await ffmpeg.deleteFile("in.webm").catch(() => {});
  await ffmpeg.deleteFile("out.mp4").catch(() => {});
  // data is a Uint8Array; wrap a fresh copy so the buffer is a plain ArrayBuffer.
  const bytes = data as Uint8Array;
  return new Blob([new Uint8Array(bytes)], { type: "video/mp4" });
}

export function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}
