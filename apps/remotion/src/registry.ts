import type { AnyCompositionInfo } from "./schema";
import { messagePopupInfo } from "./compositions/MessagePopup/meta";
import { messageBubblesInfo } from "./compositions/MessageBubbles/meta";
import { titleSlideUpInfo } from "./compositions/TitleSlideUp/meta";
import { titleTypeInfo } from "./compositions/TitleType/meta";
import { titlePopupInfo } from "./compositions/TitlePopup/meta";
import { titleFadeInfo } from "./compositions/TitleFade/meta";
import { typingSearchInfo } from "./compositions/TypingSearch/meta";
import { typingComposerInfo } from "./compositions/TypingComposer/meta";
import { statCounterInfo } from "./compositions/StatCounter/meta";
import { tweetCardInfo } from "./compositions/TweetCard/meta";
import { cursorWalkthroughInfo } from "./compositions/CursorWalkthrough/meta";
import { browserWindowInfo } from "./compositions/BrowserWindow/meta";
import { captionTrackInfo } from "./compositions/CaptionTrack/meta";
import { twitterFollowInfo } from "./compositions/TwitterFollow/meta";
import { whatsappMessagesInfo } from "./compositions/WhatsAppMessages/meta";
import { slackMessagesInfo } from "./compositions/SlackMessages/meta";
import { discordMessagesInfo } from "./compositions/DiscordMessages/meta";
import { phoneFrameInfo } from "./compositions/PhoneFrame/meta";
import { laptopFrameInfo } from "./compositions/LaptopFrame/meta";
import { splitSceneInfo } from "./compositions/SplitScene/meta";
import { textMicroScaleFadeInfo } from "./compositions/TextMicroScaleFade/meta";
import { textShimmerSweepInfo } from "./compositions/TextShimmerSweep/meta";
import { textFadeThroughInfo } from "./compositions/TextFadeThrough/meta";
import { textSharedAxisZInfo } from "./compositions/TextSharedAxisZ/meta";
import { textScaleDownFadeInfo } from "./compositions/TextScaleDownFade/meta";
import { textFocusBlurResolveInfo } from "./compositions/TextFocusBlurResolve/meta";
import { textSharedAxisXInfo } from "./compositions/TextSharedAxisX/meta";
import { textMaskRevealUpInfo } from "./compositions/TextMaskRevealUp/meta";
import { textLineByLineSlideInfo } from "./compositions/TextLineByLineSlide/meta";
import { textSoftBlurInInfo } from "./compositions/TextSoftBlurIn/meta";
import { textPerCharacterRiseInfo } from "./compositions/TextPerCharacterRise/meta";
import { textBottomUpLettersInfo } from "./compositions/TextBottomUpLetters/meta";
import { textTopDownLettersInfo } from "./compositions/TextTopDownLetters/meta";
import { textStaggerFromCenterInfo } from "./compositions/TextStaggerFromCenter/meta";
import { textStaggerFromEdgesInfo } from "./compositions/TextStaggerFromEdges/meta";
import { textTypewriterInfo } from "./compositions/TextTypewriter/meta";
import { textPerWordCrossfadeInfo } from "./compositions/TextPerWordCrossfade/meta";
import { textSpringScaleInInfo } from "./compositions/TextSpringScaleIn/meta";
import { textBlurOutUpInfo } from "./compositions/TextBlurOutUp/meta";
import { textSharedAxisYInfo } from "./compositions/TextSharedAxisY/meta";
import { textDepthParallaxWordsInfo } from "./compositions/TextDepthParallaxWords/meta";
import { textShortSlideRightInfo } from "./compositions/TextShortSlideRight/meta";
import { textKineticCenterBuildInfo } from "./compositions/TextKineticCenterBuild/meta";
import { textShortSlideDownInfo } from "./compositions/TextShortSlideDown/meta";

export const compositions: AnyCompositionInfo[] = [
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
  messagePopupInfo,
  messageBubblesInfo,
  whatsappMessagesInfo,
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
];

export const compositionsById: Record<string, AnyCompositionInfo> =
  Object.fromEntries(compositions.map((c) => [c.id, c]));
