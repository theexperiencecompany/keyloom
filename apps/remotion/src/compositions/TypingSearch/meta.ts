import type { CompositionInfo } from "../../schema";
import type { TypingSearchProps } from "./TypingSearch";

export const TYPING_SEARCH_DURATION = 300;
export const TYPING_SEARCH_FPS = 60;
export const TYPING_SEARCH_WIDTH = 1920;
export const TYPING_SEARCH_HEIGHT = 1080;

export const typingSearchDefaultProps: TypingSearchProps = {
  query: "best new tech of 2025",
  placeholder: "Search the web…",
  backgroundColor: "#ffffff",
  accentColor: "#0a84ff",
};

export const typingSearchInfo: CompositionInfo<TypingSearchProps> = {
  id: "TypingSearch",
  title: "Typing Search",
  description:
    "A search bar that types out a query character-by-character, then a mouse cursor flies in and clicks the search button.",
  durationInFrames: TYPING_SEARCH_DURATION,
  fps: TYPING_SEARCH_FPS,
  width: TYPING_SEARCH_WIDTH,
  height: TYPING_SEARCH_HEIGHT,
  defaultProps: typingSearchDefaultProps,
  fields: [
    { kind: "text", key: "query", label: "Query" },
    { kind: "text", key: "placeholder", label: "Placeholder" },
    { kind: "color", key: "backgroundColor", label: "Background color" },
    { kind: "color", key: "accentColor", label: "Accent color" },
  ],
};
