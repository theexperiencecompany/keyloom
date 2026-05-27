import type { Metadata } from "next";
import { ShortsBuilder } from "./shorts-builder";

export const metadata: Metadata = {
  title: "Shorts — Generate TikTok-style captions from audio",
  description:
    "Drop an MP3 voiceover and get a vertical, word-timed caption video powered by OpenAI Whisper.",
};

export default function ShortsPage() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-6xl px-6 py-10">
        <header className="mb-8 space-y-2">
          <h1 className="text-3xl font-semibold tracking-tight">Shorts</h1>
          <p className="text-sm text-muted-foreground">
            Upload an MP3 voiceover. Whisper transcribes it with word-level
            timestamps and we render a TikTok-style 9:16 caption track on top of
            your audio.
          </p>
        </header>
        <ShortsBuilder />
      </div>
    </main>
  );
}
