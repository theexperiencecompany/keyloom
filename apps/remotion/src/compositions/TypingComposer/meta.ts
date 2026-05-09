import type { CompositionInfo } from "../../schema";
import type { TypingComposerProps } from "./TypingComposer";

export const TYPING_COMPOSER_DURATION = 260;
export const TYPING_COMPOSER_FPS = 60;
export const TYPING_COMPOSER_WIDTH = 1920;
export const TYPING_COMPOSER_HEIGHT = 1080;

export const typingComposerDefaultProps: TypingComposerProps = {
  query: "Plan a 3-day trip to Tokyo with a $2000 budget",
  placeholder: "What can I do for you today? (Type '/' for tools)",
};

export const typingComposerInfo: CompositionInfo<TypingComposerProps> = {
  id: "TypingComposer",
  title: "Typing Composer",
  description:
    "A GAIA-style chat composer that types out a prompt character-by-character, then a mouse cursor flies in and clicks the send button.",
  durationInFrames: TYPING_COMPOSER_DURATION,
  fps: TYPING_COMPOSER_FPS,
  width: TYPING_COMPOSER_WIDTH,
  height: TYPING_COMPOSER_HEIGHT,
  defaultProps: typingComposerDefaultProps,
  fields: [
    { kind: "text", key: "query", label: "Query" },
    { kind: "text", key: "placeholder", label: "Placeholder" },
  ],
};
