"use client";

import {
  ArrowRight01Icon,
  PaintBoardIcon,
  RefreshIcon,
  TextIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ClipStyle } from "@workspace/compositions/clip-style";
import {
  FieldsRenderer,
  PrimitiveControl,
} from "@workspace/compositions/editors";
import type { Project } from "@workspace/compositions/project";
import {
  compositionModulePath,
  compositionsById,
} from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@workspace/ui/components/collapsible";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { cn } from "@workspace/ui/lib/utils";
import { useReducedMotion } from "motion/react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { toast } from "sonner";
import { resolveCompositionMeta } from "@/lib/composition-meta";
import { CATEGORY_COLORS, CATEGORY_LABELS } from "@/lib/scene-categories";
import { storeSceneProject } from "@/lib/scene-handoff";
import {
  matchLook,
  ORIGINAL_LOOK_ID,
  SCENE_LOOKS,
  type SceneLook,
} from "@/lib/scene-looks";

const LivePreview = dynamic(
  () => import("./live-preview").then((m) => m.LivePreview),
  {
    ssr: false,
    loading: () => (
      <p role="status" className="p-6 text-sm text-white/50">
        Loading scene…
      </p>
    ),
  },
);

const QUICK_FIELD_KINDS = ["text", "textarea", "select", "switch"];
const QUICK_FIELD_LIMIT = 4;

const COLOR_FIELDS: {
  kind: "color";
  key: "backgroundColor" | "textColor" | "accentColor";
  label: string;
}[] = [
  { kind: "color", key: "backgroundColor", label: "Background" },
  { kind: "color", key: "textColor", label: "Text" },
  { kind: "color", key: "accentColor", label: "Accent" },
];

/**
 * A scene's public page: the scene runs on a dark stage, and the panel next
 * to it changes how it looks and what it says. Everything the creator sets
 * here travels into Studio as a single-clip project.
 */
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
  const [style, setStyle] = useState<ClipStyle>({});
  const [opening, setOpening] = useState(false);

  const meta = resolveCompositionMeta(info, props);
  const categoryColor = CATEGORY_COLORS[info.category];
  const themes = info.themes ?? [];
  const activeTheme = style.theme ?? themes[0]?.id;
  const activeLook = matchLook(style);

  const quickFields = info.fields
    .filter((field) => QUICK_FIELD_KINDS.includes(field.kind))
    .slice(0, QUICK_FIELD_LIMIT);
  const chatFields = info.fields.filter((field) => field.kind === "chat");
  const moreFields = info.fields.filter(
    (field) => !quickFields.includes(field) && field.kind !== "chat",
  );

  const isEdited =
    Object.keys(style).some((key) => style[key as keyof ClipStyle]) ||
    JSON.stringify(props) !== JSON.stringify(info.defaultProps);

  // The player receives exactly what Studio's Project.tsx would forward.
  const previewProps: Record<string, unknown> = {
    ...props,
    clipStyle: style,
    ...(style.theme ? { clipTheme: style.theme } : {}),
  };

  function applyLook(look: SceneLook) {
    setStyle((current) => ({
      ...current,
      backgroundColor: look.style.backgroundColor,
      textColor: look.style.textColor,
      accentColor: look.style.accentColor,
    }));
  }

  function resetAll() {
    setProps(structuredClone(info.defaultProps));
    setStyle({});
  }

  function openStudio() {
    const hasStyle = Object.values(style).some(Boolean);
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
          ...(hasStyle ? { style } : {}),
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

  const cta = (
    <Button
      size="lg"
      onClick={openStudio}
      disabled={opening}
      className="h-11 w-full rounded-full text-[15px] font-semibold"
    >
      {opening ? "Opening Studio…" : "Use in Studio"}
      <HugeiconsIcon icon={ArrowRight01Icon} size={16} />
    </Button>
  );

  return (
    <>
      <header className="mt-6 mb-8 max-w-2xl">
        <h1 className="font-heading text-4xl font-semibold tracking-tight text-balance sm:text-5xl">
          {info.title}
        </h1>
        <p className="mt-3 text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          {info.description}
        </p>
      </header>

      <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_352px] lg:gap-8">
        <section
          aria-label={`${info.title} preview`}
          className="min-w-0 lg:sticky lg:top-6"
        >
          <div
            className="relative overflow-hidden rounded-3xl bg-[#0e0e12] text-white"
            style={{
              backgroundImage: `radial-gradient(ellipse 70% 60% at 20% 0%, ${categoryColor}33, transparent 60%), radial-gradient(ellipse 60% 50% at 90% 100%, ${categoryColor}1f, transparent 60%)`,
            }}
          >
            <div className="flex min-h-[420px] items-center justify-center p-4 sm:p-8 lg:min-h-[560px]">
              <div
                className="w-full overflow-hidden rounded-xl shadow-[0_30px_80px_-20px_rgba(0,0,0,0.7)] ring-1 ring-white/10"
                style={{
                  aspectRatio: `${meta.width} / ${meta.height}`,
                  maxWidth:
                    meta.height > meta.width
                      ? `min(100%, ${(64 * meta.width) / meta.height}vh)`
                      : undefined,
                }}
              >
                <LivePreview
                  modulePath={compositionModulePath(info)}
                  id={id}
                  defaultProps={previewProps}
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

            <div className="flex flex-wrap items-center gap-x-5 gap-y-2 border-t border-white/10 px-5 py-3.5 text-[13px] text-white/60">
              <span className="flex items-center gap-2 text-white/85">
                <span
                  aria-hidden
                  className="size-2 rounded-full"
                  style={{ backgroundColor: categoryColor }}
                />
                {CATEGORY_LABELS[info.category]}
              </span>
              <span>{formatDuration(meta.durationInFrames, meta.fps)}</span>
              <span>{formatAspect(meta.width, meta.height)}</span>
              {isEdited ? (
                <span className="ml-auto text-white/85">Edited</span>
              ) : null}
            </div>
          </div>
          <p className="mt-3 text-sm text-muted-foreground md:hidden">
            Preview and customize here. Studio editing needs a tablet or
            desktop.
          </p>
        </section>

        <aside className="min-w-0 lg:sticky lg:top-6">
          <div className="lg:hidden">{cta}</div>

          <Tabs defaultValue="look" className="mt-5 lg:mt-0">
            <div className="flex items-center justify-between gap-3">
              <TabsList className="h-10">
                <TabsTrigger value="look" className="px-4">
                  <HugeiconsIcon icon={PaintBoardIcon} size={15} />
                  Look
                </TabsTrigger>
                <TabsTrigger value="content" className="px-4">
                  <HugeiconsIcon icon={TextIcon} size={15} />
                  Content
                </TabsTrigger>
              </TabsList>
              <Button
                variant="ghost"
                size="sm"
                onClick={resetAll}
                disabled={!isEdited}
                className="rounded-full text-muted-foreground"
              >
                <HugeiconsIcon icon={RefreshIcon} size={14} />
                Reset
              </Button>
            </div>

            <TabsContent value="look" className="mt-4 space-y-6">
              {themes.length > 0 ? (
                <div>
                  <h2 className="text-sm font-semibold">Theme</h2>
                  <div className="mt-2.5 flex flex-wrap gap-2">
                    {themes.map((theme, index) => {
                      const selected = activeTheme === theme.id;
                      return (
                        <button
                          key={theme.id}
                          type="button"
                          aria-pressed={selected}
                          title={theme.description}
                          onClick={() =>
                            setStyle((current) => ({
                              ...current,
                              theme: index === 0 ? undefined : theme.id,
                            }))
                          }
                          className={cn(
                            "rounded-full px-3.5 py-1.5 text-[13px] font-medium transition-colors",
                            selected
                              ? "bg-foreground text-background"
                              : "bg-card text-muted-foreground shadow-sm hover:text-foreground",
                          )}
                        >
                          {theme.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              ) : null}

              <div>
                <h2 className="text-sm font-semibold">Colors</h2>
                <p className="mt-0.5 text-[13px] text-muted-foreground">
                  Pick a look, or set your own below.
                </p>
                <div className="mt-3 grid grid-cols-4 gap-2.5">
                  {SCENE_LOOKS.map((look) => (
                    <LookSwatch
                      key={look.id}
                      look={look}
                      selected={activeLook === look.id}
                      onSelect={() => applyLook(look)}
                    />
                  ))}
                </div>
              </div>

              <Collapsible className="rounded-2xl bg-card shadow-sm">
                <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-medium">
                  Custom colors
                  <HugeiconsIcon
                    icon={ArrowRight01Icon}
                    size={14}
                    className="text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90"
                  />
                </CollapsibleTrigger>
                <CollapsibleContent className="space-y-3 px-4 pb-4">
                  {COLOR_FIELDS.map((field) => (
                    <PrimitiveControl
                      key={field.key}
                      field={field}
                      value={style[field.key] ?? ""}
                      onChange={(v) =>
                        setStyle((c) => ({
                          ...c,
                          [field.key]: typeof v === "string" ? v : undefined,
                        }))
                      }
                    />
                  ))}
                </CollapsibleContent>
              </Collapsible>
            </TabsContent>

            <TabsContent value="content" className="mt-4 space-y-3">
              {quickFields.length > 0 ? (
                <div className="rounded-2xl bg-card shadow-sm">
                  <FieldsRenderer
                    fields={quickFields}
                    value={props}
                    onChange={setProps}
                  />
                </div>
              ) : null}
              {chatFields.length > 0 ? (
                <Collapsible
                  defaultOpen={quickFields.length === 0}
                  className="rounded-2xl bg-card shadow-sm"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-medium">
                    Messages
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={14}
                      className="text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-border">
                    <FieldsRenderer
                      fields={chatFields}
                      value={props}
                      onChange={setProps}
                    />
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
              {moreFields.length > 0 ? (
                <Collapsible
                  defaultOpen={
                    quickFields.length === 0 && chatFields.length === 0
                  }
                  className="rounded-2xl bg-card shadow-sm"
                >
                  <CollapsibleTrigger className="flex w-full items-center justify-between px-4 py-3 text-[13px] font-medium">
                    More options
                    <HugeiconsIcon
                      icon={ArrowRight01Icon}
                      size={14}
                      className="text-muted-foreground transition-transform [[data-state=open]>&]:rotate-90"
                    />
                  </CollapsibleTrigger>
                  <CollapsibleContent className="border-t border-border">
                    <FieldsRenderer
                      fields={moreFields}
                      value={props}
                      onChange={setProps}
                    />
                  </CollapsibleContent>
                </Collapsible>
              ) : null}
              {quickFields.length + chatFields.length + moreFields.length ===
              0 ? (
                <p className="rounded-2xl bg-card px-4 py-6 text-center text-sm text-muted-foreground shadow-sm">
                  This scene has nothing to edit here. Open it in Studio to
                  change the timing and layout.
                </p>
              ) : null}
            </TabsContent>
          </Tabs>

          <div className="mt-6 hidden lg:block">
            {cta}
            <p className="mt-2 text-center text-[12px] text-muted-foreground">
              Starts a new video with your changes.
            </p>
          </div>
        </aside>
      </div>

      {relatedIds.length > 0 && (
        <section className="mt-16" aria-labelledby="related-heading">
          <div className="flex items-baseline justify-between gap-4">
            <h2
              id="related-heading"
              className="font-heading text-2xl font-semibold tracking-tight"
            >
              More {CATEGORY_LABELS[info.category].toLowerCase()} scenes
            </h2>
            <Link
              href="/components"
              className="text-sm text-muted-foreground hover:text-foreground"
            >
              See all
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {relatedIds.map((relatedId) => {
              const scene = compositionsById[relatedId]!;
              const relatedMeta = resolveCompositionMeta(scene);
              return (
                <Link
                  key={scene.id}
                  href={`/component/${scene.id}`}
                  prefetch={false}
                  className="group block overflow-hidden rounded-2xl border border-border/60 bg-card shadow-sm transition-shadow hover:shadow-md"
                >
                  <div
                    className="pointer-events-none relative m-2 aspect-[4/5] overflow-hidden rounded-xl bg-muted/40"
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
                  <h3 className="truncate px-3 pb-3 pt-1 text-[13px] font-semibold leading-tight">
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

function LookSwatch({
  look,
  selected,
  onSelect,
}: {
  look: SceneLook;
  selected: boolean;
  onSelect: () => void;
}) {
  const original = look.id === ORIGINAL_LOOK_ID;
  return (
    <button
      type="button"
      aria-pressed={selected}
      onClick={onSelect}
      className="group flex flex-col items-center gap-1.5 rounded-xl focus-visible:outline-none"
    >
      <span
        className={cn(
          "relative flex aspect-square w-full items-end justify-between overflow-hidden rounded-xl p-1.5 shadow-sm ring-2 ring-offset-2 ring-offset-background transition-[transform,box-shadow] group-hover:scale-[1.04] group-focus-visible:ring-ring",
          selected ? "ring-foreground" : "ring-transparent",
          original &&
            "bg-[conic-gradient(from_180deg,#f5f5f5,#d4d4d8,#f5f5f5)] dark:bg-[conic-gradient(from_180deg,#3f3f46,#27272a,#3f3f46)]",
        )}
        style={
          original ? undefined : { backgroundColor: look.style.backgroundColor }
        }
      >
        {original ? null : (
          <>
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ backgroundColor: look.style.textColor }}
            />
            <span
              aria-hidden
              className="size-2.5 rounded-full"
              style={{ backgroundColor: look.style.accentColor }}
            />
          </>
        )}
      </span>
      <span
        className={cn(
          "text-[11px] leading-none",
          selected ? "font-medium text-foreground" : "text-muted-foreground",
        )}
      >
        {look.label}
      </span>
    </button>
  );
}

function formatDuration(frames: number, fps: number): string {
  const seconds = frames / fps;
  return seconds < 10 ? `${seconds.toFixed(1)}s` : `${Math.round(seconds)}s`;
}

function formatAspect(width: number, height: number): string {
  const divisor = gcd(width, height);
  const w = width / divisor;
  const h = height / divisor;
  // Common near-miss ratios read better rounded to what creators call them.
  if (Math.abs(width / height - 16 / 9) < 0.02) return "16:9";
  if (Math.abs(width / height - 9 / 16) < 0.02) return "9:16";
  if (Math.abs(width / height - 4 / 5) < 0.02) return "4:5";
  return `${w}:${h}`;
}

function gcd(a: number, b: number): number {
  return b === 0 ? a : gcd(b, a % b);
}
