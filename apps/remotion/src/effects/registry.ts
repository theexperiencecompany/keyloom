import type { ComponentType } from "react";
import { FadeOut, fadeOutInfo } from "./FadeOut";
import { KenBurns, kenBurnsInfo } from "./KenBurns";
import { Pop, popInfo } from "./Pop";
import { Shake, shakeInfo } from "./Shake";
import { SlideOut, slideOutInfo } from "./SlideOut";
import type { AnyEffectInfo } from "./schema";
import { ZoomOut, zoomOutInfo } from "./ZoomOut";

export const effects: AnyEffectInfo[] = [
  popInfo,
  slideOutInfo,
  zoomOutInfo,
  fadeOutInfo,
  shakeInfo,
  kenBurnsInfo,
];

export const effectsById: Record<string, AnyEffectInfo | undefined> =
  Object.fromEntries(effects.map((e) => [e.id, e]));

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const effectComponentsById: Record<string, ComponentType<any>> = {
  Pop,
  Shake,
  KenBurns,
  SlideOut,
  ZoomOut,
  FadeOut,
};
