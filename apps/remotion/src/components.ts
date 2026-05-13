"use client";
import type { ComponentType } from "react";
import { componentsByIdBase } from "./componentsBase";
import { LaptopFrame } from "./compositions/LaptopFrame/LaptopFrame";
import { PhoneFrame } from "./compositions/PhoneFrame/PhoneFrame";
import { Showcase } from "./compositions/Showcase/Showcase";
import { SplitScene } from "./compositions/SplitScene/SplitScene";

// Wrapper compositions (PhoneFrame, LaptopFrame, SplitScene, Showcase) import
// this module to look up nested compositions, which creates a circular
// dependency. To avoid TDZ errors when the bundler evaluates this module
// mid-cycle, leaf compositions live in `componentsBase`; we layer the
// wrappers on top here.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentsById: Record<string, ComponentType<any>> = {
  ...componentsByIdBase,
  PhoneFrame,
  LaptopFrame,
  SplitScene,
  Showcase,
};
