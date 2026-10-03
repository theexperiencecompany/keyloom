import { compositions } from "@workspace/compositions/registry";
import type { CompositionCategory } from "@workspace/compositions/schema";

// The agent only ever sees this filtered slice — compositions flagged
// `hideFromAgent: true` (internal/branded scenes)
// are excluded from every discovery surface so the LLM can't pick them.
// They still appear in the studio library and docs.
const AGENT_COMPOSITIONS = compositions.filter((c) => !c.hideFromAgent);

/**
 * Lean category index for the agent's system prompt.
 *
 * The catalog is intentionally tiny — just the category names with a
 * short description and a count of scenes in each. The agent drills
 * into a category with `listScenesInCategory` (returns one-line scene
 * summaries) and then fetches `getSceneDetails(id)` for any scene it
 * actually wants to use.
 *
 * This keeps the system prompt constant-size as the registry grows.
 * Inlining every composition's `defaultProps` (the previous approach)
 * spent ~20k tokens before the first user message.
 */

const CATEGORY_DESCRIPTIONS: Record<CompositionCategory, string> = {
  text: "Title & body text animations — Headlines, type-on, fades, slides, kinetic builds.",
  social:
    "Social-app impersonators — Tweet/Slack/Discord/WhatsApp/Telegram/Instagram/iMessage UI (brand-locked).",
  data: "Charts, counters, and stats — Line/Bar/Pie/Radar/Radial, MetricCard, StatCounter.",
  devtools:
    "Code & product walkthroughs — Terminal, Browser window, cursor walkthrough, typing demos.",
  marketing:
    "Promotional UI — Feature/Pricing/Testimonial cards, LogoCloud, GitHub star button, Toast.",
  layout:
    "Wrapper compositions that embed other scenes — PhoneFrame, LaptopFrame, SplitScene, Showcase.",
  captions: "Voiceover-driven caption tracks — TikTok-style word highlight.",
  media:
    "Images, QR codes, marquees, scenario players (ImageScene, PerspectiveMarquee, QrCode).",
  background:
    "Ambient looping backdrops — a cobalt grid, a white radial burst, a liquid-chrome surface, and minimal futuristic architecture (BlueGrid, WhiteRadialBurst, LiquidChrome, FuturisticArch).",
};

const CATEGORY_ORDER: CompositionCategory[] = [
  "text",
  "social",
  "data",
  "devtools",
  "marketing",
  "layout",
  "captions",
  "media",
  "background",
];

/**
 * Catalog block injected into the system prompt. Tiny by design.
 */
export function buildCatalogText(): string {
  const counts = countByCategory();
  const lines = CATEGORY_ORDER.map((cat) => {
    const n = counts.get(cat) ?? 0;
    return `- **${cat}** (${n} scene${n === 1 ? "" : "s"}) — ${CATEGORY_DESCRIPTIONS[cat]}`;
  });
  return lines.join("\n");
}

/**
 * Structured payload for the `listScenesInCategory` tool. The agent uses
 * the returned id + description to shortlist scenes, then calls
 * `getSceneDetails` for the few it actually wants to build with.
 *
 * Results are **shuffled** per call so the agent doesn't anchor on
 * whichever scene happens to be first in registry order — that was
 * causing every build to pick the same handful of scenes.
 */
export function listScenesInCategory(category: CompositionCategory): Array<{
  id: string;
  title: string;
  description: string;
  durationInFrames: number;
  fps: number;
  width: number;
  height: number;
  brandLocked: boolean;
}> {
  const matches = AGENT_COMPOSITIONS.filter((c) => c.category === category);
  // Fisher-Yates shuffle so the agent sees scenes in a different order
  // each call. With deterministic models like gpt-4.1-mini this is the
  // cheapest way to get variety in scene picks across builds.
  for (let i = matches.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [matches[i], matches[j]] = [matches[j]!, matches[i]!];
  }
  return matches.map((c) => ({
    id: c.id,
    title: c.title,
    description: c.description,
    durationInFrames: c.durationInFrames,
    fps: c.fps,
    width: c.width,
    height: c.height,
    brandLocked: false,
  }));
}

/** Whether the agent is allowed to see (and pick) a composition by id. */
export function isAgentVisible(compositionId: string): boolean {
  return AGENT_COMPOSITIONS.some((c) => c.id === compositionId);
}

export const KNOWN_CATEGORIES = CATEGORY_ORDER;

function countByCategory(): Map<CompositionCategory, number> {
  const out = new Map<CompositionCategory, number>();
  for (const c of AGENT_COMPOSITIONS) {
    out.set(c.category, (out.get(c.category) ?? 0) + 1);
  }
  return out;
}
