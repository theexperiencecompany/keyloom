import type { AnyCompositionInfo } from "./schema";
import { messagePopupInfo } from "./compositions/MessagePopup/meta";
import { messageBubblesInfo } from "./compositions/MessageBubbles/meta";
import { titleRevealInfo } from "./compositions/TitleReveal/meta";

export const compositions: AnyCompositionInfo[] = [
  titleRevealInfo,
  messagePopupInfo,
  messageBubblesInfo,
];

export const compositionsById: Record<string, AnyCompositionInfo> =
  Object.fromEntries(compositions.map((c) => [c.id, c]));
