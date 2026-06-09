"use client";

import type { ClipStyle } from "@workspace/compositions/clip-style";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { useState } from "react";

import { BackgroundScenePicker } from "./background-scene-picker";
import { FontPicker } from "./font-picker";

type Props = {
  style: ClipStyle | undefined;
  onPatch: (patch: Partial<ClipStyle>) => void;
  onReset: () => void;
};

/**
 * Renders the universal Style controls every non-locked clip exposes:
 * Background, Text color, Font, Accent color. Stored on `Clip.style` and
 * forwarded to the composition through the `clipStyle` prop.
 *
 * The Background control toggles between a flat Color and a Scene — an
 * animated `category: "background"` composition rendered behind the clip
 * (see `Project.tsx`). The parent keys this component by clip id, so the
 * Color/Scene view mode resets when a different clip is selected.
 */
export function ClipStyleSection({ style, onPatch, onReset }: Props) {
  const value = style ?? {};
  const isCustomized =
    Boolean(value.backgroundColor) ||
    Boolean(value.textColor) ||
    Boolean(value.fontFamily) ||
    Boolean(value.accentColor) ||
    Boolean(value.backgroundScene);

  // Color vs Scene is a view mode; the persisted signal is `backgroundScene`.
  // Scene is the default view — open it first unless the clip already has an
  // explicit background color (and no scene), in which case show that color.
  const [bgMode, setBgMode] = useState<"color" | "scene">(
    value.backgroundScene ? "scene" : value.backgroundColor ? "color" : "scene",
  );

  function onBgModeChange(next: string) {
    const mode = next === "scene" ? "scene" : "color";
    // Leaving Scene mode drops the backdrop so Color mode renders cleanly.
    if (mode === "color" && value.backgroundScene) {
      onPatch({ backgroundScene: undefined });
    }
    setBgMode(mode);
  }

  return (
    <div className="space-y-4 px-5 py-5">
      {isCustomized && (
        <div className="flex items-center justify-end">
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="h-6 text-[11px]"
          >
            Reset to default
          </Button>
        </div>
      )}

      <div className="space-y-1.5">
        <Label className="text-[12px]">Background</Label>
        <Tabs value={bgMode} onValueChange={onBgModeChange}>
          <TabsList className="w-full">
            <TabsTrigger value="scene" className="flex-1 text-[11px]">
              Scene
            </TabsTrigger>
            <TabsTrigger value="color" className="flex-1 text-[11px]">
              Color
            </TabsTrigger>
          </TabsList>
          <TabsContent value="color" className="mt-2">
            <ColorField
              id="clip-style-bg"
              label="Background"
              value={value.backgroundColor ?? ""}
              onChange={(v) => onPatch({ backgroundColor: v })}
            />
          </TabsContent>
          <TabsContent value="scene" className="mt-2">
            <BackgroundScenePicker
              value={value.backgroundScene}
              onSelect={(id) => onPatch({ backgroundScene: id })}
              accent={value.accentColor || undefined}
            />
          </TabsContent>
        </Tabs>
      </div>

      <ColorRow
        id="clip-style-text"
        label="Text color"
        value={value.textColor ?? ""}
        onChange={(v) => onPatch({ textColor: v })}
      />
      <ColorRow
        id="clip-style-accent"
        label="Accent"
        value={value.accentColor ?? ""}
        onChange={(v) => onPatch({ accentColor: v })}
      />

      <div className="space-y-1.5">
        <Label htmlFor="clip-style-font" className="text-[12px]">
          Font
        </Label>
        <FontPicker
          value={value.fontFamily ?? ""}
          onChange={(cssValue) =>
            onPatch({ fontFamily: cssValue ? cssValue : undefined })
          }
          placeholder="Component default"
        />
      </div>
    </div>
  );
}

function ColorRow({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px]">
        {label}
      </Label>
      <ColorField id={id} label={label} value={value} onChange={onChange} />
    </div>
  );
}

function ColorField({
  id,
  label,
  value,
  onChange,
}: {
  id: string;
  label: string;
  value: string;
  onChange: (v: string) => void;
}) {
  const looksHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  const swatchValue = looksHex ? value : "#ffffff";

  return (
    <div className="flex items-center gap-2">
      <label
        className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border transition-shadow hover:ring-2 hover:ring-ring/40"
        style={{ background: swatchValue }}
        title="Pick color"
      >
        <input
          type="color"
          aria-label={`${label} color`}
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        id={id}
        value={value}
        placeholder="default"
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
        spellCheck={false}
      />
    </div>
  );
}
