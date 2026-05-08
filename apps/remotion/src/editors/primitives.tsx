"use client";

import { Input } from "@workspace/ui/components/input";
import { Textarea } from "@workspace/ui/components/textarea";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import type { PrimitiveField } from "../schema";

type Props = {
  field: PrimitiveField;
  value: unknown;
  onChange: (v: unknown) => void;
};

export function PrimitiveControl({ field, value, onChange }: Props) {
  switch (field.kind) {
    case "text":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Input
            id={field.key}
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
            onChange={(e) => onChange(e.target.value)}
          />
        </Wrapper>
      );

    case "textarea":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Textarea
            id={field.key}
            value={(value as string) ?? ""}
            rows={field.rows ?? 3}
            onChange={(e) => onChange(e.target.value)}
          />
        </Wrapper>
      );

    case "number":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Input
            id={field.key}
            type="number"
            value={(value as number) ?? 0}
            min={field.min}
            max={field.max}
            onChange={(e) => onChange(Number(e.target.value))}
          />
        </Wrapper>
      );

    case "color":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <ColorControl
            id={field.key}
            value={(value as string) ?? "#ffffff"}
            onChange={onChange}
          />
        </Wrapper>
      );

    case "select": {
      const current = (value as string) ?? field.options[0]?.value ?? "";
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <Select value={current} onValueChange={(v) => onChange(v)}>
            <SelectTrigger id={field.key}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {field.options.map((o) => (
                <SelectItem key={o.value} value={o.value}>
                  {o.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Wrapper>
      );
    }
  }
}

function Wrapper({
  htmlFor,
  label,
  children,
}: {
  htmlFor: string;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label htmlFor={htmlFor} className="text-[12px]">
        {label}
      </Label>
      {children}
    </div>
  );
}

function ColorControl({
  id,
  value,
  onChange,
}: {
  id: string;
  value: string;
  onChange: (v: unknown) => void;
}) {
  const looksHex = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(value);
  const swatchValue = looksHex ? value : "#ffffff";

  return (
    <div className="flex items-center gap-2">
      <label
        className="relative size-9 shrink-0 cursor-pointer overflow-hidden rounded-full border border-border ring-offset-background transition-shadow hover:ring-2 hover:ring-ring/40"
        style={{ background: swatchValue }}
        title="Pick color"
      >
        <input
          type="color"
          aria-label="Pick color"
          value={swatchValue}
          onChange={(e) => onChange(e.target.value)}
          className="absolute inset-0 size-full cursor-pointer opacity-0"
        />
      </label>
      <Input
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="font-mono"
        spellCheck={false}
      />
    </div>
  );
}
