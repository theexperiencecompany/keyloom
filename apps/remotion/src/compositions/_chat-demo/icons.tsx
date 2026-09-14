"use client";

import {
  Attachment01Icon,
  Camera01Icon,
  Mic01Icon,
  SmileIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";

/* ----- Shared composer icons ----- */

export function MicIcon({ size = 22 }: { size?: number }) {
  return (
    <HugeiconsIcon icon={Mic01Icon} size={size} strokeWidth={2} aria-hidden />
  );
}

export function AttachmentIcon({ size = 22 }: { size?: number }) {
  return (
    <HugeiconsIcon
      icon={Attachment01Icon}
      size={size}
      strokeWidth={2}
      aria-hidden
    />
  );
}

export function CameraIcon({ size = 22 }: { size?: number }) {
  return (
    <HugeiconsIcon
      icon={Camera01Icon}
      size={size}
      strokeWidth={2}
      aria-hidden
    />
  );
}

export function EmojiIcon({ size = 22 }: { size?: number }) {
  return (
    <HugeiconsIcon icon={SmileIcon} size={size} strokeWidth={2} aria-hidden />
  );
}

// Discord's sticker / Nitro-gift glyphs are bespoke Lottie shapes with no
// HugeIcons equivalent — kept as the verbatim SVG paths.
export function DiscordStickerIcon({ size = 20 }: { size?: number }) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 96 96"
      width={size}
      height={size}
      aria-hidden
    >
      <g transform="matrix(2.7,0,0,2.7,-79.6,-81.35)">
        <g transform="translate(32.022 32.647)">
          <g transform="translate(7.18 7.181)">
            <path
              fill="currentColor"
              d="M-6.555 1.641c-.375 1.401.455 2.84 1.856 3.216l6.34 1.698c1.4.376 2.841-.456 3.216-1.856L6.555-1.641C6.93-3.042 6.099-4.481 4.699-4.857L-1.641-6.556c-1.4-.375-2.841.457-3.216 1.857z"
            />
          </g>
        </g>
        <g transform="translate(47.443 32.419)">
          <g transform="translate(7.802 7.022)">
            <path
              fill="currentColor"
              d="M-6.478 2.404C-7.552 4.372-6.127 6.772-3.885 6.772h7.771c2.242 0 3.666-2.4 2.593-4.368L2.593-4.719c-1.119-2.053-4.066-2.053-5.186 0z"
            />
          </g>
        </g>
        <g transform="translate(32.12 49.045)">
          <g transform="translate(7.082 7.047)">
            <path
              fill="currentColor"
              d="M-.941-6.268c.52-.529 1.361-.529 1.882 0l1.116 1.135c.213.216.491.353.789.388l1.566.183c.729.085 1.254.756 1.173 1.501l-.174 1.598a1.4 1.4 0 0 0 .195.872l.836 1.363c.39.635.203 1.472-.419 1.872l-1.333.858a1.4 1.4 0 0 0-.547.699l-.523 1.517c-.243.706-1.001 1.079-1.695.833l-1.488-.529a1.32 1.32 0 0 0-.876 0l-1.489.529c-.693.246-1.451-.127-1.695-.833l-.523-1.517a1.4 1.4 0 0 0-.546-.699L-6.024 2.644c-.621-.4-.808-1.237-.419-1.872l.837-1.363a1.4 1.4 0 0 0 .194-.872l-.173-1.598c-.081-.745.443-1.416 1.173-1.501l1.565-.183c.299-.035.577-.172.79-.388z"
            />
          </g>
        </g>
        <g transform="matrix(-1,0,0,-1,62.694,63.32)">
          <g transform="translate(7.247 7.247)">
            <path
              fill="currentColor"
              d="M1.513-5.592C.993-6.997-.994-6.997-1.514-5.592l-.677 1.831c-.269.727-.843 1.301-1.571 1.57l-1.83.678c-1.405.52-1.405 2.506 0 3.026l1.83.678c.728.269 1.302.843 1.571 1.57l.677 1.831c.52 1.405 2.507 1.405 3.027 0l.677-1.831c.27-.727.843-1.301 1.571-1.57l1.832-.678c1.405-.52 1.405-2.506 0-3.026l-1.832-.678c-.728-.269-1.301-.843-1.571-1.57z"
            />
          </g>
        </g>
      </g>
    </svg>
  );
}

export function DiscordGiftIcon({ size = 20 }: { size?: number }) {
  // Verbatim Lottie SVG provided by the user — transforms preserved as-is.
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      aria-hidden
    >
      <g transform="matrix(0.04,0,0,0.04,0,0)">
        <g transform="matrix(25,0,0,25,300,300)">
          <path
            fill="currentColor"
            d="M-7,10 C-8.105,10 -9,9.105 -9,8 V2.5 C-9,2.224 -8.776,2 -8.5,2 H-1.5 C-1.224,2 -1,2.224 -1,2.5 V9.5 C-1,9.776 -1.224,10 -1.5,10 Z M1,9.5 C1,9.776 1.224,10 1.5,10 H7 C8.105,10 9,9.105 9,8 V2.5 C9,2.224 8.776,2 8.5,2 H1.5 C1.224,2 1,2.224 1,2.5 Z"
          />
        </g>
        <g transform="matrix(25,0,0,25,300,300)">
          <path
            fill="currentColor"
            d="M-10,-2 C-10,-3.105 -9.105,-4 -8,-4 H8 C9.105,-4 10,-3.105 10,-2 V-0.5 C10,-0.224 9.776,0 9.5,0 H-9.5 C-9.776,0 -10,-0.224 -10,-0.5 Z"
          />
        </g>
        <g transform="matrix(25,0,0,25,300,300)">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            d="M7,-6 C7,-7.657 5.657,-9 4,-9 H3.911 C2.494,-9 1.259,-8.036 0.915,-6.661 L0,-3 H4 C5.657,-3 7,-4.343 7,-6 Z"
          />
        </g>
        <g transform="matrix(25,0,0,25,300,300)">
          <path
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinejoin="round"
            d="M-7,-6 C-7,-7.657 -5.657,-9 -4,-9 H-3.911 C-2.494,-9 -1.259,-8.036 -0.915,-6.661 L0,-3 H-4 C-5.657,-3 -7,-4.343 -7,-6 Z"
          />
        </g>
      </g>
    </svg>
  );
}
