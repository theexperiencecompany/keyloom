import type { MemeTemplate } from "./memes";

/**
 * Order matters twice: filter pills render in this order, and a template's
 * display tag is the first match — keep broad catch-alls (green screen) last
 * so specific tags win.
 */
export const CHART_TAGS = [
  {
    id: "reactions",
    label: "Reactions",
    test: /(cry|laugh|shock|confus|scream|facepalm|side.?eye|staring|angry|awkward|zoning)/i,
  },
  {
    id: "animals",
    label: "Animals",
    test: /(cat|dog|beaver|bear|monkey|frog|duck|bird|hamster|raccoon)/i,
  },
  { id: "packs", label: "Packs", test: /pack/i },
  { id: "green-screen", label: "Green screen", test: /green.?screen/i },
] as const;

export const CHART_FILTERS = ["all", ...CHART_TAGS.map((t) => t.id)] as const;

export type ChartFilter = (typeof CHART_FILTERS)[number];

export type ChartEntry = {
  template: MemeTemplate;
  rank: number;
  /** Positions gained since last week's chart (negative = fell). */
  delta: number;
  isNew: boolean;
  uses: string;
  /** 8 weeks of relative heat, oldest first, each in [0, 1]. */
  sparkline: number[];
  tag?: string;
};

const SPARKLINE_WEEKS = 8;

function hashString(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619) >>> 0;
  }
  return h >>> 0;
}

function weekStart(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - d.getDay());
  return d;
}

function seedFor(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Seeds for the trailing weeks, oldest first; last entry is the current week. */
function weekSeeds(now: Date, count: number): string[] {
  const current = weekStart(now);
  return Array.from({ length: count }, (_, i) => {
    const d = new Date(current);
    d.setDate(current.getDate() - (count - 1 - i) * 7);
    return seedFor(d);
  });
}

export function tagForTemplate(id: string): string | undefined {
  return CHART_TAGS.find((t) => t.test.test(id))?.label;
}

function formatUses(n: number): string {
  return n >= 1000 ? `${(n / 1000).toFixed(1)}K` : String(n);
}

/**
 * Dummy chart data until real usage tracking exists: rankings are seeded from
 * hash(id + week-start), so the whole chart reshuffles every Sunday, movement
 * arrows diff against last week's seed, and sparklines replay the trailing
 * weeks of the same hash. Deterministic — everyone sees the same chart all week.
 */
export function buildChart(templates: MemeTemplate[], now: Date): ChartEntry[] {
  const seeds = weekSeeds(now, SPARKLINE_WEEKS);
  const seed = seeds[seeds.length - 1] as string;
  const prevSeed = seeds[seeds.length - 2] as string;
  const score = (id: string, s: string) => hashString(`${id}::${s}`);
  const rankBy = (s: string) =>
    [...templates].sort((a, b) => score(b.id, s) - score(a.id, s));

  const order = rankBy(seed);
  const prevRankById = new Map(rankBy(prevSeed).map((t, i) => [t.id, i + 1]));

  return order.map((template, i) => {
    const rank = i + 1;
    const prevRank = prevRankById.get(template.id) ?? rank;
    const isNew = hashString(`${template.id}::${seed}::debut`) % 11 === 0;
    const heat = 1 - i / Math.max(1, templates.length - 1);
    const jitter = score(template.id, seed) % 700;
    return {
      template,
      rank,
      delta: prevRank - rank,
      isNew,
      uses: formatUses(Math.round(600 + heat * heat * 11800 + jitter)),
      sparkline: seeds.map(
        (s) => 0.15 + ((score(template.id, s) % 1000) / 1000) * 0.85,
      ),
      tag: tagForTemplate(template.id),
    };
  });
}
