"use client";

import type { ClipStyle } from "@workspace/compositions/clip-style";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";

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
 */
export function ClipStyleSection({ style, onPatch, onReset }: Props) {
  const value = style ?? {};
  const isCustomized =
    Boolean(value.backgroundColor) ||
    Boolean(value.textColor) ||
    Boolean(value.fontFamily) ||
    Boolean(value.accentColor);

  return (
    <div className="space-y-4 px-5 py-5">
      <div className="flex items-center justify-between">
        <p className="text-[11px] font-semibold tracking-wider text-muted-foreground uppercase">
          Style
        </p>
        {isCustomized && (
          <Button
            variant="ghost"
            size="xs"
            onClick={onReset}
            className="h-6 text-[11px]"
          >
            Reset
          </Button>
        )}
      </div>

      <ColorRow
        id="clip-style-bg"
        label="Background"
        value={value.backgroundColor ?? ""}
        onChange={(v) => onPatch({ backgroundColor: v })}
      />
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
  const looksHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  const swatchValue = looksHex ? value : "#ffffff";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-[12px]">
        {label}
      </Label>
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
    </div>
  );
}
