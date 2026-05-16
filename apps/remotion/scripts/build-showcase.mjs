#!/usr/bin/env node
/**
 * Build the landing-page showcase project — a user-facing pitch for
 * Motion Studio. Each section starts with a short title card that
 * explains the beat, then plays the components. Fast cuts mid-section,
 * slower beats at the open and close so the URL sticks.
 *
 * Output: apps/remotion/showcase-project.json
 */
import { writeFileSync } from "node:fs";
import { join, dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const repoRoot = resolve(__dirname, "..", "..", "..");

let nextId = 1;
const id = () => `clip-${nextId++}`;

/** A clip with sensible defaults. `transition` is the ENTER transition. */
function clip(compositionId, props, durationSec, transition = "fade") {
  return {
    id: id(),
    compositionId,
    props,
    durationInFrames: Math.round(durationSec * 60),
    transition: { kind: transition, durationInFrames: 14 },
  };
}

/** A short title card that explains the next beat. */
function explainer(headline, subtitle, durationSec = 1.7, kind = "TitleFade", transition = "fade") {
  return clip(kind, { headline, subtitle }, durationSec, transition);
}

const project = {
  fps: 60,
  width: 1920,
  height: 1080,
  clips: [
    // ═════════════════════ COLD OPEN ═════════════════════
    // Bold pitch, then four text-reveal beats — each one introduces a
    // different value prop using a different signature text effect from
    // the library. Closes on a punchy single-line marquee.
    clip(
      "TitlePopup",
      {
        headline: "Ship video that doesn't look free.",
        subtitle: "",
      },
      2.0,
      "none",
    ),
    clip(
      "TextSoftBlurIn",
      {
        headline: "60+ cinematic scenes.",
        subtitle: "All open source.",
      },
      2.2,
      "fade",
    ),
    clip(
      "TextPerCharacterRise",
      {
        headline: "Built on Remotion.",
        subtitle: "Fully typed React.",
      },
      2.2,
      "fade",
    ),
    clip(
      "TextMaskRevealUp",
      {
        headline: "Copy the source.\nOwn it.",
        subtitle: "Drop into any Remotion project.",
      },
      2.4,
      "fade",
    ),
    clip(
      "TextDepthParallaxWords",
      {
        headline: "MIT licensed.",
        subtitle: "Forever.",
      },
      2.2,
      "fade",
    ),
    clip(
      "PerspectiveMarquee",
      {
        items:
          "SHIP, COPY, PASTE, RENDER, EXPORT, COMPOSE, TWEAK, DROP IN, LAUNCH, STITCH, REMIX",
        speedPxPerFrame: 3.6,
        perspective: 1200,
        rotateY: -28,
        rotateX: 8,
        fontSize: 180,
        fontWeight: 800,
        textTransform: "uppercase",
      },
      3.0,
      "fade",
    ),

    // ═════════════════════ THE PITCH ═════════════════════
    explainer(
      "60+ scenes. Copy the source.",
      "Like shadcn for video.",
      2.2,
      "TitleSlideUp",
    ),
    clip(
      "Terminal",
      {
        title: "~/projects/launch-reel",
        prompt: "❯",
        lines: [
          { kind: "comment", text: "# one dependency. that's it." },
          { kind: "command", text: "npm install remotion" },
          { kind: "success", text: "ready" },
          { kind: "comment", text: "" },
          { kind: "comment", text: "# paste a scene. render in your browser." },
          { kind: "command", text: "open localhost:3000/studio" },
          { kind: "success", text: "shipped" },
        ],
        charactersPerSecond: 38,
        lineGap: 6,
        chromeStyle: "mac",
        cursorStyle: "block",
        fontSize: 26,
        paddingX: 32,
        paddingY: 28,
        cornerRadius: 16,
        successColor: "#10b981",
        outputOpacity: 0.62,
        commentOpacity: 0.4,
        showShadow: true,
        maxWidth: 1280,
      },
      4.4,
      "fade",
    ),

    // ═════════════════════ DATA STORYTELLING ═════════════════════
    explainer(
      "Charts that animate themselves.",
      "Bar, line, area, pie, radial, radar.",
      1.8,
      "TitleFade",
      "swipe-up",
    ),
    clip(
      "BarChart",
      {
        title: "Monthly active users",
        caption: "Past 6 months",
        labels: "Jan, Feb, Mar, Apr, May, Jun",
        values: "42, 58, 49, 73, 84, 96",
        showAxes: true,
        showGrid: true,
        showValues: true,
      },
      2.0,
      "fade",
    ),
    clip(
      "RadialChart",
      {
        title: "Conversion lift",
        caption: "Q4 target",
        label: "of monthly goal",
        value: 84,
        max: 100,
        unit: "%",
      },
      1.8,
      "fade",
    ),
    clip(
      "StatCounter",
      { target: 12847, label: "developers shipping", prefix: "", suffix: "+" },
      1.8,
      "zoom-in",
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
      2.0,
      "swipe-right",
    ),

    // ═════════════════════ REAL PRODUCT UI ═════════════════════
    explainer(
      "Pixel-faithful product UI.",
      "GitHub, X, the apps people actually use.",
      1.8,
      "TitlePopup",
      "fade",
    ),
    clip(
      "GitHubStarButton",
      {
        owner: "theexperiencecompany",
        repo: "motion-studio",
        startCount: 1240,
        endCount: 1872,
        theme: "light",
      },
      2.6,
      "zoom-out",
    ),
    clip(
      "TweetCard",
      {
        displayName: "Motion Studio",
        handle: "@motionstudio",
        avatarUrl: "https://avatars.githubusercontent.com/theexperiencecompany?s=200",
        verified: "yes",
        text:
          "shipped: 60+ Remotion scenes, in-browser MP4 export, fully typed.\n\nopen source. MIT.",
        timestamp: "10:30 PM · Today",
        replies: 84,
        retweets: 412,
        likes: 1893,
        views: 84200,
        theme: "light",
        backgroundColor: "#ffffff",
      },
      2.8,
      "swipe-down",
    ),

    // ═════════════════════ CHAT PLATFORM BREADTH ═════════════════════
    explainer(
      "Every chat. Every brand.",
      "iMessage, WhatsApp, Telegram, Slack, Discord.",
      2.0,
      "TitleType",
      "fade",
    ),
    clip(
      "MessageBubbles",
      {
        contactName: "design",
        contactAvatar: "https://avatars.githubusercontent.com/theexperiencecompany?s=200",
        messages: [
          { text: "saw the new reel?", side: "left", typingFrames: 28, delay: 12 },
          { text: "rendered in browser 🔥", side: "right", typingFrames: 32, delay: 70 },
          { text: "how long?", side: "left", typingFrames: 28, delay: 130 },
          { text: "12 seconds", side: "right", typingFrames: 24, delay: 180 },
        ],
        theme: "light",
      },
      3.6,
      "fade",
    ),
    clip(
      "WhatsAppMessages",
      {
        contactName: "shipping",
        contactAvatar: "https://avatars.githubusercontent.com/theexperiencecompany?s=200",
        messages: [
          { text: "is it really open source?", side: "left", typingFrames: 28, delay: 12 },
          { text: "MIT licensed", side: "right", typingFrames: 22, delay: 70 },
          { text: "zero servers", side: "right", typingFrames: 24, delay: 120 },
          { text: "you're kidding", side: "left", typingFrames: 26, delay: 180 },
        ],
        theme: "light",
      },
      3.6,
      "swipe-left",
    ),
    clip(
      "TelegramMessages",
      {
        contactName: "launch",
        contactAvatar: "https://avatars.githubusercontent.com/theexperiencecompany?s=200",
        messages: [
          { text: "demo's recorded", side: "left", typingFrames: 26, delay: 12 },
          { text: "via the browser?", side: "right", typingFrames: 24, delay: 70 },
          { text: "WebCodecs + mp4-muxer", side: "left", typingFrames: 32, delay: 130 },
          { text: "no FFmpeg 🎉", side: "right", typingFrames: 28, delay: 190 },
        ],
        theme: "light",
      },
      3.6,
      "swipe-left",
    ),
    clip(
      "SlackMessages",
      {
        contactName: "general",
        messages: [
          { text: "ship motion studio v1?", side: "left", typingFrames: 30, delay: 12 },
          { text: "lgtm 🚀", side: "right", typingFrames: 22, delay: 70 },
          { text: "60+ scenes, all typed", side: "left", typingFrames: 30, delay: 130 },
          { text: "merging now", side: "right", typingFrames: 26, delay: 190 },
        ],
        theme: "light",
      },
      3.6,
      "swipe-left",
    ),
    clip(
      "DiscordMessages",
      {
        contactName: "motion-studio",
        messages: [
          { text: "tried the new charts?", side: "left", typingFrames: 30, delay: 12 },
          { text: "the radar one goes hard", side: "right", typingFrames: 32, delay: 80 },
          { text: "bar + line + area + pie + radial too", side: "left", typingFrames: 40, delay: 150 },
          { text: "all animated.", side: "right", typingFrames: 26, delay: 220 },
        ],
        theme: "dark",
      },
      3.6,
      "swipe-left",
    ),

    // ═════════════════════ COMPOSABILITY ═════════════════════
    explainer(
      "Scenes compose.",
      "Drop any scene inside any device frame.",
      1.8,
      "TitleSlideUp",
      "fade",
    ),
    clip(
      "PhoneFrame",
      {
        device: "dynamic-island",
        innerCompositionId: "MessageBubbles",
        screenImage: "",
      },
      3.2,
      "fade",
    ),
    clip(
      "LaptopFrame",
      {
        innerCompositionId: "BarChart",
        screenImage: "",
      },
      3.0,
      "swipe-up",
    ),

    // ═════════════════════ POLISH (TEXT) ═════════════════════
    explainer(
      "Kinetic typography, baked in.",
      "30+ text reveals. Pick one. Drop it in.",
      1.8,
      "TitleFade",
      "fade",
    ),
    clip(
      "TextShimmerSweep",
      { headline: "Polished by default.", subtitle: "" },
      2.4,
      "fade",
    ),
    clip(
      "TextSoftBlurIn",
      { headline: "Built for shipping.", subtitle: "" },
      2.2,
      "fade",
    ),

    // ═════════════════════ STUDIO + EXPORT ═════════════════════
    explainer(
      "Export in the browser.",
      "WebCodecs + mp4-muxer. No servers. No SDK.",
      2.2,
      "TitlePopup",
      "swipe-up",
    ),
    clip(
      "Toast",
      {
        title: "Render complete",
        description: "Your MP4 is ready to download.",
        position: "bottom-right",
        variant: "success",
        showIcon: true,
        durationVisibleSec: 2.4,
      },
      3.0,
      "fade",
    ),

    // ═════════════════════ CLOSE ═════════════════════
    clip(
      "TextMaskRevealUp",
      {
        headline: "Open source.\nForever.",
        subtitle: "MIT licensed.",
      },
      2.6,
      "fade",
    ),
    clip(
      "TitleSlideUp",
      {
        headline: "Ship the reel.",
        subtitle: "motion-studio.heygaia.io",
      },
      2.8,
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
