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
import { Switch } from "@workspace/ui/components/switch";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import { useRef, useState } from "react";
import {
  ICON_PRESETS,
  type IconPreset,
} from "../compositions/MessagePopup/icon-presets";
import type { PrimitiveField } from "../schema";

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
            className="min-h-9 resize-none px-3 py-1.5 text-sm"
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
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </Wrapper>
      );

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
      const wordCount = Array.isArray(extraValue)
        ? (extraValue as unknown[]).length
        : 0;
      const setBoth = (url: string, words: unknown[]) => {
        onChange({ __audioBoth: true, audioUrl: url, words });
      };
      void onExtraChange;
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <AudioControl
            id={field.key}
            value={audioUrl}
            placeholder={field.placeholder}
            wordCount={wordCount}
            onChange={setBoth}
          />
        </Wrapper>
      );
    }

    case "switch":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Switch
            id={field.key}
            checked={Boolean(value)}
            onCheckedChange={(v) => onChange(v)}
          />
        </Wrapper>
      );

    case "select": {
      const current = (value as string) ?? field.options[0]?.value ?? "";
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Select value={current} onValueChange={(v) => onChange(v)}>
            <SelectTrigger id={field.key}>
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
      <Label htmlFor={htmlFor} className="text-[12px]">
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

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
          title="Upload an image"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {hasImage ? (
          <Button variant="outline" size="sm" onClick={() => onChange("")}>
            Clear
          </Button>
        ) : null}
      </div>
      <Input
        id={id}
        value={value.startsWith("data:") ? "" : value}
        placeholder={placeholder ?? "Or paste an image URL"}
        onChange={(e) => onChange(e.target.value)}
      />
      {hasImage ? (
        <div className="overflow-hidden rounded-md border border-border bg-background">
          {/* eslint-disable-next-line @remotion/warn-native-media-tag -- editor preview, not rendered video */}
          <img
            src={value}
            alt="Selected image preview"
            className="block h-28 w-full object-cover"
          />
        </div>
      ) : null}
    </div>
  );
}

function AudioControl({
  id,
  value,
  placeholder,
  wordCount,
  onChange,
}: {
  id: string;
  value: string;
  placeholder?: string;
  wordCount: number;
  onChange: (url: string, words: unknown[]) => void;
}) {
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  async function handleFile(file: File | null) {
    if (!file) return;
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
      const data = (await res.json()) as {
        audioUrl: string;
        words: unknown[];
      };
      onChange(data.audioUrl, data.words);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setIsUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  }

  const hasAudio = value.length > 0;

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          className={cn(
            "flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-muted",
            isUploading && "pointer-events-none opacity-60",
          )}
          title="Upload an audio file (auto-transcribed via Whisper)"
        >
          <HugeiconsIcon
            icon={isUploading ? RefreshIcon : Upload04Icon}
            size={13}
            className={isUploading ? "animate-spin" : undefined}
          />
          {isUploading ? "Transcribing…" : "Upload audio"}
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
            onClick={() => onChange("", [])}
            disabled={isUploading}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={13} />
          </Button>
        ) : null}
      </div>
      <Input
        id={id}
        value={value}
        placeholder={placeholder ?? "Or paste an audio URL"}
        onChange={(e) => onChange(e.target.value, [])}
      />
      {hasAudio ? (
        <div className="space-y-1.5 rounded-md border border-border bg-background px-2.5 py-2">
          <p className="text-[11px] text-muted-foreground">
            {wordCount > 0
              ? `${wordCount} word${wordCount === 1 ? "" : "s"} transcribed`
              : "No transcript — upload a file to auto-caption."}
          </p>
          {/* biome-ignore lint/a11y/useMediaCaption: editor preview, not rendered video */}
          <audio src={value} controls className="block w-full h-8" />
        </div>
      ) : null}
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
        className="font-mono"
        spellCheck={false}
      />
    </div>
  );
}
