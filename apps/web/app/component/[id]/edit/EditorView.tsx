"use client";

import { Player } from "@remotion/player";
import { componentsById } from "@workspace/compositions/components";
import { FieldsRenderer } from "@workspace/compositions/editors";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import { Button } from "@workspace/ui/components/button";
import { useMemo, useState } from "react";
import {
  downloadMp4Blob,
  renderComponentInBrowser,
} from "@/features/studio/lib/browser-export";

export function EditorView({
  info,
}: {
  info: Omit<AnyCompositionInfo, "calculateMetadata">;
}) {
  const Component = componentsById[info.id];
  const [props, setProps] = useState<Record<string, unknown>>(
    () => structuredClone(info.defaultProps) as Record<string, unknown>,
  );
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);

  const playerProps = useMemo(() => props, [props]);

  async function handleDownload() {
    if (!Component) return;
    setLoading(true);
    setProgress(0);
    setError(null);
    try {
      const blob = await renderComponentInBrowser({
        component: Component,
        inputProps: props,
        durationInFrames: info.durationInFrames,
        fps: info.fps,
        width: info.width,
        height: info.height,
        onProgress: setProgress,
      });
      downloadMp4Blob(blob, `${info.id}.mp4`);
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
          <Button
            className="w-full"
            onClick={handleDownload}
            disabled={loading}
          >
            {loading
              ? `Rendering… ${Math.round(progress * 100)}%`
              : "Download MP4"}
          </Button>
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
