"use client";

import {
  ArrowDown01Icon,
  AtIcon,
  Cancel01Icon,
  FavouriteIcon,
  GiftIcon,
  SmileIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { motion, useAnimationControls } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { PhoneMockup } from "@/components/landing/phone-mockup";

const comments = [
  {
    user: "marcusbuilds",
    avatar: "https://i.pravatar.cc/80?img=12",
    time: "2h",
    text: "wait what app is this?? i need it 😭",
    likes: 1200,
    replies: 13,
    likedByCreator: true,
  },
  {
    user: "lena.designs",
    avatar: "https://i.pravatar.cc/80?img=5",
    time: "4h",
    text: "drop the link pls 🙏",
    likes: 843,
    replies: 2,
    likedByCreator: false,
  },
  {
    user: "thefoundernext",
    avatar: "https://i.pravatar.cc/80?img=33",
    time: "6h",
    text: "made my first reel in like 2 minutes, thank you!!",
    likes: 2100,
    replies: 22,
    likedByCreator: true,
  },
  {
    user: "ava.co",
    avatar: "https://i.pravatar.cc/80?img=47",
    time: "1d",
    text: "okay this is exactly what my brand needed",
    likes: 512,
    replies: 31,
    likedByCreator: false,
  },
];

function formatCount(n: number) {
  if (n >= 1000) return `${(n / 1000).toFixed(1).replace(/\.0$/, "")}k`;
  return String(n);
}

// Radiating particles that fly outward and fade — the TikTok "blast" on like.
// Remounted via a changing `key` so it replays on every like.
const BURST_PARTICLES = Array.from({ length: 8 }, (_, i) => {
  const angle = (i / 8) * Math.PI * 2;
  return { x: Math.cos(angle) * 16, y: Math.sin(angle) * 16 };
});

function HeartBurst() {
  return (
    <span className="pointer-events-none absolute inset-0 flex items-center justify-center">
      {BURST_PARTICLES.map((p, i) => (
        <motion.span
          // biome-ignore lint/suspicious/noArrayIndexKey: fixed-length static ring
          key={i}
          className="absolute size-1 rounded-full bg-rose-500"
          initial={{ x: 0, y: 0, scale: 1, opacity: 1 }}
          animate={{ x: p.x, y: p.y, scale: 0, opacity: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        />
      ))}
    </span>
  );
}

function CommentRow({
  c,
  index,
}: {
  c: (typeof comments)[number];
  index: number;
}) {
  const [liked, setLiked] = useState(false);
  const [burstKey, setBurstKey] = useState(0);
  const heartControls = useAnimationControls();

  const toggleLike = () => {
    const next = !liked;
    setLiked(next);
    if (next) {
      setBurstKey((k) => k + 1);
      heartControls.start({
        scale: [1, 1.45, 0.9, 1],
        transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] },
      });
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{
        duration: 0.5,
        delay: 0.2 + index * 0.08,
        ease: [0.4, 0, 0.2, 1],
      }}
      className="flex gap-3 px-4 py-3.5"
    >
      {/* biome-ignore lint/performance/noImgElement: external placeholder avatar */}
      <img
        src={c.avatar}
        alt={c.user}
        className="size-9 shrink-0 rounded-full object-cover"
      />
      <div className="min-w-0 flex-1">
        <span className="text-[13px] text-white/45">{c.user}</span>
        <p className="mt-0.5 text-[15px] leading-snug text-white/95">
          {c.text}
        </p>
        <div className="mt-1.5 flex items-center gap-4 text-xs text-white/45">
          <span>{c.time}</span>
          <span className="font-semibold">Reply</span>
        </div>
        {c.likedByCreator && (
          <div className="mt-1.5 inline-flex items-center gap-1 rounded-md bg-white/[0.06] px-1.5 py-0.5 text-[11px] text-white/45">
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={11}
              className="fill-rose-500 text-rose-500"
            />
            Liked by creator
          </div>
        )}
        <button
          type="button"
          className="mt-1.5 flex items-center gap-1 text-xs font-medium text-white/45"
        >
          View replies ({c.replies})
          <HugeiconsIcon icon={ArrowDown01Icon} size={14} />
        </button>
      </div>
      <button
        type="button"
        aria-pressed={liked}
        aria-label={liked ? "Unlike comment" : "Like comment"}
        onClick={toggleLike}
        className="flex shrink-0 flex-col items-center gap-1 pt-0.5 text-white/45"
      >
        <span className="relative flex items-center justify-center">
          {burstKey > 0 && <HeartBurst key={burstKey} />}
          <motion.span animate={heartControls} className="flex">
            <HugeiconsIcon
              icon={FavouriteIcon}
              size={18}
              className={liked ? "fill-rose-500 text-rose-500" : ""}
            />
          </motion.span>
        </span>
        <span className="text-[11px] tabular-nums">
          {formatCount(c.likes + (liked ? 1 : 0))}
        </span>
      </button>
    </motion.div>
  );
}

export function ViralSection() {
  const [draft, setDraft] = useState("");

  return (
    <section className="border-t border-border px-5 py-24 sm:py-32">
      <div className="mx-auto grid max-w-7xl items-center gap-12 lg:grid-cols-[1.3fr_1fr] lg:gap-16">
        {/* Left: copy + CTA + comments */}
        <div>
          <h2 className="text-balance text-4xl font-bold leading-[1.05] tracking-tight sm:text-5xl lg:text-6xl">
            <span className="italic">All you need is</span> ONE viral reel for
            your product.
          </h2>

          <p className="mt-5 max-w-xl text-pretty text-base leading-relaxed text-muted-foreground sm:text-lg">
            One reel can put your product in front of millions. Make it in
            minutes with ready-made scenes, then post it everywhere.
          </p>

          <Button asChild size="lg" className="mt-8">
            <Link href="/studio">Get started for free</Link>
          </Button>

          {/* TikTok-style comments sheet — dark theme, reveals on scroll.
              Slight tilt + compact "peek" window keeps it from reading as a
              tall flat box; it straightens on hover. */}
          <motion.div
            initial={{ opacity: 0, y: 24, rotate: -2 }}
            whileInView={{ opacity: 1, y: 0, rotate: -2 }}
            whileHover={{ scale: 1.015 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.4, 0, 0.2, 1] }}
            className="mt-8 w-full max-w-sm origin-center transform-gpu overflow-hidden rounded-[2rem] border border-white/10 bg-[#1c1c1e] text-white shadow-2xl ring-1 ring-inset ring-white/5"
          >
            {/* Header */}
            <div className="relative flex items-center justify-center border-b border-white/10 px-4 py-3.5">
              <span className="text-[13px] font-semibold text-white/90">
                10.9k comments
              </span>
              <HugeiconsIcon
                icon={Cancel01Icon}
                size={18}
                className="absolute right-4 text-white/70"
              />
            </div>

            {/* Comment list — capped height, scrolls so the sheet stays compact */}
            <div className="max-h-[210px] divide-y divide-white/[0.06] overflow-y-auto [mask-image:linear-gradient(to_bottom,black_calc(100%-2.5rem),transparent)] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
              {comments.map((c, i) => (
                <CommentRow key={c.user} c={c} index={i} />
              ))}
            </div>

            {/* Add comment bar */}
            <div className="flex items-center gap-3 border-t border-white/10 px-4 py-3">
              <input
                type="text"
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Add comment..."
                className="flex-1 rounded-full bg-white/[0.08] px-4 py-2.5 text-[13px] text-white outline-none placeholder:text-white/40"
              />
              <div className="flex items-center gap-3 text-white/55">
                <HugeiconsIcon icon={AtIcon} size={20} />
                <HugeiconsIcon icon={GiftIcon} size={20} />
                <HugeiconsIcon icon={SmileIcon} size={20} />
              </div>
            </div>
          </motion.div>
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
