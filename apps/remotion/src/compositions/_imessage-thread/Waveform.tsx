// iOS 26 dictation glyph: five rounded bars, tallest in the middle.
const BAR_W = 2;
const BAR_PITCH = 4.4;
const BAR_HEIGHTS = [4.6, 9.2, 17.6, 9.2, 4.6];
const WAVE_W = BAR_PITCH * (BAR_HEIGHTS.length - 1) + BAR_W;
const WAVE_H = Math.max(...BAR_HEIGHTS);

export function Waveform({
  color,
  style,
}: {
  color: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg
      width={WAVE_W}
      height={WAVE_H}
      viewBox={`0 0 ${WAVE_W} ${WAVE_H}`}
      style={{ display: "block", flexShrink: 0, ...style }}
      aria-hidden
    >
      {BAR_HEIGHTS.map((h, i) => (
        <rect
          key={`${i}-${h}`}
          x={i * BAR_PITCH}
          y={(WAVE_H - h) / 2}
          width={BAR_W}
          height={h}
          rx={BAR_W / 2}
          fill={color}
        />
      ))}
    </svg>
  );
}
