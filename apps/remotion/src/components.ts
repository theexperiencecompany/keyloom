"use client";
import type { ComponentType } from "react";
import { componentsByIdBase } from "./componentsBase";
import { SplitScene } from "./compositions/SplitScene/SplitScene";

// Frame compositions (PhoneFrame, LaptopFrame, SplitScene) import this module
// to look up nested compositions, which creates a circular dependency. To
// avoid TDZ errors when the bundler evaluates this module mid-cycle, leaf
// compositions live in `componentsBase`; we layer SplitScene on top here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentsById: Record<string, ComponentType<any>> = {
  ...componentsByIdBase,
  SplitScene,
};
