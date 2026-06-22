"use client";

import { PencilEdit02Icon, PlayIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  compositionModulePath,
  compositions,
} from "@workspace/compositions/registry";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import { Button } from "@workspace/ui/components/button";
import dynamic from "next/dynamic";
import { useRouter } from "next/navigation";
import * as React from "react";
import { forkPayload } from "@/lib/fork";
import { createUserComponent } from "@/lib/user-components";

// Heavy Remotion preview, mounted only on hover (one card at a time) so the
// dashboard never loads dozens of Players at once.
const LivePreview = dynamic(
  () => import("@/components/gallery/live-preview").then((m) => m.LivePreview),
  { ssr: false },
);

const VISIBLE = compositions.filter(
  (c) => !c.hideFromAgent && c.category !== "background",
);

export function DashboardGallery() {
  const router = useRouter();

  const openInStudio = (info: AnyCompositionInfo) => {
    router.push(`/studio?component=${info.id}`);
  };

  const [forking, setForking] = React.useState<string | null>(null);

  const editComponent = async (info: AnyCompositionInfo) => {
    if (forking) return;
    const payload = forkPayload(info.id);
    if (!payload) return;
    setForking(info.id);
    const created = await createUserComponent(payload);
    setForking(null);
    if (created)
      router.push(`/component/${encodeURIComponent(created.id)}/edit`);
  };

  return (
    <div className="px-5 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">Components</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Open a component in the studio, or fork it to edit its code into your
          own version.
        </p>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
        {VISIBLE.map((info) => (
          <GalleryCard
            key={info.id}
            info={info}
            editing={forking === info.id}
            onOpen={() => openInStudio(info)}
            onEdit={() => editComponent(info)}
          />
        ))}
      </div>
    </div>
  );
}

function GalleryCard({
  info,
  editing,
  onOpen,
  onEdit,
}: {
  info: AnyCompositionInfo;
  editing: boolean;
  onOpen: () => void;
  onEdit: () => void;
}) {
  const [hovered, setHovered] = React.useState(false);

  return (
    <div
      className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
        {hovered ? (
          <LivePreview
            modulePath={compositionModulePath(info)}
            id={info.id}
            defaultProps={info.defaultProps as Record<string, unknown>}
            durationInFrames={info.durationInFrames}
            fps={info.fps}
            width={info.width}
            height={info.height}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center">
            <span className="text-3xl font-semibold tracking-tight text-muted-foreground/40">
              {info.title.slice(0, 1)}
            </span>
          </div>
        )}
      </div>

      <div className="space-y-2.5 p-3">
        <div className="min-w-0">
          <div className="flex items-center justify-between gap-2">
            <h3 className="truncate text-sm font-medium">{info.title}</h3>
            <span className="shrink-0 rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">
              {info.category}
            </span>
          </div>
          <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-muted-foreground">
            {info.description}
          </p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onOpen}>
            <HugeiconsIcon icon={PlayIcon} size={14} />
            Open in studio
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1"
            onClick={onEdit}
            disabled={editing}
          >
            <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
            {editing ? "Forking…" : "Edit"}
          </Button>
        </div>
      </div>
    </div>
  );
}
