"use client";

import type { ReactNode } from "react";
import { ClipDurationContext } from "./clip-context";
import { effectComponentsById, effectsById } from "./registry";
import type { ClipEffect, EffectTrigger } from "./schema";

type Props = {
  effects?: ClipEffect[];
  clipDurationInFrames: number;
  children: ReactNode;
};

const TRIGGER_ORDER: EffectTrigger[] = ["enter", "exit", "range", "loop"];

export function EffectsWrap({
  effects,
  clipDurationInFrames,
  children,
}: Props) {
  const list = effects ?? [];

  let node: ReactNode = children;

  for (const trigger of TRIGGER_ORDER) {
    const inGroup = list.filter(
      (e) => effectsById[e.effectId]?.trigger === trigger,
    );
    for (const e of inGroup) {
      const Component = effectComponentsById[e.effectId];
      if (!Component) continue;
      node = (
        <Component key={e.id} {...e.props}>
          {node}
        </Component>
      );
    }
  }

  return (
    <ClipDurationContext.Provider value={clipDurationInFrames}>
      {node}
    </ClipDurationContext.Provider>
  );
}
