import type { CompositionInfo } from "../../schema";
import { TITLE_FIELDS } from "../title-shared";
import type { TextStaggerFromEdgesProps } from "./TextStaggerFromEdges";

export const TEXT_STAGGER_FROM_EDGES_DURATION = 100;
export const TEXT_STAGGER_FROM_EDGES_FPS = 60;
export const TEXT_STAGGER_FROM_EDGES_WIDTH = 1920;
export const TEXT_STAGGER_FROM_EDGES_HEIGHT = 1080;

export const textStaggerFromEdgesDefaultProps: TextStaggerFromEdgesProps = {
  headline: "Converging text",
  subtitle: "Edges meet center",
};

export const textStaggerFromEdgesInfo: CompositionInfo<TextStaggerFromEdgesProps> =
  {
    id: "TextStaggerFromEdges",
    title: "Edge Stagger",
    description:
      "Characters start from both edges and converge toward the center.",
    durationInFrames: TEXT_STAGGER_FROM_EDGES_DURATION,
    fps: TEXT_STAGGER_FROM_EDGES_FPS,
    width: TEXT_STAGGER_FROM_EDGES_WIDTH,
    height: TEXT_STAGGER_FROM_EDGES_HEIGHT,
    defaultProps: textStaggerFromEdgesDefaultProps,
    fields: TITLE_FIELDS,
  };
