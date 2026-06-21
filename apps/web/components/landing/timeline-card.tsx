// Presentational timeline clip card — the exact look of the studio's timeline
// clips (vertical gradient, inner top highlight, drop-shadowed label) so the
// homepage illustrations stay identical to the real editor.

// Gradient classes mirror CLIP_PALETTES in features/studio/lib/clip-colors.
export const CARD_GRADIENTS = {
  violet: "from-violet-400 to-violet-600",
  sky: "from-sky-400 to-sky-600",
  emerald: "from-emerald-400 to-emerald-600",
  amber: "from-amber-400 to-amber-600",
  rose: "from-rose-400 to-rose-600",
  fuchsia: "from-fuchsia-400 to-fuchsia-600",
} as const;

export type CardGradient = keyof typeof CARD_GRADIENTS;

export function TimelineCard({
  gradient,
  label,
  sublabel,
  className,
  height = "h-14",
}: {
  gradient: CardGradient;
  label: string;
  sublabel?: string;
  className?: string;
  height?: string;
}) {
  return (
    <div
      className={`relative flex ${height} flex-col justify-between overflow-hidden rounded-md bg-gradient-to-b px-3 py-2 ${CARD_GRADIENTS[gradient]} ${className ?? ""}`}
    >
      {/* Inner top highlight + outline — matches SortableClipBlock. */}
      <div
        className="pointer-events-none absolute inset-0 rounded-md"
        style={{
          boxShadow:
            "inset 0 1px 0 rgba(255,255,255,0.32), inset 0 0 0 1px rgba(255,255,255,0.10)",
        }}
      />
      <p className="relative truncate text-[11px] font-semibold leading-tight text-white drop-shadow-sm">
        {label}
      </p>
      {sublabel ? (
        <p className="relative truncate text-[10px] tabular-nums text-white/80 drop-shadow-sm">
          {sublabel}
        </p>
      ) : null}
    </div>
  );
}
