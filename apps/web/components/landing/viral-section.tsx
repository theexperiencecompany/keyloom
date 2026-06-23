"use client";

import { FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { motion } from "motion/react";
import Link from "next/link";
import { PhoneMockup } from "@/components/landing/phone-mockup";

const comments = [
  {
    user: "marcusbuilds",
    avatar: "https://i.pravatar.cc/80?img=12",
    time: "2h",
    text: "wait what app is this?? i need it 😭",
    likes: "1.2k",
    rotate: -2,
  },
  {
    user: "lena.designs",
    avatar: "https://i.pravatar.cc/80?img=5",
    time: "4h",
    text: "drop the link pls 🙏",
    likes: "843",
    rotate: 1,
  },
  {
    user: "thefoundernext",
    avatar: "https://i.pravatar.cc/80?img=33",
    time: "6h",
    text: "made my first reel in like 2 minutes, thank you!!",
    likes: "2.1k",
    rotate: -1,
  },
  {
    user: "ava.co",
    avatar: "https://i.pravatar.cc/80?img=47",
    time: "1d",
    text: "okay this is exactly what my brand needed",
    likes: "512",
    rotate: 2,
  },
];

export function ViralSection() {
  return (
    <section className="border-t border-border px-5 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        {/* Left: copy + CTA + comments */}
        <div>
          <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            All you need is one viral reel for your product.
          </h2>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            One reel can put your product in front of millions. Make it in
            minutes with ready-made scenes, then post it everywhere.
          </p>

          <Button asChild size="lg" className="mt-8">
            <Link href="/studio">Get started for free</Link>
          </Button>

          {/* Reel comment section — cards reveal upward, staggered, on scroll */}
          <div className="mt-10 max-w-md space-y-4">
            {comments.map((c, i) => (
              <motion.div
                key={c.user}
                initial={{ opacity: 0, y: 32, rotate: 0 }}
                whileInView={{ opacity: 1, y: 0, rotate: c.rotate }}
                whileHover={{ rotate: 0 }}
                viewport={{ once: true, amount: 0.5 }}
                transition={{
                  duration: 0.55,
                  delay: i * 0.12,
                  ease: [0.22, 1, 0.36, 1],
                }}
                className="flex transform-gpu gap-3 rounded-2xl border border-border/60 bg-card/80 p-4 shadow-lg ring-1 ring-inset ring-white/10 dark:ring-white/5"
              >
                {/* biome-ignore lint/performance/noImgElement: external placeholder avatar */}
                <img
                  src={c.avatar}
                  alt={c.user}
                  className="size-8 shrink-0 rounded-full object-cover"
                />
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-medium text-foreground">
                      {c.user}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {c.time}
                    </span>
                  </div>
                  <p className="mt-0.5 text-sm text-foreground/90">{c.text}</p>
                </div>
                <div className="flex shrink-0 flex-col items-center gap-0.5 text-muted-foreground">
                  <HugeiconsIcon
                    icon={FavouriteIcon}
                    size={16}
                    className="fill-rose-500 text-rose-500"
                  />
                  <span className="text-[11px] tabular-nums">{c.likes}</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Right: phone mockup */}
        <div className="flex justify-center lg:justify-end">
          <PhoneMockup
            videoSrc="/landing/wolfofwallstreet.mp4"
            fit="cover"
            className="w-64 sm:w-72"
          />
        </div>
      </div>
    </section>
  );
}
