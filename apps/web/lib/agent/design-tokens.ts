/**
 * Curated design tokens for the agent.
 *
 * The agent picks ONE base palette + ONE accent + ONE font and composes
 * a coherent style across every non-brand-locked clip. Each token is
 * hand-tuned to look premium; inventing raw hex codes produced amateur
 * results, so we lock the agent to these atoms.
 *
 * Scale: 6 bases × 14 accents × 6 fonts = 504 valid combos — enough
 * for variety, all guaranteed to look intentional.
 */

export type ColorBase = {
  id: string;
  name: string;
  /** Background of the clip. */
  background: string;
  /** Primary text color. Pairs with background for legibility. */
  color: string;
  /** Suggested mood / when to reach for it. */
  vibe: string;
};

export type AccentColor = {
  id: string;
  name: string;
  hex: string;
  /** Optional pairing hint — which bases this looks especially good on. */
  bestOn?: string[];
};

export type PremiumFont = {
  id: string;
  name: string;
  family: string;
  category: "sans" | "display" | "mono";
  vibe: string;
};

/* ───────── Bases (background + text-color pairs) ───────── */

export const COLOR_BASES: ColorBase[] = [
  {
    id: "pure-dark",
    name: "Pure dark",
    background: "#0a0a0f",
    color: "#ffffff",
    vibe: "Default modern tech look — Linear, Vercel, Anthropic dark. Works for almost anything.",
  },
  {
    id: "midnight-navy",
    name: "Midnight navy",
    background: "#0b1220",
    color: "#e8f0ff",
    vibe: "Slightly warmer dark — fintech, B2B, serious products.",
  },
  {
    id: "charcoal-stone",
    name: "Charcoal stone",
    background: "#1c1917",
    color: "#fafaf9",
    vibe: "Warm dark with stone undertone — editorial, design tools, premium.",
  },
  {
    id: "off-white",
    name: "Off-white",
    background: "#fafaf9",
    color: "#0a0a0f",
    vibe: "Clean light mode — Stripe, Notion, Apple-style marketing.",
  },
  {
    id: "warm-cream",
    name: "Warm cream",
    background: "#faf6f1",
    color: "#1a1612",
    vibe: "Warm light — Anthropic, editorial, food/lifestyle brands.",
  },
  {
    id: "transparent",
    name: "Transparent",
    background: "transparent",
    color: "#ffffff",
    vibe: "Use when the clip will overlay another asset or be exported as alpha WebM for compositing.",
  },
];

/* ───────── Accents (the highlight color) ───────── */

export const ACCENT_COLORS: AccentColor[] = [
  {
    id: "electric-blue",
    name: "Electric blue",
    hex: "#0070f3",
    bestOn: ["pure-dark", "midnight-navy", "off-white"],
  },
  {
    id: "cyan",
    name: "Cyan",
    hex: "#22d3ee",
    bestOn: ["pure-dark", "midnight-navy", "charcoal-stone"],
  },
  {
    id: "emerald",
    name: "Emerald",
    hex: "#10b981",
    bestOn: ["pure-dark", "off-white"],
  },
  {
    id: "lime",
    name: "Lime",
    hex: "#84cc16",
    bestOn: ["pure-dark", "charcoal-stone"],
  },
  {
    id: "amber",
    name: "Amber",
    hex: "#f59e0b",
    bestOn: ["pure-dark", "warm-cream", "charcoal-stone"],
  },
  {
    id: "coral",
    name: "Coral",
    hex: "#fb7185",
    bestOn: ["pure-dark", "warm-cream"],
  },
  {
    id: "crimson",
    name: "Crimson",
    hex: "#dc2626",
    bestOn: ["pure-dark", "warm-cream", "off-white"],
  },
  {
    id: "hot-pink",
    name: "Hot pink",
    hex: "#ec4899",
    bestOn: ["pure-dark", "charcoal-stone"],
  },
  {
    id: "violet",
    name: "Violet",
    hex: "#8b5cf6",
    bestOn: ["pure-dark", "midnight-navy", "off-white"],
  },
  {
    id: "indigo",
    name: "Indigo",
    hex: "#635bff",
    bestOn: ["off-white", "warm-cream"],
  },
  {
    id: "linear-purple",
    name: "Linear purple",
    hex: "#5e6ad2",
    bestOn: ["pure-dark", "midnight-navy"],
  },
  {
    id: "anthropic-coral",
    name: "Anthropic coral",
    hex: "#d97757",
    bestOn: ["warm-cream", "charcoal-stone"],
  },
  {
    id: "instagram-pink",
    name: "Instagram pink",
    hex: "#E1306C",
    bestOn: ["pure-dark", "warm-cream"],
  },
  {
    id: "tiktok-cyan",
    name: "TikTok cyan",
    hex: "#25F4EE",
    bestOn: ["pure-dark"],
  },
];

/* ───────── Fonts (Google Fonts families) ───────── */

export const PREMIUM_FONTS: PremiumFont[] = [
  {
    id: "inter",
    name: "Inter",
    family: "Inter",
    category: "sans",
    vibe: "The default. Versatile, clean, reads well at any size. Pick for marketing, dashboards, UI demos.",
  },
  {
    id: "geist",
    name: "Geist",
    family: "Geist",
    category: "sans",
    vibe: "Modern dev/tech feel — Vercel's font. Pick for terminal demos, dev tools, CLI launches.",
  },
  {
    id: "dm-sans",
    name: "DM Sans",
    family: "DM Sans",
    category: "sans",
    vibe: "Editorial, premium, slightly softer than Inter. Pick for design tools, content brands, lifestyle.",
  },
  {
    id: "space-grotesk",
    name: "Space Grotesk",
    family: "Space Grotesk",
    category: "sans",
    vibe: "Premium tech with character. Pick for AI/ML, fintech, modern B2B.",
  },
  {
    id: "anton",
    name: "Anton",
    family: "Anton",
    category: "display",
    vibe: "Heavy condensed display — TikTok-style. Pick for short-form social, vertical video, captions.",
  },
  {
    id: "bebas-neue",
    name: "Bebas Neue",
    family: "Bebas Neue",
    category: "display",
    vibe: "Tall condensed impact font. Pick for bold marketing reveals, sports, launch teasers.",
  },
];
