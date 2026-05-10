import type { CompositionInfo } from "../../schema";
import type { CaptionTrackProps } from "./CaptionTrack";

export const CAPTION_TRACK_DURATION = 160;
export const CAPTION_TRACK_FPS = 60;
export const CAPTION_TRACK_WIDTH = 1920;
export const CAPTION_TRACK_HEIGHT = 1080;

export const captionTrackDefaultProps: CaptionTrackProps = {
  text: "this is the future of motion graphics",
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
    {
      kind: "number",
      key: "wordsPerSecond",
      label: "Words per second",
      min: 1,
      max: 8,
    },
  ],
};
