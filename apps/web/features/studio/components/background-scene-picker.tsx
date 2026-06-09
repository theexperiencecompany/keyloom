"use client";

import { Tick02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositions } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@workspace/ui/components/hover-card";
import type { CSSProperties } from "react";

import { CompositionPreviewCard } from "./composition-preview-card";

const backgroundScenes = compositions.filter(
  (c) => c.category === "background",
);

/**
 * Static CSS approximations of each background scene, keyed by composition id.
 * These are cheap, non-animated stand-ins drawn purely with gradients so the
 * card grid stays light — the live Remotion preview only renders on hover.
 */
const scenePreviews: Record<string, CSSProperties> = {
  BlueGrid: {
    background:
      "radial-gradient(45% 50% at 82% 16%, rgba(255,255,255,0.45) 0%, transparent 60%), repeating-linear-gradient(0deg, transparent 0 13px, rgba(255,255,255,0.12) 13px 14px), repeating-linear-gradient(90deg, transparent 0 13px, rgba(255,255,255,0.12) 13px 14px), #1d4ed8",
  },
  WhiteRadialBurst: {
    background:
      "repeating-conic-gradient(from 0deg at 50% 50%, rgba(37,99,235,0.5) 0deg 0.6deg, transparent 0.6deg 6deg), radial-gradient(22% 24% at 50% 50%, #ffffff 0%, transparent 72%), #ffffff",
  },
  LiquidChrome: {
    background:
      "linear-gradient(135deg, #e5e7eb, #ffffff 26%, #94a3b8 50%, #60a5fa 70%, #cbd5e1)",
  },
  FuturisticArch: {
    background:
      "radial-gradient(80% 100% at 18% 100%, rgba(255,255,255,0.92), transparent 60%), radial-gradient(80% 100% at 92% 0%, rgba(147,197,253,0.5), transparent 60%), #eaf1fb",
  },
};

const fallbackPreview: CSSProperties = { background: "#18181b" };

type Props = {
  value: string | undefined;
  onSelect: (compositionId: string) => void;
  /** Accent color used for the selected card's ring. */
  accent?: string;
};

/**
 * Background → Scene picker for the inspector. Renders every
 * `category: "background"` composition as a 2-column grid of cards with a
 * static CSS preview. Hovering a card opens a live Remotion preview
 * (CompositionPreviewCard) to the left of the inspector; clicking selects it.
 */
export function BackgroundScenePicker({
  value,
  onSelect,
  accent = "#6366f1",
}: Props) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {backgroundScenes.map((info) => {
        const selected = value === info.id;
        return (
          <HoverCard key={info.id} openDelay={150} closeDelay={100}>
            <HoverCardTrigger asChild>
              <Button
                variant="ghost"
                onClick={() => onSelect(info.id)}
                aria-pressed={selected}
                style={
                  selected ? { boxShadow: `0 0 0 2px ${accent}` } : undefined
                }
                className="relative h-16 w-full overflow-hidden rounded-lg p-0 ring-1 ring-border/60 hover:ring-border"
              >
                <span
                  className="absolute inset-0"
                  style={scenePreviews[info.id] ?? fallbackPreview}
                />
                <span className="absolute inset-x-0 bottom-0 h-8 bg-gradient-to-t from-black/70 to-transparent" />
                <span className="absolute bottom-1.5 left-2 right-2 truncate text-left text-[11px] font-medium text-white/90">
                  {info.title}
                </span>
                {selected && (
                  <span
                    className="absolute right-1.5 top-1.5 flex size-4 items-center justify-center rounded-full"
                    style={{ background: accent }}
                  >
                    <HugeiconsIcon
                      icon={Tick02Icon}
                      className="size-3 text-white"
                    />
                  </span>
                )}
              </Button>
            </HoverCardTrigger>
            <HoverCardContent
              side="left"
              align="center"
              sideOffset={8}
              collisionPadding={8}
              className="w-72 overflow-hidden border-border bg-background p-0 shadow-xl"
            >
              <CompositionPreviewCard info={info} />
            </HoverCardContent>
          </HoverCard>
        );
      })}
    </div>
  );
}
