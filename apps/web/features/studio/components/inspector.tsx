"use client";

import { Cancel01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import type { ClipStyle } from "@workspace/compositions/clip-style";
import {
  FieldsRenderer,
  PrimitiveControl,
} from "@workspace/compositions/editors";
import { effectsById } from "@workspace/compositions/effects/registry";
import type { ClipEffect } from "@workspace/compositions/effects/schema";
import type { Clip } from "@workspace/compositions/project";
import type { compositionsById } from "@workspace/compositions/registry";
import { Button } from "@workspace/ui/components/button";
import type { ComponentProps } from "react";

import { ClipStyleSection } from "./clip-style-section";

type Info = NonNullable<(typeof compositionsById)[string]>;

type Props = {
  clip: Clip;
  info: Info;
  onChange: ComponentProps<typeof FieldsRenderer>["onChange"];
  onUpdateStyle: (patch: Partial<ClipStyle>) => void;
  onResetStyle: () => void;
  onUpdateEffect: (
    effectInstanceId: string,
    props: Record<string, unknown>,
  ) => void;
  onRemoveEffect: (effectInstanceId: string) => void;
  onClose: () => void;
};

export function Inspector({
  clip,
  info,
  onChange,
  onUpdateStyle,
  onResetStyle,
  onUpdateEffect,
  onRemoveEffect,
  onClose,
}: Props) {
  const clipEffects = clip.effects ?? [];
  // Locked compositions (Twitter, WhatsApp, Slack, Discord, iMessage)
  // intentionally ignore the universal ClipStyle — hide the Style section
  // for them.
  const supportsStyle = info.brandMode !== "locked";

  return (
    <aside className="flex w-80 shrink-0 flex-col border-l border-border bg-background">
      <div className="flex items-start justify-between gap-3 border-b border-border px-4 py-3">
        <div className="min-w-0">
          <p className="text-xs font-medium text-muted-foreground">Inspector</p>
          <p className="mt-1 truncate text-sm font-medium text-foreground">
            {info.title}
          </p>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close">
          ×
        </Button>
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">
        {supportsStyle && (
          <div className="border-b border-border">
            <ClipStyleSection
              style={clip.style}
              onPatch={onUpdateStyle}
              onReset={onResetStyle}
            />
          </div>
        )}
        <FieldsRenderer
          fields={info.fields}
          value={clip.props}
          onChange={onChange}
        />
        <div className="border-t border-border px-5 py-5">
          <div className="mb-3 flex items-center justify-between">
            <p className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Effects
            </p>
            <span className="text-[10px] text-muted-foreground">
              {clipEffects.length}
            </span>
          </div>
          {clipEffects.length === 0 ? (
            <p className="rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-[11px] text-muted-foreground">
              No effects applied. Open the Library and switch to the Effects
              tab.
            </p>
          ) : (
            <ul className="space-y-3">
              {clipEffects.map((e) => (
                <EffectCard
                  key={e.id}
                  instance={e}
                  onChange={(props) => onUpdateEffect(e.id, props)}
                  onRemove={() => onRemoveEffect(e.id)}
                />
              ))}
            </ul>
          )}
        </div>
      </div>
    </aside>
  );
}

function EffectCard({
  instance,
  onChange,
  onRemove,
}: {
  instance: ClipEffect;
  onChange: (props: Record<string, unknown>) => void;
  onRemove: () => void;
}) {
  const info = effectsById[instance.effectId];
  if (!info) {
    return (
      <li className="flex items-center justify-between gap-2 rounded-md border border-dashed border-border/60 px-3 py-2 text-[12px] text-muted-foreground">
        <span>Unknown effect &ldquo;{instance.effectId}&rdquo;</span>
        <button
          type="button"
          onClick={onRemove}
          title="Remove"
          className="rounded-md border border-border bg-background px-2 py-1 text-[10px] font-medium hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
        >
          Remove
        </button>
      </li>
    );
  }

  function setProp(key: string, v: unknown) {
    onChange({ ...instance.props, [key]: v });
  }

  return (
    <li className="overflow-hidden rounded-md border border-border bg-muted/20">
      <div className="flex items-center justify-between gap-2 border-b border-border/60 px-3 py-1.5">
        <div className="flex min-w-0 items-center gap-1.5">
          <span className="truncate text-[12px] font-medium text-foreground">
            {info.title}
          </span>
          <span className="rounded-sm bg-background px-1.5 py-0.5 text-[9px] uppercase tracking-wider text-muted-foreground">
            {info.trigger}
          </span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          title="Remove effect"
          aria-label="Remove effect"
          className="flex size-6 shrink-0 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
        >
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        </button>
      </div>
      <div className="space-y-3 px-3 py-3">
        {info.fields.map((field) => (
          <PrimitiveControl
            key={field.key}
            field={field}
            value={instance.props[field.key]}
            onChange={(v) => setProp(field.key, v)}
          />
        ))}
      </div>
    </li>
  );
}
