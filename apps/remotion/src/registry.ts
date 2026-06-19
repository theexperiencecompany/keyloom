import { areaChartInfo } from "./compositions/AreaChart/meta";
import { barChartInfo } from "./compositions/BarChart/meta";
import { bounceCardsInfo } from "./compositions/BounceCards/meta";
import { browserWindowInfo } from "./compositions/BrowserWindow/meta";
import { auroraGradientInfo } from "./compositions/backgrounds/AuroraGradient/meta";
import { blueGridInfo } from "./compositions/backgrounds/BlueGrid/meta";
import { futuristicArchInfo } from "./compositions/backgrounds/FuturisticArch/meta";
import { liquidChromeInfo } from "./compositions/backgrounds/LiquidChrome/meta";
import { whiteRadialBurstInfo } from "./compositions/backgrounds/WhiteRadialBurst/meta";
import { captionTrackInfo } from "./compositions/CaptionTrack/meta";
import { cardRevealInfo } from "./compositions/CardReveal/meta";
import { cursorWalkthroughInfo } from "./compositions/CursorWalkthrough/meta";
import { discordMessagesInfo } from "./compositions/DiscordMessages/meta";
import { gaiaScenarioInfo } from "./compositions/GaiaScenario/meta";
import { githubStarButtonInfo } from "./compositions/GitHubStarButton/meta";
import { imageSceneInfo } from "./compositions/ImageScene/meta";
import { instagramMessagesInfo } from "./compositions/InstagramMessages/meta";
import { instagramPostInfo } from "./compositions/InstagramPost/meta";
import { laptopFrameInfo } from "./compositions/LaptopFrame/meta";
import { lineChartInfo } from "./compositions/LineChart/meta";
import { lockScreenMessageInfo } from "./compositions/LockScreenMessage/meta";
import { logoCloudInfo } from "./compositions/LogoCloud/meta";
import { messageBubblesInfo } from "./compositions/MessageBubbles/meta";
import { messagePopupInfo } from "./compositions/MessagePopup/meta";
import { perspectiveMarqueeInfo } from "./compositions/PerspectiveMarquee/meta";
import { phoneFrameInfo } from "./compositions/PhoneFrame/meta";
import { pieChartInfo } from "./compositions/PieChart/meta";
import { pricingCardInfo } from "./compositions/PricingCard/meta";
import { qrCodeInfo } from "./compositions/QrCode/meta";
import { radarChartInfo } from "./compositions/RadarChart/meta";
import { radialChartInfo } from "./compositions/RadialChart/meta";
import { showcaseInfo } from "./compositions/Showcase/meta";
import { slackMessagesInfo } from "./compositions/SlackMessages/meta";
import { statCounterInfo } from "./compositions/StatCounter/meta";
import { telegramMessagesInfo } from "./compositions/TelegramMessages/meta";
import { terminalInfo } from "./compositions/Terminal/meta";
import { testimonialCardInfo } from "./compositions/TestimonialCard/meta";
import { textInfo } from "./compositions/Text/meta";
import { textMagicMoveInfo } from "./compositions/TextMagicMove/meta";
import { textMorphInfo } from "./compositions/TextMorph/meta";
import { tikTokCaptionInfo } from "./compositions/TikTokCaption/meta";
import { tweetCardInfo } from "./compositions/TweetCard/meta";
import { twitterFollowInfo } from "./compositions/TwitterFollow/meta";
import { typingComposerInfo } from "./compositions/TypingComposer/meta";
import { typingSearchInfo } from "./compositions/TypingSearch/meta";
import { whatsappMessagesInfo } from "./compositions/WhatsAppMessages/meta";
import type { AnyCompositionInfo } from "./schema";

export const compositions: AnyCompositionInfo[] = [
  gaiaScenarioInfo,
  typingSearchInfo,
  typingComposerInfo,
  cursorWalkthroughInfo,
  browserWindowInfo,
  captionTrackInfo,
  tikTokCaptionInfo,
  statCounterInfo,
  tweetCardInfo,
  twitterFollowInfo,
  instagramPostInfo,
  messageBubblesInfo,
  lockScreenMessageInfo,
  whatsappMessagesInfo,
  telegramMessagesInfo,
  slackMessagesInfo,
  discordMessagesInfo,
  instagramMessagesInfo,
  messagePopupInfo,
  phoneFrameInfo,
  laptopFrameInfo,
  textInfo,
  textMagicMoveInfo,
  textMorphInfo,
  testimonialCardInfo,
  logoCloudInfo,
  cardRevealInfo,
  pricingCardInfo,
  terminalInfo,
  githubStarButtonInfo,
  imageSceneInfo,
  bounceCardsInfo,
  qrCodeInfo,
  perspectiveMarqueeInfo,
  barChartInfo,
  lineChartInfo,
  areaChartInfo,
  pieChartInfo,
  radarChartInfo,
  radialChartInfo,
  blueGridInfo,
  auroraGradientInfo,
  whiteRadialBurstInfo,
  liquidChromeInfo,
  futuristicArchInfo,
  showcaseInfo,
];

export const compositionsById: Record<string, AnyCompositionInfo> =
  Object.fromEntries(compositions.map((c) => [c.id, c]));

/**
 * Module path (relative to `compositions/`) for a composition's React
 * component file, used by the docs/creators previews to lazy-load the
 * component into its own chunk. Most compositions live flat at
 * `<Id>/<Id>`, but background scenes are grouped under `backgrounds/`.
 * Keep this in sync with the on-disk folder layout.
 */
export function compositionModulePath(
  info: Pick<AnyCompositionInfo, "id" | "category">,
): string {
  const dir =
    info.category === "background" ? `backgrounds/${info.id}` : info.id;
  return `${dir}/${info.id}`;
}
