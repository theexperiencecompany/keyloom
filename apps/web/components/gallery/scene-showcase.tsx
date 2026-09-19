"use client";

import { FieldsRenderer } from "@workspace/compositions/editors";
import type { Project } from "@workspace/compositions/project";
import {
  compositionModulePath,
  compositionsById,
} from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { resolveCompositionMeta } from "@/lib/composition-meta";
import { storeSceneProject } from "@/lib/scene-handoff";

const LivePreview = dynamic(
  () => import("./live-preview").then((m) => m.LivePreview),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="p-6 text-sm text-muted-foreground">
        Loading preview…
      </p>
    ),
  },
);

export function SceneShowcase({
  id,
  relatedIds,
}: {
  id: string;
  relatedIds: string[];
}) {
  const info = compositionsById[id]!;
  const router = useRouter();
  const reducedMotion = useReducedMotion();
  const [props, setProps] = useState<Record<string, unknown>>(() =>
    structuredClone(info.defaultProps),
  );
  const [opening, setOpening] = useState(false);
  const meta = resolveCompositionMeta(info, props);
  // Keep the initial panel approachable; the existing editor handles every
  // advanced field (including nested scenes and conversation editing).
  const quickFields = info.fields
    .filter((field) =>
      ["text", "textarea", "color", "select"].includes(field.kind),
    )
    .slice(0, 4);
  const chatFields = info.fields.filter((field) => field.kind === "chat");
  const moreFields = info.fields.filter(
    (field) => !quickFields.includes(field) && field.kind !== "chat",
  );

  function openStudio() {
    const project: Project = {
      name: info.title,
      fps: meta.fps,
      width: meta.width,
      height: meta.height,
      clips: [
        {
          id: crypto.randomUUID(),
          compositionId: id,
          props,
          durationInFrames: meta.durationInFrames,
        },
      ],
    };
    try {
      storeSceneProject(window.sessionStorage, project);
      setOpening(true);
      router.push("/studio?from=showcase");
    } catch {
      toast.error(
        "We couldn't open Studio. Your changes are still here. Allow browser storage and try again.",
      );
    }
  }

  return (
    <>
      <header className="my-8 flex flex-wrap items-start justify-between gap-5">
        <div className="max-w-2xl">
          <h1 className="font-heading text-3xl font-semibold tracking-tight sm:text-4xl">
            {info.title}
          </h1>
          <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground">
            {info.description}
          </p>
        </div>
        <Button onClick={openStudio} disabled={opening}>
          {opening ? "Opening Studio…" : "Use in Studio"}
        </Button>
      </header>

      <div className="grid items-start gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
        <section
          aria-label={`${info.title} preview`}
          className="min-w-0 lg:sticky lg:top-20"
        >
          <div className="flex min-h-64 items-center justify-center rounded-xl border border-border bg-muted/20 p-3 sm:p-6">
            <div
              className="w-full overflow-hidden rounded-lg"
              style={{
                aspectRatio: `${meta.width} / ${meta.height}`,
                maxWidth:
                  meta.height > meta.width
                    ? `min(100%, ${(60 * meta.width) / meta.height}vh)`
                    : undefined,
              }}
            >
              <LivePreview
                modulePath={compositionModulePath(info)}
                id={id}
                defaultProps={props}
                durationInFrames={meta.durationInFrames}
                fps={meta.fps}
                width={meta.width}
                height={meta.height}
                controls
                autoPlay={reducedMotion === false}
                playbackRate={1}
              />
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground">
            Try a few changes, then take your scene into Studio.
          </p>
          <p className="mt-2 text-sm text-muted-foreground md:hidden">
            You can preview and customize here. Studio editing needs a tablet or
            desktop.
          </p>
        </section>

        <section
          aria-labelledby="customize-heading"
          className="min-w-0 rounded-xl border border-border"
        >
          <div className="flex items-center justify-between gap-3 border-b border-border px-4 py-3">
            <h2 id="customize-heading" className="font-semibold">
              Make it yours
            </h2>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setProps(structuredClone(info.defaultProps))}
            >
              Reset
            </Button>
          </div>
          <FieldsRenderer
            fields={quickFields}
            value={props}
            onChange={setProps}
          />
          {chatFields.length > 0 && (
            <details className="border-t border-border">
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                Edit messages
              </summary>
              <FieldsRenderer
                fields={chatFields}
                value={props}
                onChange={setProps}
              />
            </details>
          )}
          {moreFields.length > 0 && (
            <details
              open={quickFields.length === 0 ? true : undefined}
              className="border-t border-border"
            >
              <summary className="cursor-pointer px-4 py-3 text-sm font-medium">
                More options
              </summary>
              <FieldsRenderer
                fields={moreFields}
                value={props}
                onChange={setProps}
              />
            </details>
          )}
          <div className="border-t border-border p-4">
            <Button className="w-full" onClick={openStudio} disabled={opening}>
              {opening ? "Opening Studio…" : "Use in Studio"}
            </Button>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Starts a new video with your changes.
            </p>
          </div>
        </section>
      </div>

      {relatedIds.length > 0 && (
        <section className="mt-14" aria-labelledby="related-heading">
          <h2
            id="related-heading"
            className="font-heading text-xl font-semibold"
          >
            More scenes to try
          </h2>
          <div className="mt-5 grid gap-5 sm:grid-cols-3">
            {relatedIds.map((relatedId) => {
              const scene = compositionsById[relatedId]!;
              const relatedMeta = resolveCompositionMeta(scene);
              return (
                <Link
                  key={scene.id}
                  href={`/component/${scene.id}`}
                  prefetch={false}
                  className="group min-w-0 rounded-xl border border-border p-3 transition-colors hover:bg-muted/30"
                >
                  <div
                    className="pointer-events-none aspect-video overflow-hidden rounded-lg bg-muted/20"
                    aria-hidden="true"
                  >
                    <LivePreview
                      modulePath={compositionModulePath(scene)}
                      id={scene.id}
                      defaultProps={scene.defaultProps}
                      {...relatedMeta}
                      autoPlay={false}
                      initialFrame={Math.floor(
                        relatedMeta.durationInFrames / 2,
                      )}
                    />
                  </div>
                  <h3 className="mt-3 text-sm font-medium group-hover:underline">
                    {scene.title}
                  </h3>
                </Link>
              );
            })}
          </div>
        </section>
      )}
    </>
  );
}
