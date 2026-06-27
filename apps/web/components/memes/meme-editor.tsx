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
import { useCallback, useEffect, useRef, useState } from "react";
import {
  type MemeBackground,
  type MemeTemplate,
  memeBackgrounds,
  memeTemplates,
} from "@/lib/memes";
import { downloadBlob, recordCanvas, webmToMp4 } from "./meme-export";
import { drawMemeFrame, type MemeCaption } from "./meme-render";

const FONTS = [
  { value: "Impact, sans-serif", label: "Impact" },
  { value: "Arial, sans-serif", label: "Arial" },
  { value: "'Inter', sans-serif", label: "Inter" },
  { value: "Georgia, serif", label: "Georgia" },
  { value: "'Comic Sans MS', cursive", label: "Comic Sans" },
];

const WEIGHTS = [
  { value: "400", label: "Normal" },
  { value: "600", label: "Semibold" },
  { value: "700", label: "Bold" },
  { value: "900", label: "Black" },
];

type Offset = { x: number; y: number };

type Params = {
  template: MemeTemplate;
  bgImg: HTMLImageElement | null;
  offset: Offset;
  zoom: number;
  caption: MemeCaption;
};

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
  const [offset, setOffset] = useState<Offset>({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(100);
  const [playing, setPlaying] = useState(true);
  const [exporting, setExporting] = useState(false);
  const [status, setStatus] = useState<string | null>(null);
  const [caption, setCaption] = useState<MemeCaption>({
    text: "when the code works and i'm about to find out why",
    fontFamily: "Impact, sans-serif",
    fontWeight: 700,
    fontSize: 64,
    color: "#ffffff",
    stroke: 6,
    yFraction: 0.08,
  });

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const baseScaleRef = useRef(1);
  const paramsRef = useRef<Params>({
    template,
    bgImg,
    offset,
    zoom,
    caption,
  });

  // Keep the volatile draw inputs in a ref so the rAF loop never goes stale.
  useEffect(() => {
    paramsRef.current = { template, bgImg, offset, zoom, caption };
  });

  // Load the chosen background as a CORS-enabled image (export reads it back).
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

  const computeBaseScale = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const vw = video.videoWidth || template.width;
    const vh = video.videoHeight || template.height;
    baseScaleRef.current = Math.max(canvas.width / vw, canvas.height / vh);
  }, [template.width, template.height]);

  const render = useCallback(() => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const p = paramsRef.current;
    const vw = video.videoWidth || p.template.width;
    const vh = video.videoHeight || p.template.height;
    const W = canvas.width;
    const H = canvas.height;
    const scale = baseScaleRef.current * (p.zoom / 100);
    const drawW = vw * scale;
    const drawH = vh * scale;
    const x = (W - drawW) / 2 + p.offset.x;
    const y = (H - drawH) / 2 + p.offset.y;

    drawMemeFrame(ctx, {
      background: p.bgImg,
      video,
      videoWidth: vw,
      videoHeight: vh,
      transform: { x, y, scale },
      caption: p.caption,
    });
  }, []);

  // Continuous preview loop — reflects drag, zoom, text and the playing clip.
  useEffect(() => {
    let raf = 0;
    const tick = () => {
      render();
      raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [render]);

  // Reset framing whenever the template changes.
  useEffect(() => {
    setOffset({ x: 0, y: 0 });
    setZoom(100);
  }, []);

  // Drag-to-reposition the subject.
  const dragRef = useRef<{
    startX: number;
    startY: number;
    base: Offset;
  } | null>(null);

  const onPointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (exporting) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.setPointerCapture(e.pointerId);
    dragRef.current = { startX: e.clientX, startY: e.clientY, base: offset };
  };

  const onPointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const drag = dragRef.current;
    const canvas = canvasRef.current;
    if (!drag || !canvas) return;
    const rect = canvas.getBoundingClientRect();
    const factor = canvas.width / rect.width;
    setOffset({
      x: drag.base.x + (e.clientX - drag.startX) * factor,
      y: drag.base.y + (e.clientY - drag.startY) * factor,
    });
  };

  const onPointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    dragRef.current = null;
    canvasRef.current?.releasePointerCapture(e.pointerId);
  };

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) {
      video.play().then(
        () => setPlaying(true),
        () => {},
      );
    } else {
      video.pause();
      setPlaying(false);
    }
  };

  const handleExport = async () => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const prevLoop = video.loop;
    const prevMuted = video.muted;
    const prevPaused = video.paused;
    const withAudio = !!template.hasAudio;

    setExporting(true);
    setStatus("Recording…");
    try {
      video.loop = false;
      video.muted = !withAudio;
      const webm = await recordCanvas({
        canvas,
        video,
        withAudio,
        onTick: render,
      });
      setStatus("Converting to MP4…");
      const mp4 = await webmToMp4(webm);
      downloadBlob(mp4, `${template.id}-meme.mp4`);
      setStatus("Downloaded ✓");
    } catch (err) {
      console.error("Meme export failed:", err);
      setStatus("Export failed — check the console");
    } finally {
      video.loop = prevLoop;
      video.muted = prevMuted;
      video.currentTime = 0;
      if (!prevPaused) video.play().catch(() => {});
      setExporting(false);
    }
  };

  const onUploadBackground = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = ""; // allow re-selecting the same file
    if (!file || !file.type.startsWith("image/")) return;
    // blob: URL is same-origin, so the export canvas stays untainted.
    const url = URL.createObjectURL(file);
    const bg: MemeBackground = {
      id: `custom-${url}`,
      title: file.name,
      src: url,
    };
    setCustomBackgrounds((prev) => [...prev, bg]);
    setBackground(bg);
  };

  // Release uploaded object URLs when leaving the page.
  useEffect(() => {
    return () => {
      for (const b of customBackgrounds) URL.revokeObjectURL(b.src);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const patch = (p: Partial<MemeCaption>) =>
    setCaption((c) => ({ ...c, ...p }));

  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
      {/* Preview */}
      <div className="flex flex-col items-center gap-4">
        <div className="relative flex w-full justify-center rounded-xl border border-border bg-muted/30 p-4">
          <canvas
            ref={canvasRef}
            width={template.width}
            height={template.height}
            onPointerDown={onPointerDown}
            onPointerMove={onPointerMove}
            onPointerUp={onPointerUp}
            className={cn(
              "max-h-[70vh] w-auto rounded-lg shadow-sm",
              exporting ? "cursor-wait" : "cursor-grab active:cursor-grabbing",
            )}
          />
          {/* Hidden source clip — muted+loop so it autoplays in preview. */}
          <video
            ref={videoRef}
            src={template.src}
            crossOrigin="anonymous"
            loop
            muted
            playsInline
            autoPlay
            onLoadedMetadata={computeBaseScale}
            className="hidden"
          />
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

        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Zoom</Label>
            <span className="text-xs text-muted-foreground">{zoom}%</span>
          </div>
          <Slider
            min={50}
            max={250}
            step={1}
            value={[zoom]}
            onValueChange={([v]) => setZoom(v ?? 100)}
          />
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setOffset({ x: 0, y: 0 });
              setZoom(100);
            }}
          >
            <HugeiconsIcon icon={RefreshIcon} size={14} />
            Reset position
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
            max={160}
            step={1}
            value={[caption.fontSize]}
            onValueChange={([v]) => patch({ fontSize: v ?? 64 })}
          />

          <div className="flex items-center justify-between">
            <Label className="text-xs">Outline</Label>
            <span className="text-xs text-muted-foreground">
              {caption.stroke}px
            </span>
          </div>
          <Slider
            min={0}
            max={20}
            step={1}
            value={[caption.stroke]}
            onValueChange={([v]) => patch({ stroke: v ?? 0 })}
          />

          <div className="flex items-center justify-between">
            <Label className="text-xs">Vertical position</Label>
            <span className="text-xs text-muted-foreground">
              {Math.round(caption.yFraction * 100)}%
            </span>
          </div>
          <Slider
            min={0}
            max={90}
            step={1}
            value={[caption.yFraction * 100]}
            onValueChange={([v]) => patch({ yFraction: (v ?? 8) / 100 })}
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
