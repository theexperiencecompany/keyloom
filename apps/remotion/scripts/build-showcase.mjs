#!/usr/bin/env node
/**
 * Build a showcase Project JSON that demos a wide variety of compositions.
 * Output: apps/remotion/showcase-project.json (consumed by `remotion render`).
 */
import { writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");

let nextId = 1;
const id = () => `clip-${nextId++}`;

/**
 * Concise scene factory. Pass compositionId + props + durationSec + optional
 * transition kind. Falls back to fade.
 */
function clip(compositionId, props, durationSec, transition = "fade") {
  return {
    id: id(),
    compositionId,
    props,
    durationInFrames: Math.round(durationSec * 60),
    transition: { kind: transition, durationInFrames: 18 },
  };
}

const project = {
  fps: 60,
  width: 1920,
  height: 1080,
  clips: [
    // ───────────────────────── INTRO ─────────────────────────
    clip(
      "TitleSlideUp",
      { headline: "Motion Studio", subtitle: "Cinematic Remotion scenes" },
      2.3,
      "none",
    ),
    clip(
      "PerspectiveMarquee",
      {
        items: "Motion Studio, Remotion, GAIA, React, Cinematic, Open Source",
        speedPxPerFrame: 2.5,
        perspective: 1200,
        rotateY: -28,
        rotateX: 8,
        fontSize: 168,
        fontWeight: 700,
        textTransform: "uppercase",
      },
      3,
      "fade",
    ),

    // ───────────────────────── INSTALL ───────────────────────
    clip(
      "TitlePopup",
      { headline: "Drop in. Render. Ship.", subtitle: "" },
      1.8,
      "swipe-up",
    ),
    clip(
      "Terminal",
      {
        title: "~/projects/launch-reel",
        prompt: "❯",
        lines: [
          { kind: "comment", text: "# 1 — install" },
          { kind: "command", text: "npm install remotion" },
          { kind: "success", text: "ready" },
          { kind: "comment", text: "" },
          { kind: "comment", text: "# 2 — render" },
          { kind: "command", text: "npx remotion render Showcase out.mp4" },
          { kind: "output", text: "encoding frames @ 60fps..." },
          { kind: "success", text: "shipped" },
        ],
        charactersPerSecond: 32,
        lineGap: 6,
        chromeStyle: "mac",
        cursorStyle: "block",
        fontSize: 26,
        paddingX: 32,
        paddingY: 28,
        cornerRadius: 16,
        successColor: "#34d399",
        outputOpacity: 0.62,
        commentOpacity: 0.38,
        showShadow: true,
        maxWidth: 1280,
      },
      6,
      "fade",
    ),

    // ───────────────────────── DATA ──────────────────────────
    clip(
      "TitlePopup",
      { headline: "Built for product reels.", subtitle: "" },
      1.6,
      "swipe-left",
    ),
    clip(
      "BarChart",
      {
        title: "Monthly active users",
        caption: "Past 6 months · in thousands",
        labels: "Jan, Feb, Mar, Apr, May, Jun",
        values: "42, 58, 49, 73, 84, 96",
        showAxes: true,
        showGrid: true,
        showValues: true,
      },
      3,
      "fade",
    ),
    clip(
      "StatCounter",
      { target: 12847, label: "developers shipping", prefix: "", suffix: "+" },
      2.3,
      "zoom-in",
    ),
    clip(
      "RadialChart",
      {
        title: "Conversion lift",
        caption: "Q4 target reached",
        label: "of monthly goal",
        value: 84,
        max: 100,
        unit: "%",
      },
      2.5,
      "fade",
    ),
    clip(
      "AreaChart",
      {
        title: "Signups",
        caption: "Last 8 weeks",
        labels: "W1, W2, W3, W4, W5, W6, W7, W8",
        values: "120, 145, 132, 168, 195, 224, 270, 312",
        showAxes: true,
        showGrid: true,
      },
      2.6,
      "swipe-right",
    ),

    // ───────────────────────── SOCIAL ────────────────────────
    clip(
      "TitleFade",
      { headline: "Brand-faithful UI.", subtitle: "" },
      1.6,
      "fade",
    ),
    clip(
      "GitHubStarButton",
      {
        owner: "theexperiencecompany",
        repo: "motion-studio",
        startCount: 1240,
        endCount: 1289,
        theme: "light",
      },
      3,
      "zoom-out",
    ),
    clip(
      "TweetCard",
      {
        displayName: "Motion Studio",
        handle: "@motionstudio",
        avatarUrl: "https://github.com/theexperiencecompany.png?size=200",
        verified: "yes",
        text: "Just shipped — 60+ Remotion scenes, in-browser MP4 export, open source.",
        timestamp: "10:30 PM · Today",
        replies: 28,
        retweets: 73,
        likes: 482,
        views: 21400,
        theme: "light",
        backgroundColor: "#ffffff",
      },
      3,
      "swipe-down",
    ),

    // ───────────────────────── CHAT ──────────────────────────
    clip(
      "MessageBubbles",
      {
        contactName: "shipped",
        contactAvatar: "https://github.com/theexperiencecompany.png",
        messages: [
          { text: "you see motion studio yet?", side: "left", typingFrames: 40, delay: 24 },
          { text: "yeah just exported a demo in browser 😳", side: "right", typingFrames: 50, delay: 110 },
          { text: "no way it's open source?", side: "left", typingFrames: 42, delay: 220 },
          { text: "MIT license. zero servers.", side: "right", typingFrames: 44, delay: 320 },
        ],
        theme: "light",
      },
      6,
      "fade",
    ),

    // ───────────────────────── ALERTS ────────────────────────
    clip(
      "Toast",
      {
        title: "Render complete",
        description: "Your 30-second video is ready to download.",
        position: "bottom-right",
        variant: "success",
        showIcon: true,
        durationVisibleSec: 2.4,
      },
      3,
      "fade",
    ),

    // ───────────────────────── PROOF ─────────────────────────
    clip(
      "TitleType",
      { headline: "Trusted by builders.", subtitle: "" },
      2.2,
      "swipe-up",
    ),
    clip(
      "LogoCloud",
      {
        headline: "Trusted by teams at",
        logos: [
          { name: "Vercel", url: "" },
          { name: "Linear", url: "" },
          { name: "Stripe", url: "" },
          { name: "Notion", url: "" },
          { name: "Figma", url: "" },
        ],
        theme: "light",
      },
      2.4,
      "fade",
    ),

    // ───────────────────────── OUTRO ─────────────────────────
    clip(
      "TextMaskRevealUp",
      {
        headline: "Open source.\nForever.",
        subtitle: "MIT licensed",
      },
      2.4,
      "fade",
    ),
    clip(
      "TitleSlideUp",
      {
        headline: "Ship the reel.",
        subtitle: "motion-studio.heygaia.io",
      },
      2.4,
      "zoom-in",
    ),
  ],
};

const target = join(repoRoot, "apps", "remotion", "showcase-project.json");
writeFileSync(target, JSON.stringify(project, null, 2), "utf-8");
const totalSeconds = project.clips.reduce(
  (s, c) => s + c.durationInFrames / 60,
  0,
);
console.log(`Wrote ${project.clips.length} clips → ${target}`);
console.log(`Duration: ${totalSeconds.toFixed(1)}s @ 60fps`);
