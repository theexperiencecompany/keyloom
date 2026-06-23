"use client";

import { EyeIcon, FavouriteIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { motion } from "motion/react";
import Image from "next/image";

type Badge = {
  logo: string;
  alt: string;
  views: string;
  likes: string;
  /** Tailwind position classes relative to the phone container. */
  position: string;
  /** Stagger/float offset so they don't bob in unison. */
  delay: number;
};

const BADGES: Badge[] = [
  {
    logo: "/tiktok_logo.png",
    alt: "TikTok",
    views: "532.1k views",
    likes: "89.9k likes",
    position: "-left-28 top-10",
    delay: 0,
  },
  {
    logo: "/youtube_logo.png",
    alt: "YouTube",
    views: "340.9k views",
    likes: "75.5k likes",
    position: "-left-32 bottom-16",
    delay: 0.8,
  },
  {
    logo: "/instagram_logo.png",
    alt: "Instagram",
    views: "1.2m views",
    likes: "150.2k likes",
    position: "-right-32 top-1/3",
    delay: 1.4,
  },
];

/**
 * Floating frosted-glass stat badges around the hero phone — each shows a
 * platform logo with view + like counts and gently bobs. Decorative; hidden on
 * small screens where there's no room beside the phone.
 */
export function HeroReelBadges() {
  return (
    <>
      {BADGES.map((b) => (
        <motion.div
          key={b.alt}
          initial={{ opacity: 0, y: 10, scale: 0.96 }}
          whileInView={{ opacity: 1, y: 0, scale: 1 }}
          viewport={{ once: true }}
          transition={{
            duration: 0.5,
            delay: b.delay * 0.15,
            ease: [0.22, 1, 0.36, 1],
          }}
          className={`absolute z-10 hidden transform-gpu items-center gap-2.5 rounded-2xl border border-white/40 bg-white/60 px-3 py-2 shadow-lg ring-1 ring-inset ring-white/50 backdrop-blur-md lg:flex dark:border-white/10 dark:bg-white/10 dark:ring-white/10 ${b.position}`}
        >
          <Image
            src={b.logo}
            alt={b.alt}
            width={36}
            height={36}
            className="size-9 shrink-0 rounded-xl"
          />
          <div className="flex flex-col gap-0.5 pr-1 text-left">
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
              <HugeiconsIcon icon={EyeIcon} size={13} />
              {b.views}
            </span>
            <span className="flex items-center gap-1.5 text-[11px] font-medium text-foreground/80">
              <HugeiconsIcon icon={FavouriteIcon} size={13} />
              {b.likes}
            </span>
          </div>
        </motion.div>
      ))}
    </>
  );
}
