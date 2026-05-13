"use client";

import { Cancel01Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { cn } from "@workspace/ui/lib/utils";
import * as React from "react";

type Animation =
  | "from-center"
  | "from-bottom"
  | "from-top"
  | "fade"
  | "top-in-bottom-out";

type Props = {
  videoSrc: string;
  thumbnailSrc?: string;
  thumbnailAlt?: string;
  animationStyle?: Animation;
  className?: string;
};

const ANIMATIONS: Record<Animation, { open: string; closed: string }> = {
  "from-center": {
    open: "opacity-100 scale-100",
    closed: "opacity-0 scale-90",
  },
  "from-bottom": {
    open: "opacity-100 translate-y-0",
    closed: "opacity-0 translate-y-12",
  },
  "from-top": {
    open: "opacity-100 translate-y-0",
    closed: "opacity-0 -translate-y-12",
  },
  fade: { open: "opacity-100", closed: "opacity-0" },
  "top-in-bottom-out": {
    open: "opacity-100 translate-y-0",
    closed: "opacity-0 -translate-y-12",
  },
};

export function HeroVideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video preview",
  animationStyle = "from-center",
  className,
}: Props) {
  const [open, setOpen] = React.useState(false);
  const anim = ANIMATIONS[animationStyle];

  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "Escape") setOpen(false);
    }
    if (open) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <div className={cn("relative", className)}>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="group relative block w-full overflow-hidden rounded-2xl border border-border bg-muted/30 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.55)] transition hover:shadow-[0_32px_100px_-32px_rgba(0,0,0,0.65)]"
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        {thumbnailSrc ? (
          <img
            src={thumbnailSrc}
            alt={thumbnailAlt}
            className="block aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
          />
        ) : (
          <video
            src={videoSrc}
            muted
            playsInline
            preload="metadata"
            className="block aspect-video w-full object-cover transition-transform duration-500 group-hover:scale-[1.015]"
          />
        )}
        <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30" />
        <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
          <span className="flex size-20 items-center justify-center rounded-full bg-white/95 text-black shadow-2xl ring-1 ring-white/40 transition group-hover:scale-105">
            <HugeiconsIcon icon={PlayIcon} size={30} className="ml-1.5" />
          </span>
        </span>
      </button>

      {open && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-md animate-in fade-in duration-200"
          onClick={() => setOpen(false)}
        >
          <button
            type="button"
            aria-label="Close video"
            className="absolute right-4 top-4 flex size-10 items-center justify-center rounded-full bg-white/10 text-white transition hover:bg-white/20"
            onClick={(e) => {
              e.stopPropagation();
              setOpen(false);
            }}
          >
            <HugeiconsIcon icon={Cancel01Icon} size={18} />
          </button>
          <div
            className={cn(
              "relative aspect-video w-full max-w-5xl overflow-hidden rounded-2xl bg-black shadow-2xl transition-all duration-300",
              anim.open,
            )}
            onClick={(e) => e.stopPropagation()}
          >
            {/** biome-ignore lint/a11y/useMediaCaption: showcase video has no spoken audio */}
            <video
              src={videoSrc}
              autoPlay
              controls
              playsInline
              className="h-full w-full"
            >
              <track kind="captions" />
            </video>
          </div>
        </div>
      )}
    </div>
  );
}
