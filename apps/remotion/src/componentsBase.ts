"use client";
import type { ComponentType } from "react";
import { BarChart } from "./compositions/BarChart/BarChart";
import { BounceCards } from "./compositions/BounceCards/BounceCards";
import { AuroraGradient } from "./compositions/backgrounds/AuroraGradient/AuroraGradient";
import { BlueGrid } from "./compositions/backgrounds/BlueGrid/BlueGrid";
import { FuturisticArch } from "./compositions/backgrounds/FuturisticArch/FuturisticArch";
import { LiquidChrome } from "./compositions/backgrounds/LiquidChrome/LiquidChrome";
import { WhiteRadialBurst } from "./compositions/backgrounds/WhiteRadialBurst/WhiteRadialBurst";
import { CursorWalkthrough } from "./compositions/CursorWalkthrough/CursorWalkthrough";
import { DiscordMessages } from "./compositions/DiscordMessages/DiscordMessages";
import { GitHubStarButton } from "./compositions/GitHubStarButton/GitHubStarButton";
import { ImageScene } from "./compositions/ImageScene/ImageScene";
import { InstagramMessages } from "./compositions/InstagramMessages/InstagramMessages";
import { InstagramPost } from "./compositions/InstagramPost/InstagramPost";
import { LineChart } from "./compositions/LineChart/LineChart";
import { LockScreenMessage } from "./compositions/LockScreenMessage/LockScreenMessage";
import { LogoCloud } from "./compositions/LogoCloud/LogoCloud";
import { MessageBubbles } from "./compositions/MessageBubbles/MessageBubbles";
import { PricingCard } from "./compositions/PricingCard/PricingCard";
import { QrCode } from "./compositions/QrCode/QrCode";
import { RadialChart } from "./compositions/RadialChart/RadialChart";
import { SlackMessages } from "./compositions/SlackMessages/SlackMessages";
import { SpotifyPlayer } from "./compositions/SpotifyPlayer/SpotifyPlayer";
import { StatCounter } from "./compositions/StatCounter/StatCounter";
import { TelegramMessages } from "./compositions/TelegramMessages/TelegramMessages";
import { Terminal } from "./compositions/Terminal/Terminal";
import { TestimonialCard } from "./compositions/TestimonialCard/TestimonialCard";
import { Text } from "./compositions/Text/Text";
import { TextMagicMove } from "./compositions/TextMagicMove/TextMagicMove";
import { TextMorph } from "./compositions/TextMorph/TextMorph";
import { TikTokCaption } from "./compositions/TikTokCaption/TikTokCaption";
import { TweetPost } from "./compositions/TweetPost/TweetPost";
import { TypingSearch } from "./compositions/TypingSearch/TypingSearch";
import { WhatsAppMessages } from "./compositions/WhatsAppMessages/WhatsAppMessages";

// Wrapper compositions (PhoneFrame, LaptopFrame, SplitScene) import this
// module to look up nested compositions. Keep them OUT of this file to avoid
// circular-import TDZ errors. Add them in components.ts instead.
export const componentsByIdBase: Record<string, ComponentType<any>> = {
  MessageBubbles,
  LockScreenMessage,
  TypingSearch,
  StatCounter,
  SpotifyPlayer,
  TweetPost,
  CursorWalkthrough,
  TikTokCaption,
  WhatsAppMessages,
  InstagramMessages,
  InstagramPost,
  SlackMessages,
  DiscordMessages,
  TelegramMessages,
  Text,
  TextMagicMove,
  TextMorph,
  TestimonialCard,
  LogoCloud,
  PricingCard,
  Terminal,
  GitHubStarButton,
  ImageScene,
  BounceCards,
  QrCode,
  BarChart,
  LineChart,
  RadialChart,
  BlueGrid,
  AuroraGradient,
  WhiteRadialBurst,
  LiquidChrome,
  FuturisticArch,
};
