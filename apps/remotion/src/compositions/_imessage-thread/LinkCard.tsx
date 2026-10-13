// iMessage rich link preview (LPLinkView), measured on a real iOS 17
// Messages screenshot (idownloadblog "Sending-website-URL-on-iMessage-with-and-
// without-link-preview"; scale 1.63 px/pt, calibrated on the 17pt bubble text
// widths against SF Pro's real advance widths):
//   card       #E9E9EB (grey on both sides of the thread), 18pt radius, with
//              the normal bubble tail; image fills the top edge-to-edge at its
//              own aspect ratio
//   footer     16pt side padding, 8.5pt top, 9pt bottom
//   title      15pt semibold black, 18.5pt leading, max 2 lines
//   domain     13pt regular, rgba(60,60,67,0.6) (secondaryLabel), 2pt below
import { Img, interpolate } from "remotion";
import { threadAsset } from "./asset";
import { DropletTail } from "./Bubble";
import { SF_TEXT, tracking } from "./fonts";
import { type Look, RECEIVED_GREY } from "./look";

const TAIL_LEFT =
  "M 20 0 L 20 2 A 16 16 0 0 1 4 18 L 0 18 L 0 17.54 A 10 10 0 0 0 7 8 L 7 0 Z";
const TAIL_RIGHT =
  "M 0 0 L 0 2 A 16 16 0 0 0 16 18 L 20 18 L 20 17.54 A 10 10 0 0 1 13 8 L 13 0 Z";

export function LinkCard({
  title,
  domain,
  image,
  progress = 1,
  width = 262,
  imageAspect = 1200 / 630,
  side = "left",
  tail = true,
  look,
}: {
  title: string;
  domain: string;
  /** staticFile-relative path, e.g. "link/pay-preview.png". */
  image?: string;
  progress?: number;
  width?: number;
  /** width / height of the preview image (og:image is 1.91:1). */
  imageAspect?: number;
  side?: "left" | "right";
  tail?: boolean;
  /** iOS 26 swaps the card grey and the side swoosh for the droplet tail. */
  look: Look;
}) {
  const p = Math.max(0, progress);
  // Lands like a bubble: rises a touch and scales up from the tail corner.
  const scale = interpolate(p, [0, 1], [0.86, 1]);
  const y = interpolate(p, [0, 1], [10, 0]);
  return (
    <div
      style={{
        position: "relative",
        width,
        opacity: Math.min(1, p * 2.5),
        transform: `translateY(${y}px) scale(${scale})`,
        transformOrigin: side === "left" ? "0% 100%" : "100% 100%",
      }}
    >
      {tail && look === "ios26" && (
        <DropletTail side={side} color={RECEIVED_GREY} />
      )}
      <div
        style={{
          position: "relative",
          background: RECEIVED_GREY,
          borderRadius: 18,
          overflow: "hidden",
          fontFamily: SF_TEXT,
        }}
      >
        {image ? (
          <Img
            src={threadAsset(image)}
            style={{
              display: "block",
              width: "100%",
              height: width / imageAspect,
              objectFit: "cover",
            }}
          />
        ) : null}
        <div style={{ padding: "8.5px 16px 9px" }}>
          <div
            style={{
              fontSize: 15,
              lineHeight: "18.5px",
              fontWeight: 600,
              letterSpacing: tracking(15),
              color: "#000",
              display: "-webkit-box",
              WebkitLineClamp: 2,
              WebkitBoxOrient: "vertical",
              overflow: "hidden",
            }}
          >
            {title}
          </div>
          <div
            style={{
              marginTop: 2.5,
              fontSize: 13,
              lineHeight: "16px",
              letterSpacing: tracking(13),
              color: "rgba(60,60,67,0.6)",
              whiteSpace: "nowrap",
              overflow: "hidden",
              textOverflow: "ellipsis",
            }}
          >
            {domain}
          </div>
        </div>
      </div>
      {tail && look === "ios18" && (
        <span
          style={{
            position: "absolute",
            bottom: 0,
            [side === "left" ? "left" : "right"]: -7,
            width: 20,
            height: 18,
            background: RECEIVED_GREY,
            clipPath: `path('${side === "left" ? TAIL_LEFT : TAIL_RIGHT}')`,
          }}
        />
      )}
    </div>
  );
}
