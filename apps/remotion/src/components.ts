"use client";
import type { ComponentType } from "react";
import { MessagePopup } from "./compositions/MessagePopup/MessagePopup";
import { MessageBubbles } from "./compositions/MessageBubbles/MessageBubbles";
import { TitleSlideUp } from "./compositions/TitleSlideUp/TitleSlideUp";
import { TitleType } from "./compositions/TitleType/TitleType";
import { TitlePopup } from "./compositions/TitlePopup/TitlePopup";
import { TitleFade } from "./compositions/TitleFade/TitleFade";
import { TypingSearch } from "./compositions/TypingSearch/TypingSearch";
import { StatCounter } from "./compositions/StatCounter/StatCounter";
import { TweetCard } from "./compositions/TweetCard/TweetCard";
import { CursorWalkthrough } from "./compositions/CursorWalkthrough/CursorWalkthrough";
import { BrowserWindow } from "./compositions/BrowserWindow/BrowserWindow";
import { CaptionTrack } from "./compositions/CaptionTrack/CaptionTrack";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentsById: Record<string, ComponentType<any>> = {
  MessagePopup,
  MessageBubbles,
  TitleSlideUp,
  TitleType,
  TitlePopup,
  TitleFade,
  TypingSearch,
  StatCounter,
  TweetCard,
  CursorWalkthrough,
  BrowserWindow,
  CaptionTrack,
};
