import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositions } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import Link from "next/link";
import { DebugNavProbe } from "@/components/debug-nav-probe";
import { DocsHeader } from "@/components/docs-header";
import { FeaturedComponents } from "@/components/featured-components";
import { HeroSticker, type HeroStickerProps } from "@/components/hero-sticker";

// Every sticker extracted from "stickers motion design shit.png".
// Each one gets a unique position, rotation, size, and bob timing so the
// scatter feels handmade rather than evenly distributed.
const HERO_STICKERS: HeroStickerProps[] = [
  // Left wall — top to bottom
  {
    src: "/images/stickers/sticker_03.png",
    width: 96,
    rotate: -16,
    position: { left: "2%", top: "5%" },
    duration: 3.6,
    distance: 9,
    delay: 0,
  },
  {
    src: "/images/stickers/sticker_13.png",
    width: 84,
    rotate: 8,
    position: { left: "12%", top: "16%" },
    duration: 4.1,
    distance: 7,
    delay: 0.4,
  },
  {
    src: "/images/stickers/sticker_05.png",
    width: 100,
    rotate: -10,
    position: { left: "1%", top: "30%" },
    duration: 3.3,
    distance: 10,
    delay: 0.8,
  },
  {
    src: "/images/stickers/sticker_06.png",
    width: 92,
    rotate: 14,
    position: { left: "15%", top: "44%" },
    duration: 4.4,
    distance: 6,
    delay: 1.2,
  },
  {
    src: "/images/stickers/sticker_17.png",
    width: 86,
    rotate: -7,
    position: { left: "3%", top: "58%" },
    duration: 3.8,
    distance: 8,
    delay: 1.6,
  },
  {
    src: "/images/stickers/sticker_11.png",
    width: 96,
    rotate: 12,
    position: { left: "13%", top: "73%" },
    duration: 3.5,
    distance: 9,
    delay: 0.2,
  },
  {
    src: "/images/stickers/sticker_18.png",
    width: 80,
    rotate: -22,
    position: { left: "5%", bottom: "4%" },
    duration: 4.2,
    distance: 7,
    delay: 1.0,
  },

  // Right wall — top to bottom
  {
    src: "/images/stickers/sticker_04.png",
    width: 102,
    rotate: 18,
    position: { right: "2%", top: "6%" },
    duration: 3.4,
    distance: 8,
    delay: 0.3,
  },
  {
    src: "/images/stickers/sticker_15.png",
    width: 80,
    rotate: -10,
    position: { right: "13%", top: "18%" },
    duration: 4.0,
    distance: 7,
    delay: 0.7,
  },
  {
    src: "/images/stickers/sticker_07.png",
    width: 96,
    rotate: 9,
    position: { right: "1%", top: "32%" },
    duration: 3.7,
    distance: 10,
    delay: 1.1,
  },
  {
    src: "/images/stickers/sticker_10.png",
    width: 88,
    rotate: -15,
    position: { right: "16%", top: "45%" },
    duration: 3.2,
    distance: 6,
    delay: 1.5,
  },
  {
    src: "/images/stickers/sticker_08.png",
    width: 102,
    rotate: 7,
    position: { right: "3%", top: "58%" },
    duration: 4.3,
    distance: 9,
    delay: 1.9,
  },
  {
    src: "/images/stickers/sticker_19.png",
    width: 78,
    rotate: 20,
    position: { right: "11%", top: "72%" },
    duration: 3.6,
    distance: 7,
    delay: 0.5,
  },
  {
    src: "/images/stickers/sticker_20.png",
    width: 86,
    rotate: -13,
    position: { right: "4%", bottom: "5%" },
    duration: 4.5,
    distance: 8,
    delay: 1.3,
  },

  // Top stripe — above the centered content
  {
    src: "/images/stickers/sticker_01.png",
    width: 110,
    rotate: -6,
    position: { left: "26%", top: "2%" },
    duration: 3.9,
    distance: 9,
    delay: 0.1,
  },
  {
    src: "/images/stickers/sticker_02.png",
    width: 96,
    rotate: 4,
    position: { right: "27%", top: "3%" },
    duration: 3.5,
    distance: 7,
    delay: 1.4,
  },

  // Bottom stripe — below the buttons
  {
    src: "/images/stickers/sticker_09.png",
    width: 84,
    rotate: 11,
    position: { left: "30%", bottom: "3%" },
    duration: 4.1,
    distance: 8,
    delay: 0.6,
  },
  {
    src: "/images/stickers/sticker_12.png",
    width: 86,
    rotate: -14,
    position: { right: "30%", bottom: "2%" },
    duration: 3.4,
    distance: 9,
    delay: 1.7,
  },
  {
    src: "/images/stickers/sticker_14.png",
    width: 70,
    rotate: 17,
    position: { left: "42%", bottom: "8%" },
    duration: 3.7,
    distance: 6,
    delay: 0.9,
  },
  {
    src: "/images/stickers/sticker_16.png",
    width: 72,
    rotate: -19,
    position: { right: "44%", top: "4%" },
    duration: 4.2,
    distance: 7,
    delay: 2.0,
  },
];

export default function LandingPage() {
  const items = compositions.map(({ calculateMetadata: _, ...rest }) => rest);

  return (
    <div className="mx-auto min-h-screen max-w-[1600px] border-x border-dashed border-border">
      <DebugNavProbe />
      <DocsHeader />

      {/* Hero */}
      <section className="relative flex min-h-screen items-center overflow-hidden border-b border-dashed border-border">
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.07]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.4) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.4) 1px, transparent 1px)",
            backgroundSize: "44px 44px",
            maskImage:
              "radial-gradient(circle at 50% 30%, black 0%, transparent 70%)",
          }}
        />

        {/* Stickers — every sticker from the sheet, draggable + slowly bobbing (xl+) */}
        {HERO_STICKERS.map((s) => (
          <HeroSticker key={s.src} {...s} />
        ))}

        <div className="relative w-full px-8 py-20">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="text-5xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
              Ship videos
              <img
                src="/images/clapperboard.png"
                alt=""
                aria-hidden
                className="mx-1 inline-block h-[1.05em] w-auto align-[-0.18em]"
              />
              that look expensive.
            </h1>
            <p className="mt-6 max-w-xl text-base text-muted-foreground text-balance sm:text-lg">
              A library of cinematic scenes for Remotion. No After Effects, no
              animation team — drop in, render, ship.
            </p>

            <div className="mt-10 flex flex-wrap items-center justify-center gap-3">
              <Button asChild>
                <Link href="/docs">
                  Get started
                  <HugeiconsIcon
                    icon={ArrowRight02Icon}
                    data-icon="inline-end"
                  />
                </Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/studio">Open Studio</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Featured component */}
      <section className="border-b border-dashed border-border px-8 py-20">
        <div className="mx-auto max-w-7xl">
          <div className="mb-12 flex items-end justify-between gap-6">
            <div>
              <h2 className="text-3xl font-semibold tracking-tight sm:text-4xl">
                Browse the components.
              </h2>
              <p className="mt-3 text-muted-foreground">
                Premium scenes you can drop straight into a video. Tap the
                preview for sound.
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              asChild
              className="hidden shrink-0 sm:inline-flex"
            >
              <Link href="/docs">
                View all
                <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
              </Link>
            </Button>
          </div>

          <FeaturedComponents items={items} />
        </div>
      </section>

      {/* CTA */}
      <section className="px-8 py-24">
        <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-border bg-muted/20 px-8 py-14 text-center">
          <h2 className="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Start shipping motion in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-muted-foreground">
            Read the docs, copy a component, render your first scene.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
            <Button asChild>
              <Link href="/docs">
                Read the docs
                <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
              </Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="https://github.com/theexperiencecompany/motion-studio">
                GitHub
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-dashed border-border px-8 py-10">
        <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-4 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="size-4 rounded bg-foreground" />
            <span>Motion Studio</span>
          </div>
          <div className="flex items-center gap-5">
            <Link href="/docs" className="hover:text-foreground">
              Docs
            </Link>
            <Link href="/studio" className="hover:text-foreground">
              Studio
            </Link>
            <Link
              href="https://github.com/theexperiencecompany/motion-studio"
              className="hover:text-foreground"
            >
              GitHub
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
