import type { CompositionInfo } from "../../schema";
import type { LockScreenMessageProps } from "./LockScreenMessage";

export const LOCK_SCREEN_MESSAGE_DURATION = 150;
export const LOCK_SCREEN_MESSAGE_FPS = 60;
// Portrait 9:19.5 — iPhone screen aspect.
export const LOCK_SCREEN_MESSAGE_WIDTH = 1080;
export const LOCK_SCREEN_MESSAGE_HEIGHT = 2340;

export const lockScreenMessageDefaultProps: LockScreenMessageProps = {
  time: "9:41",
  date: "Tue Apr 1",
  wallpaper: "",

  n1Sender: "Armando Cajide",
  n1Title: "Gym Training",
  n1Body: "Anyone up for powerlifting this weekend?",
  n1Time: "now",
  n1Avatar: "images/logos/aryan-avatar.png",

  n2Sender: "Ashley Rico",
  n2Title: "To you & Dawn Ramirez",
  n2Body: "Want to come over for dinner tonight? We're grilling 🔥",
  n2Time: "2m ago",
  n2Avatar: "",

  n3Sender: "Meri Alvarez",
  n3Title: "Family Reunion 🎉",
  n3Body: "So excited to see everyone at the reunion next week!!",
  n3Time: "8m ago",
  n3Avatar: "",
};

export const lockScreenMessageInfo: CompositionInfo<LockScreenMessageProps> = {
  id: "LockScreenMessage",
  category: "social",
  title: "Lock Screen Message",
  description:
    "An iPhone lock screen — wallpaper, big clock, and a stack of iMessage notifications that spring up. Fill 1–3 notifications; upload a custom wallpaper or per-notification avatars.",
  durationInFrames: LOCK_SCREEN_MESSAGE_DURATION,
  fps: LOCK_SCREEN_MESSAGE_FPS,
  width: LOCK_SCREEN_MESSAGE_WIDTH,
  height: LOCK_SCREEN_MESSAGE_HEIGHT,
  defaultProps: lockScreenMessageDefaultProps,
  agentNotes:
    "Use for a 'phone buzzes' beat — messages landing on a locked iPhone over a wallpaper and clock. Great cold open or punchline. Keep each body short (one or two lines reads best). Leave n2/n3 empty for a single notification.",
  fields: [
    { kind: "text", key: "time", label: "Clock time" },
    { kind: "text", key: "date", label: "Date" },
    {
      kind: "image",
      key: "wallpaper",
      label: "Wallpaper",
      placeholder: "Defaults to wallpaper.png",
    },
    {
      kind: "section",
      key: "notif1",
      label: "Notification 1",
      defaultOpen: true,
      fields: [
        { kind: "text", key: "n1Sender", label: "Sender" },
        { kind: "text", key: "n1Title", label: "Title / group" },
        { kind: "textarea", key: "n1Body", label: "Message", rows: 2 },
        { kind: "text", key: "n1Time", label: "Time" },
        { kind: "image", key: "n1Avatar", label: "Avatar" },
      ],
    },
    {
      kind: "section",
      key: "notif2",
      label: "Notification 2",
      description: "Leave the sender and message empty to hide this one.",
      fields: [
        { kind: "text", key: "n2Sender", label: "Sender" },
        { kind: "text", key: "n2Title", label: "Title / group" },
        { kind: "textarea", key: "n2Body", label: "Message", rows: 2 },
        { kind: "text", key: "n2Time", label: "Time" },
        { kind: "image", key: "n2Avatar", label: "Avatar" },
      ],
    },
    {
      kind: "section",
      key: "notif3",
      label: "Notification 3",
      description: "Leave the sender and message empty to hide this one.",
      fields: [
        { kind: "text", key: "n3Sender", label: "Sender" },
        { kind: "text", key: "n3Title", label: "Title / group" },
        { kind: "textarea", key: "n3Body", label: "Message", rows: 2 },
        { kind: "text", key: "n3Time", label: "Time" },
        { kind: "image", key: "n3Avatar", label: "Avatar" },
      ],
    },
  ],
};
