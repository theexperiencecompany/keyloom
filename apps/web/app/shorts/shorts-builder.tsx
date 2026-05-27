"use client";

import { CloudUploadIcon, Mic01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player } from "@remotion/player";
import {
  ASPECT_DIMENSIONS,
  type AspectRatio,
  DEFAULT_FONT_KEY,
  FONT_KEYS,
  FONTS,
  type FontKey,
  H_ALIGNS,
  type HAlign,
  V_ALIGNS,
  type VAlign,
} from "@workspace/compositions/compositions/TikTokCaption/config";
import { TIKTOK_CAPTION_FPS } from "@workspace/compositions/compositions/TikTokCaption/meta";
import { TikTokCaption } from "@workspace/compositions/compositions/TikTokCaption/TikTokCaption";
import { Button } from "@workspace/ui/components/button";
import { cn } from "@workspace/ui/lib/utils";
import { useRef, useState } from "react";
import { toast } from "sonner";
import type {
  CaptionWord,
  TranscribeResponse,
} from "../api/shorts/transcribe/route";

type Stage = "idle" | "uploading" | "ready" | "error";
type BgMode = "transparent" | "solid";

const FONT_PRESETS: { label: string; value: number; previewPx: number }[] = [
  { label: "Small", value: 0.7, previewPx: 11 },
  { label: "Medium", value: 1.0, previewPx: 14 },
  { label: "Large", value: 1.3, previewPx: 17 },
  { label: "Huge", value: 1.6, previewPx: 20 },
];

const PLACEHOLDER_WORDS: CaptionWord[] = [
  { start: 0, end: 0.45, text: "drop" },
  { start: 0.45, end: 0.9, text: "an" },
  { start: 0.9, end: 1.5, text: "mp3" },
  { start: 1.5, end: 2.1, text: "below" },
];

export function ShortsBuilder() {
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<TranscribeResponse | null>(null);
  const [stage, setStage] = useState<Stage>("idle");
  const [error, setError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const [aspectRatio, setAspectRatio] = useState<AspectRatio>("9:16");
  const [bgMode, setBgMode] = useState<BgMode>("solid");
  const [bgColor, setBgColor] = useState<string>("#0a0a0f");
  const [textColor, setTextColor] = useState<string>("#ffffff");
  const [accentColor, setAccentColor] = useState<string>("#22d3ee");
  const [vAlign, setVAlign] = useState<VAlign>("center");
  const [hAlign, setHAlign] = useState<HAlign>("center");
  const [fontScale, setFontScale] = useState<number>(1);
  const [fontKey, setFontKey] = useState<FontKey>(DEFAULT_FONT_KEY);

  const inputRef = useRef<HTMLInputElement>(null);

  async function handleFile(f: File) {
    setFile(f);
    setStage("uploading");
    setError(null);
    setResult(null);

    const body = new FormData();
    body.append("file", f);

    try {
      const res = await fetch("/api/shorts/transcribe", {
        method: "POST",
        body,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        const message = err.error ?? `Request failed with ${res.status}`;
        setError(message);
        setStage("error");
        toast.error(message);
        return;
      }
      const data = (await res.json()) as TranscribeResponse;
      setResult(data);
      setStage("ready");
      toast.success(`Transcribed ${data.words.length} words`);
    } catch (e) {
      const message = e instanceof Error ? e.message : "Upload failed";
      setError(message);
      setStage("error");
      toast.error(message);
    }
  }

  const dims = ASPECT_DIMENSIONS[aspectRatio];
  const durationFrames = result
    ? Math.max(
        TIKTOK_CAPTION_FPS,
        Math.ceil((result.duration + 0.5) * TIKTOK_CAPTION_FPS),
      )
    : TIKTOK_CAPTION_FPS * 5;

  const previewMaxWidth = aspectRatio === "9:16" ? 360 : 720;
  const isTransparent = bgMode === "transparent";

  const clipStyle = {
    background: isTransparent ? "transparent" : bgColor,
    color: textColor,
    fontFamily: FONTS[fontKey].cssFamily,
    accent: accentColor,
  };

  return (
    <div className="grid gap-8">
      <Card
        title="1. Upload audio"
        hint="MP3, WAV, M4A, OGG or WEBM — max 25 MB (Whisper's limit)."
      >
        <DropZone
          file={file}
          dragging={dragging}
          onDrag={setDragging}
          uploading={stage === "uploading"}
          inputRef={inputRef}
          onFile={handleFile}
        />
        {error ? (
          <p className="mt-3 rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {error}
          </p>
        ) : null}
        {stage === "uploading" ? (
          <p className="mt-3 text-sm text-muted-foreground">
            Transcribing with Whisper…
          </p>
        ) : null}
      </Card>

      {result ? (
        <>
          <Card
            title="2. Caption style"
            hint="All of this updates the preview live. Nothing renders server-side until you export."
          >
            <div className="space-y-6">
              <Field
                label="Aspect ratio"
                hint="9:16 for TikTok/Reels/Shorts. 16:9 for YouTube/horizontal."
              >
                <SegmentedGroup>
                  <Segmented
                    selected={aspectRatio === "9:16"}
                    onClick={() => setAspectRatio("9:16")}
                  >
                    <AspectIcon ratio="9:16" />
                    9:16 · Vertical
                  </Segmented>
                  <Segmented
                    selected={aspectRatio === "16:9"}
                    onClick={() => setAspectRatio("16:9")}
                  >
                    <AspectIcon ratio="16:9" />
                    16:9 · Landscape
                  </Segmented>
                </SegmentedGroup>
              </Field>

              <Field
                label="Background"
                hint="Transparent shows a checkerboard in the preview — it means the canvas behind the text is alpha. Solid bakes a flat color in."
              >
                <div className="space-y-3">
                  <SegmentedGroup>
                    <Segmented
                      selected={bgMode === "solid"}
                      onClick={() => setBgMode("solid")}
                    >
                      <span
                        className="h-4 w-4 rounded-sm border border-border"
                        style={{ backgroundColor: bgColor }}
                      />
                      Solid color
                    </Segmented>
                    <Segmented
                      selected={bgMode === "transparent"}
                      onClick={() => setBgMode("transparent")}
                    >
                      <CheckerIcon />
                      Transparent
                    </Segmented>
                  </SegmentedGroup>
                  {bgMode === "solid" ? (
                    <ColorRow
                      label="Background"
                      value={bgColor}
                      onChange={setBgColor}
                    />
                  ) : null}
                </div>
              </Field>

              <Field
                label="Text + accent"
                hint="Text color applies to context words; accent applies to the active word."
              >
                <div className="flex flex-wrap gap-4">
                  <ColorRow
                    label="Text"
                    value={textColor}
                    onChange={setTextColor}
                  />
                  <ColorRow
                    label="Accent"
                    value={accentColor}
                    onChange={setAccentColor}
                  />
                </div>
              </Field>

              <Field
                label="Caption position"
                hint="Click any spot to anchor the text."
              >
                <PositionGrid
                  vAlign={vAlign}
                  hAlign={hAlign}
                  onChange={(v, h) => {
                    setVAlign(v);
                    setHAlign(h);
                  }}
                  aspectRatio={aspectRatio}
                />
              </Field>

              <Field
                label="Font size"
                hint="Multiplier on the auto-fit size. Larger for dense feeds, smaller to leave room for b-roll."
              >
                <SegmentedGroup>
                  {FONT_PRESETS.map((p) => (
                    <Segmented
                      key={p.label}
                      selected={Math.abs(fontScale - p.value) < 0.01}
                      onClick={() => setFontScale(p.value)}
                    >
                      <span
                        className="font-semibold"
                        style={{ fontSize: p.previewPx }}
                      >
                        Aa
                      </span>
                      {p.label}
                    </Segmented>
                  ))}
                </SegmentedGroup>
              </Field>

              <Field
                label="Font family"
                hint="Anton + Bebas read as classic TikTok. Archivo Black + Poppins feel more editorial."
              >
                <SegmentedGroup>
                  {FONT_KEYS.map((key) => {
                    const f = FONTS[key];
                    return (
                      <Segmented
                        key={key}
                        selected={fontKey === key}
                        onClick={() => setFontKey(key)}
                      >
                        <span
                          style={{
                            fontFamily: f.cssFamily,
                            fontWeight: f.weight,
                            fontSize: 22,
                            lineHeight: 1,
                            textTransform: "uppercase",
                          }}
                        >
                          Aa
                        </span>
                        {f.label}
                      </Segmented>
                    );
                  })}
                </SegmentedGroup>
              </Field>
            </div>
          </Card>

          <Card
            title="3. Preview"
            hint={`${result.words.length} words · ${result.duration.toFixed(1)}s · ${dims.width}×${dims.height}`}
          >
            <div className="space-y-3">
              <div
                className="mx-auto overflow-hidden rounded-2xl border border-border"
                style={{
                  maxWidth: previewMaxWidth,
                  aspectRatio: `${dims.width} / ${dims.height}`,
                  ...(isTransparent
                    ? {
                        backgroundColor: "#7a7a7a",
                        backgroundImage:
                          "linear-gradient(45deg, #5a5a5a 25%, transparent 25%), linear-gradient(-45deg, #5a5a5a 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #5a5a5a 75%), linear-gradient(-45deg, transparent 75%, #5a5a5a 75%)",
                        backgroundSize: "20px 20px",
                        backgroundPosition:
                          "0 0, 0 10px, 10px -10px, -10px 0px",
                      }
                    : {}),
                }}
              >
                <Player
                  component={TikTokCaption}
                  inputProps={{
                    words: result?.words ?? PLACEHOLDER_WORDS,
                    audioUrl: result?.audioUrl,
                    captionVAlign: vAlign,
                    captionHAlign: hAlign,
                    fontScale,
                    clipStyle,
                  }}
                  durationInFrames={durationFrames}
                  fps={TIKTOK_CAPTION_FPS}
                  compositionWidth={dims.width}
                  compositionHeight={dims.height}
                  style={{
                    width: "100%",
                    height: "100%",
                    background: "transparent",
                  }}
                  controls
                  loop
                  acknowledgeRemotionLicense
                />
              </div>
              <p className="text-center text-xs text-muted-foreground">
                {isTransparent
                  ? "Checkerboard = transparent. Take this clip into the Studio to export a WebM with alpha for compositing."
                  : `${bgColor.toUpperCase()} background baked in. Take this clip into the Studio to export MP4.`}
              </p>
            </div>
          </Card>

          <WordsList words={result.words} />
        </>
      ) : null}
    </div>
  );
}

// ───── Layout helpers ─────

function Card({
  title,
  hint,
  children,
}: {
  title: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-card p-6 shadow-sm">
      <div className="mb-5 space-y-1">
        <h2 className="text-base font-semibold tracking-tight">{title}</h2>
        {hint ? <p className="text-sm text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </section>
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
    <div className="space-y-2">
      <div className="space-y-0.5">
        <div className="text-sm font-medium">{label}</div>
        {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
      </div>
      {children}
    </div>
  );
}

function SegmentedGroup({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex flex-wrap gap-1 rounded-lg bg-muted/50 p-1">
      {children}
    </div>
  );
}

function Segmented({
  selected,
  onClick,
  children,
}: {
  selected: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-2 rounded-md px-3 py-1.5 text-sm transition-colors",
        selected
          ? "bg-background text-foreground shadow-sm"
          : "text-muted-foreground hover:text-foreground",
      )}
    >
      {children}
    </button>
  );
}

function ColorRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <label className="flex items-center gap-3">
      <span className="text-xs text-muted-foreground">{label}</span>
      <input
        type="color"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-12 cursor-pointer rounded-md border border-input bg-transparent p-0.5"
        aria-label={`${label} color`}
      />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="h-9 w-28 rounded-md border border-input bg-transparent px-3 font-mono text-sm uppercase"
        aria-label={`${label} hex`}
      />
    </label>
  );
}

function AspectIcon({ ratio }: { ratio: AspectRatio }) {
  const horiz = ratio === "16:9";
  return (
    <span
      className="border-current"
      style={{
        display: "inline-block",
        width: horiz ? 20 : 11,
        height: horiz ? 11 : 20,
        borderWidth: 1.5,
        borderStyle: "solid",
        borderRadius: 2,
      }}
    />
  );
}

function CheckerIcon() {
  return (
    <span
      style={{
        display: "inline-block",
        width: 16,
        height: 16,
        borderRadius: 3,
        backgroundColor: "#a0a0a0",
        backgroundImage:
          "linear-gradient(45deg, #6f6f6f 25%, transparent 25%), linear-gradient(-45deg, #6f6f6f 25%, transparent 25%), linear-gradient(45deg, transparent 75%, #6f6f6f 75%), linear-gradient(-45deg, transparent 75%, #6f6f6f 75%)",
        backgroundSize: "8px 8px",
        backgroundPosition: "0 0, 0 4px, 4px -4px, -4px 0px",
      }}
    />
  );
}

function PositionGrid({
  vAlign,
  hAlign,
  onChange,
  aspectRatio,
}: {
  vAlign: VAlign;
  hAlign: HAlign;
  onChange: (v: VAlign, h: HAlign) => void;
  aspectRatio: AspectRatio;
}) {
  const horiz = aspectRatio === "16:9";
  const w = horiz ? 192 : 108;
  const h = horiz ? 108 : 192;
  return (
    <div
      className="grid rounded-lg border border-border bg-muted/30 p-2"
      style={{
        width: w + 16,
        height: h + 16,
        gridTemplateColumns: "1fr 1fr 1fr",
        gridTemplateRows: "1fr 1fr 1fr",
        gap: 4,
      }}
    >
      {V_ALIGNS.map((v) =>
        H_ALIGNS.map((hh) => {
          const active = vAlign === v && hAlign === hh;
          return (
            <button
              key={`${v}-${hh}`}
              type="button"
              onClick={() => onChange(v, hh)}
              aria-label={`Position ${v} ${hh}`}
              className={cn(
                "flex items-center justify-center rounded-md border transition-colors",
                active
                  ? "border-foreground/50 bg-foreground/10"
                  : "border-transparent hover:bg-muted",
              )}
            >
              <span
                className={cn(
                  "block rounded-full transition-all",
                  active ? "bg-foreground" : "bg-muted-foreground/40",
                )}
                style={{
                  width: active ? 12 : 8,
                  height: active ? 12 : 8,
                }}
              />
            </button>
          );
        }),
      )}
    </div>
  );
}

function DropZone({
  file,
  dragging,
  onDrag,
  uploading,
  inputRef,
  onFile,
}: {
  file: File | null;
  dragging: boolean;
  onDrag: (v: boolean) => void;
  uploading: boolean;
  inputRef: React.RefObject<HTMLInputElement | null>;
  onFile: (f: File) => void;
}) {
  return (
    // biome-ignore lint/a11y/useSemanticElements: drop-zone needs drag-and-drop events that a native <button> swallows
    <div
      role="button"
      tabIndex={0}
      onClick={() => inputRef.current?.click()}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          inputRef.current?.click();
        }
      }}
      onDragOver={(e) => {
        e.preventDefault();
        onDrag(true);
      }}
      onDragLeave={() => onDrag(false)}
      onDrop={(e) => {
        e.preventDefault();
        onDrag(false);
        const dropped = e.dataTransfer.files?.[0];
        if (dropped) onFile(dropped);
      }}
      className={cn(
        "flex cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-10 text-center transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
        dragging
          ? "border-foreground/60 bg-accent/40"
          : "border-border bg-muted/30 hover:border-muted-foreground/40",
      )}
    >
      <div className="flex size-12 items-center justify-center rounded-full bg-background shadow-sm">
        <HugeiconsIcon
          icon={uploading ? Mic01Icon : CloudUploadIcon}
          size={22}
          className={uploading ? "animate-pulse" : ""}
        />
      </div>
      <div>
        <p className="text-sm font-medium">
          {file ? file.name : "Drop an MP3 here or click to browse"}
        </p>
        <p className="text-xs text-muted-foreground">
          {file
            ? `${(file.size / 1024 / 1024).toFixed(2)} MB · click to replace`
            : "MP3, WAV, M4A, OGG, or WEBM — up to 25 MB"}
        </p>
      </div>
      <Button
        variant="outline"
        size="sm"
        disabled={uploading}
        onClick={(e) => {
          e.stopPropagation();
          inputRef.current?.click();
        }}
      >
        {uploading
          ? "Transcribing…"
          : file
            ? "Choose different file"
            : "Choose file"}
      </Button>
      <input
        ref={inputRef}
        type="file"
        accept="audio/*"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) onFile(f);
        }}
      />
    </div>
  );
}

function WordsList({ words }: { words: CaptionWord[] }) {
  return (
    <details className="rounded-2xl border border-border bg-muted/20 p-4 text-xs">
      <summary className="cursor-pointer text-sm font-medium">
        {words.length} words — show transcript with timings
      </summary>
      <div className="mt-3 max-h-72 overflow-auto font-mono leading-relaxed">
        {words.map((w) => (
          <span key={`${w.start}-${w.text}`} className="mr-2">
            <span className="text-foreground">{w.text}</span>
            <span className="text-muted-foreground/70">
              [{w.start.toFixed(2)}]
            </span>
          </span>
        ))}
      </div>
    </details>
  );
}
