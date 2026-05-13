"use client";

import { PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { cn } from "@workspace/ui/lib/utils";

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

export function HeroVideoDialog({
  videoSrc,
  thumbnailSrc,
  thumbnailAlt = "Video preview",
  animationStyle: _animationStyle = "from-center",
  className,
}: Props) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button
          variant="ghost"
          className={cn(
            "group relative block h-auto w-full overflow-hidden rounded-2xl border border-border bg-muted/30 p-0 shadow-[0_24px_80px_-32px_rgba(0,0,0,0.55)] transition hover:bg-muted/30 hover:shadow-[0_32px_100px_-32px_rgba(0,0,0,0.65)]",
            className,
          )}
        >
          {thumbnailSrc ? (
            // biome-ignore lint/performance/noImgElement: consumer-supplied thumbnail src
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
            >
              <track kind="captions" />
            </video>
          )}
          <span className="pointer-events-none absolute inset-0 bg-gradient-to-b from-black/0 via-black/0 to-black/30" />
          <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-white/95 text-black shadow-2xl ring-1 ring-white/40 transition group-hover:scale-105">
              <HugeiconsIcon icon={PlayIcon} size={30} className="ml-1.5" />
            </span>
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent
        showCloseButton
        className="aspect-video w-[min(100vw-2rem,72rem)] max-w-none overflow-hidden border-0 bg-black p-0 sm:max-w-none"
      >
        <DialogTitle className="sr-only">{thumbnailAlt}</DialogTitle>
        {/* biome-ignore lint/a11y/useMediaCaption: showcase video has no spoken audio */}
        <video
          src={videoSrc}
          autoPlay
          controls
          playsInline
          className="h-full w-full"
        >
          <track kind="captions" />
        </video>
      </DialogContent>
    </Dialog>
  );
}
