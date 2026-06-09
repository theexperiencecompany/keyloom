import { compositions } from "@workspace/compositions/registry";
import type {
  AnyCompositionInfo,
  CompositionCategory,
} from "@workspace/compositions/schema";

// The agent only ever sees this filtered slice — compositions flagged
// `hideFromAgent: true` (internal/branded scenes like GaiaScenario)
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
  captions:
    "Voiceover-driven caption tracks — TikTok-style word highlight, CaptionTrack.",
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
    brandLocked: c.brandMode === "locked",
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

// Kept so debug callers / docs surfaces can render a one-line list if needed.
export function formatSceneOneLine(c: AnyCompositionInfo): string {
  const locked = c.brandMode === "locked" ? " [brand-locked]" : "";
  return `- **${c.id}**${locked} — ${c.description}`;
}

/* ─────────── shortlistScenes: server-driven exploration ─────────── */

export type BeatRequest = {
  /** Free-text role of this beat ("Hook title", "Demo step 1", "CTA"). */
  role: string;
  category: CompositionCategory;
};

export type ShortlistedCandidate = {
  id: string;
  title: string;
  description: string;
  agentNotes?: string;
  brandLocked: boolean;
  defaultDurationFrames: number;
  defaultProps: unknown;
};

export type ShortlistedBeat = {
  role: string;
  category: CompositionCategory;
  candidates: ShortlistedCandidate[];
};

/**
 * Server-driven exploration that forces variety.
 *
 * For each category that appears across the beat plan, the available
 * scenes are shuffled and then **partitioned disjointly** across all
 * the beats that share that category. A 7-beat video where 3 beats
 * want `text` will see three NON-OVERLAPPING text shortlists — the
 * agent literally cannot pick TitlePopup twice.
 *
 * If a category has too few scenes to disjointly partition (e.g.
 * `captions` has 2 scenes but 3 beats want them), we fall back to a
 * rotated overlap so each beat still gets options.
 *
 * Per-beat candidate count defaults to 4. The agent reviews them
 * inline (full description + agentNotes + trimmed defaultProps in the
 * response), picks one per beat, and calls buildProject.
 */
export function shortlistScenes(
  beats: BeatRequest[],
  options?: {
    perBeat?: number;
    trimDefaultProps?: (v: unknown) => unknown;
  },
): ShortlistedBeat[] {
  const perBeat = Math.max(1, options?.perBeat ?? 4);
  const trim = options?.trimDefaultProps ?? ((v: unknown) => v);

  // Group beat indices by category so we know how many beats compete
  // for each pool.
  const beatIndicesByCategory = new Map<CompositionCategory, number[]>();
  beats.forEach((b, i) => {
    const list = beatIndicesByCategory.get(b.category) ?? [];
    list.push(i);
    beatIndicesByCategory.set(b.category, list);
  });

  const out: ShortlistedBeat[] = beats.map((b) => ({
    role: b.role,
    category: b.category,
    candidates: [],
  }));

  for (const [category, beatIndices] of beatIndicesByCategory) {
    const pool = shuffled(
      AGENT_COMPOSITIONS.filter((c) => c.category === category),
    );
    if (pool.length === 0) continue;

    const totalNeeded = beatIndices.length * perBeat;

    if (pool.length >= totalNeeded) {
      // Perfect partition — each beat gets a disjoint slice.
      beatIndices.forEach((beatIdx, i) => {
        out[beatIdx]!.candidates = pool
          .slice(i * perBeat, (i + 1) * perBeat)
          .map((c) => toCandidate(c, trim));
      });
    } else {
      // Not enough scenes for disjoint partitioning. Rotate the pool
      // for each beat so the agent at least sees different "first"
      // options per beat, even though there will be overlap.
      beatIndices.forEach((beatIdx, i) => {
        const rotateBy = (i * perBeat) % pool.length;
        const rotated = [...pool.slice(rotateBy), ...pool.slice(0, rotateBy)];
        const take = Math.min(perBeat, pool.length);
        out[beatIdx]!.candidates = rotated
          .slice(0, take)
          .map((c) => toCandidate(c, trim));
      });
    }
  }

  return out;
}

function toCandidate(
  c: AnyCompositionInfo,
  trim: (v: unknown) => unknown,
): ShortlistedCandidate {
  return {
    id: c.id,
    title: c.title,
    description: c.description,
    agentNotes: c.agentNotes,
    brandLocked: c.brandMode === "locked",
    defaultDurationFrames: c.durationInFrames,
    defaultProps: trim(c.defaultProps),
  };
}

function shuffled<T>(input: T[]): T[] {
  const out = input.slice();
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j]!, out[i]!];
  }
  return out;
}
