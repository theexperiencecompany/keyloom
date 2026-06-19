import { compositions } from "@workspace/compositions/registry";
import { type ComponentType, createElement } from "react";
import { AutoDoc } from "@/components/docs/auto-doc";

export type DocTocItem = { label: string; id: string };

export type DocMeta = {
  title: string;
  description: string;
  toc: DocTocItem[];
};

/**
 * A fully-resolved doc, including its rendered MDX/AutoDoc content. Only
 * produced lazily by `getDoc`.
 */
export type Doc = {
  slug: string;
  href: string;
  meta: DocMeta;
  Content: ComponentType;
};

/**
 * A cheap doc index entry — no MDX is imported to build these. The sidebar
 * search, command palette, and prev/next navigation only need the title /
 * description / href / slug, so the index omits the heavy `Content` and the
 * full `toc`.
 */
export type DocLink = {
  slug: string;
  href: string;
  meta: DocMeta;
};

/** A bespoke MDX module: `{ default: ComponentType, meta: DocMeta }`. */
type MdxModule = { default: ComponentType; meta: DocMeta };

/**
 * Composition docs are registry-driven. For each composition in
 * `@workspace/compositions/registry`, we either:
 *   - lazily import the bespoke MDX file in `content/docs/<kebab>.mdx` if its
 *     loader is listed in `bespokeMdxByCompositionId` below, OR
 *   - render an <AutoDoc /> shell built from the composition's registry
 *     metadata (title, description, fields).
 *
 * Critically, NO MDX is imported at module load. Each entry is a lazy
 * `() => import()` so that visiting one `/docs/<id>` page only compiles that
 * one doc's MDX rather than all of them.
 *
 * Adding bespoke prose for a composition: drop an MDX file at
 * `content/docs/<kebab>.mdx` exporting `meta` + a default component, add
 * one lazy-loader map entry below. Optional.
 */
const bespokeMdxByCompositionId: Record<string, () => Promise<MdxModule>> = {
  GaiaScenario: () => import("@/content/docs/gaia-scenario.mdx"),
  TitleSlideUp: () => import("@/content/docs/title-slide-up.mdx"),
  TitleType: () => import("@/content/docs/title-type.mdx"),
  TitlePopup: () => import("@/content/docs/title-popup.mdx"),
  TitleFade: () => import("@/content/docs/title-fade.mdx"),
  FontHook: () => import("@/content/docs/font-hook.mdx"),
  TextBlurOutUp: () => import("@/content/docs/text-blur-out-up.mdx"),
  TextBottomUpLetters: () =>
    import("@/content/docs/text-bottom-up-letters.mdx"),
  TextDepthParallaxWords: () =>
    import("@/content/docs/text-depth-parallax-words.mdx"),
  TextFadeThrough: () => import("@/content/docs/text-fade-through.mdx"),
  TextFocusBlurResolve: () =>
    import("@/content/docs/text-focus-blur-resolve.mdx"),
  TextKineticCenterBuild: () =>
    import("@/content/docs/text-kinetic-center-build.mdx"),
  TextLineByLineSlide: () =>
    import("@/content/docs/text-line-by-line-slide.mdx"),
  TextMaskRevealUp: () => import("@/content/docs/text-mask-reveal-up.mdx"),
  TextMicroScaleFade: () => import("@/content/docs/text-micro-scale-fade.mdx"),
  TextPerCharacterRise: () =>
    import("@/content/docs/text-per-character-rise.mdx"),
  TextPerWordCrossfade: () =>
    import("@/content/docs/text-per-word-crossfade.mdx"),
  TextScaleDownFade: () => import("@/content/docs/text-scale-down-fade.mdx"),
  TextSharedAxisX: () => import("@/content/docs/text-shared-axis-x.mdx"),
  TextSharedAxisY: () => import("@/content/docs/text-shared-axis-y.mdx"),
  TextSharedAxisZ: () => import("@/content/docs/text-shared-axis-z.mdx"),
  TextShimmerSweep: () => import("@/content/docs/text-shimmer-sweep.mdx"),
  TextShortSlideDown: () => import("@/content/docs/text-short-slide-down.mdx"),
  TextShortSlideRight: () =>
    import("@/content/docs/text-short-slide-right.mdx"),
  TextSoftBlurIn: () => import("@/content/docs/text-soft-blur-in.mdx"),
  TextSpringScaleIn: () => import("@/content/docs/text-spring-scale-in.mdx"),
  TextStaggerFromCenter: () =>
    import("@/content/docs/text-stagger-from-center.mdx"),
  TextStaggerFromEdges: () =>
    import("@/content/docs/text-stagger-from-edges.mdx"),
  TextTopDownLetters: () => import("@/content/docs/text-top-down-letters.mdx"),
  TextTypewriter: () => import("@/content/docs/text-typewriter.mdx"),
  TypingSearch: () => import("@/content/docs/typing-search.mdx"),
  TypingComposer: () => import("@/content/docs/typing-composer.mdx"),
  CursorWalkthrough: () => import("@/content/docs/cursor-walkthrough.mdx"),
  BrowserWindow: () => import("@/content/docs/browser-window.mdx"),
  CaptionTrack: () => import("@/content/docs/caption-track.mdx"),
  TikTokCaption: () => import("@/content/docs/tiktok-caption.mdx"),
  StatCounter: () => import("@/content/docs/stat-counter.mdx"),
  TweetCard: () => import("@/content/docs/tweet-card.mdx"),
  TwitterFollow: () => import("@/content/docs/twitter-follow.mdx"),
  InstagramPost: () => import("@/content/docs/instagram-post.mdx"),
  MessageBubbles: () => import("@/content/docs/message-bubbles.mdx"),
  WhatsAppMessages: () => import("@/content/docs/whatsapp-messages.mdx"),
  TelegramMessages: () => import("@/content/docs/telegram-messages.mdx"),
  SlackMessages: () => import("@/content/docs/slack-messages.mdx"),
  DiscordMessages: () => import("@/content/docs/discord-messages.mdx"),
  InstagramMessages: () => import("@/content/docs/instagram-messages.mdx"),
  MessagePopup: () => import("@/content/docs/message-popup.mdx"),
  PhoneFrame: () => import("@/content/docs/phone-frame.mdx"),
  LaptopFrame: () => import("@/content/docs/laptop-frame.mdx"),
  SplitScene: () => import("@/content/docs/split-scene.mdx"),
  FeatureCard: () => import("@/content/docs/feature-card.mdx"),
  MetricCard: () => import("@/content/docs/metric-card.mdx"),
  TestimonialCard: () => import("@/content/docs/testimonial-card.mdx"),
  LogoCloud: () => import("@/content/docs/logo-cloud.mdx"),
  PricingCard: () => import("@/content/docs/pricing-card.mdx"),
  QrCode: () => import("@/content/docs/qr-code.mdx"),
  Terminal: () => import("@/content/docs/terminal.mdx"),
  GitHubStarButton: () => import("@/content/docs/github-star-button.mdx"),
  Toast: () => import("@/content/docs/toast.mdx"),
  PerspectiveMarquee: () => import("@/content/docs/perspective-marquee.mdx"),
  BarChart: () => import("@/content/docs/bar-chart.mdx"),
  LineChart: () => import("@/content/docs/line-chart.mdx"),
  AreaChart: () => import("@/content/docs/area-chart.mdx"),
  PieChart: () => import("@/content/docs/pie-chart.mdx"),
  RadarChart: () => import("@/content/docs/radar-chart.mdx"),
  RadialChart: () => import("@/content/docs/radial-chart.mdx"),
  Showcase: () => import("@/content/docs/showcase.mdx"),
};

// Default toc for AutoDoc-rendered composition pages — the same three blocks
// every AutoDoc shell renders.
const AUTO_DOC_TOC: DocTocItem[] = [
  { label: "Preview", id: "preview" },
  { label: "Props", id: "props" },
  { label: "Composition", id: "composition" },
];

/**
 * Introduction + the four static-page docs. Their title/description are
 * inlined here (mirrored from the `meta` in each `.mdx`) so the cheap index
 * needs no MDX import. The full `meta` (with `toc`) is loaded lazily by
 * `getDoc` via `staticDocLoaders`.
 */
type StaticDocDef = {
  slug: string;
  href: string;
  title: string;
  description: string;
  load: () => Promise<MdxModule>;
};

const introductionDef: StaticDocDef = {
  slug: "introduction",
  href: "/docs",
  title: "Keyloom",
  description:
    "An open-source library of animated video primitives, plus a browser studio to assemble them — built on Remotion. Use it by hand or let an AI agent compose scenes for you.",
  load: () => import("@/content/docs/introduction.mdx"),
};

const staticDocDefs: StaticDocDef[] = [
  {
    slug: "installation",
    href: "/docs/installation",
    title: "Installation",
    description:
      "Keyloom isn't a package — it's a collection of Remotion scenes you copy into your project. Here's how to get started.",
    load: () => import("@/content/docs/installation.mdx"),
  },
  {
    slug: "using-the-studio",
    href: "/docs/using-the-studio",
    title: "Using the platform",
    description:
      "Keyloom is a visual editor for video and a primitive set for AI coding agents. Both paths produce the same Remotion output — here's how to drive each.",
    load: () => import("@/content/docs/using-the-studio.mdx"),
  },
  {
    slug: "components",
    href: "/docs/components",
    title: "Components",
    description:
      "Every scene in Keyloom, grouped by category. Click a component to see its live preview, props, and source code.",
    load: () => import("@/content/docs/components.mdx"),
  },
  {
    slug: "contributors",
    href: "/docs/contributors",
    title: "Contributors",
    description:
      "Keyloom is open source. Contribute a new scene, fix a bug, or propose a category.",
    load: () => import("@/content/docs/contributors.mdx"),
  },
];

const staticDocLoaders: Record<string, () => Promise<MdxModule>> =
  Object.fromEntries(
    [introductionDef, ...staticDocDefs].map((d) => [d.slug, d.load]),
  );

function staticDocLink(d: StaticDocDef): DocLink {
  return {
    slug: d.slug,
    href: d.href,
    meta: { title: d.title, description: d.description, toc: [] },
  };
}

/**
 * Derive the cheap index entry for a registered composition. Order in the
 * sidebar follows registry order, so reordering compositions in `registry.ts`
 * automatically reorders the docs nav and the prev/next chain. The index
 * never reads MDX — `toc` is empty here (consumers don't read it).
 */
function deriveCompositionDocLink(c: (typeof compositions)[number]): DocLink {
  return {
    slug: c.id,
    href: `/docs/${c.id}`,
    meta: { title: c.title, description: c.description, toc: [] },
  };
}

const componentDocs: DocLink[] = compositions.map(deriveCompositionDocLink);

/**
 * Main docs feed — introduction sits first, then every composition in
 * registry order. Adding a composition automatically extends this list.
 * This is the cheap index (no `Content`).
 */
export const docs: DocLink[] = [
  staticDocLink(introductionDef),
  ...componentDocs,
];

// Static-page docs (no composition behind them) — linked from the
// sidebar / nav but don't appear in the components grid.
export const staticDocs: DocLink[] = staticDocDefs.map(staticDocLink);

/**
 * Resolve a doc fully, lazily compiling its MDX (or building an AutoDoc
 * shell) on demand. Returns `undefined` for unknown slugs.
 */
export async function getDoc(slug: string): Promise<Doc | undefined> {
  // Introduction + static docs.
  const staticLoad = staticDocLoaders[slug];
  if (staticLoad) {
    const mod = await staticLoad();
    const href = slug === "introduction" ? "/docs" : `/docs/${slug}`;
    return { slug, href, meta: mod.meta, Content: mod.default };
  }

  // Composition with bespoke MDX prose.
  const bespokeLoad = bespokeMdxByCompositionId[slug];
  if (bespokeLoad) {
    const mod = await bespokeLoad();
    return {
      slug,
      href: `/docs/${slug}`,
      meta: mod.meta,
      Content: mod.default,
    };
  }

  // Composition without bespoke MDX — AutoDoc fallback derived from registry.
  const c = compositions.find((comp) => comp.id === slug);
  if (c) {
    const id = c.id;
    const description = c.description;
    const AutoContent: ComponentType = () =>
      createElement(AutoDoc, { id, description });
    return {
      slug: id,
      href: `/docs/${id}`,
      meta: {
        title: c.title,
        description: c.description,
        toc: AUTO_DOC_TOC,
      },
      Content: AutoContent,
    };
  }

  return undefined;
}

export function getAdjacent(slug: string): {
  prev: { href: string; label: string } | null;
  next: { href: string; label: string } | null;
} {
  const i = docs.findIndex((d) => d.slug === slug);
  if (i < 0) return { prev: null, next: null };
  const prev = i > 0 ? docs[i - 1]! : null;
  const next = i < docs.length - 1 ? docs[i + 1]! : null;
  return {
    prev: prev ? { href: prev.href, label: prev.meta.title } : null,
    next: next ? { href: next.href, label: next.meta.title } : null,
  };
}
