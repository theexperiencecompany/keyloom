import { Easing } from "remotion";
import {
  type ClipStyle,
  type ClipStyleDefaults,
  resolveClipStyle,
} from "../clip-style";
import { snap } from "../snap";
import { useCanvasLayout } from "../use-canvas-layout";

export { snap, snapNear, snapZero } from "../snap";

/**
 * Shared prop shape used by every Title* and Text* composition. The
 * universal Style controls (background / text color / font / accent) live
 * on `clipStyle`; per-clip text content lives on `headline` and `subtitle`.
 */
export type TitleProps = {
  headline: string;
  subtitle: string;
  clipStyle?: ClipStyle;
};

export const APPLE_EASE = Easing.bezier(0.16, 1, 0.3, 1);

export const TITLE_FONT_FAMILY =
  "-apple-system, BlinkMacSystemFont, 'SF Pro Display', Inter, sans-serif";

export const TITLE_DEFAULTS: ClipStyleDefaults = {
  background: "#ffffff",
  color: "#0f1014",
  fontFamily: TITLE_FONT_FAMILY,
  accent: "#0f1014",
};

export function resolveTitleStyle(clipStyle: ClipStyle | undefined) {
  return resolveClipStyle(clipStyle, TITLE_DEFAULTS);
}

function isLightColor(color: string): boolean {
  const c = color.trim().toLowerCase();
  if (c === "white" || c === "#fff" || c === "#ffffff") return true;
  if (c.startsWith("#") && c.length === 7) {
    const r = parseInt(c.slice(1, 3), 16);
    const g = parseInt(c.slice(3, 5), 16);
    const b = parseInt(c.slice(5, 7), 16);
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.6;
  }
  return false;
}

/**
 * The subtitle line under every Title* / Text* headline. It fades in with
 * `progress` while rising `rise` px into place (defaults to `vmin(1.3)`).
 */
export function TitleSubtitle({
  text,
  progress,
  textColor,
  rise,
}: {
  text: string;
  progress: number;
  textColor: string;
  rise?: number;
}) {
  const { vmin } = useCanvasLayout();
  if (!text.trim()) return null;
  return (
    <p
      style={{
        fontSize: vmin(3.5),
        fontWeight: 400,
        letterSpacing: "-0.012em",
        margin: `${vmin(3)}px 0 0`,
        maxWidth: "40em",
        color: isLightColor(textColor)
          ? "rgba(15,16,20,0.55)"
          : "rgba(255,255,255,0.65)",
        opacity: progress,
        transform: `translate3d(0, ${snap((1 - progress) * (rise ?? vmin(1.3)))}px, 0)`,
      }}
    >
      {text}
    </p>
  );
}
