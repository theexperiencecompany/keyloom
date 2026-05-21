import type { CompositionInfo } from "../../schema";
import { QR_LOGO_PRESETS } from "./logo-presets";
import type { QrCodeProps } from "./QrCode";

export const QR_CODE_DURATION = 240;
export const QR_CODE_FPS = 60;
export const QR_CODE_WIDTH = 1920;
export const QR_CODE_HEIGHT = 1080;

export const qrCodeDefaultProps: QrCodeProps = {
  value: "https://heygaia.io",
  caption: "heygaia.io",
  moduleStyle: "dots",
  logoPreset: "gaia",
  logoCustom: "",
  logoPadding: 0,
};

export const qrCodeInfo: CompositionInfo<QrCodeProps> = {
  id: "QrCode",
  title: "QR Code",
  description:
    "A scannable QR code with optional center logo and caption. Choose dot or square modules, pick a brand logo preset (WhatsApp, Telegram, Slack…) or upload your own.",
  durationInFrames: QR_CODE_DURATION,
  fps: QR_CODE_FPS,
  width: QR_CODE_WIDTH,
  height: QR_CODE_HEIGHT,
  defaultProps: qrCodeDefaultProps,
  fields: [
    { kind: "text", key: "value", label: "Encoded value (URL or text)" },
    { kind: "text", key: "caption", label: "Caption (optional)" },
    {
      kind: "select",
      key: "moduleStyle",
      label: "Module style",
      options: [
        { value: "dots", label: "Dots" },
        { value: "squares", label: "Squares" },
      ],
    },
    {
      kind: "select",
      key: "logoPreset",
      label: "Center logo",
      options: QR_LOGO_PRESETS.map((p) => ({ value: p.key, label: p.label })),
    },
    {
      kind: "image",
      key: "logoCustom",
      label: "Custom logo (overrides preset)",
    },
    {
      kind: "number",
      key: "logoPadding",
      label: "Logo padding (px)",
      min: 0,
      max: 80,
    },
  ],
};
