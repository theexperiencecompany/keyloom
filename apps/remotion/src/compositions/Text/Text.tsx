"use client";

import type { ComponentType } from "react";
import type { ClipStyle } from "../../clip-style";
import { TextBlurOutUp } from "../TextBlurOutUp/TextBlurOutUp";
import { TextBottomUpLetters } from "../TextBottomUpLetters/TextBottomUpLetters";
import { TextDepthParallaxWords } from "../TextDepthParallaxWords/TextDepthParallaxWords";
import { TextFadeThrough } from "../TextFadeThrough/TextFadeThrough";
import { TextFocusBlurResolve } from "../TextFocusBlurResolve/TextFocusBlurResolve";
import { TextKineticCenterBuild } from "../TextKineticCenterBuild/TextKineticCenterBuild";
import { TextLineByLineSlide } from "../TextLineByLineSlide/TextLineByLineSlide";
import { TextMaskRevealUp } from "../TextMaskRevealUp/TextMaskRevealUp";
import { TextMicroScaleFade } from "../TextMicroScaleFade/TextMicroScaleFade";
import { TextPerCharacterRise } from "../TextPerCharacterRise/TextPerCharacterRise";
import { TextPerWordCrossfade } from "../TextPerWordCrossfade/TextPerWordCrossfade";
import { TextScaleDownFade } from "../TextScaleDownFade/TextScaleDownFade";
import { TextSharedAxisX } from "../TextSharedAxisX/TextSharedAxisX";
import { TextSharedAxisY } from "../TextSharedAxisY/TextSharedAxisY";
import { TextSharedAxisZ } from "../TextSharedAxisZ/TextSharedAxisZ";
import { TextShimmerSweep } from "../TextShimmerSweep/TextShimmerSweep";
import { TextShortSlideDown } from "../TextShortSlideDown/TextShortSlideDown";
import { TextShortSlideRight } from "../TextShortSlideRight/TextShortSlideRight";
import { TextSoftBlurIn } from "../TextSoftBlurIn/TextSoftBlurIn";
import { TextSpringScaleIn } from "../TextSpringScaleIn/TextSpringScaleIn";
import { TextStaggerFromCenter } from "../TextStaggerFromCenter/TextStaggerFromCenter";
import { TextStaggerFromEdges } from "../TextStaggerFromEdges/TextStaggerFromEdges";
import { TextTopDownLetters } from "../TextTopDownLetters/TextTopDownLetters";
import { TextTypewriter } from "../TextTypewriter/TextTypewriter";
import { TitleFade } from "../TitleFade/TitleFade";
import { TitlePopup } from "../TitlePopup/TitlePopup";
import { TitleSlideUp } from "../TitleSlideUp/TitleSlideUp";
import { TitleType } from "../TitleType/TitleType";
import type { TitleProps } from "../title-shared";

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
const ANIMATIONS: Record<string, ComponentType<TitleProps>> = {
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
  const Variant = ANIMATIONS[animation] ?? TitleFade;
  return (
    <Variant headline={headline} subtitle={subtitle} clipStyle={clipStyle} />
  );
};
