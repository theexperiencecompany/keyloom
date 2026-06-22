import type { Layout } from "@workspace/ui/components/resizable";
import { useCallback, useEffect, useRef, useState } from "react";

// Bump the version key when changing default panel sizes so old persisted
// layouts don't pin panels at sizes that no longer make sense.
const LAYOUT_STORAGE_KEY = "studio-layout-v4";
const STALE_KEYS = ["studio-layout-v1", "studio-layout-v2", "studio-layout-v3"];

/**
 * Persisted studio panel layout. The stored layout MUST NOT be read during the
 * initial render (the server has no localStorage and renders panels at default
 * sizes — reading on the client's first render would cause a hydration
 * mismatch). So we start `undefined`, load after mount, and remount the panel
 * group via `layoutKey` so the restored sizes take effect. Persistence is gated
 * on `loaded` so the default-sized first mount can't overwrite the saved layout.
 */
export function useStudioLayout() {
  const [layout, setLayout] = useState<Layout | undefined>(undefined);
  const [layoutKey, setLayoutKey] = useState("initial");
  const loadedRef = useRef(false);

  useEffect(() => {
    try {
      for (const key of STALE_KEYS) window.localStorage.removeItem(key);
      const raw = window.localStorage.getItem(LAYOUT_STORAGE_KEY);
      if (raw) setLayout(JSON.parse(raw) as Layout);
    } catch {
      // localStorage may be disabled (private mode / quota); silent fallback.
    }
    loadedRef.current = true;
    setLayoutKey("loaded");
  }, []);

  const handleLayoutChanged = useCallback((next: Layout) => {
    if (!loadedRef.current) return;
    setLayout(next);
    try {
      window.localStorage.setItem(LAYOUT_STORAGE_KEY, JSON.stringify(next));
    } catch {
      // localStorage may be disabled (private mode / quota); silent fallback.
    }
  }, []);

  return { layout, layoutKey, handleLayoutChanged };
}
