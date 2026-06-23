import { ArrowRight02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Image from "next/image";
import Link from "next/link";
import NavbarMenuFull from "@/components/landing/navbar-menu";
import { PhoneMockup } from "@/components/landing/phone-mockup";
import { SiteFooter } from "@/components/site-footer";

export default function LandingPage() {
  return (
    <div className="mx-auto min-h-screen max-w-7xl">
      <NavbarMenuFull />

      <main className="flex flex-col items-center px-5 pb-20 pt-20 text-center sm:pt-28">
        <span className="mb-6 inline-flex items-center rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground">
          Marketing reels, built in the browser
        </span>
        <h1 className="max-w-3xl text-balance text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Ship marketing reels for your product.
        </h1>
        <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
          A library of ready-made motion scenes. Compose, customize, and ship
          reels for{" "}
          <span className="inline-flex items-center gap-1 align-middle font-medium text-foreground">
            <Image
              src="/tiktok_logo.png"
              alt=""
              aria-hidden
              width={20}
              height={20}
              className="size-5 rounded-[5px]"
            />
            TikTok
          </span>{" "}
          and{" "}
          <span className="inline-flex items-center gap-1 align-middle font-medium text-foreground">
            <Image
              src="/instagram_logo.png"
              alt=""
              aria-hidden
              width={20}
              height={20}
              className="size-5 rounded-[5px]"
            />
            Instagram
          </span>{" "}
          — right from your browser.
        </p>
        <div className="mt-9 flex w-full flex-col items-center gap-3 sm:w-auto sm:flex-row">
          <Button asChild size="lg" className="w-full sm:w-auto">
            <Link href="/studio">
              Open Studio
              <HugeiconsIcon icon={ArrowRight02Icon} data-icon="inline-end" />
            </Link>
          </Button>
          <Button
            asChild
            size="lg"
            variant="outline"
            className="w-full sm:w-auto"
          >
            <Link href="/components">Browse components</Link>
          </Button>
        </div>

        {/* Phone mockup preview */}
        <div className="relative mt-16">
          <div
            aria-hidden
            className="absolute -inset-10 -z-10 rounded-full bg-[radial-gradient(closest-side,rgba(59,130,246,0.28),transparent)] blur-2xl"
          />
          {/* Plain <video>, not a Remotion component. Autoplays muted + looped. */}
          <PhoneMockup videoSrc="/landing/cbum.mp4" fit="contain" />
        </div>
      </main>

      <SiteFooter />
    </div>
  );
}
