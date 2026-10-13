export type IMessageThreadHook = {
  text: string;
  /** How long the caption stays on screen. */
  seconds: number;
  /** Path under public/imessage-thread/. When set, this clip plays full screen under the caption before the chat starts. */
  video?: string;
};

export type IMessageThreadOutro = {
  /** Shown under the GAIA logo, e.g. "heygaia.io". */
  url: string;
};

export type IMessageThreadMusic = {
  /** Path under public/imessage-thread/, loudness-normalised beforehand. */
  src: string;
  /** Peak level under the message sounds (0–1). */
  volume?: number;
};

export const OUTRO_SECONDS = 2;

/** Seconds of video-hook intro that run before the chat starts. */
export const videoHookSeconds = (hook?: IMessageThreadHook) =>
  hook?.video ? hook.seconds : 0;

export const outroSeconds = (outro?: IMessageThreadOutro) =>
  outro ? OUTRO_SECONDS : 0;
