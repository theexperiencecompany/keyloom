// iOS Messages photo stack (iOS 15+, unchanged in 17/18): the first photo sits
// flat in front at the image's own aspect ratio; the others are tucked behind
// it, each a little smaller, nudged outward and turned a few degrees so their
// edges fan out past the front photo on the side away from the screen edge.
// No bubble behind it; ~18pt corner radius; no outline, just a soft shadow so
// white screenshots don't melt into the white thread.
// Above it sits the blue "▦ N Photos" grid button, beside it the grey save
// button iOS shows next to received photos.
import type React from "react";
import { Img, interpolate } from "remotion";
import { threadAsset } from "./asset";
import { SF_TEXT, tracking } from "./fonts";

const RADIUS = 18;
const BLUE = "#007AFF";

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));
const easeOut = (t: number) => 1 - (1 - t) ** 3;

// Rear-card pose by depth (1 = directly behind the front photo).
const REAR = [
  { rot: 0, dx: 0, dy: 0, s: 1 },
  { rot: 2.5, dx: 15, dy: 0, s: 0.95 },
  { rot: 5, dx: 27, dy: 1, s: 0.9 },
  { rot: 7.5, dx: 37, dy: 2, s: 0.85 },
];

function GridIcon() {
  return (
    <svg
      width="11"
      height="11"
      viewBox="0 0 11 11"
      style={{ display: "block" }}
    >
      {[0, 6].map((x) =>
        [0, 6].map((y) => (
          <rect
            key={`${x}${y}`}
            x={x}
            y={y}
            width="5"
            height="5"
            rx="1.2"
            fill={BLUE}
          />
        )),
      )}
    </svg>
  );
}

function SaveButton() {
  return (
    <div
      style={{
        width: 30,
        height: 30,
        borderRadius: 15,
        background: "rgba(120,120,128,0.12)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
      }}
    >
      {/* SF Symbol square.and.arrow.down, 15pt */}
      <svg
        width="15"
        height="17"
        viewBox="0 0 15 17"
        fill="none"
        style={{ display: "block" }}
      >
        <path
          d="M4.6 6.4H3.4c-1.1 0-1.9.8-1.9 1.9v5.9c0 1.1.8 1.9 1.9 1.9h8.2c1.1 0 1.9-.8 1.9-1.9V8.3c0-1.1-.8-1.9-1.9-1.9h-1.2"
          stroke="#6D6D72"
          strokeWidth="1.5"
          strokeLinecap="round"
        />
        <path
          d="M7.5 1.2v9.3M4.7 7.8l2.8 2.8 2.8-2.8"
          stroke="#6D6D72"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </div>
  );
}

export function ImageStack({
  srcs,
  progress = 1,
  width,
  aspect = 1.9,
  side = "left",
  label = true,
  saveButton = true,
}: {
  srcs: string[];
  progress?: number;
  /** Width of the front photo in px (pt); the fan adds ~16px beside it. */
  width: number;
  /** width / height of the photos. */
  aspect?: number;
  side?: "left" | "right";
  label?: boolean;
  saveButton?: boolean;
}) {
  const h = width / aspect;
  const n = Math.min(srcs.length, REAR.length);
  const dir = side === "left" ? 1 : -1;
  const fan = REAR[n - 1].dx - ((1 - REAR[n - 1].s) * width) / 2 + 8;

  // Cards land back-to-front, one by one; the fan opens as the front lands.
  const step = n > 1 ? 0.45 / (n - 1) : 0;
  const fanOpen = easeOut(clamp01((progress - 0.35) / 0.65));

  const cards = srcs.slice(0, n).map((src, i) => {
    const depth = i; // 0 = front
    const order = n - 1 - i; // back card lands first
    const t = clamp01((progress - order * step) / 0.55);
    const e = easeOut(t);
    const pose = REAR[depth];
    const rot = pose.rot * fanOpen + (1 - e) * 4;
    const dx = pose.dx * fanOpen * dir;
    const dy = pose.dy * fanOpen + (1 - e) * 26;
    const s = interpolate(e, [0, 1], [0.9, pose.s]);
    const style: React.CSSProperties = {
      position: "absolute",
      left: 0,
      top: 0,
      width,
      height: h,
      borderRadius: RADIUS,
      overflow: "hidden",
      zIndex: n - depth,
      opacity: clamp01(t * 5),
      transform: `translate(${dx}px, ${dy}px) rotate(${rot * dir}deg) scale(${s})`,
      transformOrigin: "50% 50%",
      boxShadow:
        depth === 0
          ? "0 1px 8px rgba(0,0,0,0.10)"
          : "0 1px 8px rgba(0,0,0,0.08)",
      background: "#F2F2F7",
    };
    return (
      <div key={src + i} style={style}>
        <Img
          src={threadAsset(src)}
          style={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            objectPosition: "left top",
            display: "block",
          }}
        />
      </div>
    );
  });

  const labelOpacity = clamp01((progress - 0.6) / 0.4);

  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: side === "left" ? "flex-start" : "flex-end",
      }}
    >
      {label && n > 1 ? (
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            fontFamily: SF_TEXT,
            fontSize: 13,
            lineHeight: "16px",
            fontWeight: 600,
            letterSpacing: tracking(13),
            color: BLUE,
            margin: side === "left" ? "0 0 5px 4px" : "0 4px 5px 0",
            opacity: labelOpacity,
          }}
        >
          <GridIcon />
          {srcs.length} Photos
        </div>
      ) : null}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          flexDirection: side === "left" ? "row" : "row-reverse",
        }}
      >
        <div
          style={{ position: "relative", width: width + fan, height: h + 6 }}
        >
          <div
            style={{
              position: "absolute",
              top: 0,
              [side === "left" ? "left" : "right"]: 0,
              width,
              height: h,
            }}
          >
            {cards}
          </div>
        </div>
        {saveButton && side === "left" ? (
          <div style={{ marginLeft: 6, opacity: labelOpacity }}>
            <SaveButton />
          </div>
        ) : null}
      </div>
    </div>
  );
}
