"use client";

import { useEffect, useRef } from "react";
import type { MemeTemplate } from "@/lib/memes";
import { MemeThumbnail } from "./meme-thumbnail";

/**
 * TikTok/Reels-style feed: one template per screen, vertical scroll-snap, and a
 * wheel handler that advances exactly one reel per gesture (instead of letting a
 * single trackpad swipe fly past several). The scrollbar is hidden.
 */
export function MemeReel({
  templates,
  onSelect,
}: {
  templates: MemeTemplate[];
  onSelect: (t: MemeTemplate) => void;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    // Locked while a snap animation is in flight so one gesture = one reel.
    let locked = false;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      if (locked || Math.abs(e.deltaY) < 8) return;
      locked = true;
      el.scrollBy({
        top: e.deltaY > 0 ? el.clientHeight : -el.clientHeight,
        behavior: "smooth",
      });
      window.setTimeout(() => {
        locked = false;
      }, 600);
    };
    // Non-passive so preventDefault actually stops the native multi-reel scroll.
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, []);

  return (
    <div
      ref={containerRef}
      className="mx-auto h-[80vh] w-full max-w-[420px] snap-y snap-mandatory overflow-y-auto rounded-xl [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
    >
      {templates.map((t) => (
        <div
          key={t.id}
          className="flex h-full snap-center items-center justify-center py-2"
        >
          <MemeThumbnail
            template={t}
            mode="view"
            className="aspect-[9/16] h-full"
            onSelect={onSelect}
          />
        </div>
      ))}
    </div>
  );
}
