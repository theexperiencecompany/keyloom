"use client";
import type { ComponentType } from "react";
import { BrowserWindow } from "./compositions/BrowserWindow/BrowserWindow";
import { CaptionTrack } from "./compositions/CaptionTrack/CaptionTrack";
import { CursorWalkthrough } from "./compositions/CursorWalkthrough/CursorWalkthrough";
import { DiscordMessages } from "./compositions/DiscordMessages/DiscordMessages";
import { GaiaScenario } from "./compositions/GaiaScenario/GaiaScenario";
import { MessageBubbles } from "./compositions/MessageBubbles/MessageBubbles";
import { MessagePopup } from "./compositions/MessagePopup/MessagePopup";
import { SlackMessages } from "./compositions/SlackMessages/SlackMessages";
import { StatCounter } from "./compositions/StatCounter/StatCounter";
import { TextBlurOutUp } from "./compositions/TextBlurOutUp/TextBlurOutUp";
import { TextBottomUpLetters } from "./compositions/TextBottomUpLetters/TextBottomUpLetters";
import { TextDepthParallaxWords } from "./compositions/TextDepthParallaxWords/TextDepthParallaxWords";
import { TextFadeThrough } from "./compositions/TextFadeThrough/TextFadeThrough";
import { TextFocusBlurResolve } from "./compositions/TextFocusBlurResolve/TextFocusBlurResolve";
import { TextKineticCenterBuild } from "./compositions/TextKineticCenterBuild/TextKineticCenterBuild";
import { TextLineByLineSlide } from "./compositions/TextLineByLineSlide/TextLineByLineSlide";
import { TextMaskRevealUp } from "./compositions/TextMaskRevealUp/TextMaskRevealUp";
import { TextMicroScaleFade } from "./compositions/TextMicroScaleFade/TextMicroScaleFade";
import { TextPerCharacterRise } from "./compositions/TextPerCharacterRise/TextPerCharacterRise";
import { TextPerWordCrossfade } from "./compositions/TextPerWordCrossfade/TextPerWordCrossfade";
import { TextScaleDownFade } from "./compositions/TextScaleDownFade/TextScaleDownFade";
import { TextSharedAxisX } from "./compositions/TextSharedAxisX/TextSharedAxisX";
import { TextSharedAxisY } from "./compositions/TextSharedAxisY/TextSharedAxisY";
import { TextSharedAxisZ } from "./compositions/TextSharedAxisZ/TextSharedAxisZ";
import { TextShimmerSweep } from "./compositions/TextShimmerSweep/TextShimmerSweep";
import { TextShortSlideDown } from "./compositions/TextShortSlideDown/TextShortSlideDown";
import { TextShortSlideRight } from "./compositions/TextShortSlideRight/TextShortSlideRight";
import { TextSoftBlurIn } from "./compositions/TextSoftBlurIn/TextSoftBlurIn";
import { TextSpringScaleIn } from "./compositions/TextSpringScaleIn/TextSpringScaleIn";
import { TextStaggerFromCenter } from "./compositions/TextStaggerFromCenter/TextStaggerFromCenter";
import { TextStaggerFromEdges } from "./compositions/TextStaggerFromEdges/TextStaggerFromEdges";
import { TextTopDownLetters } from "./compositions/TextTopDownLetters/TextTopDownLetters";
import { TextTypewriter } from "./compositions/TextTypewriter/TextTypewriter";
import { TitleFade } from "./compositions/TitleFade/TitleFade";
import { TitlePopup } from "./compositions/TitlePopup/TitlePopup";
import { TitleSlideUp } from "./compositions/TitleSlideUp/TitleSlideUp";
import { TitleType } from "./compositions/TitleType/TitleType";
import { TweetCard } from "./compositions/TweetCard/TweetCard";
import { TwitterFollow } from "./compositions/TwitterFollow/TwitterFollow";
import { TypingComposer } from "./compositions/TypingComposer/TypingComposer";
import { TypingSearch } from "./compositions/TypingSearch/TypingSearch";
import { WhatsAppMessages } from "./compositions/WhatsAppMessages/WhatsAppMessages";

// Wrapper compositions (PhoneFrame, LaptopFrame, SplitScene) import this
// module to look up nested compositions. Keep them OUT of this file to avoid
// circular-import TDZ errors. Add them in components.ts instead.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentsByIdBase: Record<string, ComponentType<any>> = {
  GaiaScenario,
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
