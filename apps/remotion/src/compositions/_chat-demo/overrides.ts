/**
 * Universal Style overrides forwarded from an unlocked chat composition. Each
 * field is optional — undefined means "keep the platform's authentic default".
 * A platform renderer applies only the fields that have a clean single mapping
 * in its layout.
 */
export type ClipOverrides = {
  background?: string;
  color?: string;
  fontFamily?: string;
  accent?: string;
};

/** Use the override if set (non-empty), otherwise the authentic default. */
export function ov(value: string | undefined, fallback: string): string {
  return value && value.trim() !== "" ? value : fallback;
}
