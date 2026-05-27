"use client";

import { motion } from "motion/react";
import Image from "next/image";
import type { CSSProperties } from "react";

export type HeroStickerProps = {
  src: string;
  width: number;
  rotate: number;
  /** CSS positional offsets (use any subset of left/right/top/bottom). */
  position: Pick<CSSProperties, "left" | "right" | "top" | "bottom">;
  /** Bob animation duration in seconds. Defaults to 3.6. */
  duration?: number;
  /** Bob travel distance in px. Defaults to 8. */
  distance?: number;
  /** Stagger delay so multiple stickers don't bob in sync. */
  delay?: number;
};

/**
 * Two nested motion elements:
 *   - outer wrapper handles `drag` (translates via transform)
 *   - inner image handles the slow bob (animates `y`)
 * Splitting them prevents the drag transform from fighting the bob keyframes.
 */
export function HeroSticker({
  src,
  width,
  rotate,
  position,
  duration = 3.6,
  distance = 8,
  delay = 0,
}: HeroStickerProps) {
  return (
    <motion.div
      drag
      dragMomentum={false}
      dragElastic={0.4}
      whileDrag={{ scale: 1.06, zIndex: 50 }}
      whileHover={{ scale: 1.04 }}
      className="absolute z-20 hidden cursor-grab active:cursor-grabbing xl:block"
      style={{ ...position, touchAction: "none" }}
    >
      <motion.div
        animate={{ y: [0, -distance, 0] }}
        transition={{
          duration,
          delay,
          repeat: Infinity,
          ease: "easeInOut",
        }}
        className="block select-none"
        style={{ width, rotate: `${rotate}deg` }}
      >
        <Image
          src={src}
          alt=""
          aria-hidden
          draggable={false}
          width={width}
          height={width}
          className="block h-auto w-full select-none"
        />
      </motion.div>
    </motion.div>
  );
}
