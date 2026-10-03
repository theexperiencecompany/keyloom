import { useEffect, useState } from "react";

/**
 * Live elapsed-time ticker. While `ticking` is true and we have a startedAt,
 * re-renders every 100ms and reports the elapsed ms; once finishedAt is set
 * the value freezes at `finishedAt - startedAt`.
 */
export function useElapsed(
  startedAt: number | null,
  finishedAt: number | null,
  ticking: boolean,
): number {
  const [, force] = useState(0);
  useEffect(() => {
    if (!ticking || startedAt == null || finishedAt != null) return;
    const id = window.setInterval(() => force((n) => n + 1), 100);
    return () => window.clearInterval(id);
  }, [ticking, startedAt, finishedAt]);
  if (startedAt == null) return 0;
  return (finishedAt ?? Date.now()) - startedAt;
}

/** Format an ms duration as "0.4s", "12.3s", or "1m 34s". */
export function formatElapsed(ms: number): string {
  if (ms < 0) return "0.0s";
  if (ms < 60_000) return `${(ms / 1000).toFixed(1)}s`;
  const min = Math.floor(ms / 60_000);
  const sec = Math.round((ms % 60_000) / 1000);
  return `${min}m ${sec}s`;
}
