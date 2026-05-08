import type { CompositionInfo } from "../../schema";
import type { CaptionTrackProps } from "./CaptionTrack";

export const CAPTION_TRACK_DURATION = 240;
export const CAPTION_TRACK_FPS = 60;
export const CAPTION_TRACK_WIDTH = 1920;
export const CAPTION_TRACK_HEIGHT = 1080;

export const captionTrackDefaultProps: CaptionTrackProps = {
  text: "this is the future of motion graphics",
  backgroundColor: "#ffffff",
  textColor: "#0f1014",
  wordsPerSecond: 3,
};

export const captionTrackInfo: CompositionInfo<CaptionTrackProps> = {
  id: "CaptionTrack",
  title: "Caption Track",
  description:
    "Word-by-word caption track. Each word springs into place at the configured cadence — set the words-per-second to match your VO.",
  durationInFrames: CAPTION_TRACK_DURATION,
  fps: CAPTION_TRACK_FPS,
  width: CAPTION_TRACK_WIDTH,
  height: CAPTION_TRACK_HEIGHT,
  defaultProps: captionTrackDefaultProps,
  fields: [
    { kind: "textarea", key: "text", label: "Caption text", rows: 3 },
    { kind: "color", key: "backgroundColor", label: "Background color" },
    { kind: "color", key: "textColor", label: "Text color" },
    {
      kind: "number",
      key: "wordsPerSecond",
      label: "Words per second",
      min: 1,
      max: 8,
    },
  ],
};
