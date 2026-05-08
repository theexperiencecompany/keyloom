import type { CompositionInfo } from "../../schema";
import type { TwitterFollowProps } from "./TwitterFollow";

export const TWITTER_FOLLOW_DURATION = 240;
export const TWITTER_FOLLOW_FPS = 60;
export const TWITTER_FOLLOW_WIDTH = 1920;
export const TWITTER_FOLLOW_HEIGHT = 1080;

export const twitterFollowDefaultProps: TwitterFollowProps = {
  handle: "@sankalpa_02",
  displayName: "Sankalpa",
  avatarUrl: "https://github.com/sankalpaacharya.png?size=400",
  bio: "CEO @ping_gg, ex-Twitch. I make videos and break things.",
  followers: 482103,
  following: 2014,
  verified: "yes",
  theme: "light",
  backgroundColor: "#f7f9fa",
};

export const twitterFollowInfo: CompositionInfo<TwitterFollowProps> = {
  id: "TwitterFollow",
  title: "Twitter Follow",
  description:
    "An animated X / Twitter profile card with a Follow button click and follower count bump.",
  durationInFrames: TWITTER_FOLLOW_DURATION,
  fps: TWITTER_FOLLOW_FPS,
  width: TWITTER_FOLLOW_WIDTH,
  height: TWITTER_FOLLOW_HEIGHT,
  defaultProps: twitterFollowDefaultProps,
  fields: [
    { kind: "text", key: "handle", label: "Handle" },
    { kind: "text", key: "displayName", label: "Display name" },
    { kind: "text", key: "avatarUrl", label: "Avatar URL" },
    { kind: "textarea", key: "bio", label: "Bio", rows: 2 },
    { kind: "number", key: "followers", label: "Followers", min: 0 },
    { kind: "number", key: "following", label: "Following", min: 0 },
    {
      kind: "select",
      key: "verified",
      label: "Verified",
      options: [
        { value: "yes", label: "Verified" },
        { value: "no", label: "Not verified" },
      ],
    },
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
