"use client";

import { cn } from "@workspace/ui/lib/utils";
import {
  getContrastColor,
  getLuminance,
  parseColor,
} from "@workspace/ui/lib/utils/color-utils";
import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import * as React from "react";

const buttonVariants = cva(
  "relative inline-flex cursor-pointer items-center justify-center gap-2 border border-primary/50 bg-primary text-sm font-medium whitespace-nowrap text-primary-foreground subpixel-antialiased shadow-md transition-all transition-transform duration-200 before:absolute before:inset-0 before:border-t before:border-white/40 before:bg-gradient-to-b before:from-white/20 before:to-transparent hover:bg-primary/90 focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none active:scale-[0.96] disabled:pointer-events-none disabled:opacity-50 dark:bg-zinc-500 dark:text-white",
  {
    variants: {
      variant: {
        default: "",
      },
      size: {
        default: "h-10 rounded-xl px-4 py-2 before:rounded-xl",
        sm: "h-9 rounded-lg px-3 before:rounded-xl",
        lg: "h-11 rounded-lg px-8 before:rounded-lg",
        icon: "h-10 w-10",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  color?: string;
  asChild?: boolean;
}

const RaisedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    { className, variant, size, color, asChild = false, style = {}, ...props },
    ref,
  ) => {
    const Comp = asChild ? Slot.Root : "button";

    const dynamicStyles = React.useMemo(() => {
      if (!color) return {};

      try {
        const rgb = parseColor(color);
        if (!rgb) return {};

        const luminance = getLuminance(rgb);
        const textColor = getContrastColor(luminance);
        const borderOpacity = 0.5;
        const hoverOpacity = 0.9;
        const whiteBorderOpacity = 0.6;
        const whiteGradientOpacity = 0.3;
        const shadowOpacity = 0.2;
        const shadowSpread = "0px";
        const shadowBlur = "5px";

        return {
          backgroundColor: color,
          color: textColor,
          borderColor: `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${borderOpacity})`,
          "--hover-bg": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${hoverOpacity})`,
          "--border": `rgba(255, 255, 255, ${whiteBorderOpacity})`,
          "--gradient": `rgba(255, 255, 255, ${whiteGradientOpacity})`,
          "--shadow-color": `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${shadowOpacity})`,
          boxShadow: `0 4px ${shadowBlur} ${shadowSpread} var(--shadow-color)`,
          transition: "all 0.2s ease-in-out",
        };
      } catch (e) {
        console.error("Error processing color:", e);
        return {};
      }
    }, [color]);

    const computedClassName = cn(
      buttonVariants({ variant, size, className }),
      color &&
        "overflow-hidden before:border-[color:var(--border)] before:from-[color:var(--gradient)] hover:bg-[color:var(--hover-bg)] hover:opacity-80",
    );

    return (
      <Comp
        className={computedClassName}
        ref={ref}
        style={{
          ...style,
          ...dynamicStyles,
        }}
        {...props}
      />
    );
  },
);
RaisedButton.displayName = "RaisedButton";

export { buttonVariants, RaisedButton };
