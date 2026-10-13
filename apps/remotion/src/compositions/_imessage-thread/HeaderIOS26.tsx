// iOS 26 conversation header, from the reference SVG (pt, 375-wide frame): no bar,
// a white scroll-edge fade, 45pt glass circles for back and FaceTime, a 63pt
// avatar with a 1pt glass rim, and a glass name pill overlapping it by 4pt.
import type React from "react";
import { glass, IOS26_ICON } from "./look";
import { Img, threadAsset } from "./parts";

const BUTTON = 45;
const BUTTON_TOP = 65;
const BACK_LEFT = 23;
const FACETIME_RIGHT = 25;
const AVATAR = 63;
const AVATAR_TOP = 62;
const PILL_TOP = 121;
const PILL_H = 29;
const FADE_H = 169;

// Icon paths keep the reference SVG's absolute coordinates; each control translates by its own origin.
const BACK_CHEVRON =
  "M288.793 339.007C288.793 338.841 288.821 338.691 288.876 338.559C288.937 338.426 289.031 338.299 289.158 338.177L297.567 330.05C297.772 329.846 298.023 329.743 298.322 329.743C298.521 329.743 298.701 329.793 298.862 329.893C299.028 329.987 299.158 330.114 299.252 330.274C299.352 330.435 299.401 330.615 299.401 330.814C299.401 331.107 299.293 331.365 299.078 331.586L291.375 339.007L299.078 346.419C299.293 346.641 299.401 346.898 299.401 347.191C299.401 347.396 299.352 347.579 299.252 347.739C299.158 347.905 299.028 348.035 298.862 348.129C298.701 348.223 298.521 348.271 298.322 348.271C298.023 348.271 297.772 348.168 297.567 347.963L289.158 339.837C289.031 339.715 288.937 339.588 288.876 339.455C288.821 339.317 288.793 339.167 288.793 339.007Z";
const NAME_CHEVRON =
  "M470.945 386.475C470.945 386.377 470.929 386.289 470.896 386.211C470.861 386.133 470.805 386.058 470.73 385.986L465.784 381.206C465.664 381.086 465.516 381.025 465.34 381.025C465.223 381.025 465.117 381.055 465.022 381.113C464.925 381.169 464.848 381.243 464.793 381.338C464.734 381.432 464.705 381.538 464.705 381.655C464.705 381.828 464.769 381.979 464.896 382.109L469.427 386.475L464.896 390.835C464.769 390.965 464.705 391.117 464.705 391.289C464.705 391.41 464.734 391.517 464.793 391.611C464.848 391.709 464.925 391.785 465.022 391.841C465.117 391.896 465.223 391.924 465.34 391.924C465.516 391.924 465.664 391.864 465.784 391.743L470.73 386.963C470.805 386.891 470.861 386.816 470.896 386.738C470.929 386.657 470.945 386.569 470.945 386.475Z";

function GlassButton({
  side,
  children,
}: {
  side: "left" | "right";
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        borderRadius: BUTTON / 2,
        ...glass(),
        position: "absolute",
        top: BUTTON_TOP,
        [side]: side === "left" ? BACK_LEFT : FACETIME_RIGHT,
        width: BUTTON,
        height: BUTTON,
      }}
    >
      <svg
        width={BUTTON}
        height={BUTTON}
        viewBox={`0 0 ${BUTTON} ${BUTTON}`}
        style={{ display: "block" }}
        aria-hidden
      >
        {children}
      </svg>
    </div>
  );
}

export function HeaderIOS26({
  name,
  avatar,
}: {
  name: string;
  avatar: string;
}) {
  return (
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        height: FADE_H,
        zIndex: 20,
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          background:
            "linear-gradient(to bottom, #fff 0px, rgba(255,255,255,0.9) 63px, rgba(255,255,255,0.7) 123px, rgba(255,255,255,0.02) 169px)",
        }}
      />
      <GlassButton side="left">
        <path
          d={BACK_CHEVRON}
          transform="translate(-273 -315)"
          fill={IOS26_ICON}
        />
      </GlassButton>
      <GlassButton side="right">
        {/* SF Symbol "video": rounded camera body and a rounded lens wedge. */}
        <rect
          x="10.4"
          y="15.4"
          width="17.2"
          height="14.2"
          rx="3.8"
          fill="none"
          stroke={IOS26_ICON}
          strokeWidth="1.8"
        />
        <path
          d="M29.6 20.6 L33.9 17.8 Q35.1 17.1 35.1 18.5 V26.5 Q35.1 27.9 33.9 27.2 L29.6 24.4 Z"
          fill="none"
          stroke={IOS26_ICON}
          strokeWidth="1.8"
          strokeLinejoin="round"
        />
      </GlassButton>
      <Img
        src={threadAsset(avatar)}
        style={{
          position: "absolute",
          top: AVATAR_TOP,
          left: "50%",
          marginLeft: -AVATAR / 2,
          width: AVATAR,
          height: AVATAR,
          borderRadius: AVATAR / 2,
          objectFit: "cover",
          boxShadow:
            "0 0 0 1px rgba(255,255,255,0.6), 0 5px 40px rgba(0,0,0,0.08)",
        }}
      />
      <div
        style={{
          borderRadius: PILL_H / 2,
          ...glass(),
          position: "absolute",
          top: PILL_TOP,
          left: "50%",
          transform: "translateX(-50%)",
          height: PILL_H,
          padding: "0 12px 0 16px",
          display: "flex",
          alignItems: "center",
          gap: 11,
          whiteSpace: "nowrap",
          fontSize: 17,
          fontWeight: 500,
          lineHeight: `${PILL_H}px`,
          color: "#000",
        }}
      >
        <span>{name}</span>
        <svg
          width="6.24"
          height="10.9"
          viewBox="464.705 381.025 6.24 10.9"
          style={{ display: "block", marginTop: 2 }}
          aria-hidden
        >
          <path d={NAME_CHEVRON} fill="#BFBFBF" />
        </svg>
      </div>
    </div>
  );
}
