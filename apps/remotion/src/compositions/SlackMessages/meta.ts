import type { CompositionInfo } from "../../schema";
import type { SlackMessagesProps } from "./SlackMessages";

export const SLACK_MESSAGES_DURATION = 360;
export const SLACK_MESSAGES_FPS = 60;
export const SLACK_MESSAGES_WIDTH = 1280;
export const SLACK_MESSAGES_HEIGHT = 720;

export const slackMessagesDefaultProps: SlackMessagesProps = {
  contactName: "design",
  messages: [
    { text: "ship it tomorrow?", side: "left", typingFrames: 20, delay: 15 },
    { text: "lgtm 🚀", side: "right", typingFrames: 18, delay: 80 },
    { text: "QA signed off", side: "left", typingFrames: 22, delay: 150 },
    { text: "merging now 🎉", side: "right", typingFrames: 20, delay: 230 },
  ],
  theme: "light",
  orientation: "landscape",
  scale: 2.5,
  leftAvatar: "images/logos/aryan-avatar.png",
  rightAvatar: "gaia-glow.png",
};

export const slackMessagesInfo: CompositionInfo<SlackMessagesProps> = {
  id: "SlackMessages",
  title: "Slack Messages",
  description:
    "An animated Slack-style channel conversation with avatars, sender names, and a typing indicator.",
  durationInFrames: SLACK_MESSAGES_DURATION,
  fps: SLACK_MESSAGES_FPS,
  width: SLACK_MESSAGES_WIDTH,
  height: SLACK_MESSAGES_HEIGHT,
  defaultProps: slackMessagesDefaultProps,
  brandMode: "locked",
  phoneFitMode: "cover",
  fields: [
    { kind: "text", key: "contactName", label: "Channel name" },
    { kind: "chat", key: "messages", label: "Messages" },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
    {
      kind: "select",
      key: "orientation",
      label: "Orientation",
      options: [
        { value: "landscape", label: "Landscape" },
        { value: "portrait", label: "Portrait (phone)" },
      ],
    },
    {
      kind: "number",
      key: "scale",
      label: "UI scale (landscape)",
      min: 0.5,
      max: 3,
    },
    { kind: "image", key: "leftAvatar", label: "Left avatar" },
    { kind: "image", key: "rightAvatar", label: "Right avatar" },
  ],
};
