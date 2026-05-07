"use client";

import type { Field } from "../schema";
import { PrimitiveControl } from "./primitives";
import { ChatEditor } from "./ChatEditor";

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
  const primitives = fields.filter((f) => f.kind !== "chat");
  const chatField = fields.find((f) => f.kind === "chat");

  return (
    <div className="flex h-full min-h-0 flex-col">
      {primitives.length > 0 && (
        <div
          className={`shrink-0 space-y-4 px-5 py-5 ${
            hasChatField ? "border-b border-border" : ""
          }`}
        >
          {primitives.map((field) => (
            <PrimitiveControl
              key={field.key}
              field={field}
              value={value[field.key]}
              onChange={(v) => set(field.key, v)}
            />
          ))}
        </div>
      )}
      {chatField && (
        <div className="flex min-h-0 flex-1 flex-col">
          <ChatEditor
            value={(value[chatField.key] ?? []) as never}
            onChange={(v) => set(chatField.key, v)}
          />
        </div>
      )}
    </div>
  );
}
