import type { CompositionInfo } from "../../schema";
import { ASPECT_DIMENSIONS } from "./config";
import type { TikTokCaptionProps } from "./TikTokCaption";

export const TIKTOK_CAPTION_FPS = 30;
export const TIKTOK_CAPTION_WIDTH = ASPECT_DIMENSIONS["9:16"].width;
export const TIKTOK_CAPTION_HEIGHT = ASPECT_DIMENSIONS["9:16"].height;
export const TIKTOK_CAPTION_DEFAULT_DURATION = 150;

export const tikTokCaptionDefaultProps: TikTokCaptionProps = {
  words: [
    { start: 0.0, end: 0.4, text: "this" },
    { start: 0.4, end: 0.7, text: "is" },
    { start: 0.7, end: 1.1, text: "how" },
    { start: 1.1, end: 1.5, text: "captions" },
    { start: 1.5, end: 1.9, text: "should" },
    { start: 1.9, end: 2.3, text: "look" },
  ],
  captionVAlign: "center",
  captionHAlign: "center",
  fontScale: 1,
};

export const tikTokCaptionInfo: CompositionInfo<TikTokCaptionProps> = {
  id: "TikTokCaption",
  title: "TikTok Caption",
  description:
    "Vertical 9:16 caption track driven by word-level timestamps (e.g. from Whisper). Highlights the current word, ghosts the surrounding context — built for short-form voiceover content.",
  durationInFrames: TIKTOK_CAPTION_DEFAULT_DURATION,
  fps: TIKTOK_CAPTION_FPS,
  width: TIKTOK_CAPTION_WIDTH,
  height: TIKTOK_CAPTION_HEIGHT,
  defaultProps: tikTokCaptionDefaultProps,
  fields: [
    {
      kind: "audio",
      key: "audioUrl",
      wordsKey: "words",
      label: "Audio file",
      placeholder: "Upload an MP3/WAV/M4A to auto-caption",
    },
    {
      kind: "select",
      key: "captionVAlign",
      label: "Vertical position",
      options: [
        { value: "top", label: "Top" },
        { value: "center", label: "Center" },
        { value: "bottom", label: "Bottom" },
      ],
    },
    {
      kind: "select",
      key: "captionHAlign",
      label: "Horizontal position",
      options: [
        { value: "left", label: "Left" },
        { value: "center", label: "Center" },
        { value: "right", label: "Right" },
      ],
    },
    {
      kind: "number",
      key: "fontScale",
      label: "Font scale",
      min: 0.5,
      max: 2,
    },
  ],
  calculateMetadata: ({ props }) => {
    const last = props.words?.[props.words.length - 1];
    const duration = last
      ? Math.ceil((last.end + 0.5) * TIKTOK_CAPTION_FPS)
      : TIKTOK_CAPTION_DEFAULT_DURATION;
    return { durationInFrames: Math.max(60, duration) };
  },
};
