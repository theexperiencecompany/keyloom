"use client";

import { cn } from "@workspace/ui/lib/utils";
import { useEffect, useRef } from "react";
import { backgroundForTemplate, type MemeTemplate } from "@/lib/memes";
import { DEFAULT_CAPTION } from "./meme-layout";

// Preview caption mirrors the editor's default so the gallery matches the edit view.
const SAMPLE_CAPTION = DEFAULT_CAPTION.text;

type MemeThumbnailProps = {
  template: MemeTemplate;
  /**
   * "hover" plays the clip on mouse-over (grid); "view" plays it while scrolled
   * into view and pauses otherwise (the TikTok-style reel feed).
   */
  mode: "hover" | "view";
  className?: string;
  onSelect: (t: MemeTemplate) => void;
};

/** A single template preview: default background + clip + sample caption. */
export function MemeThumbnail({
  template,
  mode,
  className,
  onSelect,
}: MemeThumbnailProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const bgSrc = backgroundForTemplate(template.id)?.src;

  // Reel mode: play (with sound) only the card scrolled into view; pause others.
  useEffect(() => {
    if (mode !== "view") return;
    const v = videoRef.current;
    if (!v) return;
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry?.isIntersecting) {
          v.muted = false;
          v.play().catch(() => {
            // Unmuted autoplay blocked — retry muted so it at least plays.
            v.muted = true;
            v.play().catch(() => {});
          });
        } else {
          v.pause();
          v.currentTime = 0;
        }
      },
      { threshold: 0.6 },
    );
    io.observe(v);
    return () => io.disconnect();
  }, [mode]);

  return (
    <button
      type="button"
      onClick={() => onSelect(template)}
      // containerType lets the caption size in cqw units so it matches the
      // editor's proportions (72px on a 1080-wide frame) at any card size.
      style={{ containerType: "inline-size" }}
      className={cn(
        "group relative overflow-hidden rounded-xl border border-border bg-muted/40 transition hover:border-primary hover:shadow-md",
        className,
      )}
    >
      {bgSrc ? (
        // biome-ignore lint/performance/noImgElement: local preview thumbnail
        <img
          src={bgSrc}
          alt=""
          className="absolute inset-0 size-full object-cover"
        />
      ) : null}

      <video
        ref={videoRef}
        src={template.src}
        muted={mode === "hover"}
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 size-full object-contain"
        onMouseEnter={
          mode === "hover"
            ? (e) => {
                e.currentTarget.play().catch(() => {});
              }
            : undefined
        }
        onMouseLeave={
          mode === "hover"
            ? (e) => {
                e.currentTarget.pause();
                e.currentTarget.currentTime = 0;
              }
            : undefined
        }
      />

      <span
        className="absolute left-[6%] right-[6%] top-[12%] text-center text-white"
        // cqw units mirror the editor's caption (72px / 9px stroke on 1080px).
        style={{
          fontFamily: "TikTok Sans",
          fontWeight: 800,
          fontSize: "6.6667cqw",
          lineHeight: 1.05,
          WebkitTextStroke: "0.83cqw #000",
          paintOrder: "stroke fill",
        }}
      >
        {SAMPLE_CAPTION}
      </span>

      <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
        <span className="text-xs font-medium text-white">{template.title}</span>
      </div>
    </button>
  );
}
