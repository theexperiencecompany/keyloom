import type { CompositionInfo } from "../../schema";
import type { CaptionTrackProps } from "./CaptionTrack";

export const CAPTION_TRACK_DURATION = 240;
export const CAPTION_TRACK_FPS = 60;
export const CAPTION_TRACK_WIDTH = 1080;
export const CAPTION_TRACK_HEIGHT = 1920;

export const captionTrackDefaultProps: CaptionTrackProps = {
  text: "this is the future of motion graphics",
  backgroundImageUrl: "",
  backgroundColor: "#0a0a0a",
  textColor: "#ffffff",
  outlineColor: "#000000",
  wordsPerSecond: 3,
};

export const captionTrackInfo: CompositionInfo<CaptionTrackProps> = {
  id: "CaptionTrack",
  title: "Caption Track",
  description:
    "TikTok / Reels–style word-by-word captions for vertical video. Each word pops in over a background image or color.",
  durationInFrames: CAPTION_TRACK_DURATION,
  fps: CAPTION_TRACK_FPS,
  width: CAPTION_TRACK_WIDTH,
  height: CAPTION_TRACK_HEIGHT,
  defaultProps: captionTrackDefaultProps,
  fields: [
    { kind: "textarea", key: "text", label: "Caption text", rows: 3 },
    { kind: "text", key: "backgroundImageUrl", label: "Background image URL" },
    { kind: "text", key: "backgroundColor", label: "Background color" },
    { kind: "text", key: "textColor", label: "Text color" },
    { kind: "text", key: "outlineColor", label: "Outline color" },
    {
      kind: "number",
      key: "wordsPerSecond",
      label: "Words per second",
      min: 1,
      max: 8,
    },
  ],
};
