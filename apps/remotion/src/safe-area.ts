"use client";
import { createContext, useContext } from "react";

/**
 * Safe-area insets, expressed in the inner composition's design pixels.
 *
 * Wrapper compositions (PhoneFrame, LaptopFrame, etc.) compute these from
 * their own device chrome and provide them via SafeAreaContext, scaled into
 * the inner composition's coordinate space. Inner compositions read them
 * with useSafeArea() and bake in matching-color padding so the chrome
 * (header, composer, app backdrop) extends edge-to-edge to the device
 * screen while the actual UI sits within the safe area.
 *
 * Default {0, 0}: when a composition is rendered standalone, useSafeArea()
 * returns no inset and the component renders unchanged.
 */
export type SafeArea = { top: number; bottom: number };

const DEFAULT_SAFE_AREA: SafeArea = { top: 0, bottom: 0 };

export const SafeAreaContext = createContext<SafeArea>(DEFAULT_SAFE_AREA);

export function useSafeArea(): SafeArea {
  return useContext(SafeAreaContext);
}
