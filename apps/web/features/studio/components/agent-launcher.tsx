"use client";

import { compositions } from "@workspace/compositions/registry";
import { Composer, type MentionItem } from "@workspace/ui/components/composer";
import { useMemo, useRef, useState } from "react";
import { isAgentVisible } from "@/lib/agent/catalog";

// Understated prompt starters shown beneath the composer.
const PROMPTS = [
  "20s product launch video",
  "A tweet, then a Slack reaction",
  "Intro title → walkthrough → outro",
];

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
    <div className="mx-auto my-auto w-full max-w-2xl px-6 py-12">
      <div className="space-y-2 text-center">
        <h1 className="text-[26px] font-semibold tracking-tight text-foreground">
          What are we making?
        </h1>
        <p className="text-[15px] leading-relaxed text-muted-foreground">
          Describe a video and the agent builds the timeline — scenes, copy, and
          timing, all in one go.
        </p>
      </div>

      <div className="mt-7">
        <Composer
          value={value}
          onChange={setValue}
          onSubmit={submit}
          mentionItems={mentionItems}
          onMentionsChange={(ids) => {
            mentionsRef.current = ids;
          }}
          placeholder="Describe the video you want… (@ to mention a scene)"
        />
      </div>

      <div className="mt-4 flex flex-wrap items-center justify-center gap-2">
        {PROMPTS.map((p) => (
          <button
            key={p}
            type="button"
            onClick={() => submit(p)}
            className="rounded-full border border-border bg-background px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-foreground/20 hover:text-foreground"
          >
            {p}
          </button>
        ))}
      </div>

      <div className="mt-8 text-center">
        <button
          type="button"
          onClick={onBrowse}
          className="text-[13px] text-muted-foreground underline-offset-4 transition-colors hover:text-foreground hover:underline"
        >
          or add a scene from the library
        </button>
      </div>
    </div>
  );
}
