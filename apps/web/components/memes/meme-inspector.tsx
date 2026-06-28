"use client";

import { ImageAdd02Icon, RefreshIcon } from "@hugeicons/core-free-icons";
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
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import type { ChangeEvent, RefObject } from "react";
import { type MemeBackground, memeBackgrounds } from "@/lib/memes";
import { FONTS, WEIGHTS } from "./meme-fonts";
import type { Caption } from "./meme-layout";

type MemeInspectorProps = {
  background: MemeBackground | null;
  customBackgrounds: MemeBackground[];
  onSelectBackground: (b: MemeBackground) => void;
  fileInputRef: RefObject<HTMLInputElement | null>;
  onUploadBackground: (e: ChangeEvent<HTMLInputElement>) => void;
  onResetFraming: () => void;
  caption: Caption;
  onCaptionChange: (patch: Partial<Caption>) => void;
};

/** Right-hand controls: background, framing, audio, and caption styling. */
export function MemeInspector({
  background,
  customBackgrounds,
  onSelectBackground,
  fileInputRef,
  onUploadBackground,
  onResetFraming,
  caption,
  onCaptionChange,
}: MemeInspectorProps) {
  return (
    <div className="flex flex-col gap-6">
      <section className="space-y-2">
        <Label>Background</Label>
        <div className="grid grid-cols-3 gap-2">
          {[...memeBackgrounds, ...customBackgrounds].map((b) => (
            <button
              key={b.id}
              type="button"
              onClick={() => onSelectBackground(b)}
              className={cn(
                "relative aspect-square overflow-hidden rounded-md border",
                b.id === background?.id
                  ? "border-primary ring-2 ring-primary/40"
                  : "border-border",
              )}
            >
              {/* biome-ignore lint/performance/noImgElement: local preview thumb */}
              <img
                src={b.src}
                alt={b.title}
                crossOrigin="anonymous"
                className="size-full object-cover"
              />
            </button>
          ))}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          >
            <HugeiconsIcon icon={ImageAdd02Icon} size={18} />
            <span className="text-[10px]">Upload</span>
          </button>
        </div>
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onUploadBackground}
          className="hidden"
        />
      </section>

      <section>
        <Button variant="outline" size="sm" onClick={onResetFraming}>
          <HugeiconsIcon icon={RefreshIcon} size={14} />
          Reset framing
        </Button>
      </section>

      <section className="space-y-3">
        <Label>Caption</Label>
        <Textarea
          value={caption.text}
          onChange={(e) => onCaptionChange({ text: e.target.value })}
          rows={3}
          placeholder="Meme text…"
        />

        <div className="grid grid-cols-2 gap-2">
          <div className="space-y-1.5">
            <Label className="text-xs">Font</Label>
            <Select
              value={caption.fontFamily}
              onValueChange={(v) => onCaptionChange({ fontFamily: v })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {FONTS.map((f) => (
                  <SelectItem key={f.value} value={f.value}>
                    {f.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <Label className="text-xs">Weight</Label>
            <Select
              value={String(caption.fontWeight)}
              onValueChange={(v) => onCaptionChange({ fontWeight: Number(v) })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEIGHTS.map((w) => (
                  <SelectItem key={w.value} value={w.value}>
                    {w.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Label className="text-xs">Size</Label>
          <span className="text-xs text-muted-foreground">
            {caption.fontSize}px
          </span>
        </div>
        <Slider
          min={24}
          max={200}
          step={1}
          value={[caption.fontSize]}
          onValueChange={([v]) => onCaptionChange({ fontSize: v ?? 72 })}
        />

        <div className="flex items-center justify-between">
          <Label className="text-xs">Outline</Label>
          <span className="text-xs text-muted-foreground">
            {caption.stroke}px
          </span>
        </div>
        <Slider
          min={0}
          max={24}
          step={1}
          value={[caption.stroke]}
          onValueChange={([v]) => onCaptionChange({ stroke: v ?? 0 })}
        />

        <div className="space-y-1.5">
          <Label className="text-xs">Color</Label>
          <Input
            type="color"
            value={caption.color}
            onChange={(e) => onCaptionChange({ color: e.target.value })}
            className="h-9 w-full p-1"
          />
        </div>
      </section>
    </div>
  );
}
