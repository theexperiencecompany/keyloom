/**
 * Curated macOS app icon presets the MessagePopup notification can mimic.
 *
 * Each entry maps a stable string key (stored on the clip props) to:
 *  - `label`: user-facing name shown in the Inspector picker
 *  - `path`: static path inside the shared public dir (`apps/web/public/`,
 *    which `apps/remotion/public/` symlinks to) — the component
 *    runs this through `staticFile()` (relative to the Remotion bundle)
 *    or `proxyExternalImg()` (when it's an absolute URL) at render time
 *
 * The presets live next to the component so adding a new icon is a
 * one-file change (drop the asset in `public/images/icons/macos/`, add
 * an entry here).
 */
export type IconPreset = {
  key: string;
  label: string;
  path: string;
};

// NOTE: the upstream GAIA repo mislabeled many of these as `.webp` even
// though their bytes are PNG. Browsers sniff and forgive that, but
// Remotion's `<Img>` validates content-type strictly and refuses to
// decode mismatched bytes. The files were renamed to their real format
// at copy time, so the paths below reflect actual disk extensions.
export const ICON_PRESETS: readonly IconPreset[] = [
  {
    key: "whatsapp",
    label: "WhatsApp",
    path: "images/icons/macos/whatsapp.png",
  },
  { key: "slack", label: "Slack", path: "images/icons/macos/slack.png" },
  {
    key: "telegram",
    label: "Telegram",
    path: "images/icons/macos/telegram.png",
  },
  { key: "discord", label: "Discord", path: "images/icons/macos/discord.png" },
  { key: "gmail", label: "Gmail", path: "images/icons/macos/gmail.png" },
  { key: "mail", label: "Mail", path: "images/icons/macos/mail.png" },
  { key: "google", label: "Google", path: "images/icons/macos/google.png" },
  {
    key: "google_docs",
    label: "Google Docs",
    path: "images/icons/macos/google_docs.png",
  },
  { key: "sheets", label: "Sheets", path: "images/icons/macos/sheets.png" },
  { key: "drive", label: "Drive", path: "images/icons/macos/drive.png" },
  { key: "meet", label: "Meet", path: "images/icons/macos/meet.png" },
  {
    key: "calendar",
    label: "Calendar",
    path: "images/icons/macos/calendar.png",
  },
  {
    key: "notion_calendar",
    label: "Notion Calendar",
    path: "images/icons/macos/notion_calendar.png",
  },
  { key: "notion", label: "Notion", path: "images/icons/macos/notion.png" },
  { key: "linear", label: "Linear", path: "images/icons/macos/linear.webp" },
  { key: "figma", label: "Figma", path: "images/icons/macos/figma.png" },
  { key: "github", label: "GitHub", path: "images/icons/macos/github.png" },
  { key: "asana", label: "Asana", path: "images/icons/macos/asana.png" },
  { key: "clickup", label: "ClickUp", path: "images/icons/macos/clickup.png" },
  { key: "trello", label: "Trello", path: "images/icons/macos/trello.png" },
  { key: "todoist", label: "Todoist", path: "images/icons/macos/todoist.png" },
  {
    key: "airtable",
    label: "Airtable",
    path: "images/icons/macos/airtable.png",
  },
  { key: "hubspot", label: "HubSpot", path: "images/icons/macos/hubspot.png" },
  { key: "teams", label: "Teams", path: "images/icons/macos/teams.png" },
  { key: "zoom", label: "Zoom", path: "images/icons/macos/zoom.png" },
  {
    key: "instagram",
    label: "Instagram",
    path: "images/icons/macos/instagram.png",
  },
  { key: "youtube", label: "YouTube", path: "images/icons/macos/youtube.png" },
  { key: "reddit", label: "Reddit", path: "images/icons/macos/reddit.png" },
  {
    key: "perplexity",
    label: "Perplexity",
    path: "images/icons/macos/perplexity.png",
  },
  {
    key: "macos_weather",
    label: "Weather",
    path: "images/icons/macos/macos_weather.png",
  },
] as const;

const ICON_PRESETS_BY_KEY: Record<string, IconPreset> = Object.fromEntries(
  ICON_PRESETS.map((p) => [p.key, p]),
);

/**
 * Look up a preset's static asset path by key. Returns `undefined` for
 * empty strings, unknown keys, or `undefined` input — callers should
 * then fall back to whatever default icon the composition ships with.
 */
export function resolveIconPreset(key: string | undefined): string | undefined {
  if (!key) return undefined;
  const entry = ICON_PRESETS_BY_KEY[key];
  return entry?.path;
}
