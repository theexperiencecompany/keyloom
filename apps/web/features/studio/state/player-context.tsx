"use client";

import type { PlayerRef } from "@remotion/player";
import {
  createContext,
  type ReactNode,
  type RefObject,
  useContext,
  useEffect,
  useState,
} from "react";

type Ctx = {
  playerRef: RefObject<PlayerRef | null>;
  // Bumps every time the underlying Player remounts. Hooks include this in
  // their effect deps so they re-attach listeners to the fresh ref.
  version: number;
};

const PlayerCtx = createContext<Ctx | null>(null);

export function PlayerProvider({
  playerRef,
  version,
  children,
}: {
  playerRef: RefObject<PlayerRef | null>;
  version: number;
  children: ReactNode;
}) {
  return (
    <PlayerCtx.Provider value={{ playerRef, version }}>
      {children}
    </PlayerCtx.Provider>
  );
}

function useCtx(): Ctx {
  const ctx = useContext(PlayerCtx);
  if (!ctx) throw new Error("PlayerProvider is missing");
  return ctx;
}

export function usePlayerRef(): RefObject<PlayerRef | null> {
  return useCtx().playerRef;
}

export function usePlayerFrame(): number {
  const { playerRef, version } = useCtx();
  const [frame, setFrame] = useState(0);
  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      setFrame(0);
      return;
    }
    setFrame(player.getCurrentFrame());
    const onFrame = (e: { detail: { frame: number } }) => {
      setFrame(e.detail.frame);
    };
    player.addEventListener("frameupdate", onFrame as never);
    return () => player.removeEventListener("frameupdate", onFrame as never);
  }, [playerRef, version]);
  return frame;
}

export function useIsPlaying(): boolean {
  const { playerRef, version } = useCtx();
  const [playing, setPlaying] = useState(false);
  useEffect(() => {
    const player = playerRef.current;
    if (!player) {
      setPlaying(false);
      return;
    }
    setPlaying(player.isPlaying());
    const onPlay = () => setPlaying(true);
    const onPause = () => setPlaying(false);
    player.addEventListener("play", onPlay);
    player.addEventListener("pause", onPause);
    return () => {
      player.removeEventListener("play", onPlay);
      player.removeEventListener("pause", onPause);
    };
  }, [playerRef, version]);
  return playing;
}
