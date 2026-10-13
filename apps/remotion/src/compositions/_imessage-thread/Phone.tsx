import type React from "react";
import { SF_TEXT } from "./parts";
import { StatusBar } from "./StatusBar";

// Inline-style port of the gaia-ui IPhoneMockup: 390 × 815 chassis, 10px bezel,
// 56/46 radii, Dynamic Island, light status bar.
export const SCREEN_W = 370;
export const SCREEN_H = 795;

const BUTTON = "linear-gradient(90deg, #1a1d22 0%, #0a0c10 100%)";

export function Phone({
  time,
  children,
}: {
  time: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        position: "relative",
        width: 390,
        height: 815,
        padding: 10,
        borderRadius: 56,
        background: "#000",
        boxShadow:
          "0 50px 100px -20px rgba(0,0,0,0.28), 0 30px 60px -30px rgba(0,0,0,0.32), inset 0 0 0 1px rgba(255,255,255,0.04)",
      }}
    >
      {[
        { left: -2, top: 105, height: 32 },
        { left: -2, top: 175, height: 60 },
        { left: -2, top: 250, height: 60 },
        { right: -2, top: 200, height: 96 },
      ].map((b, i) => (
        <span
          key={i}
          style={{
            position: "absolute",
            width: 4,
            borderRadius: 2,
            background: BUTTON,
            ...b,
          }}
        />
      ))}
      <div
        style={{
          position: "relative",
          width: SCREEN_W,
          height: SCREEN_H,
          borderRadius: 46,
          overflow: "hidden",
          background: "#fff",
          fontFamily: SF_TEXT,
        }}
      >
        {children}
        <StatusBar time={time} island />
        <div
          style={{
            position: "absolute",
            bottom: 8,
            left: "50%",
            transform: "translateX(-50%)",
            width: 134,
            height: 5,
            borderRadius: 3,
            background: "rgba(0,0,0,0.85)",
            zIndex: 40,
          }}
        />
      </div>
    </div>
  );
}
