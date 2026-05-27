import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { compositions } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import { HeroVideoDialog } from "@workspace/ui/components/hero-video-dialog";
import Image from "next/image";
import Link from "next/link";
import { DocsHeader } from "@/components/docs-header";
import { FeaturedComponents } from "@/components/featured-components";
import { HeroSticker, type HeroStickerProps } from "@/components/hero-sticker";
import { SiteFooter } from "@/components/site-footer";

// Every sticker extracted from "stickers motion design shit.png".
// Each one gets a unique position, rotation, size, and bob timing so the
// scatter feels handmade rather than evenly distributed.
const HERO_STICKERS: HeroStickerProps[] = [
  // Left wall — top to bottom
  {
    src: "/images/stickers/sticker_03.webp",
    width: 96,
    rotate: -16,
    position: { left: "2%", top: "5%" },
    duration: 3.6,
    distance: 9,
    delay: 0,
  },
  {
    src: "/images/stickers/sticker_13.webp",
    width: 84,
    rotate: 8,
    position: { left: "12%", top: "16%" },
    duration: 4.1,
    distance: 7,
    delay: 0.4,
  },
  {
    src: "/images/stickers/sticker_05.webp",
    width: 100,
    rotate: -10,
    position: { left: "1%", top: "30%" },
    duration: 3.3,
    distance: 10,
    delay: 0.8,
  },
  {
    src: "/images/stickers/sticker_06.webp",
    width: 92,
    rotate: 14,
    position: { left: "15%", top: "44%" },
    duration: 4.4,
    distance: 6,
    delay: 1.2,
  },
  {
    src: "/images/stickers/sticker_17.webp",
    width: 86,
    rotate: -7,
    position: { left: "3%", top: "58%" },
    duration: 3.8,
    distance: 8,
    delay: 1.6,
  },
  {
    src: "/images/stickers/sticker_11.webp",
    width: 96,
    rotate: 12,
    position: { left: "13%", top: "73%" },
    duration: 3.5,
    distance: 9,
    delay: 0.2,
  },
  {
    src: "/images/stickers/sticker_18.webp",
    width: 80,
    rotate: -22,
    position: { left: "5%", bottom: "4%" },
    duration: 4.2,
    distance: 7,
    delay: 1.0,
  },

  // Right wall — top to bottom
  {
    src: "/images/stickers/sticker_04.webp",
    width: 102,
    rotate: 18,
    position: { right: "2%", top: "6%" },
    duration: 3.4,
    distance: 8,
    delay: 0.3,
  },
  {
    src: "/images/stickers/sticker_15.webp",
    width: 80,
    rotate: -10,
    position: { right: "13%", top: "18%" },
    duration: 4.0,
    distance: 7,
    delay: 0.7,
  },
  {
    src: "/images/stickers/sticker_07.webp",
    width: 96,
    rotate: 9,
    position: { right: "1%", top: "32%" },
    duration: 3.7,
    distance: 10,
    delay: 1.1,
  },
  {
    src: "/images/stickers/sticker_10.webp",
    width: 88,
    rotate: -15,
    position: { right: "16%", top: "45%" },
    duration: 3.2,
    distance: 6,
    delay: 1.5,
  },
  {
    src: "/images/stickers/sticker_08.webp",
    width: 102,
    rotate: 7,
    position: { right: "3%", top: "58%" },
    duration: 4.3,
    distance: 9,
    delay: 1.9,
  },
  {
    src: "/images/stickers/sticker_19.webp",
    width: 78,
    rotate: 20,
    position: { right: "11%", top: "72%" },
    duration: 3.6,
    distance: 7,
    delay: 0.5,
  },
  {
    src: "/images/stickers/sticker_20.webp",
    width: 86,
    rotate: -13,
    position: { right: "4%", bottom: "5%" },
    duration: 4.5,
    distance: 8,
    delay: 1.3,
  },

  // Top stripe — above the centered content
  {
    src: "/images/stickers/sticker_01.webp",
    width: 110,
    rotate: -6,
    position: { left: "26%", top: "2%" },
    duration: 3.9,
    distance: 9,
    delay: 0.1,
  },
  {
    src: "/images/stickers/sticker_02.webp",
    width: 96,
    rotate: 4,
    position: { right: "27%", top: "3%" },
    duration: 3.5,
    distance: 7,
    delay: 1.4,
  },

  // Bottom stripe — below the buttons
  {
    src: "/images/stickers/sticker_09.webp",
    width: 84,
    rotate: 11,
    position: { left: "30%", bottom: "3%" },
    duration: 4.1,
    distance: 8,
    delay: 0.6,
  },
  {
    src: "/images/stickers/sticker_12.webp",
    width: 86,
    rotate: -14,
    position: { right: "30%", bottom: "2%" },
    duration: 3.4,
    distance: 9,
    delay: 1.7,
  },
  {
    src: "/images/stickers/sticker_14.webp",
    width: 70,
    rotate: 17,
    position: { left: "42%", bottom: "8%" },
    duration: 3.7,
    distance: 6,
    delay: 0.9,
  },
  {
    src: "/images/stickers/sticker_16.webp",
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

        <div className="relative z-10 w-full px-4 py-16 sm:px-6 sm:py-20 lg:px-8">
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <h1 className="text-4xl font-semibold tracking-tight text-balance sm:text-6xl md:text-7xl">
              Ship videos
              <Image
                src="/images/clapperboard.png"
                alt=""
                aria-hidden
                width={64}
                height={64}
                className="mx-1 inline-block h-[1.3em] w-auto align-[-0.22em]"
              />
              that look expensive.
            </h1>
            <p className="mt-6 max-w-xl text-sm text-muted-foreground text-balance sm:text-lg">
              A library of cinematic scenes for Remotion. No After Effects, no
              animation team — drop in, render, ship.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3 sm:mt-10">
              <Button asChild>
                <Link href="/docs">Get started</Link>
              </Button>
              <Button variant="outline" asChild>
                <Link href="/studio">Open Studio</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Showcase video */}
      <section className="border-b border-dashed border-border px-8 py-16">
        <div className="mx-auto max-w-5xl">
          <HeroVideoDialog
            videoSrc="/motion-studio-showcase.mp4"
            thumbnailSrc="/motion-studio-showcase-poster.png"
            thumbnailAlt="Motion Studio showcase video"
            animationStyle="from-center"
          />
        </div>
      </section>

      {/* Featured component */}
      <section className="border-b border-dashed border-border px-4 py-14 sm:px-6 sm:py-20 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="mb-8 flex flex-col items-start justify-between gap-3 sm:mb-12 sm:flex-row sm:items-end sm:gap-6">
            <div>
              <h2 className="text-2xl font-semibold tracking-tight sm:text-4xl">
                Browse the components.
              </h2>
              <p className="mt-2 text-sm text-muted-foreground sm:mt-3 sm:text-base">
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
      <section className="px-4 py-16 sm:px-6 sm:py-24 lg:px-8">
        <div className="mx-auto max-w-3xl rounded-xl border border-dashed border-border bg-muted/20 px-5 py-10 text-center sm:px-8 sm:py-14">
          <h2 className="text-2xl font-semibold tracking-tight text-balance sm:text-4xl">
            Start shipping motion in minutes.
          </h2>
          <p className="mx-auto mt-3 max-w-md text-sm text-muted-foreground sm:text-base">
            Read the docs, copy a component, render your first scene.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3 sm:mt-8">
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

      <SiteFooter />
    </div>
  );
}
