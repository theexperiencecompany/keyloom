"use client";

import {
  InstagramIcon,
  Share08Icon,
  Tick02Icon,
  TiktokIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@workspace/ui/components/dialog";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Switch } from "@workspace/ui/components/switch";
import Link from "next/link";
import { useEffect, useState } from "react";

const PLATFORMS = [
  { id: "instagram", label: "Instagram", icon: InstagramIcon },
  { id: "tiktok", label: "TikTok", icon: TiktokIcon },
] as const;

type PlatformId = (typeof PLATFORMS)[number]["id"];

type Stage =
  | { kind: "idle" }
  | { kind: "rendering" }
  | { kind: "uploading" }
  | { kind: "done"; scheduled: boolean }
  | { kind: "error"; message: string };

/**
 * "Post" flow for a finished meme: render the MP4 in-browser, then hand the
 * file to /api/social/publish, which forwards it to upload-post (no public
 * hosting hop needed).
 */
export function MemePublishDialog({
  renderVideo,
  defaultTitle,
  filename,
  disabled,
}: {
  /** Produces the final MP4 (same pipeline as Download). */
  renderVideo: () => Promise<Blob>;
  defaultTitle: string;
  filename: string;
  disabled?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [connected, setConnected] = useState<Record<string, boolean> | null>(
    null,
  );
  const [selected, setSelected] = useState<Record<PlatformId, boolean>>({
    instagram: false,
    tiktok: false,
  });
  const [title, setTitle] = useState(defaultTitle);
  const [scheduledAt, setScheduledAt] = useState("");
  const [stage, setStage] = useState<Stage>({ kind: "idle" });

  // Refresh connection state each time the dialog opens.
  useEffect(() => {
    if (!open) return;
    setStage({ kind: "idle" });
    setTitle(defaultTitle);
    setConnected(null);
    fetch("/api/social/accounts")
      .then((r) => r.json())
      .then((d: { connected?: Record<string, boolean> }) => {
        const c = d.connected ?? {};
        setConnected(c);
        // Preselect everything that's already connected.
        setSelected({ instagram: !!c.instagram, tiktok: !!c.tiktok });
      })
      .catch(() => setConnected({}));
  }, [open, defaultTitle]);

  const platforms = PLATFORMS.filter((p) => selected[p.id]).map((p) => p.id);
  const busy = stage.kind === "rendering" || stage.kind === "uploading";
  const noneConnected =
    connected !== null && PLATFORMS.every((p) => !connected[p.id]);

  const publish = async () => {
    try {
      setStage({ kind: "rendering" });
      const mp4 = await renderVideo();

      setStage({ kind: "uploading" });
      const form = new FormData();
      form.append("video", new File([mp4], filename, { type: "video/mp4" }));
      form.append("platforms", JSON.stringify(platforms));
      if (title.trim()) form.append("title", title.trim());
      if (scheduledAt) {
        form.append("scheduledDate", new Date(scheduledAt).toISOString());
        form.append(
          "timezone",
          Intl.DateTimeFormat().resolvedOptions().timeZone,
        );
      }

      const res = await fetch("/api/social/publish", {
        method: "POST",
        body: form,
      });
      const data = (await res.json().catch(() => ({}))) as { error?: string };
      if (!res.ok) throw new Error(data.error || "Publish failed");
      setStage({ kind: "done", scheduled: !!scheduledAt });
    } catch (err) {
      setStage({
        kind: "error",
        message: err instanceof Error ? err.message : "Something went wrong",
      });
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && setOpen(o)}>
      <DialogTrigger asChild>
        <Button variant="secondary" disabled={disabled}>
          <HugeiconsIcon icon={Share08Icon} size={16} />
          Post
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Post to social</DialogTitle>
          <DialogDescription>
            Renders your meme and publishes it through your connected accounts.
          </DialogDescription>
        </DialogHeader>

        {stage.kind === "done" ? (
          <div className="flex flex-col items-center gap-2 py-6 text-center">
            <span className="flex size-10 items-center justify-center rounded-full bg-emerald-500/15 text-emerald-500">
              <HugeiconsIcon icon={Tick02Icon} size={20} />
            </span>
            <p className="text-sm font-medium">
              {stage.scheduled ? "Scheduled ✓" : "Posted ✓"}
            </p>
            <p className="text-xs text-muted-foreground">
              {stage.scheduled
                ? "upload-post will publish it at the scheduled time."
                : "It may take a minute to appear on your profiles."}
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              {PLATFORMS.map((p) => {
                const isConnected = !!connected?.[p.id];
                return (
                  <div
                    key={p.id}
                    className="flex items-center justify-between rounded-lg border border-border px-3 py-2.5"
                  >
                    <div className="flex items-center gap-2.5">
                      <HugeiconsIcon icon={p.icon} size={18} />
                      <span className="text-sm font-medium">{p.label}</span>
                      {connected !== null && !isConnected && (
                        <span className="text-xs text-muted-foreground">
                          Not connected
                        </span>
                      )}
                    </div>
                    <Switch
                      checked={selected[p.id]}
                      disabled={!isConnected || busy}
                      onCheckedChange={(v) =>
                        setSelected((s) => ({ ...s, [p.id]: v }))
                      }
                    />
                  </div>
                );
              })}
              {noneConnected && (
                <p className="text-xs text-muted-foreground">
                  No accounts connected yet.{" "}
                  <Link href="/integrations" className="underline">
                    Connect Instagram or TikTok →
                  </Link>
                </p>
              )}
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="post-title">Caption</Label>
              <Input
                id="post-title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Say something…"
                disabled={busy}
              />
            </div>

            <div className="flex flex-col gap-1.5">
              <Label htmlFor="post-schedule">Schedule (optional)</Label>
              <Input
                id="post-schedule"
                type="datetime-local"
                value={scheduledAt}
                onChange={(e) => setScheduledAt(e.target.value)}
                disabled={busy}
              />
              <p className="text-xs text-muted-foreground">
                Leave empty to post right away.
              </p>
            </div>

            {stage.kind === "error" && (
              <p className="text-xs text-destructive">{stage.message}</p>
            )}
          </div>
        )}

        <DialogFooter>
          {stage.kind === "done" ? (
            <Button onClick={() => setOpen(false)}>Done</Button>
          ) : (
            <Button onClick={publish} disabled={busy || platforms.length === 0}>
              {stage.kind === "rendering"
                ? "Rendering…"
                : stage.kind === "uploading"
                  ? "Uploading…"
                  : scheduledAt
                    ? "Schedule"
                    : "Post now"}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
