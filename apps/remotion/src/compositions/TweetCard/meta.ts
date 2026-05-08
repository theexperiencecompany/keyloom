import type { CompositionInfo } from "../../schema";
import type { TweetCardProps } from "./TweetCard";

export const TWEET_CARD_DURATION = 300;
export const TWEET_CARD_FPS = 60;
export const TWEET_CARD_WIDTH = 1920;
export const TWEET_CARD_HEIGHT = 1080;

export const tweetCardDefaultProps: TweetCardProps = {
  displayName: "sanku",
  handle: "@sankalpa_02",
  avatarUrl: "https://github.com/sankalpaacharya.png?size=200",
  verified: "yes",
  text: "Oh boy, we have a lot to talk about today.",
  timestamp: "10:30 PM · Mar 15, 2025",
  replies: 248,
  retweets: 1924,
  likes: 18432,
  views: 412000,
  theme: "light",
  backgroundColor: "#ffffff",
};

export const tweetCardInfo: CompositionInfo<TweetCardProps> = {
  id: "TweetCard",
  title: "Tweet Card",
  description:
    "An animated X / Twitter post card. Customize the author, copy, theme, and engagement counts.",
  durationInFrames: TWEET_CARD_DURATION,
  fps: TWEET_CARD_FPS,
  width: TWEET_CARD_WIDTH,
  height: TWEET_CARD_HEIGHT,
  defaultProps: tweetCardDefaultProps,
  fields: [
    { kind: "text", key: "displayName", label: "Display name" },
    { kind: "text", key: "handle", label: "Handle" },
    { kind: "text", key: "avatarUrl", label: "Avatar URL" },
    {
      kind: "select",
      key: "verified",
      label: "Verified",
      options: [
        { value: "yes", label: "Verified" },
        { value: "no", label: "Not verified" },
      ],
    },
    { kind: "textarea", key: "text", label: "Tweet text", rows: 3 },
    { kind: "text", key: "timestamp", label: "Timestamp" },
    { kind: "number", key: "replies", label: "Replies", min: 0 },
    { kind: "number", key: "retweets", label: "Retweets", min: 0 },
    { kind: "number", key: "likes", label: "Likes", min: 0 },
    { kind: "number", key: "views", label: "Views", min: 0 },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
    { kind: "color", key: "backgroundColor", label: "Background color" },
  ],
};
