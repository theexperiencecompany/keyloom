"use client";

import { Button } from "@workspace/ui/components/button";
import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const EASE = [0.22, 1, 0.36, 1] as const;

/**
 * Manifesto-style section below the hero: centered pitch + outlined CTA, with
 * the pixel-art scene below feathered into the page. Everything reveals on
 * scroll with a gentle staggered fade-up.
 */
export function WhyKeyloom() {
  return (
    <section className="overflow-hidden px-5 py-24 text-center sm:py-32">
      <motion.div
        initial="hidden"
        whileInView="show"
        viewport={{ once: true, amount: 0.3 }}
        transition={{ staggerChildren: 0.12 }}
        className="mx-auto max-w-3xl"
      >
        <motion.p
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: EASE }}
          className="text-xs font-medium uppercase tracking-[0.2em] text-muted-foreground"
        >
          Why Keyloom
        </motion.p>

        <motion.h2
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mt-4 text-balance text-3xl font-semibold tracking-tight sm:text-4xl lg:text-5xl"
        >
          Keep building. We&apos;ll keep you seen.
        </motion.h2>

        <motion.p
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: EASE }}
          className="mx-auto mt-6 max-w-2xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg"
        >
          Most founders stay heads-down building, while the trends that could
          launch them pass by. With Keyloom, a meme or motion-graphic reel takes
          minutes, then you get back to building.
        </motion.p>

        <motion.div
          variants={{
            hidden: { opacity: 0, y: 16 },
            show: { opacity: 1, y: 0 },
          }}
          transition={{ duration: 0.6, ease: EASE }}
        >
          <Button
            asChild
            variant="outline"
            size="lg"
            className="mt-9 rounded-full"
          >
            <Link href="/components">See it in action</Link>
          </Button>
        </motion.div>
      </motion.div>

      {/* Pixel-art scene with all four edges feathered so it dissolves into
          the background instead of reading as a hard cut-out. */}
      <motion.div
        initial={{ opacity: 0, y: 32, scale: 0.96 }}
        whileInView={{ opacity: 1, y: 0, scale: 1 }}
        viewport={{ once: true, amount: 0.2 }}
        transition={{ duration: 0.9, ease: EASE }}
        className="relative mx-auto mt-16 w-full max-w-sm"
      >
        <Image
          src="/landing/girl.png"
          alt="A founder building in a field while the world blooms around them"
          width={1254}
          height={1254}
          className="h-auto w-full [-webkit-mask-composite:source-in] [mask-composite:intersect] [mask-image:linear-gradient(to_right,transparent,black_14%,black_86%,transparent),linear-gradient(to_bottom,transparent,black_12%,black_88%,transparent)]"
        />
      </motion.div>
    </section>
  );
}
