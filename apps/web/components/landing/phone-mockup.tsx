import { cn } from "@workspace/ui/lib/utils";

type PhoneMockupProps = {
  /** Video shown on the screen (object-cover). */
  videoSrc?: string;
  /** Poster/fallback image. */
  poster?: string;
  /** Optional custom screen content (overrides the video). */
  children?: React.ReactNode;
  /**
   * How the video/poster fills the screen. "cover" crops to fill (default);
   * "contain" shows the whole frame — use when the source aspect differs from
   * the phone's tall 9:19.5 screen (e.g. a 9:16 clip) and you don't want cropping.
   */
  fit?: "cover" | "contain";
  className?: string;
};

/**
 * A pure-CSS iPhone (dynamic-island) mockup. No external image needed — the
 * frame, side buttons, island and home indicator are all drawn with Tailwind,
 * so it stays crisp at any size. Drop a video or custom node on the screen.
 */
export function PhoneMockup({
  videoSrc,
  poster,
  children,
  fit = "cover",
  className,
}: PhoneMockupProps) {
  const fitClass = fit === "contain" ? "object-contain" : "object-cover";
  return (
    <div
      className={cn(
        "relative aspect-[9/19.5] w-64 rounded-[2.75rem] p-[0.55rem] shadow-2xl sm:w-72",
        "bg-[linear-gradient(150deg,#2a2a2e_0%,#0f0f12_50%,#1a1a1d_100%)]",
        "ring-1 ring-white/10 [box-shadow:0_40px_90px_-20px_rgba(0,0,0,0.55),0_0_0_1.5px_rgba(255,255,255,0.06)_inset]",
        className,
      )}
    >
      {/* Side buttons */}
      <span className="absolute -left-[2px] top-[22%] h-16 w-[3px] rounded-l bg-gradient-to-b from-zinc-700 via-zinc-500 to-zinc-700" />
      <span className="absolute -left-[2px] top-[37%] h-10 w-[3px] rounded-l bg-gradient-to-b from-zinc-700 via-zinc-500 to-zinc-700" />
      <span className="absolute -left-[2px] top-[46%] h-10 w-[3px] rounded-l bg-gradient-to-b from-zinc-700 via-zinc-500 to-zinc-700" />
      <span className="absolute -right-[2px] top-[30%] h-20 w-[3px] rounded-r bg-gradient-to-b from-zinc-700 via-zinc-500 to-zinc-700" />

      {/* Screen */}
      <div className="relative h-full w-full overflow-hidden rounded-[2.25rem] bg-black">
        {children ??
          (videoSrc ? (
            // biome-ignore lint/a11y/useMediaCaption: decorative product preview
            <video
              src={videoSrc}
              poster={poster}
              autoPlay
              muted
              loop
              playsInline
              className={cn("absolute inset-0 h-full w-full", fitClass)}
            />
          ) : poster ? (
            // biome-ignore lint/performance/noImgElement: static decorative frame fill
            <img
              src={poster}
              alt=""
              aria-hidden
              className={cn("absolute inset-0 h-full w-full", fitClass)}
            />
          ) : null)}

        {/* Dynamic island */}
        <div className="absolute left-1/2 top-2.5 z-10 h-7 w-24 -translate-x-1/2 rounded-full bg-black" />

        {/* Home indicator */}
        <div className="absolute bottom-2 left-1/2 z-10 h-1.5 w-28 -translate-x-1/2 rounded-full bg-white/60 mix-blend-exclusion" />
      </div>
    </div>
  );
}
