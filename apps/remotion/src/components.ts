"use client";
import type { ComponentType } from "react";
import { MessagePopup } from "./compositions/MessagePopup/MessagePopup";
import { MessageBubbles } from "./compositions/MessageBubbles/MessageBubbles";
import { TitleReveal } from "./compositions/TitleReveal/TitleReveal";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const componentsById: Record<string, ComponentType<any>> = {
  MessagePopup,
  MessageBubbles,
  TitleReveal,
};
