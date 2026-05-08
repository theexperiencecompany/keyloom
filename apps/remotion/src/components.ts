"use client";
import type { ComponentType } from "react";
import { componentsByIdBase } from "./componentsBase";
import { SplitScene } from "./compositions/SplitScene/SplitScene";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentsById: Record<string, ComponentType<any>> = {
  ...componentsByIdBase,
  SplitScene,
};
