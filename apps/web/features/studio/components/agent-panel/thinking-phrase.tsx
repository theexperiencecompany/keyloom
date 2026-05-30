"use client";

import { useEffect, useState } from "react";

/**
 * Rotating phrase shown next to the WaveSpinner while the agent is
 * working. Two pools — picked based on whether the agent has started
 * emitting any parts yet. Cycles every ~3s and never picks the same
 * phrase twice in a row. The opacity pulse makes it clear the agent
 * is alive.
 */

const PLANNING_PHRASES = [
  "Cooking up something good…",
  "Wiring synapses…",
  "Doing the math on duration…",
  "Hyping myself up…",
  "Pretending to be creative…",
  "Reading the brief out loud…",
  "Lighting candles for inspiration…",
  "Choosing a vibe…",
  "Brewing pixels…",
  "Channeling my inner designer…",
];

const WORKING_PHRASES = [
  "Auditioning scenes…",
  "Mixing colors that don't clash…",
  "Refusing to pick TitlePopup again…",
  "Negotiating with composition #47…",
  "Picking fonts that don't suck…",
  "Trying not to use Toast…",
  "Composing your masterpiece…",
  "Pacing the beats…",
  "Avoiding the boring option…",
  "Designing on the fly…",
  "Adding more drama…",
  "Re-thinking that last choice…",
  "Almost there (probably)…",
  "Wrangling the timeline…",
  "Putting on the finishing touches…",
];

export function ThinkingPhrase({ pool }: { pool: "planning" | "working" }) {
  const phrases = pool === "planning" ? PLANNING_PHRASES : WORKING_PHRASES;
  const [phrase, setPhrase] = useState(
    () => phrases[Math.floor(Math.random() * phrases.length)]!,
  );
  useEffect(() => {
    const id = setInterval(() => {
      setPhrase((prev) => {
        if (phrases.length <= 1) return prev;
        let next = prev;
        while (next === prev) {
          next = phrases[Math.floor(Math.random() * phrases.length)]!;
        }
        return next;
      });
    }, 3000);
    return () => clearInterval(id);
  }, [phrases]);

  return (
    <span
      className="text-[12px] font-medium text-foreground"
      style={{ animation: "agent-pulse 1.8s ease-in-out infinite" }}
    >
      {phrase}
      <style>{`
        @keyframes agent-pulse {
          0%, 100% { opacity: 0.45; }
          50% { opacity: 1; }
        }
      `}</style>
    </span>
  );
}
