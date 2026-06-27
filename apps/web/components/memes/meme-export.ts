/**
 * In-browser export. Captures the live preview canvas (which already composites
 * background + subject + caption via drawMemeFrame) with MediaRecorder, then
 * converts the WebM to MP4 with ffmpeg.wasm. No server.
 *
 * The recording runs in real time (one playthrough of the clip). For short meme
 * clips that's fine; swap to a WebCodecs frame-stepper later if you want faster.
 */

import { FFmpeg } from "@ffmpeg/ffmpeg";
import { fetchFile, toBlobURL } from "@ffmpeg/util";

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
