/**
 * Curated logo presets that can sit in the center of a QR code. Reuses the
 * same macOS icon assets the MessagePopup picker uses so the two pickers
 * stay consistent. "none" renders a plain QR with no logo.
 */
export type QrLogoPreset = {
  key: string;
  label: string;
  path: string;
};

export const QR_LOGO_PRESETS: readonly QrLogoPreset[] = [
  { key: "none", label: "No logo", path: "" },
  {
    key: "whatsapp",
    label: "WhatsApp",
    path: "images/icons/macos/whatsapp.png",
  },
  {
    key: "telegram",
    label: "Telegram",
    path: "images/icons/macos/telegram.png",
  },
  { key: "slack", label: "Slack", path: "images/icons/macos/slack.png" },
  { key: "discord", label: "Discord", path: "images/icons/macos/discord.png" },
  {
    key: "instagram",
    label: "Instagram",
    path: "images/icons/macos/instagram.png",
  },
  { key: "gaia", label: "GAIA", path: "gaia-glow.png" },
];

const BY_KEY: Record<string, QrLogoPreset> = Object.fromEntries(
  QR_LOGO_PRESETS.map((p) => [p.key, p]),
);

export function resolveQrLogo(key: string | undefined): string | undefined {
  if (!key) return undefined;
  const entry = BY_KEY[key];
  if (!entry?.path) return undefined;
  return entry.path;
}
