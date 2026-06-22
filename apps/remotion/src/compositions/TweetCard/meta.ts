import type { CompositionInfo } from "../../schema";
import type { TweetCardProps } from "./TweetCard";

export const TWEET_CARD_DURATION = 140;
export const TWEET_CARD_FPS = 60;
export const TWEET_CARD_WIDTH = 1920;
export const TWEET_CARD_HEIGHT = 1080;

export const tweetCardDefaultProps: TweetCardProps = {
  displayName: "sanku",
  avatarUrl: "https://avatars.githubusercontent.com/sankalpaacharya?s=200",
  text: "just shipped something new 🚀",
  audience: "Everyone",
  theme: "dark",
};

export const tweetCardInfo: CompositionInfo<TweetCardProps> = {
  id: "TweetCard",
  category: "social",
  agentNotes:
    "Authentic X / Twitter compose box: avatar, audience pill, 'What's happening?' field, reply-scope line, the media toolbar, and a Post button. The tweet text types itself out and the Post button lights up and gets 'clicked'. Use for 'we just posted this' / announcement beats. Keep text under ~240 chars.",
  title: "Tweet Composer",
  description:
    "An animated X / Twitter compose box. The tweet text types out and the Post button activates and is pressed.",
  durationInFrames: TWEET_CARD_DURATION,
  fps: TWEET_CARD_FPS,
  width: TWEET_CARD_WIDTH,
  height: TWEET_CARD_HEIGHT,
  defaultProps: tweetCardDefaultProps,
  fields: [
    { kind: "text", key: "displayName", label: "Display name" },
    { kind: "text", key: "avatarUrl", label: "Avatar URL" },
    { kind: "textarea", key: "text", label: "Tweet text", rows: 3 },
    { kind: "text", key: "audience", label: "Audience" },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
  ],
};
