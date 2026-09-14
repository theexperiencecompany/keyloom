/**
 * Shared shape of the `/api/transcribe` response: word-level timestamps (in
 * seconds) from Whisper, reshaped into what the caption compositions consume.
 */
export type CaptionWord = {
  start: number;
  end: number;
  text: string;
};

export type TranscribeResponse = {
  duration: number;
  words: CaptionWord[];
};
