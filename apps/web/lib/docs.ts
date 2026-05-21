import type { ComponentType } from "react";
import AreaChartMDX, {
  meta as areaChartMeta,
} from "@/content/docs/area-chart.mdx";
import BarChartMDX, {
  meta as barChartMeta,
} from "@/content/docs/bar-chart.mdx";
import BrowserWindowMDX, {
  meta as browserWindowMeta,
} from "@/content/docs/browser-window.mdx";
import CaptionTrackMDX, {
  meta as captionTrackMeta,
} from "@/content/docs/caption-track.mdx";
import ComponentsMDX, {
  meta as componentsIndexMeta,
} from "@/content/docs/components.mdx";
import ContributorsMDX, {
  meta as contributorsMeta,
} from "@/content/docs/contributors.mdx";
import CursorWalkthroughMDX, {
  meta as cursorWalkthroughMeta,
} from "@/content/docs/cursor-walkthrough.mdx";
import DiscordMessagesMDX, {
  meta as discordMessagesMeta,
} from "@/content/docs/discord-messages.mdx";
import FeatureCardMDX, {
  meta as featureCardMeta,
} from "@/content/docs/feature-card.mdx";
import GaiaScenarioMDX, {
  meta as gaiaScenarioMeta,
} from "@/content/docs/gaia-scenario.mdx";
import GitHubStarButtonMDX, {
  meta as githubStarButtonMeta,
} from "@/content/docs/github-star-button.mdx";
import InstagramMessagesMDX, {
  meta as instagramMessagesMeta,
} from "@/content/docs/instagram-messages.mdx";
import InstagramPostMDX, {
  meta as instagramPostMeta,
} from "@/content/docs/instagram-post.mdx";
import InstallationMDX, {
  meta as installationMeta,
} from "@/content/docs/installation.mdx";
import IntroductionMDX, {
  meta as introductionMeta,
} from "@/content/docs/introduction.mdx";
import LaptopFrameMDX, {
  meta as laptopFrameMeta,
} from "@/content/docs/laptop-frame.mdx";
import LineChartMDX, {
  meta as lineChartMeta,
} from "@/content/docs/line-chart.mdx";
import LogoCloudMDX, {
  meta as logoCloudMeta,
} from "@/content/docs/logo-cloud.mdx";
import MessageBubblesMDX, {
  meta as messageBubblesMeta,
} from "@/content/docs/message-bubbles.mdx";
import MessagePopupMDX, {
  meta as messagePopupMeta,
} from "@/content/docs/message-popup.mdx";
import MetricCardMDX, {
  meta as metricCardMeta,
} from "@/content/docs/metric-card.mdx";
import PerspectiveMarqueeMDX, {
  meta as perspectiveMarqueeMeta,
} from "@/content/docs/perspective-marquee.mdx";
import PhoneFrameMDX, {
  meta as phoneFrameMeta,
} from "@/content/docs/phone-frame.mdx";
import PieChartMDX, {
  meta as pieChartMeta,
} from "@/content/docs/pie-chart.mdx";
import PricingCardMDX, {
  meta as pricingCardMeta,
} from "@/content/docs/pricing-card.mdx";
import QrCodeMDX, { meta as qrCodeMeta } from "@/content/docs/qr-code.mdx";
import RadarChartMDX, {
  meta as radarChartMeta,
} from "@/content/docs/radar-chart.mdx";
import RadialChartMDX, {
  meta as radialChartMeta,
} from "@/content/docs/radial-chart.mdx";
import ShowcaseMDX, { meta as showcaseMeta } from "@/content/docs/showcase.mdx";
import SlackMessagesMDX, {
  meta as slackMessagesMeta,
} from "@/content/docs/slack-messages.mdx";
import SplitSceneMDX, {
  meta as splitSceneMeta,
} from "@/content/docs/split-scene.mdx";
import StatCounterMDX, {
  meta as statCounterMeta,
} from "@/content/docs/stat-counter.mdx";
import TelegramMessagesMDX, {
  meta as telegramMessagesMeta,
} from "@/content/docs/telegram-messages.mdx";
import TerminalMDX, { meta as terminalMeta } from "@/content/docs/terminal.mdx";
import TestimonialCardMDX, {
  meta as testimonialCardMeta,
} from "@/content/docs/testimonial-card.mdx";
import TextBlurOutUpMDX, {
  meta as textBlurOutUpMeta,
} from "@/content/docs/text-blur-out-up.mdx";
import TextBottomUpLettersMDX, {
  meta as textBottomUpLettersMeta,
} from "@/content/docs/text-bottom-up-letters.mdx";
import TextDepthParallaxWordsMDX, {
  meta as textDepthParallaxWordsMeta,
} from "@/content/docs/text-depth-parallax-words.mdx";
import TextFadeThroughMDX, {
  meta as textFadeThroughMeta,
} from "@/content/docs/text-fade-through.mdx";
import TextFocusBlurResolveMDX, {
  meta as textFocusBlurResolveMeta,
} from "@/content/docs/text-focus-blur-resolve.mdx";
import TextKineticCenterBuildMDX, {
  meta as textKineticCenterBuildMeta,
} from "@/content/docs/text-kinetic-center-build.mdx";
import TextLineByLineSlideMDX, {
  meta as textLineByLineSlideMeta,
} from "@/content/docs/text-line-by-line-slide.mdx";
import TextMaskRevealUpMDX, {
  meta as textMaskRevealUpMeta,
} from "@/content/docs/text-mask-reveal-up.mdx";
import TextMicroScaleFadeMDX, {
  meta as textMicroScaleFadeMeta,
} from "@/content/docs/text-micro-scale-fade.mdx";
import TextPerCharacterRiseMDX, {
  meta as textPerCharacterRiseMeta,
} from "@/content/docs/text-per-character-rise.mdx";
import TextPerWordCrossfadeMDX, {
  meta as textPerWordCrossfadeMeta,
} from "@/content/docs/text-per-word-crossfade.mdx";
import TextScaleDownFadeMDX, {
  meta as textScaleDownFadeMeta,
} from "@/content/docs/text-scale-down-fade.mdx";
import TextSharedAxisXMDX, {
  meta as textSharedAxisXMeta,
} from "@/content/docs/text-shared-axis-x.mdx";
import TextSharedAxisYMDX, {
  meta as textSharedAxisYMeta,
} from "@/content/docs/text-shared-axis-y.mdx";
import TextSharedAxisZMDX, {
  meta as textSharedAxisZMeta,
} from "@/content/docs/text-shared-axis-z.mdx";
import TextShimmerSweepMDX, {
  meta as textShimmerSweepMeta,
} from "@/content/docs/text-shimmer-sweep.mdx";
import TextShortSlideDownMDX, {
  meta as textShortSlideDownMeta,
} from "@/content/docs/text-short-slide-down.mdx";
import TextShortSlideRightMDX, {
  meta as textShortSlideRightMeta,
} from "@/content/docs/text-short-slide-right.mdx";
import TextSoftBlurInMDX, {
  meta as textSoftBlurInMeta,
} from "@/content/docs/text-soft-blur-in.mdx";
import TextSpringScaleInMDX, {
  meta as textSpringScaleInMeta,
} from "@/content/docs/text-spring-scale-in.mdx";
import TextStaggerFromCenterMDX, {
  meta as textStaggerFromCenterMeta,
} from "@/content/docs/text-stagger-from-center.mdx";
import TextStaggerFromEdgesMDX, {
  meta as textStaggerFromEdgesMeta,
} from "@/content/docs/text-stagger-from-edges.mdx";
import TextTopDownLettersMDX, {
  meta as textTopDownLettersMeta,
} from "@/content/docs/text-top-down-letters.mdx";
import TextTypewriterMDX, {
  meta as textTypewriterMeta,
} from "@/content/docs/text-typewriter.mdx";
import TitleFadeMDX, {
  meta as titleFadeMeta,
} from "@/content/docs/title-fade.mdx";
import TitlePopupMDX, {
  meta as titlePopupMeta,
} from "@/content/docs/title-popup.mdx";
import TitleSlideUpMDX, {
  meta as titleSlideUpMeta,
} from "@/content/docs/title-slide-up.mdx";
import TitleTypeMDX, {
  meta as titleTypeMeta,
} from "@/content/docs/title-type.mdx";
import ToastMDX, { meta as toastMeta } from "@/content/docs/toast.mdx";
import TweetCardMDX, {
  meta as tweetCardMeta,
} from "@/content/docs/tweet-card.mdx";
import TwitterFollowMDX, {
  meta as twitterFollowMeta,
} from "@/content/docs/twitter-follow.mdx";
import TypingComposerMDX, {
  meta as typingComposerMeta,
} from "@/content/docs/typing-composer.mdx";
import TypingSearchMDX, {
  meta as typingSearchMeta,
} from "@/content/docs/typing-search.mdx";
import UsingTheStudioMDX, {
  meta as usingTheStudioMeta,
} from "@/content/docs/using-the-studio.mdx";
import WhatsAppMessagesMDX, {
  meta as whatsappMessagesMeta,
} from "@/content/docs/whatsapp-messages.mdx";

export type DocTocItem = { label: string; id: string };

export type DocMeta = {
  title: string;
  description: string;
  toc: DocTocItem[];
};

export type Doc = {
  slug: string;
  href: string;
  meta: DocMeta;
  Content: ComponentType;
};

/**
 * Composition docs are registry-driven. For each composition in
 * `@workspace/compositions/registry`, we either:
 *   - render the bespoke MDX file in `content/docs/<kebab>.mdx` if its
 *     module is listed in `bespokeMdxByCompositionId` below, OR
 *   - render an <AutoDoc /> shell built from the composition's registry
 *     metadata (title, description, fields).
 *
 * Adding a new composition therefore requires NO change to this file —
 * the studio library, /docs sidebar, /docs/<id> route, /component/<id>/edit,
 * cmd-K palette, and home grid all derive from a single source of truth:
 * `registry.compositions[]`.
 *
 * Adding bespoke prose for a composition: drop an MDX file at
 * `content/docs/<kebab>.mdx` exporting `meta` + a default component, add
 * one import + one map entry below. Optional.
 */

import { compositions } from "@workspace/compositions/registry";
import { createElement } from "react";
import { AutoDoc } from "@/components/docs/auto-doc";

type BespokeMdx = { Content: ComponentType; meta: DocMeta };

// Composition-id → bespoke MDX module. Compositions absent from this map
// automatically fall back to <AutoDoc />.
const bespokeMdxByCompositionId: Record<string, BespokeMdx> = {
  GaiaScenario: { Content: GaiaScenarioMDX, meta: gaiaScenarioMeta },
  TitleSlideUp: { Content: TitleSlideUpMDX, meta: titleSlideUpMeta },
  TitleType: { Content: TitleTypeMDX, meta: titleTypeMeta },
  TitlePopup: { Content: TitlePopupMDX, meta: titlePopupMeta },
  TitleFade: { Content: TitleFadeMDX, meta: titleFadeMeta },
  TextBlurOutUp: { Content: TextBlurOutUpMDX, meta: textBlurOutUpMeta },
  TextBottomUpLetters: {
    Content: TextBottomUpLettersMDX,
    meta: textBottomUpLettersMeta,
  },
  TextDepthParallaxWords: {
    Content: TextDepthParallaxWordsMDX,
    meta: textDepthParallaxWordsMeta,
  },
  TextFadeThrough: { Content: TextFadeThroughMDX, meta: textFadeThroughMeta },
  TextFocusBlurResolve: {
    Content: TextFocusBlurResolveMDX,
    meta: textFocusBlurResolveMeta,
  },
  TextKineticCenterBuild: {
    Content: TextKineticCenterBuildMDX,
    meta: textKineticCenterBuildMeta,
  },
  TextLineByLineSlide: {
    Content: TextLineByLineSlideMDX,
    meta: textLineByLineSlideMeta,
  },
  TextMaskRevealUp: {
    Content: TextMaskRevealUpMDX,
    meta: textMaskRevealUpMeta,
  },
  TextMicroScaleFade: {
    Content: TextMicroScaleFadeMDX,
    meta: textMicroScaleFadeMeta,
  },
  TextPerCharacterRise: {
    Content: TextPerCharacterRiseMDX,
    meta: textPerCharacterRiseMeta,
  },
  TextPerWordCrossfade: {
    Content: TextPerWordCrossfadeMDX,
    meta: textPerWordCrossfadeMeta,
  },
  TextScaleDownFade: {
    Content: TextScaleDownFadeMDX,
    meta: textScaleDownFadeMeta,
  },
  TextSharedAxisX: { Content: TextSharedAxisXMDX, meta: textSharedAxisXMeta },
  TextSharedAxisY: { Content: TextSharedAxisYMDX, meta: textSharedAxisYMeta },
  TextSharedAxisZ: { Content: TextSharedAxisZMDX, meta: textSharedAxisZMeta },
  TextShimmerSweep: {
    Content: TextShimmerSweepMDX,
    meta: textShimmerSweepMeta,
  },
  TextShortSlideDown: {
    Content: TextShortSlideDownMDX,
    meta: textShortSlideDownMeta,
  },
  TextShortSlideRight: {
    Content: TextShortSlideRightMDX,
    meta: textShortSlideRightMeta,
  },
  TextSoftBlurIn: { Content: TextSoftBlurInMDX, meta: textSoftBlurInMeta },
  TextSpringScaleIn: {
    Content: TextSpringScaleInMDX,
    meta: textSpringScaleInMeta,
  },
  TextStaggerFromCenter: {
    Content: TextStaggerFromCenterMDX,
    meta: textStaggerFromCenterMeta,
  },
  TextStaggerFromEdges: {
    Content: TextStaggerFromEdgesMDX,
    meta: textStaggerFromEdgesMeta,
  },
  TextTopDownLetters: {
    Content: TextTopDownLettersMDX,
    meta: textTopDownLettersMeta,
  },
  TextTypewriter: { Content: TextTypewriterMDX, meta: textTypewriterMeta },
  TypingSearch: { Content: TypingSearchMDX, meta: typingSearchMeta },
  TypingComposer: { Content: TypingComposerMDX, meta: typingComposerMeta },
  CursorWalkthrough: {
    Content: CursorWalkthroughMDX,
    meta: cursorWalkthroughMeta,
  },
  BrowserWindow: { Content: BrowserWindowMDX, meta: browserWindowMeta },
  CaptionTrack: { Content: CaptionTrackMDX, meta: captionTrackMeta },
  StatCounter: { Content: StatCounterMDX, meta: statCounterMeta },
  TweetCard: { Content: TweetCardMDX, meta: tweetCardMeta },
  TwitterFollow: { Content: TwitterFollowMDX, meta: twitterFollowMeta },
  InstagramPost: { Content: InstagramPostMDX, meta: instagramPostMeta },
  MessageBubbles: { Content: MessageBubblesMDX, meta: messageBubblesMeta },
  WhatsAppMessages: {
    Content: WhatsAppMessagesMDX,
    meta: whatsappMessagesMeta,
  },
  TelegramMessages: {
    Content: TelegramMessagesMDX,
    meta: telegramMessagesMeta,
  },
  SlackMessages: { Content: SlackMessagesMDX, meta: slackMessagesMeta },
  DiscordMessages: { Content: DiscordMessagesMDX, meta: discordMessagesMeta },
  InstagramMessages: {
    Content: InstagramMessagesMDX,
    meta: instagramMessagesMeta,
  },
  MessagePopup: { Content: MessagePopupMDX, meta: messagePopupMeta },
  PhoneFrame: { Content: PhoneFrameMDX, meta: phoneFrameMeta },
  LaptopFrame: { Content: LaptopFrameMDX, meta: laptopFrameMeta },
  SplitScene: { Content: SplitSceneMDX, meta: splitSceneMeta },
  FeatureCard: { Content: FeatureCardMDX, meta: featureCardMeta },
  MetricCard: { Content: MetricCardMDX, meta: metricCardMeta },
  TestimonialCard: { Content: TestimonialCardMDX, meta: testimonialCardMeta },
  LogoCloud: { Content: LogoCloudMDX, meta: logoCloudMeta },
  PricingCard: { Content: PricingCardMDX, meta: pricingCardMeta },
  QrCode: { Content: QrCodeMDX, meta: qrCodeMeta },
  Terminal: { Content: TerminalMDX, meta: terminalMeta },
  GitHubStarButton: {
    Content: GitHubStarButtonMDX,
    meta: githubStarButtonMeta,
  },
  Toast: { Content: ToastMDX, meta: toastMeta },
  PerspectiveMarquee: {
    Content: PerspectiveMarqueeMDX,
    meta: perspectiveMarqueeMeta,
  },
  BarChart: { Content: BarChartMDX, meta: barChartMeta },
  LineChart: { Content: LineChartMDX, meta: lineChartMeta },
  AreaChart: { Content: AreaChartMDX, meta: areaChartMeta },
  PieChart: { Content: PieChartMDX, meta: pieChartMeta },
  RadarChart: { Content: RadarChartMDX, meta: radarChartMeta },
  RadialChart: { Content: RadialChartMDX, meta: radialChartMeta },
  Showcase: { Content: ShowcaseMDX, meta: showcaseMeta },
};

/**
 * Derive the doc entry for a registered composition. Order in the sidebar
 * follows registry order, so reordering compositions in `registry.ts`
 * automatically reorders the docs nav and the prev/next chain.
 */
function deriveCompositionDoc(c: (typeof compositions)[number]): Doc {
  const bespoke = bespokeMdxByCompositionId[c.id];
  if (bespoke) {
    return {
      slug: c.id,
      href: `/docs/${c.id}`,
      meta: bespoke.meta,
      Content: bespoke.Content,
    };
  }
  // No MDX file — render an AutoDoc shell derived from the composition's
  // registry metadata. Same four blocks every bespoke MDX uses.
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
      toc: [
        { label: "Preview", id: "preview" },
        { label: "Props", id: "props" },
        { label: "Composition", id: "composition" },
      ],
    },
    Content: AutoContent,
  };
}

const componentDocs: Doc[] = compositions.map(deriveCompositionDoc);

/**
 * Main docs feed — introduction sits first, then every composition in
 * registry order. Adding a composition automatically extends this list.
 */
export const docs: Doc[] = [
  {
    slug: "introduction",
    href: "/docs",
    meta: introductionMeta,
    Content: IntroductionMDX,
  },
  ...componentDocs,
];

// Static-page docs (no composition behind them) — linked from the
// sidebar / nav but don't appear in the components grid.
export const staticDocs: Doc[] = [
  {
    slug: "installation",
    href: "/docs/installation",
    meta: installationMeta,
    Content: InstallationMDX,
  },
  {
    slug: "using-the-studio",
    href: "/docs/using-the-studio",
    meta: usingTheStudioMeta,
    Content: UsingTheStudioMDX,
  },
  {
    slug: "components",
    href: "/docs/components",
    meta: componentsIndexMeta,
    Content: ComponentsMDX,
  },
  {
    slug: "contributors",
    href: "/docs/contributors",
    meta: contributorsMeta,
    Content: ContributorsMDX,
  },
];

// All docs that resolve through getDoc — includes both component pages and
// the static pages (installation, using-the-studio, components, contributors).
const allDocs: Doc[] = [...docs, ...staticDocs];

const docsBySlug: Record<string, Doc> = Object.fromEntries(
  allDocs.map((d) => [d.slug, d]),
);

export function getDoc(slug: string): Doc | undefined {
  return docsBySlug[slug];
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
