"use client";

import { VolumeHighIcon, VolumeOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Player, type PlayerRef } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import { compositionsById } from "@workspace/compositions/registry";
import { useRef, useState } from "react";

const ID = "TweetCard";

export function FeaturedTweet() {
  const info = compositionsById[ID];
  const Component = info ? componentsById[ID] : undefined;
  const playerRef = useRef<PlayerRef>(null);
  const [muted, setMuted] = useState(true);

  if (!info || !Component) return null;

  function toggleMute() {
    const player = playerRef.current;
    if (!player) return;
    if (muted) {
      player.unmute();
      player.setVolume(1);
      setMuted(false);
    } else {
      player.mute();
      setMuted(true);
    }
  }

  return (
    <div className="relative">
      <div
        className="overflow-hidden rounded-2xl border border-border bg-background shadow-[0_30px_80px_-30px_rgba(0,0,0,0.4)]"
        style={{ aspectRatio: `${info.width} / ${info.height}` }}
      >
        <Player
          ref={playerRef}
          component={Component}
          inputProps={info.defaultProps}
          durationInFrames={info.durationInFrames}
          fps={info.fps}
          compositionWidth={info.width}
          compositionHeight={info.height}
          style={{ width: "100%", height: "100%" }}
          autoPlay
          loop
          initiallyMuted
          acknowledgeRemotionLicense
        />
      </div>

      <button
        type="button"
        onClick={toggleMute}
        className="absolute bottom-4 right-4 flex items-center gap-2 rounded-full border border-border bg-background/85 px-3.5 py-1.5 text-[12px] font-medium text-foreground shadow-md backdrop-blur transition-colors hover:bg-background"
        aria-label={muted ? "Unmute preview" : "Mute preview"}
      >
        <HugeiconsIcon
          icon={muted ? VolumeOffIcon : VolumeHighIcon}
          className="size-3.5"
        />
        <span>{muted ? "Tap for sound" : "Sound on"}</span>
      </button>
    </div>
  );
}
