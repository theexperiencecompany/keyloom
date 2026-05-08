import type { AnyCompositionInfo } from "./schema";
import { messagePopupInfo } from "./compositions/MessagePopup/meta";
import { messageBubblesInfo } from "./compositions/MessageBubbles/meta";
import { titleSlideUpInfo } from "./compositions/TitleSlideUp/meta";
import { titleTypeInfo } from "./compositions/TitleType/meta";
import { titlePopupInfo } from "./compositions/TitlePopup/meta";
import { titleFadeInfo } from "./compositions/TitleFade/meta";
import { typingSearchInfo } from "./compositions/TypingSearch/meta";
import { statCounterInfo } from "./compositions/StatCounter/meta";
import { tweetCardInfo } from "./compositions/TweetCard/meta";
import { cursorWalkthroughInfo } from "./compositions/CursorWalkthrough/meta";
import { browserWindowInfo } from "./compositions/BrowserWindow/meta";
import { captionTrackInfo } from "./compositions/CaptionTrack/meta";
import { twitterFollowInfo } from "./compositions/TwitterFollow/meta";
import { gaiaScenarioInfo } from "./compositions/GaiaScenario/meta";

export const compositions: AnyCompositionInfo[] = [
  gaiaScenarioInfo,
  titleSlideUpInfo,
  titleTypeInfo,
  titlePopupInfo,
  titleFadeInfo,
  typingSearchInfo,
  cursorWalkthroughInfo,
  browserWindowInfo,
  captionTrackInfo,
  statCounterInfo,
  tweetCardInfo,
  twitterFollowInfo,
  messagePopupInfo,
  messageBubblesInfo,
];

export const compositionsById: Record<string, AnyCompositionInfo> =
  Object.fromEntries(compositions.map((c) => [c.id, c]));
