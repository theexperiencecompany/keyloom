"use client";

import type {
  CaptionPos,
  FontKey,
  HAlign,
  VAlign,
} from "@workspace/compositions/compositions/TikTokCaption/config";
import { DEFAULT_FONT_KEY } from "@workspace/compositions/compositions/TikTokCaption/config";
import { DEFAULT_CAPTION_THEME } from "@workspace/compositions/compositions/TikTokCaption/themes";
import { TooltipProvider } from "@workspace/ui/components/tooltip";
import { useCallback, useMemo, useReducer, useRef, useState } from "react";
import { toast } from "sonner";
import {
  probeVideo,
  retimeSegment,
  type Segment,
  segmentsFromWords,
  type VideoMeta,
  visibleWords,
} from "../lib/editor";
import { prepareWhisperAudio } from "../lib/extract-audio";
import type { TranscribeResponse } from "../lib/transcribe";
import { PreviewPanel } from "./preview-panel";
import type { MusicTrack } from "./preview-toolbar";
import { SettingsSidebar } from "./settings-sidebar";
import { type ProcessStep, UploadStage } from "./upload-stage";

type DocState = {
  segments: Segment[];
};

type DocAction =
  | { type: "init"; segments: Segment[] }
  | { type: "edit-segment"; id: string; text: string }
  | { type: "toggle-hidden"; id: string }
  | { type: "delete-segment"; id: string };

function docReducer(state: DocState, action: DocAction): DocState {
  switch (action.type) {
    case "init":
      return { segments: action.segments };
    case "edit-segment":
      return {
        segments: state.segments.flatMap((s) => {
          if (s.id !== action.id) return [s];
          const words = retimeSegment(s, action.text);
          return words.length > 0 ? [{ ...s, words }] : [];
        }),
      };
    case "toggle-hidden":
      return {
        segments: state.segments.map((s) =>
          s.id === action.id ? { ...s, hidden: !s.hidden } : s,
        ),
      };
    case "delete-segment":
      return {
        segments: state.segments.filter((s) => s.id !== action.id),
      };
    default:
      return state;
  }
}

export type CaptionStyle = {
  themeId: string;
  fontKey: FontKey;
  fontScale: number;
  vAlign: VAlign;
  hAlign: HAlign;
  /** Dragged placement; null falls back to the vAlign/hAlign presets. */
  position: CaptionPos | null;
  /** Squeezed box width (fraction of video width); null hugs the text. */
  width: number | null;
  /** Max words shown at once. 1 = word-pop; pauses still break phrases. */
  wordsPerCaption: number;
  textColor: string;
  accentColor: string;
  /** Color-grade preset id from FILTER_PRESETS. */
  filterId: string;
};

const INITIAL_STYLE: CaptionStyle = {
  themeId: DEFAULT_CAPTION_THEME,
  fontKey: DEFAULT_FONT_KEY,
  fontScale: 1,
  vAlign: "bottom",
  hAlign: "center",
  position: null,
  width: null,
  wordsPerCaption: 3,
  textColor: "#ffffff",
  accentColor: "#facc15",
  filterId: "none",
};

type StyleAction = { type: "patch"; patch: Partial<CaptionStyle> };

function styleReducer(state: CaptionStyle, action: StyleAction): CaptionStyle {
  return action.type === "patch" ? { ...state, ...action.patch } : state;
}

type Stage = "idle" | "processing" | "ready";

export function CaptionEditor() {
  const [stage, setStage] = useState<Stage>("idle");
  const [step, setStep] = useState<ProcessStep>("audio");
  const [error, setError] = useState<string | null>(null);
  const [video, setVideo] = useState<VideoMeta | null>(null);
  const [doc, dispatchDoc] = useReducer(docReducer, { segments: [] });
  const [style, dispatchStyle] = useReducer(styleReducer, INITIAL_STYLE);
  const [music, setMusic] = useState<MusicTrack | null>(null);
  const busyRef = useRef(false);

  // Stable identity: this feeds the Player's inputProps via drag callbacks —
  // an inline lambda would churn them on every playhead-driven re-render and
  // force the whole composition (video elements included) to reconcile per
  // frame.
  const patchStyle = useCallback(
    (patch: Partial<CaptionStyle>) => dispatchStyle({ type: "patch", patch }),
    [],
  );

  const handleFile = useCallback(
    async (file: File) => {
      if (busyRef.current) return;
      busyRef.current = true;
      const url = URL.createObjectURL(file);
      setError(null);
      setStage("processing");
      setStep("audio");
      try {
        const meta = await probeVideo(url);
        const upload = await prepareWhisperAudio(file);
        setStep("transcribe");
        const body = new FormData();
        body.append("file", upload.blob, upload.filename);
        const res = await fetch("/api/transcribe", {
          method: "POST",
          body,
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as {
            error?: string;
          };
          throw new Error(err.error ?? `Transcription failed (${res.status})`);
        }
        const data = (await res.json()) as TranscribeResponse;
        const words = data.words.filter((w) => w.text.length > 0);
        if (video) URL.revokeObjectURL(video.url);
        dispatchDoc({ type: "init", segments: segmentsFromWords(words) });
        setVideo({ url, ...meta, filename: file.name });
        setStage("ready");
        toast.success(`Captioned ${words.length} words`);
      } catch (e) {
        URL.revokeObjectURL(url);
        const message = e instanceof Error ? e.message : "Upload failed";
        setError(message);
        setStage(video ? "ready" : "idle");
        toast.error(message);
      } finally {
        busyRef.current = false;
      }
    },
    [video],
  );

  const words = useMemo(() => visibleWords(doc.segments), [doc.segments]);

  const [playhead, setPlayhead] = useState(0);
  const seekRequestRef = useRef<((seconds: number) => void) | null>(null);

  const seekTo = useCallback((t: number) => {
    seekRequestRef.current?.(t);
  }, []);

  if (stage !== "ready" || !video) {
    return (
      <UploadStage
        stage={stage === "processing" ? "processing" : "idle"}
        step={step}
        error={error}
        onFile={handleFile}
      />
    );
  }

  return (
    <TooltipProvider delayDuration={300}>
      <div className="flex min-h-0 flex-1 flex-col gap-4 lg:flex-row">
        <aside className="flex w-full flex-col gap-4 overflow-y-auto pb-1 lg:w-[380px] lg:shrink-0">
          <SettingsSidebar
            style={style}
            onStyle={patchStyle}
            segments={doc.segments}
            playhead={playhead}
            onSeek={seekTo}
            onEditSegment={(id, text) =>
              dispatchDoc({ type: "edit-segment", id, text })
            }
            onToggleHidden={(id) => dispatchDoc({ type: "toggle-hidden", id })}
            onDeleteSegment={(id) =>
              dispatchDoc({ type: "delete-segment", id })
            }
          />
        </aside>
        <PreviewPanel
          video={video}
          words={words}
          style={style}
          music={music}
          onStyle={patchStyle}
          onMusic={setMusic}
          onPlayhead={setPlayhead}
          seekRequestRef={seekRequestRef}
          onReplaceVideo={handleFile}
        />
      </div>
    </TooltipProvider>
  );
}
