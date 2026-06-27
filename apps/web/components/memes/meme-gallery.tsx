"use client";

import type { MemeTemplate } from "@/lib/memes";

export function MemeGallery({
  templates,
  onSelect,
}: {
  templates: MemeTemplate[];
  onSelect: (t: MemeTemplate) => void;
}) {
  if (templates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border border-dashed border-border px-6 py-20 text-center">
        <h2 className="text-lg font-medium tracking-tight">No templates yet</h2>
        <p className="mt-1.5 max-w-sm text-sm text-muted-foreground">
          Upload transparent <code>.webm</code> clips to the <code>memes/</code>{" "}
          folder of your R2 bucket and they'll show up here.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
      {templates.map((t) => (
        <button
          key={t.id}
          type="button"
          onClick={() => onSelect(t)}
          className="group relative aspect-[9/16] overflow-hidden rounded-xl border border-border bg-muted/40 transition hover:border-primary hover:shadow-md"
        >
          {/* Transparent clip on a neutral backdrop; plays on hover to save bandwidth. */}
          {/* biome-ignore lint/a11y/useMediaCaption: silent meme template preview */}
          <video
            src={t.src}
            muted
            loop
            playsInline
            preload="metadata"
            className="size-full object-contain"
            onMouseEnter={(e) => {
              e.currentTarget.play().catch(() => {});
            }}
            onMouseLeave={(e) => {
              e.currentTarget.pause();
              e.currentTarget.currentTime = 0;
            }}
          />
          <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/70 to-transparent p-2 text-left">
            <span className="text-xs font-medium text-white">{t.title}</span>
          </div>
        </button>
      ))}
    </div>
  );
}
