import type { CompositionInfo } from "../../schema";
import type { TerminalProps } from "./Terminal";

export const TERMINAL_DURATION = 360;
export const TERMINAL_FPS = 60;
export const TERMINAL_WIDTH = 1920;
export const TERMINAL_HEIGHT = 1080;

export const terminalDefaultProps: TerminalProps = {
  title: "~/projects/keyloom",
  prompt: "❯",
  lines: [
    { kind: "comment", text: "# Install the CLI" },
    { kind: "command", text: "npm install -g keyloom" },
    { kind: "output", text: "added 247 packages in 3.2s" },
    { kind: "success", text: "ready" },
    { kind: "comment", text: "" },
    { kind: "comment", text: "# Scaffold a project" },
    { kind: "command", text: "keyloom init my-video" },
    { kind: "output", text: "created my-video/" },
  ],
  charactersPerSecond: 28,
  lineGap: 6,
  chromeStyle: "mac",
  cursorStyle: "block",
  fontSize: 26,
  paddingX: 32,
  paddingY: 28,
  cornerRadius: 16,
  successColor: "#34d399",
  outputOpacity: 0.62,
  commentOpacity: 0.38,
  showShadow: true,
  maxWidth: 1280,
};

export const terminalInfo: CompositionInfo<TerminalProps> = {
  id: "Terminal",
  category: "devtools",
  agentNotes:
    "Best for CLI install / build / deploy / one-liner shell demos with 2–4 lines. Use for the 'how it works' beat in a launch video. Each line is { kind: 'prompt' | 'output', text }. Keep individual lines short (single command + short response). Avoid for long sessions — typing animation gets stale past ~6 seconds.",
  title: "Terminal",
  description:
    "A macOS-style terminal that types out CLI commands line by line. Highly configurable: chrome style, cursor, font size, padding, line kinds.",
  durationInFrames: TERMINAL_DURATION,
  fps: TERMINAL_FPS,
  width: TERMINAL_WIDTH,
  height: TERMINAL_HEIGHT,
  defaultProps: terminalDefaultProps,
  fields: [
    { kind: "text", key: "title", label: "Window title" },
    { kind: "text", key: "prompt", label: "Prompt symbol" },
    { kind: "terminalLines", key: "lines", label: "Lines" },
    {
      kind: "select",
      key: "chromeStyle",
      label: "Window chrome",
      options: [
        { value: "mac", label: "macOS (traffic lights)" },
        { value: "linux", label: "Linux (grey dots)" },
        { value: "windows", label: "Windows (right buttons)" },
        { value: "none", label: "None" },
      ],
    },
    {
      kind: "select",
      key: "cursorStyle",
      label: "Cursor",
      options: [
        { value: "block", label: "Block" },
        { value: "underline", label: "Underline" },
        { value: "bar", label: "Bar (|)" },
      ],
    },
    {
      kind: "number",
      key: "charactersPerSecond",
      label: "Type speed (cps)",
      min: 4,
      max: 120,
    },
    { kind: "number", key: "fontSize", label: "Font size", min: 14, max: 64 },
    { kind: "number", key: "lineGap", label: "Line gap (px)", min: 0, max: 40 },
    {
      kind: "number",
      key: "paddingX",
      label: "Padding X (px)",
      min: 0,
      max: 120,
    },
    {
      kind: "number",
      key: "paddingY",
      label: "Padding Y (px)",
      min: 0,
      max: 120,
    },
    {
      kind: "number",
      key: "cornerRadius",
      label: "Window radius",
      min: 0,
      max: 48,
    },
    {
      kind: "number",
      key: "maxWidth",
      label: "Window max width",
      min: 600,
      max: 1800,
    },
    {
      kind: "color",
      key: "successColor",
      label: "Success row color",
    },
    {
      kind: "number",
      key: "outputOpacity",
      label: "Output opacity (0–1)",
      min: 0,
      max: 1,
    },
    {
      kind: "number",
      key: "commentOpacity",
      label: "Comment opacity (0–1)",
      min: 0,
      max: 1,
    },
  ],
};
