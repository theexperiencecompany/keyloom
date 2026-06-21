"use client";

import {
  Cancel01Icon,
  RefreshIcon,
  Upload04Icon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { useRef, useState } from "react";
import {
  ICON_PRESETS,
  type IconPreset,
} from "../compositions/MessagePopup/icon-presets";
import type { PrimitiveField } from "../schema";

// Shared control styling for the editor panels. We KEEP the app's pill radius
// (rounded-3xl) so fields stay consistent with the rounded buttons (Export
// etc.) — the polish here is a defined resting border and a tighter focus
// ring, not a different shape.
export const FIELD_CONTROL =
  "border-border bg-input/40 text-[13px] focus-visible:ring-2 focus-visible:ring-ring/40";

export const FIELD_LABEL = "text-[11px] font-medium text-muted-foreground";

type Props = {
  field: PrimitiveField;
  value: unknown;
  onChange: (v: unknown) => void;
  /**
   * Some primitive fields (currently `iconPreset`) edit two keys at
   * once. Callers that want to render those fields must pass through
   * the sibling key's current value and a setter for it.
   */
  extraValue?: unknown;
  onExtraChange?: (v: unknown) => void;
};

export function PrimitiveControl({
  field,
  value,
  onChange,
  extraValue,
  onExtraChange,
}: Props) {
  switch (field.kind) {
    case "text":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Textarea
            id={field.key}
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            rows={1}
            // `field-sizing-content` (in our base Textarea class) lets the
            // box grow with the value. Cap min-h so a single-line entry
            // looks like an Input rather than a giant pad.
            className={cn(
              FIELD_CONTROL,
              "min-h-9 resize-none px-3 py-1.5 leading-snug",
            )}
            onChange={(e) => onChange(normalizeNewlines(e.target.value))}
          />
        </Wrapper>
      );

    case "textarea":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Textarea
            id={field.key}
            value={(value as string) ?? ""}
            rows={field.rows ?? 3}
            className={cn(FIELD_CONTROL, "px-3 py-2")}
            onChange={(e) => onChange(normalizeNewlines(e.target.value))}
          />
        </Wrapper>
      );

    case "number":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Input
            id={field.key}
            type="number"
            value={(value as number) ?? 0}
            min={field.min}
            max={field.max}
            className={FIELD_CONTROL}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </Wrapper>
      );

    case "slider": {
      const raw = typeof value === "number" ? value : field.min;
      const v = Math.min(field.max, Math.max(field.min, raw));
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <div className="flex items-center gap-3">
            <Slider
              id={field.key}
              min={field.min}
              max={field.max}
              step={field.step ?? 1}
              value={[v]}
              onValueChange={([nv]) => {
                if (nv !== undefined) onChange(nv);
              }}
              className="flex-1"
            />
            <span className="w-9 text-right font-mono text-[11px] text-muted-foreground">
              {v}
            </span>
          </div>
        </Wrapper>
      );
    }

    case "color":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <ColorControl
            id={field.key}
            value={(value as string) ?? "#ffffff"}
            onChange={onChange}
          />
        </Wrapper>
      );

    case "image":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <ImageControl
            id={field.key}
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={onChange}
          />
        </Wrapper>
      );

    case "audio": {
      // Like iconPreset, audio writes two keys atomically — audioUrl and
      // the words array — by funneling both through onChange wrapped in a
      // sentinel object that FieldsRenderer destructures.
      const audioUrl = (value as string) ?? "";
      const setBoth = (url: string, words: unknown[]) => {
        onChange({ __audioBoth: true, audioUrl: url, words });
      };
      void onExtraChange;
      void extraValue;
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <AudioControl value={audioUrl} onChange={setBoth} />
        </Wrapper>
      );
    }

    case "switch":
      return (
        <div className="flex items-center justify-between gap-3 py-0.5">
          <Label htmlFor={field.key} className={FIELD_LABEL}>
            {field.label}
          </Label>
          <Switch
            id={field.key}
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(v)}
          />
        </div>
      );

    case "select": {
      const current = (value as string) ?? field.options[0]?.value ?? "";
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Select value={current} onValueChange={(v) => onChange(v)}>
            <SelectTrigger id={field.key} className={FIELD_CONTROL}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Wrapper>
      );
    }

    case "iconPreset": {
      // Both the preset key and the custom-upload URL live on the same
      // clip's props object. The parent's setter dispatches
      // UPDATE_CLIP_PROPS, which REPLACES props wholesale — so two
      // back-to-back single-key dispatches each spread a stale snapshot
      // and the second one clobbers the first. Write both keys in a
      // single dispatch instead. See FieldsRenderer for the combined
      // setter wiring.
      const presetKey = (value as string) ?? "";
      const customSrc = (extraValue as string) ?? "";
      const setBoth = (preset: string, custom: string) => {
        // We piggy-back through the existing single-key onChange/onExtraChange
        // by encoding "write both at once" in a single combined call. The
        // FieldsRenderer special-cases iconPreset and treats onChange as the
        // primary writer for the preset; the iconCustom side is set inside
        // the same React update via the queued onExtraChange.
        // To make this atomic with the current reducer (which replaces all
        // props), we route through a single passed-down combined writer.
        // The FieldsRenderer must implement `onChange` for iconPreset so
        // that it writes BOTH keys in one set call.
        // Here we just call onChange with a tuple-style object and let the
        // renderer destructure it.
        onChange({ __iconPresetBoth: true, preset, custom });
      };
      void onExtraChange; // kept for type compat; not used for iconPreset.
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <IconPresetControl
            presetKey={presetKey}
            customSrc={customSrc}
            onPresetChange={(v) => setBoth(v, "")}
            onCustomChange={(v) => setBoth("", v)}
            onReset={() => setBoth("", "")}
          />
        </Wrapper>
      );
    }
  }
}

/**
 * Convert literal `\n` escape sequences (the two-character backslash + n
 * that arrives when a user pastes JSON-encoded text or types the escape
 * by hand) into real newlines, so multi-line content authored in either
 * style renders correctly in the preview.
 */
function normalizeNewlines(value: string): string {
  return value.replace(/\\n/g, "\n");
}

function Wrapper({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className={FIELD_LABEL}>
        {label}
      </Label>
      {children}
    </div>
  );
}

function ImageControl({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (v: unknown) => void;
}) {
  const hasImage = value.length > 0;

  function handleFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  const isInlineData = value.startsWith("data:") || value.startsWith("blob:");

  return (
    <div className="space-y-2">
      {hasImage ? (
        // Framed media well: the preview IS the control. Hover reveals
        // Replace / Clear over a flat scrim (no gradient).
        <div className="group relative overflow-hidden rounded-2xl border border-border bg-muted/30">
          {/* eslint-disable-next-line @remotion/warn-native-media-tag -- editor preview, not rendered video */}
          <img
            src={value}
            alt="Selected"
            className="block h-32 w-full object-cover"
          />
          <div className="absolute inset-0 flex items-center justify-center gap-2 bg-black/0 opacity-0 transition-all group-hover:bg-black/45 group-hover:opacity-100">
            <label className="cursor-pointer rounded-md bg-white/15 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25">
              Replace
              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
              />
            </label>
            <button
              type="button"
              onClick={() => onChange("")}
              className="rounded-md bg-white/15 px-2.5 py-1 text-[12px] font-medium text-white backdrop-blur-sm transition-colors hover:bg-white/25"
            >
              Clear
            </button>
          </div>
        </div>
      ) : (
        // Empty: a quiet upload affordance.
        <label
          className="flex h-24 cursor-pointer flex-col items-center justify-center gap-1 rounded-2xl border border-border bg-muted/20 text-center transition-colors hover:bg-muted/40"
          title="Upload an image"
        >
          <HugeiconsIcon
            icon={Upload04Icon}
            size={17}
            className="text-muted-foreground"
          />
          <span className="text-[12px] font-medium text-foreground">
            Upload image
          </span>
          <span className="text-[10.5px] text-muted-foreground">
            PNG or JPG · or paste a URL below
          </span>
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
      )}
      <Input
        id={id}
        value={isInlineData ? "" : value}
        placeholder={placeholder ?? "Paste an image URL"}
        className={FIELD_CONTROL}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}

function AudioControl({
  value,
  onChange,
}: {
  value: string;
  onChange: (url: string, words: unknown[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
    if (!file.type.startsWith("audio/")) {
      setError("Please drop an audio file");
      return;
    }
    setError(null);
    setIsUploading(true);
    try {
      const form = new FormData();
      form.append("file", file);
      const res = await fetch("/api/shorts/transcribe", {
        method: "POST",
        body: form,
      });
      if (!res.ok) {
        const j = (await res.json().catch(() => ({}))) as { error?: string };
        throw new Error(j.error ?? `Upload failed (${res.status})`);
      }
      const data = (await res.json()) as { words: unknown[] };
      // Audio stays in browser memory — never persisted server-side.
      // Blob URL is tied to this document and is revoked on replace/clear.
      if (value.startsWith("blob:")) URL.revokeObjectURL(value);
      const blobUrl = URL.createObjectURL(file);
      onChange(blobUrl, data.words);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  function clearAudio() {
    if (value.startsWith("blob:")) URL.revokeObjectURL(value);
    onChange("", []);
  }

  const hasAudio = value.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-start gap-2">
        <label
          className={cn(
            "flex flex-1 cursor-pointer flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border bg-muted/30 px-3 py-4 text-center transition-colors hover:bg-muted/60",
            isDragging && "border-primary bg-primary/5",
            isUploading && "pointer-events-none opacity-60",
          )}
          title="Upload or drop an audio file (auto-transcribed via Whisper)"
          onDragOver={(e) => {
            e.preventDefault();
            if (!isUploading) setIsDragging(true);
          }}
          onDragLeave={(e) => {
            e.preventDefault();
            setIsDragging(false);
          }}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            if (isUploading) return;
            const file = e.dataTransfer.files?.[0] ?? null;
            void handleFile(file);
          }}
        >
          <HugeiconsIcon
            icon={isUploading ? RefreshIcon : Upload04Icon}
            size={18}
            className={isUploading ? "animate-spin" : undefined}
          />
          <span className="text-[12px] font-medium text-foreground">
            {isUploading
              ? "Transcribing…"
              : isDragging
                ? "Drop to upload"
                : "Drop audio here or click to browse"}
          </span>
          <span className="text-[10.5px] text-muted-foreground">
            MP3, WAV, or M4A
          </span>
          <input
            ref={fileInputRef}
            type="file"
            accept="audio/*"
            className="hidden"
            disabled={isUploading}
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {hasAudio ? (
          <Button
            variant="outline"
            size="sm"
            onClick={clearAudio}
            disabled={isUploading}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
          </Button>
        ) : null}
      </div>
      {error ? <p className="text-[11px] text-destructive">{error}</p> : null}
    </div>
  );
}

const ICON_PRESET_MAX_BYTES = 5 * 1024 * 1024;
const ICON_PRESET_ACCEPT = "image/png,image/jpeg,image/jpg,image/webp";

function IconPresetControl({
  presetKey,
  customSrc,
  onPresetChange,
  onCustomChange,
  onReset,
}: {
  presetKey: string;
  customSrc: string;
  onPresetChange: (v: string) => void;
  onCustomChange: (v: string) => void;
  onReset: () => void;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const hasSelection = presetKey.length > 0 || customSrc.length > 0;

  function handleFile(file: File | null) {
    if (!file) return;
    if (file.size > ICON_PRESET_MAX_BYTES) {
      // Browser-side guardrail — a 5 MB cap matches the Inspector contract
      // and avoids stuffing huge data URLs into project state.
      console.warn(
        `Icon upload rejected: ${file.size} bytes exceeds 5 MB limit.`,
      );
      return;
    }
    const url = URL.createObjectURL(file);
    onCustomChange(url);
  }

  return (
    <div className="space-y-2.5">
      <div className="grid grid-cols-4 gap-1.5">
        {ICON_PRESETS.map((preset) => (
          <IconPresetTile
            key={preset.key}
            preset={preset}
            active={preset.key === presetKey && customSrc.length === 0}
            onSelect={() => onPresetChange(preset.key)}
          />
        ))}
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5"
          onClick={() => fileInputRef.current?.click()}
        >
          <HugeiconsIcon icon={Upload04Icon} className="size-3.5" />
          {customSrc ? "Replace custom" : "Upload custom"}
        </Button>
        {hasSelection && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="gap-1.5 text-muted-foreground"
            onClick={onReset}
            title="Reset to default"
          >
            <HugeiconsIcon icon={RefreshIcon} className="size-3.5" />
            Reset
          </Button>
        )}
      </div>
      <input
        ref={fileInputRef}
        type="file"
        accept={ICON_PRESET_ACCEPT}
        className="hidden"
        onChange={(e) => {
          handleFile(e.target.files?.[0] ?? null);
          // Reset so re-selecting the same file fires onChange again.
          e.target.value = "";
        }}
      />

      {customSrc ? (
        <div className="flex items-center gap-2 rounded-md border border-border bg-muted/30 px-2 py-1.5">
          {/* eslint-disable-next-line @next/next/no-img-element -- blob/data URL preview, not a deployed asset */}
          <img
            src={customSrc}
            alt="Custom icon preview"
            className="size-10 shrink-0 rounded-md object-cover"
          />
          <p className="min-w-0 flex-1 truncate text-[11px] text-muted-foreground">
            Custom upload
          </p>
          <button
            type="button"
            onClick={() => onCustomChange("")}
            aria-label="Remove custom icon"
            className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
          >
            <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
          </button>
        </div>
      ) : null}
    </div>
  );
}

function IconPresetTile({
  preset,
  active,
  onSelect,
}: {
  preset: IconPreset;
  active: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onSelect}
      title={preset.label}
      aria-label={preset.label}
      aria-pressed={active}
      className={cn(
        "group flex aspect-square items-center justify-center overflow-hidden rounded-lg border bg-background transition-all hover:bg-muted/50",
        active
          ? "border-foreground ring-2 ring-foreground/30"
          : "border-border/60",
      )}
    >
      {/* eslint-disable-next-line @next/next/no-img-element -- inspector thumbnail, served from web public dir */}
      <img
        src={`/${preset.path}`}
        alt=""
        className="size-10 object-contain"
        draggable={false}
      />
    </button>
  );
}

function ColorControl({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: unknown) => void;
}) {
  const looksHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  const swatchValue = looksHex ? value : "#ffffff";

  return (
    <div className="flex items-center gap-2">
      <label
        className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border ring-offset-background transition-shadow hover:ring-2 hover:ring-ring/40"
        style={{ background: swatchValue }}
        title="Pick color"
      >
        <input
          type="color"
          aria-label="Pick color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className={cn(FIELD_CONTROL, "font-mono")}
        spellCheck={false}
      />
    </div>
  );
}
