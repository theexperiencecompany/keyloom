"use client";

import type { ComponentType } from "react";
import type { ClipStyle } from "../../clip-style";
import { TextBottomUpLetters } from "../TextBottomUpLetters/TextBottomUpLetters";
import { TextKineticCenterBuild } from "../TextKineticCenterBuild/TextKineticCenterBuild";
import { TextShimmerSweep } from "../TextShimmerSweep/TextShimmerSweep";
import { TextSoftBlurIn } from "../TextSoftBlurIn/TextSoftBlurIn";
import { TitleType } from "../TitleType/TitleType";
import type { TitleProps } from "../title-shared";

export type TextProps = {
  headline: string;
  subtitle: string;
  /** Which animation to apply — one of the `value`s in `TEXT_ANIMATIONS`. */
  animation: string;
  clipStyle?: ClipStyle;
};

// Unknown values (including variants removed from older saved projects) fall
// back to soft blur.
const ANIMATIONS: Record<string, ComponentType<TitleProps>> = {
  "soft-blur": TextSoftBlurIn,
  typewriter: TitleType,
  "letters-rise": TextBottomUpLetters,
  "kinetic-center": TextKineticCenterBuild,
  shimmer: TextShimmerSweep,
};

export const Text: React.FC<TextProps> = ({
  headline,
  subtitle,
  animation,
  clipStyle,
}) => {
  const Variant = ANIMATIONS[animation] ?? TextSoftBlurIn;
  return (
    <Variant headline={headline} subtitle={subtitle} clipStyle={clipStyle} />
  );
};
