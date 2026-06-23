import type { CompositionInfo } from "../../schema";
import type { TweetPostProps } from "./TweetPost";

export const TWEET_POST_DURATION = 150;
export const TWEET_POST_FPS = 60;
export const TWEET_POST_WIDTH = 1600;
export const TWEET_POST_HEIGHT = 600;

export const tweetPostDefaultProps: TweetPostProps = {
  displayName: "Duolingo",
  nameImageUrl: "",
  handle: "duolingo",
  avatarUrl: "",
  avatarShape: "rounded",
  verified: "gold",
  text: "KNICKS IN 5 so i'm giving your lost streaks back!! 🧡💙",
  timestamp: "9:04 PM · Jun 13, 2026",
  theme: "light",
};

export const tweetPostInfo: CompositionInfo<TweetPostProps> = {
  id: "TweetPost",
  category: "social",
  agentNotes:
    "Authentic X / Twitter *published* post (not the composer): avatar, display name with a verified seal, @handle, the post body with emoji, and the timestamp line. Header, body and timestamp reveal in a quick upward stagger. Use for 'a brand/person just tweeted this' beats, reaction screenshots, or announcement moments. Keep body under ~240 chars.",
  title: "Tweet Post",
  description:
    "An animated X / Twitter post — avatar, name, verified badge, body, and timestamp reveal in a staggered rise. Edit the copy, handle, avatar, and badge.",
  durationInFrames: TWEET_POST_DURATION,
  fps: TWEET_POST_FPS,
  width: TWEET_POST_WIDTH,
  height: TWEET_POST_HEIGHT,
  defaultProps: tweetPostDefaultProps,
  fields: [
    { kind: "text", key: "displayName", label: "Display name" },
    { kind: "image", key: "nameImageUrl", label: "Display name image" },
    { kind: "text", key: "handle", label: "Handle (without @)" },
    { kind: "image", key: "avatarUrl", label: "Profile picture" },
    {
      kind: "select",
      key: "avatarShape",
      label: "Avatar shape",
      options: [
        { value: "rounded", label: "Rounded square" },
        { value: "circle", label: "Circle" },
      ],
    },
    {
      kind: "select",
      key: "verified",
      label: "Verified badge",
      options: [
        { value: "none", label: "None" },
        { value: "blue", label: "Blue" },
        { value: "gold", label: "Gold (org)" },
      ],
    },
    { kind: "textarea", key: "text", label: "Post text", rows: 3 },
    { kind: "text", key: "timestamp", label: "Timestamp" },
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
