"use client";

import { useMemo, useState } from "react";
import { Player } from "@remotion/player";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import { componentsById } from "@workspace/compositions/components";
import { FieldsRenderer } from "@workspace/compositions/editors";

export function EditorView({ info }: { info: AnyCompositionInfo }) {
  const Component = componentsById[info.id];
  const [props, setProps] = useState<Record<string, unknown>>(
    () => structuredClone(info.defaultProps) as Record<string, unknown>,
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const playerProps = useMemo(() => props, [props]);

  async function handleDownload() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/render/${info.id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(props),
      });
      if (!res.ok) throw new Error(`Render failed: ${res.status}`);
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${info.id}.mp4`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unknown error");
    } finally {
      setLoading(false);
    }
  }

  if (!Component) {
    return (
      <div className="p-6 text-sm text-red-500">
        No component registered for id &quot;{info.id}&quot;.
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[380px_1fr] lg:min-h-0 lg:flex-1">
      <aside className="flex flex-col border-b border-border lg:border-b-0 lg:border-r lg:min-h-0">
        <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-hidden">
          <FieldsRenderer
            fields={info.fields}
            value={props}
            onChange={setProps}
          />
        </div>
        <div className="shrink-0 border-t border-border p-4">
          <button
            onClick={handleDownload}
            disabled={loading}
            className="w-full rounded-md bg-foreground px-3 py-2 text-sm font-medium text-background hover:opacity-90 disabled:opacity-50"
          >
            {loading ? "Rendering…" : "Download MP4"}
          </button>
          {error && <p className="mt-2 text-[12px] text-red-500">{error}</p>}
        </div>
      </aside>

      <div className="flex items-center justify-center bg-muted/20 p-6 lg:min-h-0">
        <div
          className="w-full max-w-5xl overflow-hidden rounded-lg border border-border bg-background shadow-sm"
          style={{ aspectRatio: `${info.width} / ${info.height}` }}
        >
          <Player
            component={Component}
            inputProps={playerProps}
            durationInFrames={info.durationInFrames}
            fps={info.fps}
            compositionWidth={info.width}
            compositionHeight={info.height}
            style={{ width: "100%", height: "100%" }}
            controls
            loop
            autoPlay
            initiallyMuted
            acknowledgeRemotionLicense
          />
        </div>
      </div>
    </div>
  );
}
