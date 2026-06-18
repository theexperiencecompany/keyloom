"use client";

import {
  ArrowReloadHorizontalIcon,
  Cancel01Icon,
  LockedIcon,
} from "@hugeicons/core-free-icons";
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
import type { SceneTransition } from "@workspace/compositions/transitions";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import type { ComponentProps } from "react";

import { ClipStyleSection } from "./clip-style-section";
import { TransitionSection } from "./transition-section";

type Info = NonNullable<(typeof compositionsById)[string]>;

export type InspectorTab = "content" | "messages" | "style" | "motion";

type Props = {
  clip: Clip;
  info: Info;
  isFirst: boolean;
  fps: number;
  projectDefaultTransition: SceneTransition | undefined;
  tab: InspectorTab;
  onTabChange: (tab: InspectorTab) => void;
  onChange: ComponentProps<typeof FieldsRenderer>["onChange"];
  onUpdateStyle: (patch: Partial<ClipStyle>) => void;
  onResetStyle: () => void;
  onUpdateTransition: (transition: SceneTransition | undefined) => void;
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
  isFirst,
  fps,
  projectDefaultTransition,
  tab,
  onTabChange,
  onChange,
  onUpdateStyle,
  onResetStyle,
  onUpdateTransition,
  onUpdateEffect,
  onRemoveEffect,
  onClose,
}: Props) {
  const clipEffects = clip.effects ?? [];
  const isLocked = info.brandMode === "locked";

  // Chat compositions (MessageBubbles, WhatsApp, …) get a dedicated "Messages"
  // tab for the conversation editor, so it has the full panel height and isn't
  // crammed under the other settings. Everything else stays on the General tab.
  const hasChatField = info.fields.some((f) => f.kind === "chat");
  const generalFields = info.fields.filter((f) => f.kind !== "chat");
  const chatFields = info.fields.filter((f) => f.kind === "chat");
  // The conversation lives under the chat field's key; clearing it empties the
  // thread so the user can start a fresh conversation from scratch.
  const chatKey = chatFields[0]?.key;
  const chatMessages = chatKey
    ? (clip.props[chatKey] as unknown[] | undefined)
    : undefined;
  const hasMessages = Array.isArray(chatMessages) && chatMessages.length > 0;
  const clearMessages = () => {
    if (chatKey) onChange({ ...clip.props, [chatKey]: [] });
  };
  // If a non-chat clip is selected while the Messages tab was active, fall back
  // to General so the panel isn't blank.
  const activeTab = tab === "messages" && !hasChatField ? "content" : tab;

  const hasStyleOverrides = Boolean(
    clip.style?.backgroundColor ||
      clip.style?.textColor ||
      clip.style?.fontFamily ||
      clip.style?.accentColor ||
      clip.style?.backgroundScene ||
      clip.style?.theme,
  );
  const hasTransitionOverride = clip.transition !== undefined;
  const motionBadgeCount = (hasTransitionOverride ? 1 : 0) + clipEffects.length;

  const durationSec = (clip.durationInFrames / fps).toFixed(1);

  return (
    <aside className="flex h-full min-h-0 w-full flex-col border-l border-border bg-background">
      <div className="flex items-center justify-between gap-2 px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2">
          <p className="truncate text-sm font-medium text-foreground">
            {info.title}
          </p>
          <span className="shrink-0 rounded-sm bg-muted px-1.5 py-0.5 font-mono text-[10px] text-muted-foreground">
            {durationSec}s
          </span>
        </div>
        <Button variant="ghost" size="icon-sm" onClick={onClose} title="Close">
          <HugeiconsIcon icon={Cancel01Icon} className="size-3.5" />
        </Button>
      </div>

      <Tabs
        value={activeTab}
        onValueChange={(v) => onTabChange(v as InspectorTab)}
        className="flex min-h-0 flex-1 flex-col"
      >
        <div className="px-3 py-2">
          <TabsList className="w-full">
            <TabsTrigger value="content" className="flex-1">
              {hasChatField ? "General" : "Content"}
            </TabsTrigger>
            {hasChatField && (
              <TabsTrigger value="messages" className="flex-1">
                Messages
              </TabsTrigger>
            )}
            <TabsTrigger value="style" className="flex-1">
              <span className="flex items-center gap-1.5">
                Style
                {hasStyleOverrides && <Dot />}
              </span>
            </TabsTrigger>
            <TabsTrigger value="motion" className="flex-1">
              <span className="flex items-center gap-1.5">
                Motion
                {motionBadgeCount > 0 && <Badge count={motionBadgeCount} />}
              </span>
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="content" className="min-h-0 flex-1 overflow-y-auto">
          <FieldsRenderer
            fields={generalFields}
            value={clip.props}
            onChange={onChange}
          />
        </TabsContent>

        {hasChatField && (
          <TabsContent
            value="messages"
            className="flex min-h-0 flex-1 flex-col overflow-hidden"
          >
            <div className="flex items-center justify-between border-b border-border px-4 py-2">
              <span className="text-[11px] font-medium text-muted-foreground">
                Conversation
              </span>
              <Button
                variant="ghost"
                size="icon-sm"
                onClick={clearMessages}
                disabled={!hasMessages}
                title="Clear all messages"
              >
                <HugeiconsIcon
                  icon={ArrowReloadHorizontalIcon}
                  className="size-3.5"
                />
              </Button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              <FieldsRenderer
                fields={chatFields}
                value={clip.props}
                onChange={onChange}
              />
            </div>
          </TabsContent>
        )}

        <TabsContent value="style" className="min-h-0 flex-1 overflow-y-auto">
          {isLocked && (
            <div className="flex items-start gap-2 border-b border-border bg-muted/30 px-5 py-3">
              <HugeiconsIcon
                icon={LockedIcon}
                className="mt-0.5 size-3.5 shrink-0 text-muted-foreground"
              />
              <p className="text-[11px] leading-relaxed text-muted-foreground">
                {info.themes?.length
                  ? "This composition uses authentic brand styling. Pick a curated theme to restyle it."
                  : "This composition uses authentic brand styling. Color and font changes won’t affect the preview."}
              </p>
            </div>
          )}
          <ClipStyleSection
            key={clip.id}
            style={clip.style}
            onPatch={onUpdateStyle}
            onReset={onResetStyle}
            themes={info.themes}
            locked={isLocked}
          />
        </TabsContent>

        <TabsContent value="motion" className="min-h-0 flex-1 overflow-y-auto">
          <Accordion
            type="multiple"
            defaultValue={
              clipEffects.length > 0
                ? ["transition", "effects"]
                : ["transition"]
            }
          >
            <AccordionItem value="transition" className="border-b">
              <AccordionTrigger className="px-5 py-3 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  Transition
                  {hasTransitionOverride && <Dot />}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <TransitionSection
                  transition={clip.transition}
                  projectDefault={projectDefaultTransition}
                  isFirst={isFirst}
                  fps={fps}
                  clipDurationInFrames={clip.durationInFrames}
                  onChange={onUpdateTransition}
                />
              </AccordionContent>
            </AccordionItem>

            <AccordionItem value="effects" className="border-b-0">
              <AccordionTrigger className="px-5 py-3 text-sm font-semibold text-foreground">
                <span className="flex items-center gap-2">
                  Effects
                  {clipEffects.length > 0 && (
                    <Badge count={clipEffects.length} />
                  )}
                </span>
              </AccordionTrigger>
              <AccordionContent className="px-0 pb-0">
                <div className="px-5 pb-5">
                  {clipEffects.length === 0 ? (
                    <p className="rounded-md border border-dashed border-border/60 px-3 py-3 text-center text-[11px] text-muted-foreground">
                      No effects. Open the Library &rarr; Effects tab to add
                      one.
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
              </AccordionContent>
            </AccordionItem>
          </Accordion>
        </TabsContent>
      </Tabs>
    </aside>
  );
}

function Dot() {
  return <span className="size-1.5 rounded-full bg-foreground/70" />;
}

function Badge({ count }: { count: number }) {
  return (
    <span className="flex h-4 min-w-4 items-center justify-center rounded-full bg-foreground/10 px-1 text-[9px] font-medium text-foreground/70">
      {count}
    </span>
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
