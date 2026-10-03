"use client";

import { cn } from "@workspace/ui/lib/utils";
import { cva, type VariantProps } from "class-variance-authority";
import type { FC } from "react";
import "./wave-spinner.css";

const DELAY_PATTERNS = {
  /** Diagonal wave from top-left */
  diagonalTL: [0, 0.12, 0.24, 0.12, 0.24, 0.36, 0.24, 0.36, 0.48],
  /** Horizontal wave */
  horizontal: [0, 0.12, 0.24, 0, 0.12, 0.24, 0, 0.12, 0.24],
} as const;

const DOT_COUNTS = {
  square3x3: 9,
  line: 3,
} as const;

const COLOR_PRESETS = {
  primary: "#00bbff",
} as const;

const waveSpinnerVariants = cva("flex items-center justify-center w-fit", {
  variants: {
    size: {
      xs: "[--dot-size:3px] [--gap-size:1px]",
      sm: "[--dot-size:4px] [--gap-size:1.5px]",
      md: "[--dot-size:6px] [--gap-size:2px]",
      lg: "[--dot-size:8px] [--gap-size:3px]",
      xl: "[--dot-size:10px] [--gap-size:4px]",
    },
  },
  defaultVariants: {
    size: "md",
  },
});

export interface WaveSpinnerProps
  extends VariantProps<typeof waveSpinnerVariants> {
  color?: keyof typeof COLOR_PRESETS;
  /** Both layouts sit in a 3-column grid; `line` fills only the first row */
  pattern?: keyof typeof DOT_COUNTS;
  animation?: keyof typeof DELAY_PATTERNS;
  /** Animation duration in seconds */
  duration?: number;
  dotShape?: "square" | "rounded" | "circle";
  className?: string;
  "aria-label"?: string;
}

export const WaveSpinner: FC<WaveSpinnerProps> = ({
  color = "primary",
  pattern = "square3x3",
  animation = "diagonalTL",
  duration = 0.7,
  dotShape = "square",
  size,
  className,
  "aria-label": ariaLabel = "Loading",
}) => {
  const borderRadius =
    dotShape === "circle" ? "50%" : dotShape === "rounded" ? "30%" : "0";
  const delays = DELAY_PATTERNS[animation].slice(0, DOT_COUNTS[pattern]);

  return (
    <div
      className={cn(waveSpinnerVariants({ size }), className)}
      role="status"
      aria-label={ariaLabel}
    >
      <div className="relative flex items-center justify-center">
        <div
          className="relative grid"
          style={{
            gridTemplateColumns: "repeat(3, var(--dot-size))",
            gap: "var(--gap-size)",
          }}
        >
          {delays.map((delay, idx) => (
            <div
              // biome-ignore lint/suspicious/noArrayIndexKey: fixed grid count
              key={idx}
              className="transition-all wave-spinner-dot wave-spinner-dot--pulse"
              style={{
                width: "var(--dot-size)",
                height: "var(--dot-size)",
                backgroundColor: COLOR_PRESETS[color],
                borderRadius,
                ["--wave-spinner-duration" as string]: `${duration}s`,
                ["--wave-spinner-delay" as string]: `${delay}s`,
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};
