"use client";

import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import { compositions } from "../registry";
import type { Field } from "../schema";
import { ChatEditor } from "./ChatEditor";
import { PrimitiveControl } from "./primitives";

type Props = {
  fields: Field[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
};

export function FieldsRenderer({ fields, value, onChange }: Props) {
  function set(key: string, v: unknown) {
    onChange({ ...value, [key]: v });
  }

  const hasChatField = fields.some((f) => f.kind === "chat");
  const flatFields = fields.filter((f) => f.kind !== "chat");
  const chatField = fields.find((f) => f.kind === "chat");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {flatFields.length > 0 && (
        <div
          className={`shrink-0 space-y-4 px-5 py-5 ${
            hasChatField ? "border-b border-border" : ""
          }`}
        >
          {flatFields.map((field) => {
            if (field.kind === "composition") {
              return (
                <CompositionPicker
                  key={field.key}
                  fieldKey={field.key}
                  label={field.label}
                  exclude={field.exclude}
                  value={(value[field.key] as string) ?? ""}
                  onChange={(v) => set(field.key, v)}
                />
              );
            }
            if (field.kind === "slots") {
              return (
                <SlotsControl
                  key={field.key}
                  fieldKey={field.key}
                  label={field.label}
                  exclude={field.exclude}
                  counts={field.counts}
                  layoutValue={(value[field.layoutKey] as string) ?? ""}
                  value={(value[field.key] as string[]) ?? []}
                  onChange={(v) => set(field.key, v)}
                />
              );
            }
            return (
              <PrimitiveControl
                key={field.key}
                field={field}
                value={value[field.key]}
                onChange={(v) => set(field.key, v)}
              />
            );
          })}
        </div>
      )}
      {chatField && chatField.kind === "chat" && (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="shrink-0 px-5 py-3">
            <p className="text-xs font-semibold text-foreground">
              {chatField.label}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Preview of the conversation rendered in the video
            </p>
          </div>
          <ChatEditor
            value={(value[chatField.key] ?? []) as never}
            onChange={(v) => set(chatField.key, v)}
          />
        </div>
      )}
    </div>
  );
}

function CompositionPicker({
  fieldKey,
  label,
  exclude,
  value,
  onChange,
}: {
  fieldKey: string;
  label: string;
  exclude?: string[];
  value: string;
  onChange: (v: string) => void;
}) {
  const excluded = new Set(exclude ?? []);
  const options = compositions.filter((c) => !excluded.has(c.id));
  const current = value || options[0]?.id || "";

  return (
    <div className="space-y-1.5">
      <Label htmlFor={fieldKey} className="text-[12px]">
        {label}
      </Label>
      <Select value={current} onValueChange={onChange}>
        <SelectTrigger id={fieldKey}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {options.map((o) => (
            <SelectItem key={o.id} value={o.id}>
              {o.title}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

function SlotsControl({
  fieldKey,
  label,
  exclude,
  counts,
  layoutValue,
  value,
  onChange,
}: {
  fieldKey: string;
  label: string;
  exclude?: string[];
  counts: Record<string, number>;
  layoutValue: string;
  value: string[];
  onChange: (next: string[]) => void;
}) {
  const slotCount = counts[layoutValue] ?? 2;
  const current = Array.from({ length: slotCount }, (_, i) => value[i] ?? "");

  function setSlot(i: number, id: string) {
    const next = current.slice();
    next[i] = id;
    onChange(next);
  }

  return (
    <div className="space-y-3 rounded-md border border-border/60 bg-muted/20 p-3">
      <div className="text-[12px] font-medium">{label}</div>
      {current.map((id, i) => (
        <CompositionPicker
          key={i}
          fieldKey={`${fieldKey}-${i}`}
          label={`Slot ${i + 1}`}
          exclude={exclude}
          value={id}
          onChange={(v) => setSlot(i, v)}
        />
      ))}
    </div>
  );
}
