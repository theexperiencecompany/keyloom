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

/** True when the browser can encode frames via WebCodecs. */
export function isWebCodecsSupported(): boolean {
  return (
    typeof window !== "undefined" &&
    typeof window.VideoEncoder === "function" &&
    typeof window.VideoFrame === "function"
  );
}

/** Seek a video to `time` and resolve once the frame is ready. Falls back on a
 * timer in case `seeked` never fires (e.g. currentTime already equals `time`). */
function seekVideo(video: HTMLVideoElement, time: number): Promise<void> {
  return new Promise((resolve) => {
    let settled = false;
    const done = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      video.removeEventListener("seeked", done);
      resolve();
    };
    const timer = setTimeout(done, 400);
    video.addEventListener("seeked", done);
    video.currentTime = time;
  });
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
  /** The subject clip; stepped frame-by-frame across its full duration. */
  video: HTMLVideoElement;
  /** Canvas holding the composited frame (background + subject + caption). */
  canvas: HTMLCanvasElement;
  width: number;
  height: number;
  /** Target frame rate — drives how many frames we step through. */
  fps: number;
  /** Composite the current video frame onto the canvas (e.g. `layer.draw()`). */
  drawFrame: () => void;
  onProgress?: (fraction: number) => void;
};

/**
 * Encode the full clip to an H.264 MP4 by playing it ONCE in real time and
 * encoding each frame the browser presents via `requestVideoFrameCallback` —
 * no per-frame seeking (which is what made this slow) and no ffmpeg. Bounded by
 * the clip's duration. We start from a clean seek to 0 so it never begins
 * mid-clip, and finalize on `ended` so it never truncates. Returns null if
 * WebCodecs / rVFC / a known duration isn't available (caller falls back to
 * `recordCanvas`).
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
  if (!isWebCodecsSupported()) return null;

  const duration = video.duration;
  if (!duration || !Number.isFinite(duration)) return null;

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

  const keyIntervalSec = 2; // keyframe every ~2s
  const rvfc = video as HTMLVideoElement & {
    requestVideoFrameCallback?: (
      cb: (now: number, meta: { mediaTime: number }) => void,
    ) => number;
  };
  // Without rVFC we can't grab every presented frame in real time — bail to the
  // MediaRecorder fallback.
  if (typeof rvfc.requestVideoFrameCallback !== "function") return null;

  // Start cleanly at the first frame so capture never begins mid-clip.
  video.pause();
  await seekVideo(video, 0);

  return new Promise<Blob | null>((resolve, reject) => {
    let finished = false;
    let lastKeyTime = -Infinity;
    let lastTs = -1;

    const finish = async () => {
      if (finished) return;
      finished = true;
      video.pause();
      try {
        await encoder.flush();
        if (encodeError) throw encodeError;
        muxer.finalize();
        resolve(new Blob([muxer.target.buffer], { type: "video/mp4" }));
      } catch (e) {
        reject(e);
      } finally {
        if (encoder.state !== "closed") encoder.close();
      }
    };

    // Encode each frame the browser presents during a single real-time playthrough.
    const onFrame = (_now: number, meta: { mediaTime: number }) => {
      if (finished) return;
      if (encodeError) {
        void finish();
        return;
      }
      const mediaTime = meta.mediaTime;
      let ts = Math.round(mediaTime * 1_000_000);
      if (ts <= lastTs) ts = lastTs + 1; // muxer needs strictly increasing ts
      lastTs = ts;

      drawFrame();
      const keyFrame =
        lastKeyTime < 0 || mediaTime - lastKeyTime >= keyIntervalSec;
      if (keyFrame) lastKeyTime = mediaTime;

      try {
        const frame = new VideoFrame(canvas, { timestamp: ts });
        encoder.encode(frame, { keyFrame });
        frame.close();
      } catch (e) {
        encodeError = e;
        void finish();
        return;
      }

      onProgress?.(Math.min(1, mediaTime / duration));

      if (video.ended) {
        void finish();
        return;
      }
      rvfc.requestVideoFrameCallback?.(onFrame);
    };

    video.addEventListener("ended", () => void finish(), { once: true });
    rvfc.requestVideoFrameCallback?.(onFrame);
    video.play().catch((e) => reject(e));
  });
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

/**
 * Mux the source clip's audio into an already-encoded (silent) MP4. The video is
 * stream-copied (no re-encode, so it's fast) and only the audio is transcoded to
 * AAC. Used after the WebCodecs path, which is video-only. Returns the original
 * blob unchanged if the source has no audio or muxing fails.
 */
export async function muxAudioFromSource(
  videoMp4: Blob,
  sourceUrl: string,
  volume = 1,
): Promise<Blob> {
  try {
    const ffmpeg = await getFFmpeg();
    await ffmpeg.writeFile("v.mp4", await fetchFile(videoMp4));
    await ffmpeg.writeFile("src", await fetchFile(sourceUrl));
    // Apply the volume level only when it's not unity, to avoid a needless filter.
    const volumeArgs =
      volume === 1 ? [] : ["-filter:a", `volume=${volume.toFixed(3)}`];
    await ffmpeg.exec([
      "-i",
      "v.mp4",
      "-i",
      "src",
      "-map",
      "0:v:0",
      "-map",
      "1:a:0", // fails the exec if the source has no audio → caught below
      "-c:v",
      "copy",
      ...volumeArgs,
      "-c:a",
      "aac",
      "-shortest",
      "-movflags",
      "+faststart",
      "out.mp4",
    ]);
    const data = await ffmpeg.readFile("out.mp4");
    await ffmpeg.deleteFile("v.mp4").catch(() => {});
    await ffmpeg.deleteFile("src").catch(() => {});
    await ffmpeg.deleteFile("out.mp4").catch(() => {});
    const bytes = data as Uint8Array;
    return new Blob([new Uint8Array(bytes)], { type: "video/mp4" });
  } catch (err) {
    console.warn("Audio mux failed; exporting without audio:", err);
    return videoMp4;
  }
}

/** Whether a clip carries an audio track we can play back / include in export. */
export function hasAudioTrack(video: HTMLVideoElement): boolean {
  try {
    const stream = (
      video as HTMLVideoElement & { captureStream?: () => MediaStream }
    ).captureStream?.();
    return !!stream && stream.getAudioTracks().length > 0;
  } catch {
    return false;
  }
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
