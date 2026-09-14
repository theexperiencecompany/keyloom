import type { PrimitiveField } from "../schema";

export type EffectTrigger = "enter" | "exit" | "loop" | "range";

export type EffectInfo<P extends Record<string, unknown>> = {
  id: string;
  title: string;
  description: string;
  trigger: EffectTrigger;
  defaultProps: P;
  fields: PrimitiveField[];
};

export type AnyEffectInfo = EffectInfo<any>;

export type ClipEffect = {
  id: string;
  effectId: string;
  props: Record<string, unknown>;
};
