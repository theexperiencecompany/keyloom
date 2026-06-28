"use client";

import {
  Delete02Icon,
  InboxIcon,
  PencilEdit02Icon,
  PlayIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import * as React from "react";
import { forkToProject, stashStudioProject } from "@/lib/fork";
import {
  listUserComponents,
  removeUserComponent,
  type UserComponent,
} from "@/lib/user-components";

// Heavy Remotion preview, mounted only on hover (one card at a time).
const ForkPreview = dynamic(
  () => import("./fork-preview").then((m) => m.ForkPreview),
  { ssr: false },
);

export function MyProjects() {
  const router = useRouter();
  const [items, setItems] = React.useState<UserComponent[] | null>(null);

  React.useEffect(() => {
    let active = true;
    listUserComponents().then((rows) => {
      if (active) setItems(rows);
    });
    return () => {
      active = false;
    };
  }, []);

  const edit = (fork: UserComponent) => {
    router.push(`/component/${encodeURIComponent(fork.id)}/edit`);
  };

  const openInStudio = (fork: UserComponent) => {
    stashStudioProject(forkToProject(fork));
    router.push("/studio");
  };

  const remove = async (id: string) => {
    setItems((prev) => prev?.filter((c) => c.id !== id) ?? prev);
    await removeUserComponent(id);
  };

  return (
    <div className="px-5 py-6 sm:px-8">
      <div className="mb-6">
        <h1 className="text-2xl font-semibold tracking-tight">My Projects</h1>
        <p className="mt-1.5 text-sm text-muted-foreground">
          Components you've forked and edited. Open one in the studio to keep
          tweaking or use it in a video.
        </p>
      </div>

      {items === null ? null : items.length === 0 ? (
        <EmptyState />
      ) : (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((fork) => (
            <ForkCard
              key={fork.id}
              fork={fork}
              onEdit={() => edit(fork)}
              onUse={() => openInStudio(fork)}
              onDelete={() => remove(fork.id)}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function ForkCard({
  fork,
  onEdit,
  onUse,
  onDelete,
}: {
  fork: UserComponent;
  onEdit: () => void;
  onUse: () => void;
  onDelete: () => void;
}) {
  return (
    <div className="group overflow-hidden rounded-xl border border-border bg-card transition-colors hover:border-foreground/20">
      <div className="relative aspect-video w-full overflow-hidden bg-muted/30">
        <ForkPreview fork={fork} />
      </div>

      <div className="space-y-2.5 p-3">
        <div className="min-w-0">
          <h3 className="truncate text-sm font-medium">{fork.name}</h3>
          <p className="mt-1 truncate text-xs text-muted-foreground">
            Forked from {fork.baseId} ·{" "}
            {new Date(fork.updatedAt).toLocaleDateString()}
          </p>
        </div>

        <div className="flex gap-2">
          <Button size="sm" className="flex-1" onClick={onEdit}>
            <HugeiconsIcon icon={PencilEdit02Icon} size={14} />
            Edit
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onUse}
            title="Use in a video"
          >
            <HugeiconsIcon icon={PlayIcon} size={14} />
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onDelete}
            aria-label="Delete"
          >
            <HugeiconsIcon icon={Delete02Icon} size={14} />
          </Button>
        </div>
      </div>
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center gap-4 rounded-xl border border-dashed border-border py-20 text-center">
      <HugeiconsIcon
        icon={InboxIcon}
        size={40}
        className="text-muted-foreground/40"
      />
      <div>
        <p className="text-sm font-medium">No projects yet</p>
        <p className="mt-1 text-sm text-muted-foreground">
          Fork a component to make your own editable version.
        </p>
      </div>
      <Button asChild>
        <Link href="/components">Browse components</Link>
      </Button>
    </div>
  );
}
