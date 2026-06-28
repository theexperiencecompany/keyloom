"use client";

import { ArrowLeft01Icon, Download01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type MemeBackground,
  type MemeTemplate,
  memeBackgrounds,
} from "@/lib/memes";
import { MemeCanvas } from "./meme-canvas";
import {
  downloadBlob,
  encodePlaythroughToMp4,
  hasAudioTrack,
  isWebCodecsSupported,
  muxAudioFromSource,
  recordCanvas,
  webmToMp4,
} from "./meme-export";
import { loadMemeFonts } from "./meme-fonts";
import { MemeInspector } from "./meme-inspector";
import {
  type Caption,
  DEFAULT_CAPTION,
  DEFAULT_TEXT_ATTRS,
  defaultVideoFraming,
  EXPORT_FPS,
  type NodeAttrs,
  OUTPUT_HEIGHT,
  OUTPUT_WIDTH,
  type Selected,
  type TextAttrs,
} from "./meme-layout";

// Force the canvas to be exactly 1080x1920 — no devicePixelRatio doubling. Set
// at module load so it applies BEFORE Konva creates any canvas (a useEffect runs
// too late, after the layer canvas is already built at devicePixelRatio).
if (typeof window !== "undefined") {
  Konva.pixelRatio = 1;
}

export function MemeEditor({
  template,
  onBack,
}: {
  template: MemeTemplate;
  onBack: () => void;
}) {
  const [background, setBackground] = useState<MemeBackground | null>(
    memeBackgrounds[0] ?? null,
  );
  const [customBackgrounds, setCustomBackgrounds] = useState<MemeBackground[]>(
    [],
  );
  const [bgImg, setBgImg] = useState<HTMLImageElement | null>(null);

  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);
  const [vsize, setVsize] = useState({ w: template.width, h: template.height });
  const [videoAttrs, setVideoAttrs] = useState<NodeAttrs>({
    x: 0,
    y: 0,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
  });
  const [textAttrs, setTextAttrs] = useState<TextAttrs>(DEFAULT_TEXT_ATTRS);
  const [caption, setCaption] = useState<Caption>(DEFAULT_CAPTION);

  const [selected, setSelected] = useState<Selected>(null);
  const [playing, setPlaying] = useState(true);
  // Unmuted by default; the browser may still block autoplay until interaction.
  const [muted, setMuted] = useState(false);
  const [volume, setVolume] = useState(1);
  const [audioAvailable, setAudioAvailable] = useState(false);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [mounted, setMounted] = useState(false);
  const [displayScale, setDisplayScale] = useState(0.3);

  const wrapRef = useRef<HTMLDivElement>(null);
  const layerRef = useRef<Konva.Layer>(null);
  const videoNodeRef = useRef<Konva.Image>(null);
  const textNodeRef = useRef<Konva.Text>(null);
  const trRef = useRef<Konva.Transformer>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => setMounted(true), []);

  // Load the meme Google Fonts, then redraw so the canvas picks them up.
  useEffect(() => {
    let cancelled = false;
    loadMemeFonts().then(() => {
      if (!cancelled) layerRef.current?.draw();
    });
    return () => {
      cancelled = true;
    };
  }, []);

  // Fit the full-res stage into the preview box via CSS scale.
  useEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const update = () => {
      const s = Math.min(
        el.clientWidth / OUTPUT_WIDTH,
        el.clientHeight / OUTPUT_HEIGHT,
      );
      if (s > 0) setDisplayScale(s);
    };
    update();
    const ro = new ResizeObserver(update);
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Load the chosen background as a CORS-enabled image.
  useEffect(() => {
    if (!background) {
      setBgImg(null);
      return;
    }
    const img = new Image();
    img.crossOrigin = "anonymous";
    img.onload = () => setBgImg(img);
    img.onerror = () => setBgImg(null);
    img.src = background.src;
  }, [background]);

  // Build the subject <video> as a detached element fed to Konva.Image.
  useEffect(() => {
    const v = document.createElement("video");
    v.src = template.src;
    v.crossOrigin = "anonymous";
    v.loop = true;
    v.muted = false;
    v.playsInline = true;
    v.preload = "auto";
    const onMeta = () => {
      const w = v.videoWidth || template.width;
      const h = v.videoHeight || template.height;
      setVsize({ w, h });
      // Fill width, anchored to the bottom; user resizes with the handles.
      setVideoAttrs(defaultVideoFraming(w, h));
    };
    // Detect once playback starts whether this clip carries an audio track.
    const onPlaying = () => setAudioAvailable(hasAudioTrack(v));
    setAudioAvailable(false);
    v.addEventListener("loadedmetadata", onMeta);
    v.addEventListener("playing", onPlaying);
    v.play().then(
      () => setPlaying(true),
      () => setPlaying(false), // autoplay blocked (likely unmuted) — wait for click
    );
    setVideoEl(v);
    return () => {
      v.pause();
      v.removeEventListener("loadedmetadata", onMeta);
      v.removeEventListener("playing", onPlaying);
      v.src = "";
      setVideoEl(null);
    };
  }, [template.src, template.width, template.height]);

  // Keep the element's mute + volume in sync with the controls.
  useEffect(() => {
    if (!videoEl) return;
    videoEl.muted = muted;
    videoEl.volume = volume;
  }, [videoEl, muted, volume]);

  // Repaint the content layer every frame so the video animates (preview + capture).
  useEffect(() => {
    const layer = layerRef.current;
    if (!videoEl || !layer) return;
    const anim = new Konva.Animation(() => {}, layer);
    anim.start();
    return () => {
      anim.stop();
    };
  }, [videoEl]);

  // Release uploaded object URLs on unmount.
  useEffect(() => {
    return () => {
      for (const b of customBackgrounds) URL.revokeObjectURL(b.src);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const onUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file?.type.startsWith("image/")) return;
    const url = URL.createObjectURL(file);
    const bg: MemeBackground = {
      id: `custom-${url}`,
      title: file.name,
      src: url,
    };
    setCustomBackgrounds((prev) => [...prev, bg]);
    setBackground(bg);
  };

  const syncVideo = () => {
    const n = videoNodeRef.current;
    if (!n) return;
    setVideoAttrs({
      x: n.x(),
      y: n.y(),
      scaleX: n.scaleX(),
      scaleY: n.scaleY(),
      rotation: n.rotation(),
    });
  };

  const syncText = () => {
    const n = textNodeRef.current;
    if (!n) return;
    setTextAttrs((t) => ({
      ...t,
      x: n.x(),
      y: n.y(),
      scaleX: n.scaleX(),
      scaleY: n.scaleY(),
      rotation: n.rotation(),
    }));
  };

  const resetFraming = () => {
    setVideoAttrs(defaultVideoFraming(vsize.w, vsize.h));
    setTextAttrs(DEFAULT_TEXT_ATTRS);
    setSelected(null);
  };

  const togglePlay = () => {
    if (!videoEl) return;
    if (videoEl.paused) {
      videoEl.play().then(
        () => setPlaying(true),
        () => {},
      );
    } else {
      videoEl.pause();
      setPlaying(false);
    }
  };

  const toggleMute = () => setMuted((m) => !m);

  const onVolumeChange = (v: number) => {
    setVolume(v);
    setMuted(v === 0);
  };

  const handleExport = useCallback(async () => {
    const layer = layerRef.current;
    if (!layer || !videoEl) return;
    setSelected(null);
    const canvas = layer.getNativeCanvasElement();
    const prevLoop = videoEl.loop;
    const prevMuted = videoEl.muted;
    const prevPaused = videoEl.paused;
    // Detect audio from the clip itself — the template flag is unreliable.
    const withAudio = hasAudioTrack(videoEl);
    setExporting(true);

    try {
      // Preferred path: deterministic frame-by-frame WebCodecs encode (video
      // only). If the clip has audio, mux the source audio in afterwards.
      if (isWebCodecsSupported()) {
        setStatus("Encoding…");
        videoEl.loop = false;
        videoEl.muted = true;
        const silent = await encodePlaythroughToMp4({
          video: videoEl,
          canvas,
          width: OUTPUT_WIDTH,
          height: OUTPUT_HEIGHT,
          fps: EXPORT_FPS,
          // Composite the just-presented video frame onto the Konva canvas.
          drawFrame: () => layer.draw(),
          onProgress: (f) => setStatus(`Encoding… ${Math.round(f * 100)}%`),
        });
        if (silent) {
          let out = silent;
          if (withAudio) {
            setStatus("Adding audio…");
            out = await muxAudioFromSource(silent, template.src, volume);
          }
          downloadBlob(out, `${template.id}-meme.mp4`);
          setStatus("Downloaded ✓");
          return;
        }
        // silent === null → fast path unavailable here; fall back below.
      }

      setStatus("Recording…");
      videoEl.loop = false;
      videoEl.muted = !withAudio;
      const webm = await recordCanvas({
        canvas,
        video: videoEl,
        withAudio,
        onTick: () => {},
      });
      setStatus("Converting to MP4…");
      const mp4 = await webmToMp4(webm);
      downloadBlob(mp4, `${template.id}-meme.mp4`);
      setStatus("Downloaded ✓");
    } catch (err) {
      console.error("Meme export failed:", err);
      setStatus("Export failed — check the console");
    } finally {
      videoEl.loop = prevLoop;
      videoEl.muted = prevMuted;
      videoEl.currentTime = 0;
      if (!prevPaused) videoEl.play().catch(() => {});
      setExporting(false);
    }
  }, [videoEl, template.src, template.id, volume]);

  const patch = (p: Partial<Caption>) => setCaption((c) => ({ ...c, ...p }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4">
        <div className="flex w-full items-center gap-3">
          <Button variant="ghost" size="sm" onClick={onBack}>
            <HugeiconsIcon icon={ArrowLeft01Icon} size={16} />
            Templates
          </Button>
          <h2 className="truncate text-base font-semibold tracking-tight">
            {template.title}
          </h2>
        </div>
        <div
          ref={wrapRef}
          className="relative flex h-[70vh] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4"
        >
          {mounted && (
            <MemeCanvas
              displayScale={displayScale}
              bgImg={bgImg}
              videoEl={videoEl}
              vsize={vsize}
              videoAttrs={videoAttrs}
              textAttrs={textAttrs}
              caption={caption}
              selected={selected}
              onSelect={setSelected}
              exporting={exporting}
              onSyncVideo={syncVideo}
              onSyncText={syncText}
              playing={playing}
              muted={muted}
              volume={volume}
              audioAvailable={audioAvailable}
              onTogglePlay={togglePlay}
              onToggleMute={toggleMute}
              onVolumeChange={onVolumeChange}
              layerRef={layerRef}
              videoNodeRef={videoNodeRef}
              textNodeRef={textNodeRef}
              trRef={trRef}
            />
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button onClick={handleExport} disabled={exporting}>
            <HugeiconsIcon icon={Download01Icon} size={16} />
            {exporting ? "Exporting…" : "Download MP4"}
          </Button>
          {status && (
            <span className="text-sm text-muted-foreground">{status}</span>
          )}
        </div>
        <p className="text-xs text-muted-foreground">
          Click the subject or caption to select — drag to move, use the handles
          to resize and rotate.
        </p>
      </div>

      <MemeInspector
        background={background}
        customBackgrounds={customBackgrounds}
        onSelectBackground={setBackground}
        fileInputRef={fileInputRef}
        onUploadBackground={onUploadBackground}
        onResetFraming={resetFraming}
        caption={caption}
        onCaptionChange={patch}
      />
    </div>
  );
}
