"use client";
import type { ComponentType } from "react";
import { AreaChart } from "./compositions/AreaChart/AreaChart";
import { BarChart } from "./compositions/BarChart/BarChart";
import { BounceCards } from "./compositions/BounceCards/BounceCards";
import { BrowserWindow } from "./compositions/BrowserWindow/BrowserWindow";
import { AuroraGradient } from "./compositions/backgrounds/AuroraGradient/AuroraGradient";
import { BlueGrid } from "./compositions/backgrounds/BlueGrid/BlueGrid";
import { FuturisticArch } from "./compositions/backgrounds/FuturisticArch/FuturisticArch";
import { LiquidChrome } from "./compositions/backgrounds/LiquidChrome/LiquidChrome";
import { WhiteRadialBurst } from "./compositions/backgrounds/WhiteRadialBurst/WhiteRadialBurst";
import { CaptionTrack } from "./compositions/CaptionTrack/CaptionTrack";
import { CardReveal } from "./compositions/CardReveal/CardReveal";
import { CursorWalkthrough } from "./compositions/CursorWalkthrough/CursorWalkthrough";
import { DiscordMessages } from "./compositions/DiscordMessages/DiscordMessages";
import { GaiaScenario } from "./compositions/GaiaScenario/GaiaScenario";
import { GitHubStarButton } from "./compositions/GitHubStarButton/GitHubStarButton";
import { ImageScene } from "./compositions/ImageScene/ImageScene";
import { InstagramMessages } from "./compositions/InstagramMessages/InstagramMessages";
import { InstagramPost } from "./compositions/InstagramPost/InstagramPost";
import { LineChart } from "./compositions/LineChart/LineChart";
import { LockScreenMessage } from "./compositions/LockScreenMessage/LockScreenMessage";
import { LogoCloud } from "./compositions/LogoCloud/LogoCloud";
import { MessageBubbles } from "./compositions/MessageBubbles/MessageBubbles";
import { MessagePopup } from "./compositions/MessagePopup/MessagePopup";
import { PerspectiveMarquee } from "./compositions/PerspectiveMarquee/PerspectiveMarquee";
import { PieChart } from "./compositions/PieChart/PieChart";
import { PricingCard } from "./compositions/PricingCard/PricingCard";
import { QrCode } from "./compositions/QrCode/QrCode";
import { RadarChart } from "./compositions/RadarChart/RadarChart";
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
import { TweetCard } from "./compositions/TweetCard/TweetCard";
import { TweetPost } from "./compositions/TweetPost/TweetPost";
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
  LockScreenMessage,
  TypingSearch,
  TypingComposer,
  StatCounter,
  SpotifyPlayer,
  TweetCard,
  TweetPost,
  CursorWalkthrough,
  BrowserWindow,
  CaptionTrack,
  TikTokCaption,
  TwitterFollow,
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
  CardReveal,
  PricingCard,
  Terminal,
  GitHubStarButton,
  ImageScene,
  BounceCards,
  QrCode,
  PerspectiveMarquee,
  BarChart,
  LineChart,
  AreaChart,
  PieChart,
  RadarChart,
  RadialChart,
  BlueGrid,
  AuroraGradient,
  WhiteRadialBurst,
  LiquidChrome,
  FuturisticArch,
};
