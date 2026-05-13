import type { CompositionInfo } from "../../schema";
import type { TerminalProps } from "./Terminal";

export const TERMINAL_DURATION = 360;
export const TERMINAL_FPS = 60;
export const TERMINAL_WIDTH = 1920;
export const TERMINAL_HEIGHT = 1080;

export const terminalDefaultProps: TerminalProps = {
  title: "~/projects/motion-studio",
  prompt: "❯",
  lines: [
    { kind: "comment", text: "# Install the CLI" },
    { kind: "command", text: "npm install -g motion-studio" },
    { kind: "output", text: "added 247 packages in 3.2s" },
    { kind: "success", text: "ready" },
    { kind: "comment", text: "" },
    { kind: "comment", text: "# Scaffold a project" },
    { kind: "command", text: "motion-studio init my-video" },
    { kind: "output", text: "created my-video/" },
  ],
  charactersPerSecond: 28,
  lineGap: 6,
};

export const terminalInfo: CompositionInfo<TerminalProps> = {
  id: "Terminal",
  title: "Terminal",
  description:
    "A macOS-style terminal that types out CLI commands line by line, with prompts, output, and success rows.",
  durationInFrames: TERMINAL_DURATION,
  fps: TERMINAL_FPS,
  width: TERMINAL_WIDTH,
  height: TERMINAL_HEIGHT,
  defaultProps: terminalDefaultProps,
  fields: [
    { kind: "text", key: "title", label: "Window title" },
    { kind: "text", key: "prompt", label: "Prompt symbol" },
    {
      kind: "number",
      key: "charactersPerSecond",
      label: "Type speed (cps)",
      min: 4,
      max: 120,
    },
    { kind: "number", key: "lineGap", label: "Line gap (px)", min: 0, max: 40 },
  ],
};
