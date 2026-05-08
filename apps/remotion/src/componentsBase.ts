"use client";
import type { ComponentType } from "react";
import { MessagePopup } from "./compositions/MessagePopup/MessagePopup";
import { MessageBubbles } from "./compositions/MessageBubbles/MessageBubbles";
import { TitleSlideUp } from "./compositions/TitleSlideUp/TitleSlideUp";
import { TitleType } from "./compositions/TitleType/TitleType";
import { TitlePopup } from "./compositions/TitlePopup/TitlePopup";
import { TitleFade } from "./compositions/TitleFade/TitleFade";
import { TypingSearch } from "./compositions/TypingSearch/TypingSearch";
import { TypingComposer } from "./compositions/TypingComposer/TypingComposer";
import { StatCounter } from "./compositions/StatCounter/StatCounter";
import { TweetCard } from "./compositions/TweetCard/TweetCard";
import { CursorWalkthrough } from "./compositions/CursorWalkthrough/CursorWalkthrough";
import { BrowserWindow } from "./compositions/BrowserWindow/BrowserWindow";
import { CaptionTrack } from "./compositions/CaptionTrack/CaptionTrack";
import { TwitterFollow } from "./compositions/TwitterFollow/TwitterFollow";
import { WhatsAppMessages } from "./compositions/WhatsAppMessages/WhatsAppMessages";
import { SlackMessages } from "./compositions/SlackMessages/SlackMessages";
import { DiscordMessages } from "./compositions/DiscordMessages/DiscordMessages";
import { TextMicroScaleFade } from "./compositions/TextMicroScaleFade/TextMicroScaleFade";
import { TextShimmerSweep } from "./compositions/TextShimmerSweep/TextShimmerSweep";
import { TextFadeThrough } from "./compositions/TextFadeThrough/TextFadeThrough";
import { TextSharedAxisZ } from "./compositions/TextSharedAxisZ/TextSharedAxisZ";
import { TextScaleDownFade } from "./compositions/TextScaleDownFade/TextScaleDownFade";
import { TextFocusBlurResolve } from "./compositions/TextFocusBlurResolve/TextFocusBlurResolve";
import { TextSharedAxisX } from "./compositions/TextSharedAxisX/TextSharedAxisX";
import { TextMaskRevealUp } from "./compositions/TextMaskRevealUp/TextMaskRevealUp";
import { TextLineByLineSlide } from "./compositions/TextLineByLineSlide/TextLineByLineSlide";
import { TextSoftBlurIn } from "./compositions/TextSoftBlurIn/TextSoftBlurIn";
import { TextPerCharacterRise } from "./compositions/TextPerCharacterRise/TextPerCharacterRise";
import { TextBottomUpLetters } from "./compositions/TextBottomUpLetters/TextBottomUpLetters";
import { TextTopDownLetters } from "./compositions/TextTopDownLetters/TextTopDownLetters";
import { TextStaggerFromCenter } from "./compositions/TextStaggerFromCenter/TextStaggerFromCenter";
import { TextStaggerFromEdges } from "./compositions/TextStaggerFromEdges/TextStaggerFromEdges";
import { TextTypewriter } from "./compositions/TextTypewriter/TextTypewriter";
import { TextPerWordCrossfade } from "./compositions/TextPerWordCrossfade/TextPerWordCrossfade";
import { TextSpringScaleIn } from "./compositions/TextSpringScaleIn/TextSpringScaleIn";
import { TextBlurOutUp } from "./compositions/TextBlurOutUp/TextBlurOutUp";
import { TextSharedAxisY } from "./compositions/TextSharedAxisY/TextSharedAxisY";
import { TextDepthParallaxWords } from "./compositions/TextDepthParallaxWords/TextDepthParallaxWords";
import { TextShortSlideRight } from "./compositions/TextShortSlideRight/TextShortSlideRight";
import { TextKineticCenterBuild } from "./compositions/TextKineticCenterBuild/TextKineticCenterBuild";
import { TextShortSlideDown } from "./compositions/TextShortSlideDown/TextShortSlideDown";

// Wrapper compositions (PhoneFrame, LaptopFrame, SplitScene) import this
// module to look up nested compositions. Keep them OUT of this file to avoid
// circular-import TDZ errors. Add them in components.ts instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentsByIdBase: Record<string, ComponentType<any>> = {
  MessagePopup,
  MessageBubbles,
  TitleSlideUp,
  TitleType,
  TitlePopup,
  TitleFade,
  TypingSearch,
  TypingComposer,
  StatCounter,
  TweetCard,
  CursorWalkthrough,
  BrowserWindow,
  CaptionTrack,
  TwitterFollow,
  WhatsAppMessages,
  SlackMessages,
  DiscordMessages,
  TextMicroScaleFade,
  TextShimmerSweep,
  TextFadeThrough,
  TextSharedAxisZ,
  TextScaleDownFade,
  TextFocusBlurResolve,
  TextSharedAxisX,
  TextMaskRevealUp,
  TextLineByLineSlide,
  TextSoftBlurIn,
  TextPerCharacterRise,
  TextBottomUpLetters,
  TextTopDownLetters,
  TextStaggerFromCenter,
  TextStaggerFromEdges,
  TextTypewriter,
  TextPerWordCrossfade,
  TextSpringScaleIn,
  TextBlurOutUp,
  TextSharedAxisY,
  TextDepthParallaxWords,
  TextShortSlideRight,
  TextKineticCenterBuild,
  TextShortSlideDown,
};
