"use client";

import { Player } from "@remotion/player";
import { renderMediaOnWeb } from "@remotion/web-renderer";
import { componentsById } from "@workspace/compositions/components";
import { FieldsRenderer } from "@workspace/compositions/editors";
import { compositionsById } from "@workspace/compositions/registry";
import type { AnyCompositionInfo } from "@workspace/compositions/schema";
import { Button } from "@workspace/ui/components/button";
import { useEffect, useMemo, useState } from "react";
import { downloadMp4Blob } from "@/features/studio/lib/local-export";

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

  // The server strips `calculateMetadata` (it's a function), so recompute the
  // duration here from the full client-side registry entry — otherwise a
  // composition whose length depends on its props (e.g. a chat that grows with
  // its messages) would be clipped to the static default and its last bubble
  // would never render.
  const calculateMetadata = compositionsById[info.id]?.calculateMetadata;
  const [durationInFrames, setDurationInFrames] = useState(
    info.durationInFrames,
  );
  useEffect(() => {
    if (!calculateMetadata) {
      setDurationInFrames(info.durationInFrames);
      return;
    }
    let cancelled = false;
    Promise.resolve(calculateMetadata({ props }))
      .then((meta) => {
        if (!cancelled && meta?.durationInFrames) {
          setDurationInFrames(meta.durationInFrames);
        }
      })
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, [calculateMetadata, props, info.durationInFrames]);

  async function handleDownload() {
    if (!Component) return;
    setLoading(true);
    setProgress(0);
    setError(null);
    try {
      const result = await renderMediaOnWeb({
        composition: {
          id: info.id,
          component: Component as React.ComponentType<Record<string, unknown>>,
          width: info.width,
          height: info.height,
          fps: info.fps,
          durationInFrames,
        },
        inputProps: props,
        container: "mp4",
        videoCodec: "h264",
        // Let the browser pick a working encoder. Forcing "prefer-hardware"
        // together with the very high bitrate below made hardware encoders
        // reject the config outright (avc1.640029 @ 50 Mbps unsupported).
        hardwareAcceleration: "no-preference",
        // High bitrate keeps text edges crisp without shimmer, but 50 Mbps
        // exceeds many encoders' limits — 16 Mbps is still visually lossless
        // at 720p/1080p and is broadly supported.
        videoBitrate: 16_000_000,
        onProgress: ({ progress: p }) => setProgress(p),
      });
      const blob = await result.getBlob();
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
      <aside className="flex flex-col border-b border-border lg:sticky lg:top-0 lg:h-screen lg:border-b-0 lg:border-r">
        <div className="flex flex-col lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
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

      <div className="flex items-center justify-center bg-muted/20 p-4 lg:min-h-0">
        <div
          className="max-h-full w-full max-w-[1600px] overflow-hidden rounded-lg border border-border bg-background shadow-sm"
          style={{ aspectRatio: `${info.width} / ${info.height}` }}
        >
          <Player
            component={Component}
            inputProps={playerProps}
            durationInFrames={durationInFrames}
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
