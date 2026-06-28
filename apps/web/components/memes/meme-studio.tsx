"use client";

import { useQuery } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { type MemeTemplate, memeAsset, memeTemplates } from "@/lib/memes";
import { MemeEditor } from "./meme-editor";
import { loadMemeFonts } from "./meme-fonts";
import { MemeGallery } from "./meme-gallery";

type TemplateListItem = { id: string; title: string; key: string };

async function fetchMemeTemplates(): Promise<MemeTemplate[]> {
  const res = await fetch("/api/meme-templates");
  if (!res.ok) throw new Error(`Templates request failed: ${res.status}`);
  const data: { templates?: TemplateListItem[] } = await res.json();
  if (!data.templates?.length) return memeTemplates; // R2 not configured → static
  return data.templates.map((t) => ({
    id: t.id,
    title: t.title,
    src: memeAsset(t.key),
    width: 1080,
    height: 1920,
    hasAudio: false,
  }));
}

/**
 * Two-step flow: browse the template gallery (fetched from R2 via React Query so
 * it's cached/deduped across mounts), then click one to open the editor for it.
 * Shows the static registry as placeholder data until the live list resolves.
 */
export function MemeStudio() {
  const [selected, setSelected] = useState<MemeTemplate | null>(null);

  // Load the meme fonts up front so gallery caption previews render correctly.
  useEffect(() => {
    loadMemeFonts();
  }, []);

  const { data: templates = memeTemplates } = useQuery({
    queryKey: ["meme-templates"],
    queryFn: fetchMemeTemplates,
    staleTime: 5 * 60 * 1000,
    placeholderData: memeTemplates,
  });

  if (selected) {
    return <MemeEditor template={selected} onBack={() => setSelected(null)} />;
  }
  return <MemeGallery templates={templates} onSelect={setSelected} />;
}
