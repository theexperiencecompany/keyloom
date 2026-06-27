"use client";

import {
  Download01Icon,
  ImageAdd02Icon,
  PauseIcon,
  PlayIcon,
  RefreshIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { Slider } from "@workspace/ui/components/slider";
import { Textarea } from "@workspace/ui/components/textarea";
import { cn } from "@workspace/ui/lib/utils";
import Konva from "konva";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  Image as KonvaImage,
  Text as KonvaText,
  Layer,
  Rect,
  Stage,
  Transformer,
} from "react-konva";
import {
  type MemeBackground,
  type MemeTemplate,
  memeBackgrounds,
  memeTemplates,
} from "@/lib/memes";
import { downloadBlob, recordCanvas, webmToMp4 } from "./meme-export";

// Memes always export 9:16, regardless of a template's native size. The Stage is
// authored at this resolution and CSS-scaled down to fit the screen.
const OUTPUT_WIDTH = 1080;
const OUTPUT_HEIGHT = 1920;

const FONTS = [
  { value: "Impact", label: "Impact" },
  { value: "Arial", label: "Arial" },
  { value: "Inter", label: "Inter" },
  { value: "Georgia", label: "Georgia" },
  { value: "Comic Sans MS", label: "Comic Sans" },
];

const WEIGHTS = [
  { value: "400", label: "Normal" },
  { value: "700", label: "Bold" },
  { value: "900", label: "Black" },
];

type NodeAttrs = {
  x: number;
  y: number;
  scaleX: number;
  scaleY: number;
  rotation: number;
};

type Caption = {
  text: string;
  fontFamily: string;
  fontWeight: number;
  fontSize: number;
  color: string;
  stroke: number;
};

type Selected = "video" | "text" | null;

/** object-fit: cover crop rect for a background image into the 9:16 frame. */
function coverCrop(img: HTMLImageElement) {
  const iw = img.naturalWidth;
  const ih = img.naturalHeight;
  const ar = iw / ih;
  const bar = OUTPUT_WIDTH / OUTPUT_HEIGHT;
  let cw: number;
  let ch: number;
  if (ar > bar) {
    ch = ih;
    cw = ih * bar;
  } else {
    cw = iw;
    ch = iw / bar;
  }
  return { x: (iw - cw) / 2, y: (ih - ch) / 2, width: cw, height: ch };
}

export function MemeEditor() {
  const [template, setTemplate] = useState<MemeTemplate>(
    memeTemplates[0] as MemeTemplate,
  );
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
  const [textAttrs, setTextAttrs] = useState<NodeAttrs & { width: number }>({
    x: OUTPUT_WIDTH * 0.1,
    y: OUTPUT_HEIGHT * 0.07,
    scaleX: 1,
    scaleY: 1,
    rotation: 0,
    width: OUTPUT_WIDTH * 0.8,
  });
  const [caption, setCaption] = useState<Caption>({
    text: "when the code works and i'm about to find out why",
    fontFamily: "Impact",
    fontWeight: 700,
    fontSize: 72,
    color: "#ffffff",
    stroke: 8,
  });

  const [selected, setSelected] = useState<Selected>(null);
  const [playing, setPlaying] = useState(true);
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

  // Export at exactly 1080x1920 (no devicePixelRatio doubling).
  useEffect(() => {
    Konva.pixelRatio = 1;
  }, []);

  useEffect(() => setMounted(true), []);

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
    v.muted = true;
    v.playsInline = true;
    v.preload = "auto";
    const onMeta = () => {
      const w = v.videoWidth || template.width;
      const h = v.videoHeight || template.height;
      setVsize({ w, h });
      // contain into 9:16 by default; user resizes with the handles.
      const scale = Math.min(OUTPUT_WIDTH / w, OUTPUT_HEIGHT / h);
      setVideoAttrs({
        x: (OUTPUT_WIDTH - w * scale) / 2,
        y: (OUTPUT_HEIGHT - h * scale) / 2,
        scaleX: scale,
        scaleY: scale,
        rotation: 0,
      });
    };
    v.addEventListener("loadedmetadata", onMeta);
    v.play().then(
      () => setPlaying(true),
      () => {},
    );
    setVideoEl(v);
    return () => {
      v.pause();
      v.removeEventListener("loadedmetadata", onMeta);
      v.src = "";
      setVideoEl(null);
    };
  }, [template.src, template.width, template.height]);

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

  // Attach the Transformer to the selected node.
  useEffect(() => {
    const tr = trRef.current;
    if (!tr) return;
    const node =
      selected === "video"
        ? videoNodeRef.current
        : selected === "text"
          ? textNodeRef.current
          : null;
    tr.nodes(node ? [node] : []);
    tr.getLayer()?.batchDraw();
  }, [selected, videoEl]);

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
    const scale = Math.min(OUTPUT_WIDTH / vsize.w, OUTPUT_HEIGHT / vsize.h);
    setVideoAttrs({
      x: (OUTPUT_WIDTH - vsize.w * scale) / 2,
      y: (OUTPUT_HEIGHT - vsize.h * scale) / 2,
      scaleX: scale,
      scaleY: scale,
      rotation: 0,
    });
    setTextAttrs({
      x: OUTPUT_WIDTH * 0.1,
      y: OUTPUT_HEIGHT * 0.07,
      scaleX: 1,
      scaleY: 1,
      rotation: 0,
      width: OUTPUT_WIDTH * 0.8,
    });
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

  const handleExport = useCallback(async () => {
    const layer = layerRef.current;
    if (!layer || !videoEl) return;
    setSelected(null);
    const canvas = layer.getNativeCanvasElement();
    const prevLoop = videoEl.loop;
    const prevMuted = videoEl.muted;
    const prevPaused = videoEl.paused;
    const withAudio = !!template.hasAudio;
    setExporting(true);
    setStatus("Recording…");
    try {
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
  }, [videoEl, template.hasAudio, template.id]);

  const patch = (p: Partial<Caption>) => setCaption((c) => ({ ...c, ...p }));

  const fontStyle = caption.fontWeight >= 600 ? "bold" : "normal";

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4">
        <div
          ref={wrapRef}
          className="relative flex h-[70vh] w-full items-center justify-center overflow-hidden rounded-xl border border-border bg-muted/30 p-4"
        >
          {mounted && (
            <div
              style={{
                width: OUTPUT_WIDTH * displayScale,
                height: OUTPUT_HEIGHT * displayScale,
              }}
            >
              <div
                style={{
                  width: OUTPUT_WIDTH,
                  height: OUTPUT_HEIGHT,
                  transform: `scale(${displayScale})`,
                  transformOrigin: "top left",
                }}
              >
                <Stage
                  width={OUTPUT_WIDTH}
                  height={OUTPUT_HEIGHT}
                  onMouseDown={(e) => {
                    if (e.target === e.target.getStage()) setSelected(null);
                  }}
                  onTouchStart={(e) => {
                    if (e.target === e.target.getStage()) setSelected(null);
                  }}
                >
                  <Layer ref={layerRef}>
                    {bgImg ? (
                      <KonvaImage
                        image={bgImg}
                        width={OUTPUT_WIDTH}
                        height={OUTPUT_HEIGHT}
                        crop={coverCrop(bgImg)}
                        listening={false}
                      />
                    ) : (
                      <Rect
                        width={OUTPUT_WIDTH}
                        height={OUTPUT_HEIGHT}
                        fill="#000000"
                        listening={false}
                      />
                    )}

                    {videoEl && (
                      <KonvaImage
                        ref={videoNodeRef}
                        image={videoEl}
                        width={vsize.w}
                        height={vsize.h}
                        x={videoAttrs.x}
                        y={videoAttrs.y}
                        scaleX={videoAttrs.scaleX}
                        scaleY={videoAttrs.scaleY}
                        rotation={videoAttrs.rotation}
                        draggable={!exporting}
                        onMouseDown={() => setSelected("video")}
                        onTap={() => setSelected("video")}
                        onDragEnd={syncVideo}
                        onTransformEnd={syncVideo}
                      />
                    )}

                    <KonvaText
                      ref={textNodeRef}
                      text={caption.text}
                      x={textAttrs.x}
                      y={textAttrs.y}
                      width={textAttrs.width}
                      scaleX={textAttrs.scaleX}
                      scaleY={textAttrs.scaleY}
                      rotation={textAttrs.rotation}
                      fontFamily={caption.fontFamily}
                      fontSize={caption.fontSize}
                      fontStyle={fontStyle}
                      fill={caption.color}
                      stroke="#000000"
                      strokeWidth={caption.stroke}
                      fillAfterStrokeEnabled
                      lineHeight={1.15}
                      align="center"
                      draggable={!exporting}
                      onMouseDown={() => setSelected("text")}
                      onTap={() => setSelected("text")}
                      onDragEnd={syncText}
                      onTransformEnd={syncText}
                    />
                  </Layer>

                  <Layer>
                    <Transformer
                      ref={trRef}
                      rotateEnabled
                      keepRatio={false}
                      ignoreStroke
                      anchorSize={18}
                      borderStrokeWidth={2}
                    />
                  </Layer>
                </Stage>
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center gap-3">
          <Button variant="outline" onClick={togglePlay} disabled={exporting}>
            <HugeiconsIcon icon={playing ? PauseIcon : PlayIcon} size={16} />
            {playing ? "Pause" : "Play"}
          </Button>
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

      {/* Inspector */}
      <div className="flex flex-col gap-6">
        <section className="space-y-2">
          <Label>Template</Label>
          <div className="flex flex-wrap gap-2">
            {memeTemplates.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setTemplate(t)}
                className={cn(
                  "rounded-md border px-3 py-1.5 text-sm transition-colors",
                  t.id === template.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted",
                )}
              >
                {t.title}
              </button>
            ))}
          </div>
        </section>

        <section className="space-y-2">
          <Label>Background</Label>
          <div className="grid grid-cols-3 gap-2">
            {[...memeBackgrounds, ...customBackgrounds].map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setBackground(b)}
                className={cn(
                  "relative aspect-square overflow-hidden rounded-md border",
                  b.id === background?.id
                    ? "border-primary ring-2 ring-primary/40"
                    : "border-border",
                )}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={b.src}
                  alt={b.title}
                  crossOrigin="anonymous"
                  className="size-full object-cover"
                />
              </button>
            ))}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex aspect-square flex-col items-center justify-center gap-1 rounded-md border border-dashed border-border text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            >
              <HugeiconsIcon icon={ImageAdd02Icon} size={18} />
              <span className="text-[10px]">Upload</span>
            </button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onUploadBackground}
            className="hidden"
          />
        </section>

        <section>
          <Button variant="outline" size="sm" onClick={resetFraming}>
            <HugeiconsIcon icon={RefreshIcon} size={14} />
            Reset framing
          </Button>
        </section>

        <section className="space-y-3">
          <Label>Caption</Label>
          <Textarea
            value={caption.text}
            onChange={(e) => patch({ text: e.target.value })}
            rows={3}
            placeholder="Meme text…"
          />

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Font</Label>
              <Select
                value={caption.fontFamily}
                onValueChange={(v) => patch({ fontFamily: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {FONTS.map((f) => (
                    <SelectItem key={f.value} value={f.value}>
                      {f.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Weight</Label>
              <Select
                value={String(caption.fontWeight)}
                onValueChange={(v) => patch({ fontWeight: Number(v) })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {WEIGHTS.map((w) => (
                    <SelectItem key={w.value} value={w.value}>
                      {w.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="flex items-center justify-between">
            <Label className="text-xs">Size</Label>
            <span className="text-xs text-muted-foreground">
              {caption.fontSize}px
            </span>
          </div>
          <Slider
            min={24}
            max={200}
            step={1}
            value={[caption.fontSize]}
            onValueChange={([v]) => patch({ fontSize: v ?? 72 })}
          />

          <div className="flex items-center justify-between">
            <Label className="text-xs">Outline</Label>
            <span className="text-xs text-muted-foreground">
              {caption.stroke}px
            </span>
          </div>
          <Slider
            min={0}
            max={24}
            step={1}
            value={[caption.stroke]}
            onValueChange={([v]) => patch({ stroke: v ?? 0 })}
          />

          <div className="space-y-1.5">
            <Label className="text-xs">Color</Label>
            <Input
              type="color"
              value={caption.color}
              onChange={(e) => patch({ color: e.target.value })}
              className="h-9 w-full p-1"
            />
          </div>
        </section>
      </div>
    </div>
  );
}
