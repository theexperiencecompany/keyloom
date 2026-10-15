"use client";

import type { ComponentType } from "react";
import type { ClipStyle } from "../../clip-style";
import { TextBottomUpLetters } from "../TextBottomUpLetters/TextBottomUpLetters";
import { TextKineticCenterBuild } from "../TextKineticCenterBuild/TextKineticCenterBuild";
import { TextShimmerSweep } from "../TextShimmerSweep/TextShimmerSweep";
import { TextSoftBlurIn } from "../TextSoftBlurIn/TextSoftBlurIn";
import { TitleType } from "../TitleType/TitleType";
import type { TitleProps } from "../title-shared";
import { TextBlurOutUp } from "./variants/TextBlurOutUp";
import { TextDepthParallaxWords } from "./variants/TextDepthParallaxWords";
import { TextFadeThrough } from "./variants/TextFadeThrough";
import { TextFocusBlurResolve } from "./variants/TextFocusBlurResolve";
import { TextLineByLineSlide } from "./variants/TextLineByLineSlide";
import { TextMaskRevealUp } from "./variants/TextMaskRevealUp";
import { TextMicroScaleFade } from "./variants/TextMicroScaleFade";
import { TextPerCharacterRise } from "./variants/TextPerCharacterRise";
import { TextPerWordCrossfade } from "./variants/TextPerWordCrossfade";
import { TextScaleDownFade } from "./variants/TextScaleDownFade";
import { TextSharedAxisX } from "./variants/TextSharedAxisX";
import { TextSharedAxisY } from "./variants/TextSharedAxisY";
import { TextSharedAxisZ } from "./variants/TextSharedAxisZ";
import { TextShortSlideDown } from "./variants/TextShortSlideDown";
import { TextShortSlideRight } from "./variants/TextShortSlideRight";
import { TextSpringScaleIn } from "./variants/TextSpringScaleIn";
import { TextStaggerFromCenter } from "./variants/TextStaggerFromCenter";
import { TextStaggerFromEdges } from "./variants/TextStaggerFromEdges";
import { TextTopDownLetters } from "./variants/TextTopDownLetters";
import { TextTypewriter } from "./variants/TextTypewriter";
import { TitleFade } from "./variants/TitleFade";
import { TitlePopup } from "./variants/TitlePopup";
import { TitleSlideUp } from "./variants/TitleSlideUp";

export type TextProps = {
  headline: string;
  subtitle: string;
  /** Which animation to apply — one of the `value`s in `TEXT_ANIMATIONS`. */
  animation: string;
  clipStyle?: ClipStyle;
};

// Every variant is just an existing headline+subtitle composition. `Text`
// delegates to the one the user picked — this is a re-wiring of the 28 separate
// text compositions into one plug-and-play picker, not a reimplementation.
export const TEXT_VARIANTS: Record<string, ComponentType<TitleProps>> = {
  fade: TitleFade,
  "slide-up": TitleSlideUp,
  pop: TitlePopup,
  spring: TextSpringScaleIn,
  typewriter: TitleType,
  "typewriter-mono": TextTypewriter,
  "soft-blur": TextSoftBlurIn,
  "blur-out": TextBlurOutUp,
  "focus-pull": TextFocusBlurResolve,
  shimmer: TextShimmerSweep,
  settle: TextScaleDownFade,
  "scale-fade": TextMicroScaleFade,
  "fade-through": TextFadeThrough,
  "line-reveal": TextMaskRevealUp,
  "line-slide": TextLineByLineSlide,
  "char-rise": TextPerCharacterRise,
  "word-crossfade": TextPerWordCrossfade,
  "stagger-center": TextStaggerFromCenter,
  "stagger-edges": TextStaggerFromEdges,
  "letters-rise": TextBottomUpLetters,
  "letters-drop": TextTopDownLetters,
  "depth-parallax": TextDepthParallaxWords,
  "kinetic-center": TextKineticCenterBuild,
  "slide-down": TextShortSlideDown,
  "slide-right": TextShortSlideRight,
  "shared-axis-x": TextSharedAxisX,
  "shared-axis-y": TextSharedAxisY,
  "shared-axis-z": TextSharedAxisZ,
};

export const Text: React.FC<TextProps> = ({
  headline,
  subtitle,
  animation,
  clipStyle,
}) => {
  const Variant = TEXT_VARIANTS[animation] ?? TextSoftBlurIn;
  return (
    <Variant headline={headline} subtitle={subtitle} clipStyle={clipStyle} />
  );
};
