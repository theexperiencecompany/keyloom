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
import { whatsappMessagesInfo } from "./compositions/WhatsAppMessages/meta";
import { slackMessagesInfo } from "./compositions/SlackMessages/meta";
import { discordMessagesInfo } from "./compositions/DiscordMessages/meta";
import { phoneFrameInfo } from "./compositions/PhoneFrame/meta";
import { laptopFrameInfo } from "./compositions/LaptopFrame/meta";
import { splitSceneInfo } from "./compositions/SplitScene/meta";

export const compositions: AnyCompositionInfo[] = [
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
  whatsappMessagesInfo,
  slackMessagesInfo,
  discordMessagesInfo,
  phoneFrameInfo,
  laptopFrameInfo,
  splitSceneInfo,
];

export const compositionsById: Record<string, AnyCompositionInfo> =
  Object.fromEntries(compositions.map((c) => [c.id, c]));
