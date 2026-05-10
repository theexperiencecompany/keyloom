import { browserWindowInfo } from "./compositions/BrowserWindow/meta";
import { captionTrackInfo } from "./compositions/CaptionTrack/meta";
import { cursorWalkthroughInfo } from "./compositions/CursorWalkthrough/meta";
import { discordMessagesInfo } from "./compositions/DiscordMessages/meta";
import { featureCardInfo } from "./compositions/FeatureCard/meta";
import { gaiaScenarioInfo } from "./compositions/GaiaScenario/meta";
import { instagramMessagesInfo } from "./compositions/InstagramMessages/meta";
import { instagramPostInfo } from "./compositions/InstagramPost/meta";
import { laptopFrameInfo } from "./compositions/LaptopFrame/meta";
import { logoCloudInfo } from "./compositions/LogoCloud/meta";
import { messageBubblesInfo } from "./compositions/MessageBubbles/meta";
import { messagePopupInfo } from "./compositions/MessagePopup/meta";
import { metricCardInfo } from "./compositions/MetricCard/meta";
import { phoneFrameInfo } from "./compositions/PhoneFrame/meta";
import { pricingCardInfo } from "./compositions/PricingCard/meta";
import { slackMessagesInfo } from "./compositions/SlackMessages/meta";
import { splitSceneInfo } from "./compositions/SplitScene/meta";
import { statCounterInfo } from "./compositions/StatCounter/meta";
import { testimonialCardInfo } from "./compositions/TestimonialCard/meta";
import { textBlurOutUpInfo } from "./compositions/TextBlurOutUp/meta";
import { textBottomUpLettersInfo } from "./compositions/TextBottomUpLetters/meta";
import { textDepthParallaxWordsInfo } from "./compositions/TextDepthParallaxWords/meta";
import { textFadeThroughInfo } from "./compositions/TextFadeThrough/meta";
import { textFocusBlurResolveInfo } from "./compositions/TextFocusBlurResolve/meta";
import { textKineticCenterBuildInfo } from "./compositions/TextKineticCenterBuild/meta";
import { textLineByLineSlideInfo } from "./compositions/TextLineByLineSlide/meta";
import { textMaskRevealUpInfo } from "./compositions/TextMaskRevealUp/meta";
import { textMicroScaleFadeInfo } from "./compositions/TextMicroScaleFade/meta";
import { textPerCharacterRiseInfo } from "./compositions/TextPerCharacterRise/meta";
import { textPerWordCrossfadeInfo } from "./compositions/TextPerWordCrossfade/meta";
import { textScaleDownFadeInfo } from "./compositions/TextScaleDownFade/meta";
import { textSharedAxisXInfo } from "./compositions/TextSharedAxisX/meta";
import { textSharedAxisYInfo } from "./compositions/TextSharedAxisY/meta";
import { textSharedAxisZInfo } from "./compositions/TextSharedAxisZ/meta";
import { textShimmerSweepInfo } from "./compositions/TextShimmerSweep/meta";
import { textShortSlideDownInfo } from "./compositions/TextShortSlideDown/meta";
import { textShortSlideRightInfo } from "./compositions/TextShortSlideRight/meta";
import { textSoftBlurInInfo } from "./compositions/TextSoftBlurIn/meta";
import { textSpringScaleInInfo } from "./compositions/TextSpringScaleIn/meta";
import { textStaggerFromCenterInfo } from "./compositions/TextStaggerFromCenter/meta";
import { textStaggerFromEdgesInfo } from "./compositions/TextStaggerFromEdges/meta";
import { textTopDownLettersInfo } from "./compositions/TextTopDownLetters/meta";
import { textTypewriterInfo } from "./compositions/TextTypewriter/meta";
import { titleFadeInfo } from "./compositions/TitleFade/meta";
import { titlePopupInfo } from "./compositions/TitlePopup/meta";
import { titleSlideUpInfo } from "./compositions/TitleSlideUp/meta";
import { titleTypeInfo } from "./compositions/TitleType/meta";
import { tweetCardInfo } from "./compositions/TweetCard/meta";
import { twitterFollowInfo } from "./compositions/TwitterFollow/meta";
import { typingComposerInfo } from "./compositions/TypingComposer/meta";
import { typingSearchInfo } from "./compositions/TypingSearch/meta";
import { whatsappMessagesInfo } from "./compositions/WhatsAppMessages/meta";
import type { AnyCompositionInfo } from "./schema";

export const compositions: AnyCompositionInfo[] = [
  gaiaScenarioInfo,
  titleSlideUpInfo,
  titleTypeInfo,
  titlePopupInfo,
  titleFadeInfo,
  typingSearchInfo,
  typingComposerInfo,
  cursorWalkthroughInfo,
  browserWindowInfo,
  captionTrackInfo,
  statCounterInfo,
  tweetCardInfo,
  twitterFollowInfo,
  instagramPostInfo,
  messagePopupInfo,
  messageBubblesInfo,
  whatsappMessagesInfo,
  instagramMessagesInfo,
  slackMessagesInfo,
  discordMessagesInfo,
  phoneFrameInfo,
  laptopFrameInfo,
  splitSceneInfo,
  textMicroScaleFadeInfo,
  textShimmerSweepInfo,
  textFadeThroughInfo,
  textSharedAxisZInfo,
  textScaleDownFadeInfo,
  textFocusBlurResolveInfo,
  textSharedAxisXInfo,
  textMaskRevealUpInfo,
  textLineByLineSlideInfo,
  textSoftBlurInInfo,
  textPerCharacterRiseInfo,
  textBottomUpLettersInfo,
  textTopDownLettersInfo,
  textStaggerFromCenterInfo,
  textStaggerFromEdgesInfo,
  textTypewriterInfo,
  textPerWordCrossfadeInfo,
  textSpringScaleInInfo,
  textBlurOutUpInfo,
  textSharedAxisYInfo,
  textDepthParallaxWordsInfo,
  textShortSlideRightInfo,
  textKineticCenterBuildInfo,
  textShortSlideDownInfo,
  featureCardInfo,
  metricCardInfo,
  testimonialCardInfo,
  logoCloudInfo,
  pricingCardInfo,
];

export const compositionsById: Record<string, AnyCompositionInfo> =
  Object.fromEntries(compositions.map((c) => [c.id, c]));
