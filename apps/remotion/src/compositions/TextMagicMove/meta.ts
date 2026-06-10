import type { CompositionInfo } from "../../schema";
import {
  computeMagicMoveDuration,
  type TextMagicMoveProps,
} from "./TextMagicMove";

export const TEXT_MAGIC_MOVE_FPS = 60;
export const TEXT_MAGIC_MOVE_WIDTH = 1920;
export const TEXT_MAGIC_MOVE_HEIGHT = 1080;

export const textMagicMoveDefaultProps: TextMagicMoveProps = {
  phrases: "Motion makes it real\nMotion makes it flow\nMotion makes it yours",
  fontSize: 120,
};

export const textMagicMoveInfo: CompositionInfo<TextMagicMoveProps> = {
  id: "TextMagicMove",
  category: "text",
  agentNotes:
    "Magic-move headline: cycles through multiple short phrases (one per line) where SHARED words physically glide to their new position while unique words blur in/out. Best when consecutive phrases share words ('Ship it fast' → 'Ship it everywhere'). Distinct from TextMorph (gooey single-word melt). Colors and font come from the Style section.",
  title: "Magic Move",
  description:
    "Cycles through short phrases; words common to consecutive phrases travel to their new position while the rest blur in and out — a Keynote-style text morph.",
  durationInFrames: computeMagicMoveDuration(textMagicMoveDefaultProps.phrases),
  fps: TEXT_MAGIC_MOVE_FPS,
  width: TEXT_MAGIC_MOVE_WIDTH,
  height: TEXT_MAGIC_MOVE_HEIGHT,
  defaultProps: textMagicMoveDefaultProps,
  fields: [
    {
      kind: "textarea",
      key: "phrases",
      label: "Phrases (one per line)",
      rows: 4,
    },
    {
      kind: "number",
      key: "fontSize",
      label: "Font size (px)",
      min: 48,
      max: 240,
    },
  ],
  calculateMetadata: ({ props }) => ({
    durationInFrames: computeMagicMoveDuration(props.phrases),
  }),
};
