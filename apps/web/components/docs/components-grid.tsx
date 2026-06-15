"use client";

import { Player } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import { compositions } from "@workspace/compositions/registry";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import Link from "next/link";
import * as React from "react";

type Group = {
  id: string;
  label: string;
  description: string;
  items: AnyCompositionInfo[];
};

const TEXT_PREFIXES = ["Title", "Text"];
const CHAT_IDS = new Set([
  "MessagePopup",
  "MessageBubbles",
  "WhatsAppMessages",
  "SlackMessages",
  "DiscordMessages",
]);
const SOCIAL_IDS = new Set([
  "TweetCard",
  "TwitterFollow",
  "GitHubStarButton",
  "InstagramPost",
]);
const FRAME_IDS = new Set(["BrowserWindow", "LaptopFrame", "PhoneFrame"]);
const CHART_IDS = new Set([
  "BarChart",
  "LineChart",
  "AreaChart",
  "PieChart",
  "RadarChart",
  "RadialChart",
]);
const GAIA_IDS = new Set(["GaiaScenario"]);

function isText(c: AnyCompositionInfo) {
  return TEXT_PREFIXES.some((p) => c.id.startsWith(p));
}

function partition(): Group[] {
  const scenes: AnyCompositionInfo[] = [];
  const charts: AnyCompositionInfo[] = [];
  const chat: AnyCompositionInfo[] = [];
  const social: AnyCompositionInfo[] = [];
  const frames: AnyCompositionInfo[] = [];
  const gaia: AnyCompositionInfo[] = [];
  const text: AnyCompositionInfo[] = [];

  for (const c of compositions) {
    if (GAIA_IDS.has(c.id)) gaia.push(c);
    else if (CHART_IDS.has(c.id)) charts.push(c);
    else if (CHAT_IDS.has(c.id)) chat.push(c);
    else if (SOCIAL_IDS.has(c.id)) social.push(c);
    else if (FRAME_IDS.has(c.id)) frames.push(c);
    else if (isText(c)) text.push(c);
    else scenes.push(c);
  }

  return [
    {
      id: "scenes-effects",
      label: "Scenes & Effects",
      description:
        "Standalone scene primitives — terminals, toasts, walkthroughs, cards, counters.",
      items: scenes,
    },
    {
      id: "charts",
      label: "Charts",
      description:
        "Animated data charts — bar, line, area, pie, radar, radial.",
      items: charts,
    },
    {
      id: "chat-messaging",
      label: "Chat & Messaging",
      description:
        "Conversation reveals styled after iMessage, WhatsApp, Slack, and Discord.",
      items: chat,
    },
    {
      id: "social",
      label: "Social",
      description:
        "Brand-locked social UI — tweets, follow buttons, GitHub stars, Instagram posts.",
      items: social,
    },
    {
      id: "frames-mockups",
      label: "Frames & Mockups",
      description:
        "Device chrome wrappers — phone, laptop, browser window — that host any other scene inside.",
      items: frames,
    },
    {
      id: "gaia",
      label: "GAIA",
      description:
        "Showcase scenes for GAIA — the personal AI assistant Keyloom is built for.",
      items: gaia,
    },
    {
      id: "text-animations",
      label: "Text Animations",
      description:
        "Kinetic typography primitives — fades, slides, blurs, stagger reveals.",
      items: text,
    },
  ].filter((g) => g.items.length > 0);
}

export function ComponentsGrid() {
  const groups = React.useMemo(() => partition(), []);
  return (
    <div className="not-prose my-8 space-y-12">
      {groups.map((group) => (
        <section key={group.id} id={group.id} className="scroll-mt-24">
          <div className="mb-5">
            <h2 className="text-xl font-semibold tracking-tight text-foreground">
              {group.label}
            </h2>
            <p className="mt-1 text-[13px] text-muted-foreground">
              {group.description}
            </p>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {group.items.map((info) => (
              <ComponentCard key={info.id} info={info} />
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}

function ComponentCard({ info }: { info: AnyCompositionInfo }) {
  const Component = componentsById[info.id];
  const playerRef = React.useRef<React.ComponentRef<typeof Player>>(null);

  function handleEnter() {
    playerRef.current?.play();
  }
  function handleLeave() {
    const p = playerRef.current;
    if (!p) return;
    p.pause();
    p.seekTo(0);
  }

  return (
    <Link
      href={`/docs/${info.id}`}
      className="group block overflow-hidden rounded-lg border border-border bg-muted/20 transition-all hover:border-border/80 hover:bg-muted/40"
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
    >
      <div
        className="relative w-full overflow-hidden bg-background"
        style={{ aspectRatio: `${info.width} / ${info.height}` }}
      >
        {Component ? (
          <Player
            ref={playerRef}
            component={Component}
            inputProps={info.defaultProps}
            durationInFrames={info.durationInFrames}
            fps={info.fps}
            compositionWidth={info.width}
            compositionHeight={info.height}
            style={{ width: "100%", height: "100%" }}
            loop
            initialFrame={Math.min(
              info.durationInFrames - 1,
              Math.round(info.durationInFrames * 0.7),
            )}
            initiallyMuted
            controls={false}
            acknowledgeRemotionLicense
          />
        ) : (
          <div className="flex h-full items-center justify-center text-[12px] text-muted-foreground">
            No preview
          </div>
        )}
        <div className="pointer-events-none absolute inset-0 flex items-end p-3">
          <span className="rounded-md bg-background/80 px-2 py-1 text-[10px] font-medium text-foreground/80 backdrop-blur opacity-0 transition-opacity group-hover:opacity-100">
            Hover to play
          </span>
        </div>
      </div>
      <div className="space-y-1 border-t border-border p-3">
        <div className="text-[13px] font-medium text-foreground">
          {info.title}
        </div>
        <div className="line-clamp-2 text-[11px] text-muted-foreground">
          {info.description}
        </div>
      </div>
    </Link>
  );
}
