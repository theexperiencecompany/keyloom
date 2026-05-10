import type { CompositionInfo } from "../../schema";
import type { SlackMessagesProps } from "./SlackMessages";

export const SLACK_MESSAGES_DURATION = 660;
export const SLACK_MESSAGES_FPS = 60;
export const SLACK_MESSAGES_WIDTH = 1280;
export const SLACK_MESSAGES_HEIGHT = 720;

export const slackMessagesDefaultProps: SlackMessagesProps = {
  contactName: "design",
  messages: [
    {
      text: "ship it tomorrow?",
      side: "left",
      typingFrames: 50,
      delay: 30,
    },
    { text: "lgtm 🚀", side: "right", typingFrames: 45, delay: 150 },
    {
      text: "QA signed off this morning",
      side: "left",
      typingFrames: 60,
      delay: 290,
    },
    {
      text: "merging now",
      side: "right",
      typingFrames: 48,
      delay: 430,
    },
    {
      text: "🎉🎉🎉",
      side: "left",
      typingFrames: 45,
      delay: 560,
    },
  ],
  theme: "light",
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
  ],
};
