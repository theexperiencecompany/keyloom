import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";

/**
 * Process-local registry of completed server-side renders. The `/api/render`
 * route writes an MP4 to a temp file and registers it here; the
 * `/api/render/result/[id]` route reads + deletes it.
 *
 * Entries expire after `TTL_MS` so we don't leak temp files when the client
 * abandons the download.
 */

type Entry = {
  filePath: string;
  filename: string;
  expiresAt: number;
};

const TTL_MS = 10 * 60 * 1000;

const store = new Map<string, Entry>();

export function tempPathFor(id: string): string {
  return path.join(os.tmpdir(), `motion-studio-${id}.mp4`);
}

export function registerRender(id: string, filePath: string, filename: string) {
  store.set(id, {
    filePath,
    filename,
    expiresAt: Date.now() + TTL_MS,
  });
  scheduleSweep();
}

export function consumeRender(id: string): Entry | null {
  const entry = store.get(id);
  if (!entry) return null;
  if (entry.expiresAt < Date.now()) {
    store.delete(id);
    void fs.unlink(entry.filePath).catch(() => {});
    return null;
  }
  store.delete(id);
  return entry;
}

let sweepHandle: NodeJS.Timeout | null = null;
function scheduleSweep() {
  if (sweepHandle) return;
  sweepHandle = setTimeout(() => {
    sweepHandle = null;
    const now = Date.now();
    for (const [id, entry] of store) {
      if (entry.expiresAt < now) {
        store.delete(id);
        void fs.unlink(entry.filePath).catch(() => {});
      }
    }
    if (store.size > 0) scheduleSweep();
  }, TTL_MS);
  // Don't hold the event loop open just for sweeping.
  if (typeof sweepHandle.unref === "function") sweepHandle.unref();
}
