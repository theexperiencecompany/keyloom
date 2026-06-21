"use client";

import { compositions } from "@workspace/compositions/registry";
import { Composer, type MentionItem } from "@workspace/ui/components/composer";
import { useMemo, useRef, useState } from "react";
import { isAgentVisible } from "@/lib/agent/catalog";

type Props = {
  /** Hands the brief to the agent (opens the agent panel and sends it). */
  onSubmit: (text: string, mentions: string[]) => void;
  /** Opens the full library panel for manual scene-adding. */
  onBrowse: () => void;
};

export function AgentLauncher({ onSubmit, onBrowse }: Props) {
  const [value, setValue] = useState("");
  const mentionsRef = useRef<string[]>([]);

  const mentionItems = useMemo<MentionItem[]>(
    () =>
      compositions
        .filter((c) => isAgentVisible(c.id))
        .map((c) => ({ id: c.id, label: c.title, hint: c.category })),
    [],
  );

  function submit(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;
    onSubmit(trimmed, mentionsRef.current);
    mentionsRef.current = [];
    setValue("");
  }

  return (
    <div className="mx-auto my-auto w-full max-w-xl px-6">
      <Composer
        value={value}
        onChange={setValue}
        onSubmit={submit}
        mentionItems={mentionItems}
        onMentionsChange={(ids) => {
          mentionsRef.current = ids;
        }}
        placeholder="Describe a video to build…"
      />
      <p className="mt-3 text-center text-[12px] text-muted-foreground">
        <kbd className="rounded bg-muted px-1 py-0.5 font-sans text-[11px] text-muted-foreground">
          ↵
        </kbd>{" "}
        to build
        <span className="px-1.5 text-muted-foreground/40">·</span>
        <span className="font-medium text-foreground/70">@</span> to add a scene
        <span className="px-1.5 text-muted-foreground/40">·</span>
        or{" "}
        <button
          type="button"
          onClick={onBrowse}
          className="underline underline-offset-2 transition-colors hover:text-foreground"
        >
          browse the library
        </button>
      </p>
    </div>
  );
}
