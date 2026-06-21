import {
  Download04Icon,
  DragDropIcon,
  FilmRoll01Icon,
  MusicNote01Icon,
  PaintBrush02Icon,
  SparklesIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

const FEATURES = [
  {
    icon: SparklesIcon,
    title: "An agent that builds the video",
    body: "Describe it in plain English and the agent assembles the scenes, copy, and timing for you.",
  },
  {
    icon: FilmRoll01Icon,
    title: "70+ cinematic scenes",
    body: "Animated titles, data charts, device mockups, captions, and pixel-accurate social cards.",
  },
  {
    icon: DragDropIcon,
    title: "A real timeline editor",
    body: "Drag to reorder, trim to retime, and add transitions between scenes — all in the browser.",
  },
  {
    icon: PaintBrush02Icon,
    title: "Restyle anything",
    body: "Swap colors, fonts, and accents on any scene with universal controls. Make it yours in seconds.",
  },
  {
    icon: MusicNote01Icon,
    title: "Sound built in",
    body: "Search royalty-free music or drop your own MP3, then trim and fade it right on the timeline.",
  },
  {
    icon: Download04Icon,
    title: "Export Full-HD MP4",
    body: "Render in your browser or in the cloud, in landscape, square, or vertical — ready to post.",
  },
];

export function Features() {
  return (
    <section className="border-b border-dashed border-border px-6 py-20 sm:px-10 sm:py-24">
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl">
          <h2 className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
            Everything you need to make it move.
          </h2>
          <p className="mt-4 text-base leading-relaxed text-muted-foreground">
            Keyloom is a full motion-graphics studio in the browser — built on
            Remotion, so every scene is real, programmatic, and export-ready.
          </p>
        </div>

        <div className="mt-12 grid gap-px overflow-hidden rounded-2xl border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
          {FEATURES.map((f) => (
            <div key={f.title} className="bg-background p-6">
              <div className="flex size-10 items-center justify-center rounded-lg bg-muted text-foreground">
                <HugeiconsIcon icon={f.icon} className="size-5" />
              </div>
              <h3 className="mt-4 text-[15px] font-semibold text-foreground">
                {f.title}
              </h3>
              <p className="mt-1.5 text-[14px] leading-relaxed text-muted-foreground">
                {f.body}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
