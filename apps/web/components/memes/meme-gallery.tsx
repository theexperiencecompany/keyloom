"use client";

import { GridViewIcon, SmartPhone01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { useState } from "react";
import type { MemeTemplate } from "@/lib/memes";
import { MemeReel } from "./meme-reel";
import { MemeThumbnail } from "./meme-thumbnail";

type View = "grid" | "reel";

export function MemeGallery({
  templates,
  onSelect,
}: {
  templates: MemeTemplate[];
  onSelect: (t: MemeTemplate) => void;
}) {
  const [view, setView] = useState<View>("grid");

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
    <div className="flex flex-col gap-4">
      {/* View toggle: grid vs. one-at-a-time reel feed. */}
      <div className="flex justify-end">
        <div className="inline-flex gap-1 rounded-lg border border-border p-1">
          <Button
            size="sm"
            variant={view === "grid" ? "secondary" : "ghost"}
            onClick={() => setView("grid")}
          >
            <HugeiconsIcon icon={GridViewIcon} size={16} />
            Grid
          </Button>
          <Button
            size="sm"
            variant={view === "reel" ? "secondary" : "ghost"}
            onClick={() => setView("reel")}
          >
            <HugeiconsIcon icon={SmartPhone01Icon} size={16} />
            Reel
          </Button>
        </div>
      </div>

      {view === "grid" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5">
          {templates.map((t) => (
            <MemeThumbnail
              key={t.id}
              template={t}
              mode="hover"
              className="aspect-[9/16]"
              onSelect={onSelect}
            />
          ))}
        </div>
      ) : (
        <MemeReel templates={templates} onSelect={onSelect} />
      )}
    </div>
  );
}
