"use client";
import { useMemo } from "react";
import { AbsoluteFill, interpolate, Sequence, useVideoConfig } from "remotion";
import { type ClipStyle, resolveClipStyle } from "../../clip-style";
import { SmartAudio } from "../../smart-audio";
import { SmartVideo } from "../../smart-video";
import { DESIGN_FPS, useDesignFrame } from "../../use-design-frame";
import { keyboardSfx, threadAsset } from "../_imessage-thread/asset";
import {
  type Beat,
  type BuiltThread,
  buildThread,
  SEND_PAUSE,
} from "../_imessage-thread/build";
import { SF_DISPLAY, SF_TEXT } from "../_imessage-thread/fonts";
import { type Look, lookFromTheme } from "../_imessage-thread/look";
import { Outro } from "../_imessage-thread/Outro";
import { Phone, SCREEN_W } from "../_imessage-thread/Phone";
import { StatusBar } from "../_imessage-thread/StatusBar";
import {
  type IMessageThreadHook,
  type IMessageThreadMusic,
  type IMessageThreadOutro,
  videoHookSeconds,
} from "../_imessage-thread/segments";
import { Thread } from "../_imessage-thread/Thread";
import type { ThreadItem } from "../_imessage-thread/types";

export type IMessageThreadProps = {
  beats: Beat[];
  contactName: string;
  /** Path under public/imessage-thread/. */
  contactAvatar: string;
  /** "phone": iPhone mockup on a soft backdrop. "fullscreen": the screen itself, like a screen recording. */
  layout: "phone" | "fullscreen";
  hook?: IMessageThreadHook;
  /** Logo call to action after the chat. */
  outro?: IMessageThreadOutro;
  /** Background music under the whole video; loops if shorter. */
  music?: IMessageThreadMusic;
  /** Show the iOS 18 keyboard under the composer while chatting (iOS 18 theme only). */
  keyboard?: boolean;
  /** Play the iMessage send, receive and tapback sounds. */
  sounds?: boolean;
  clipStyle?: ClipStyle;
  /** Curated theme id from meta.themes: "ios26" (default) or "ios18". */
  clipTheme?: string;
};

const PHONE_W = 390;
const PHONE_H = 815;
const PHONE_BOTTOM_MARGIN = 0.02;
const HOOK_FADE_S = 0.25;
const SFX_SECONDS = 0.6;
const KEY_SFX_SECONDS = 0.12;
const MIN_KEY_GAP_S = 0.07;

// When each character appears in the composer (Thread reveals round(len * k) chars), thinned to MIN_KEY_GAP_S.
function keyTapTimes(text: string, start: number, compose: number) {
  const n = Array.from(text).length;
  const times: number[] = [];
  for (let i = 1; i <= n; i++) {
    const at = start + (compose * (i - 0.5)) / n;
    if (times.length === 0 || at - times[times.length - 1] >= MIN_KEY_GAP_S) {
      times.push(at);
    }
  }
  return times;
}

export const IMessageThread: React.FC<IMessageThreadProps> = ({
  beats,
  contactName,
  contactAvatar,
  layout,
  hook,
  outro,
  music,
  keyboard = false,
  sounds = true,
  clipStyle,
  clipTheme,
}) => {
  const { fps } = useVideoConfig();
  const built = useMemo(() => buildThread(beats), [beats]);
  const chat = (overlay?: IMessageThreadHook) => (
    <Chat
      built={built}
      contactName={contactName}
      contactAvatar={contactAvatar}
      layout={layout}
      overlay={overlay}
      keyboard={keyboard}
      sounds={sounds}
      clipStyle={clipStyle}
      look={lookFromTheme(clipTheme)}
    />
  );

  const hookFrames = Math.round(videoHookSeconds(hook) * fps);
  const chatFrames = Math.ceil(built.end * fps);
  return (
    <AbsoluteFill style={{ background: "#000" }}>
      {hook?.video && (
        <Sequence durationInFrames={hookFrames} name="video-hook">
          <AbsoluteFill>
            <SmartVideo
              src={threadAsset(hook.video)}
              muted
              objectFit="cover"
              style={{ width: "100%", height: "100%" }}
            />
            <HookCaption text={hook.text} top={0.3} />
          </AbsoluteFill>
        </Sequence>
      )}
      <Sequence
        from={hookFrames}
        durationInFrames={outro ? chatFrames : undefined}
        name="chat"
      >
        {chat(hook?.video ? undefined : hook)}
      </Sequence>
      {outro && (
        <Sequence from={hookFrames + chatFrames} name="outro">
          <Outro url={outro.url} />
        </Sequence>
      )}
      {music && <MusicTrack music={music} />}
    </AbsoluteFill>
  );
};

const MUSIC_VOLUME = 0.3;
const MUSIC_FADE_IN_S = 0.6;
const MUSIC_FADE_OUT_S = 1.2;

function MusicTrack({ music }: { music: IMessageThreadMusic }) {
  const { fps, durationInFrames } = useVideoConfig();
  const peak = music.volume ?? MUSIC_VOLUME;
  return (
    <Sequence name="music" layout="none">
      <SmartAudio
        src={threadAsset(music.src)}
        loop
        volume={(f) =>
          peak *
          interpolate(
            f,
            [
              0,
              MUSIC_FADE_IN_S * fps,
              durationInFrames - MUSIC_FADE_OUT_S * fps,
              durationInFrames,
            ],
            [0, 1, 1, 0],
            { extrapolateLeft: "clamp", extrapolateRight: "clamp" },
          )
        }
      />
    </Sequence>
  );
}

function Chat({
  built,
  contactName,
  contactAvatar,
  layout,
  overlay,
  keyboard,
  sounds,
  clipStyle,
  look,
}: {
  built: BuiltThread;
  contactName: string;
  contactAvatar: string;
  layout: IMessageThreadProps["layout"];
  overlay?: IMessageThreadHook;
  keyboard: boolean;
  sounds: boolean;
  clipStyle?: ClipStyle;
  look: Look;
}) {
  const t = useDesignFrame() / DESIGN_FPS;
  const { width, height } = useVideoConfig();
  const s = resolveClipStyle(clipStyle, {
    background:
      "radial-gradient(120% 90% at 50% 40%, #FFFFFF 0%, #F2F2F5 70%, #ECECF0 100%)",
    color: "#000000",
    fontFamily: SF_TEXT,
    accent: "#0A7CFF",
  });
  const clock =
    [...built.clock].reverse().find((c) => t >= c.at)?.time ??
    built.clock[0]?.time ??
    "9:41";
  const thread = (
    <Thread
      script={built.items}
      contactName={contactName}
      contactAvatar={contactAvatar}
      keyboard={keyboard}
      look={look}
    />
  );
  const overlayOpacity = overlay
    ? interpolate(t, [overlay.seconds - HOOK_FADE_S, overlay.seconds], [1, 0], {
        extrapolateLeft: "clamp",
        extrapolateRight: "clamp",
      })
    : 0;
  const sfx = sounds && <MessageSounds items={built.items} />;

  if (layout === "fullscreen") {
    const scale = width / SCREEN_W;
    return (
      <AbsoluteFill style={{ background: "#fff" }}>
        <div
          style={{
            position: "absolute",
            top: 0,
            left: 0,
            width: SCREEN_W,
            height: height / scale,
            transform: `scale(${scale})`,
            transformOrigin: "top left",
            overflow: "hidden",
            background: "#fff",
            fontFamily: SF_TEXT,
          }}
        >
          {thread}
          <StatusBar time={clock} />
        </div>
        {overlay && (
          <HookCaption text={overlay.text} opacity={overlayOpacity} />
        )}
        {sfx}
      </AbsoluteFill>
    );
  }

  const phoneScale = Math.min(
    (width * 0.9) / PHONE_W,
    (height * (overlay ? 0.8 : 0.94)) / PHONE_H,
  );
  const phoneTop = height * (1 - PHONE_BOTTOM_MARGIN) - PHONE_H * phoneScale;
  return (
    <AbsoluteFill style={{ background: s.background }}>
      <div
        style={{
          position: "absolute",
          top: overlay ? phoneTop : (height - PHONE_H * phoneScale) / 2,
          left: (width - PHONE_W * phoneScale) / 2,
          transform: `scale(${phoneScale})`,
          transformOrigin: "top left",
        }}
      >
        <Phone time={clock}>{thread}</Phone>
      </div>
      {overlay && (
        <HookCaption
          text={overlay.text}
          top={phoneTop / 2 / height}
          opacity={overlayOpacity}
        />
      )}
      {sfx}
    </AbsoluteFill>
  );
}

// Sent swoosh for the user's messages, received note for GAIA's, tap sound for reactions.
function MessageSounds({ items }: { items: ThreadItem[] }) {
  const { fps } = useVideoConfig();
  const duration = Math.ceil(SFX_SECONDS * fps);
  const keyDuration = Math.max(1, Math.ceil(KEY_SFX_SECONDS * fps));
  return (
    <>
      {items.flatMap((item) => {
        if (item.kind === "divider") return [];
        const sound =
          item.kind === "reaction"
            ? "sounds/tapback.mp3"
            : item.from === "user"
              ? "sounds/sent.mp3"
              : "sounds/received.mp3";
        const typing =
          item.kind === "text" && item.compose
            ? keyTapTimes(
                item.text,
                item.at - item.compose - SEND_PAUSE,
                item.compose,
              ).map((at, i) => (
                <Sequence
                  key={`key-${item.id}-${i}`}
                  from={Math.round(at * fps)}
                  durationInFrames={keyDuration}
                  name="key-sfx"
                  layout="none"
                >
                  <SmartAudio src={keyboardSfx()} volume={0.4} />
                </Sequence>
              ))
            : [];
        return [
          ...typing,
          <Sequence
            key={`sfx-${item.id}`}
            from={Math.round(item.at * fps)}
            durationInFrames={duration}
            name="message-sfx"
            layout="none"
          >
            <SmartAudio src={threadAsset(sound)} volume={0.8} />
          </Sequence>,
        ];
      })}
    </>
  );
}

// TikTok-classic caption: bold white text with a black outline, centred at `top` (fraction of height).
function HookCaption({
  text,
  top = 0.3,
  opacity = 1,
}: {
  text: string;
  top?: number;
  opacity?: number;
}) {
  const { width, height } = useVideoConfig();
  if (opacity <= 0) return null;
  const fontSize = width * 0.058;
  return (
    <div
      style={{
        position: "absolute",
        left: width * 0.08,
        right: width * 0.08,
        top: height * top,
        transform: "translateY(-50%)",
        textAlign: "center",
        fontFamily: SF_DISPLAY,
        fontWeight: 700,
        fontSize,
        lineHeight: 1.18,
        letterSpacing: "0.005em",
        wordSpacing: "0.1em",
        opacity,
        zIndex: 50,
        whiteSpace: "pre-line",
      }}
    >
      {/* Outline on its own layer so the stroke never eats into the white fill. */}
      <span
        style={{
          color: "#000",
          WebkitTextStroke: `${fontSize * 0.14}px #000`,
        }}
      >
        {text}
      </span>
      <span style={{ position: "absolute", inset: 0, color: "#fff" }}>
        {text}
      </span>
    </div>
  );
}
