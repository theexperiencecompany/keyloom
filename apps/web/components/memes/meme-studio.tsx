"use client";

import { useEffect, useState } from "react";
import { type MemeTemplate, memeAsset, memeTemplates } from "@/lib/memes";
import { loadMemeFonts, MemeEditor } from "./meme-editor";
import { MemeGallery } from "./meme-gallery";

/**
 * Two-step flow: browse the template gallery (fetched from R2), then click one
 * to open the editor for it. Falls back to the static registry if the listing
 * route returns nothing (no R2 creds configured).
 */
export function MemeStudio() {
  const [templates, setTemplates] = useState<MemeTemplate[]>(memeTemplates);
  const [selected, setSelected] = useState<MemeTemplate | null>(null);

  // Load the meme fonts up front so gallery caption previews render correctly.
  useEffect(() => {
    loadMemeFonts();
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/meme-templates")
      .then((r) => r.json())
      .then(
        (data: {
          templates?: { id: string; title: string; key: string }[];
        }) => {
          if (cancelled || !data.templates?.length) return;
          setTemplates(
            data.templates.map((t) => ({
              id: t.id,
              title: t.title,
              src: memeAsset(t.key),
              width: 1080,
              height: 1920,
              hasAudio: false,
            })),
          );
        },
      )
      .catch(() => {});
    return () => {
      cancelled = true;
    };
  }, []);

  if (selected) {
    return <MemeEditor template={selected} onBack={() => setSelected(null)} />;
  }
  return <MemeGallery templates={templates} onSelect={setSelected} />;
}
