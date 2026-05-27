"use client";

import {
  CloudUploadIcon,
  Mic01Icon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player } from "@remotion/player";
import { ASPECT_DIMENSIONS } from "@workspace/compositions/compositions/TikTokCaption/config";
import {
  TIKTOK_CAPTION_DEFAULT_DURATION,
  TIKTOK_CAPTION_FPS,
} from "@workspace/compositions/compositions/TikTokCaption/meta";
import {
  type CaptionWord,
  TikTokCaption,
} from "@workspace/compositions/compositions/TikTokCaption/TikTokCaption";
import { Button } from "@workspace/ui/components/button";
import { useRef, useState } from "react";
import type { TranscribeResponse } from "@/app/api/shorts/transcribe/route";

const PLACEHOLDER_WORDS: CaptionWord[] = [
  { start: 0.0, end: 0.45, text: "drop" },
  { start: 0.45, end: 0.9, text: "your" },
  { start: 0.9, end: 1.5, text: "mp3" },
  { start: 1.5, end: 2.2, text: "below" },
];

const PLACEHOLDER_DURATION = TIKTOK_CAPTION_DEFAULT_DURATION;
const { width: WIDTH, height: HEIGHT } = ASPECT_DIMENSIONS["9:16"];

type Stage = "idle" | "uploading" | "ready" | "error";

export function CaptionTitlePlayer() {
  const inputRef = useRef<HTMLInputElement>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [fileName, setFileName] = useState<string | null>(null);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const [dragging, setDragging] = useState(false);

  async function handleFile(file: File) {
    setFileName(file.name);
    setStage("uploading");
    setError(null);
    setResult(null);

    const body = new FormData();
    body.append("file", file);

    try {
      const res = await fetch("/api/shorts/transcribe", {
        method: "POST",
        body,
      });
      const data = (await res.json().catch(() => ({}))) as
        | TranscribeResponse
        | { error?: string };
      if (!res.ok || "error" in data) {
        throw new Error(
          ("error" in data && data.error) || `HTTP ${res.status}`,
        );
      }
      setResult(data as TranscribeResponse);
      setStage("ready");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Transcription failed");
      setStage("error");
    }
  }

  function reset() {
    setStage("idle");
    setResult(null);
    setError(null);
    setFileName(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  const previewWords = result?.words ?? PLACEHOLDER_WORDS;
  const previewAudio = result?.audioUrl;
  const durationInFrames = result
    ? Math.max(60, Math.ceil((result.duration + 0.5) * TIKTOK_CAPTION_FPS))
    : PLACEHOLDER_DURATION;

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-[1fr_360px]">
      {/* Player */}
      <div
        className="overflow-hidden rounded-xl border border-border bg-black"
        style={{ aspectRatio: `${WIDTH} / ${HEIGHT}` }}
      >
        <Player
          component={TikTokCaption}
          inputProps={{
            words: previewWords,
            audioUrl: previewAudio,
            captionVAlign: "center",
            captionHAlign: "center",
            fontScale: 1,
            clipStyle: {
              backgroundColor: "#0a0a0f",
              textColor: "#ffffff",
              accentColor: "#22d3ee",
            },
          }}
          durationInFrames={durationInFrames}
          fps={TIKTOK_CAPTION_FPS}
          compositionWidth={WIDTH}
          compositionHeight={HEIGHT}
          style={{ width: "100%", height: "100%" }}
          controls
          loop
          // Pre-upload preview should loop muted; once we have user audio it
          // starts paused so the user explicitly hits play.
          autoPlay={!result}
          initiallyMuted={!result}
          acknowledgeRemotionLicense
        />
      </div>

      {/* Right column — upload & state */}
      <div className="flex flex-col gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm font-medium">
            <HugeiconsIcon icon={Mic01Icon} size={16} />
            <span>Voice → caption title</span>
          </div>
          <p className="text-[12px] leading-relaxed text-muted-foreground">
            Drop an MP3 of your voiceover. Whisper transcribes it with
            word-level timestamps and the TikTok-style caption tracks your audio
            in real time.
          </p>
        </div>

        <label
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            const f = e.dataTransfer.files?.[0];
            if (f) void handleFile(f);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center gap-2 rounded-lg border-2 border-dashed px-4 py-8 text-center transition-colors ${
            dragging
              ? "border-foreground/50 bg-accent/30"
              : "border-border bg-muted/10 hover:bg-muted/20"
          }`}
        >
          <HugeiconsIcon
            icon={CloudUploadIcon}
            className="size-6 text-muted-foreground"
          />
          {fileName ? (
            <p className="text-[12px]">
              <span className="font-medium">{fileName}</span>
            </p>
          ) : (
            <p className="text-[12px] text-muted-foreground">
              Drop an MP3 here or click to browse
            </p>
          )}
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground/60">
            up to 25 MB · mp3, wav, m4a
          </p>
          <input
            ref={inputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            onChange={(e) => {
              const f = e.target.files?.[0];
              if (f) void handleFile(f);
            }}
          />
        </label>

        {stage === "uploading" && (
          <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[12px]">
            Transcribing… this takes a few seconds.
          </div>
        )}

        {stage === "error" && error && (
          <div className="space-y-2">
            <div className="rounded-md border border-destructive/40 bg-destructive/10 px-3 py-2 text-[12px] text-destructive">
              {error}
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <HugeiconsIcon icon={RefreshIcon} size={13} /> Try another file
            </Button>
          </div>
        )}

        {stage === "ready" && result && (
          <div className="space-y-3">
            <div className="rounded-md border border-border bg-muted/30 px-3 py-2 text-[12px]">
              <div className="flex items-center justify-between">
                <span className="font-medium">Transcribed</span>
                <span className="text-muted-foreground tabular-nums">
                  {result.duration.toFixed(1)}s · {result.words.length} words
                </span>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={reset}>
              <HugeiconsIcon icon={RefreshIcon} size={13} /> Try another file
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
