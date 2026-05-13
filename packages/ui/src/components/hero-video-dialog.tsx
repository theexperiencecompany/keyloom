"use client";

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
          {/* MagicUI's default play affordance — gradient pill nested in a
              backdrop-blurred halo. Inline SVG (not HugeIcons) because the
              triangle needs to inherit the gradient pill's white fill and
              the size/offset is calibrated to MagicUI's published design. */}
          <span className="pointer-events-none absolute inset-0 flex scale-[0.9] items-center justify-center transition-all duration-200 ease-out group-hover:scale-100">
            <span className="flex size-28 items-center justify-center rounded-full bg-primary/10 backdrop-blur-md">
              <span className="relative flex size-20 items-center justify-center rounded-full bg-gradient-to-b from-primary/30 to-primary shadow-md transition-all duration-200 ease-out group-hover:scale-[1.2]">
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="white"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="size-8 fill-white text-white"
                  aria-hidden
                >
                  <title>Play</title>
                  <path d="M6 3L20 12 6 21 6 3Z" />
                </svg>
              </span>
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
