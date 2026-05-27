import { randomUUID } from "node:crypto";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";
import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";
export const maxDuration = 60;

// Whisper rejects files over 25 MB.
const WHISPER_MAX_BYTES = 25 * 1024 * 1024;

const PUBLIC_AUDIO_DIR = path.join(process.cwd(), "public", "audio", "shorts");

export type CaptionWord = {
  start: number;
  end: number;
  text: string;
};

export type TranscribeResponse = {
  audioUrl: string;
  duration: number;
  words: CaptionWord[];
};

type WhisperResponse = {
  text?: string;
  duration?: number;
  words?: { word: string; start: number; end: number }[];
};

export async function POST(req: NextRequest) {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "OPENAI_API_KEY is not set on the server" },
      { status: 500 },
    );
  }

  let form: FormData;
  try {
    form = await req.formData();
  } catch {
    return NextResponse.json(
      { error: "Expected multipart/form-data" },
      { status: 400 },
    );
  }

  const file = form.get("file");
  if (!(file instanceof File)) {
    return NextResponse.json(
      { error: "Missing 'file' field" },
      { status: 400 },
    );
  }
  if (file.size === 0) {
    return NextResponse.json({ error: "Empty file" }, { status: 400 });
  }
  if (file.size > WHISPER_MAX_BYTES) {
    return NextResponse.json(
      {
        error: `File too large (max ${Math.floor(
          WHISPER_MAX_BYTES / 1024 / 1024,
        )} MB)`,
      },
      { status: 413 },
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());

  const ext = inferExtension(file.name, file.type);
  const id = randomUUID();
  const fileName = `${id}.${ext}`;
  await mkdir(PUBLIC_AUDIO_DIR, { recursive: true });
  await writeFile(path.join(PUBLIC_AUDIO_DIR, fileName), buffer);
  const audioUrl = `/audio/shorts/${fileName}`;

  const whisperForm = new FormData();
  whisperForm.append(
    "file",
    new Blob([new Uint8Array(buffer)], { type: file.type || "audio/mpeg" }),
    file.name || `${id}.${ext}`,
  );
  whisperForm.append("model", "whisper-1");
  whisperForm.append("response_format", "verbose_json");
  whisperForm.append("timestamp_granularities[]", "word");

  const whisperRes = await fetch(
    "https://api.openai.com/v1/audio/transcriptions",
    {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}` },
      body: whisperForm,
    },
  );

  if (!whisperRes.ok) {
    const errText = await whisperRes.text().catch(() => "");
    return NextResponse.json(
      {
        error: `Whisper request failed: ${whisperRes.status} ${whisperRes.statusText}`,
        detail: errText.slice(0, 500),
      },
      { status: 502 },
    );
  }

  const whisper = (await whisperRes.json()) as WhisperResponse;
  const words: CaptionWord[] =
    whisper.words?.map((w) => ({
      start: w.start,
      end: w.end,
      text: w.word.trim(),
    })) ?? [];

  if (words.length === 0) {
    return NextResponse.json(
      { error: "Whisper returned no word-level timestamps" },
      { status: 502 },
    );
  }

  const lastEnd = words[words.length - 1]?.end ?? 0;
  const duration = whisper.duration ?? lastEnd;

  const payload: TranscribeResponse = { audioUrl, duration, words };
  return NextResponse.json(payload);
}

function inferExtension(name: string, type: string): string {
  const fromName = name.includes(".")
    ? name.split(".").pop()?.toLowerCase()
    : undefined;
  if (fromName && /^[a-z0-9]{2,5}$/.test(fromName)) return fromName;
  if (type.includes("mpeg")) return "mp3";
  if (type.includes("wav")) return "wav";
  if (type.includes("mp4")) return "m4a";
  if (type.includes("ogg")) return "ogg";
  if (type.includes("webm")) return "webm";
  return "mp3";
}
