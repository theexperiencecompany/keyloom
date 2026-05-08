"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import { Textarea } from "@workspace/ui/components/textarea";
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

    case "image":
      return (
        <Wrapper htmlFor={field.key} label={field.label}>
          <ImageControl
            id={field.key}
            value={(value as string) ?? ""}
            placeholder={field.placeholder}
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

function ImageControl({
  id,
  value,
  placeholder,
  onChange,
}: {
  id: string;
  value: string;
  placeholder?: string;
  onChange: (v: unknown) => void;
}) {
  const hasImage = value.length > 0;

  function handleFile(file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") onChange(reader.result);
    };
    reader.readAsDataURL(file);
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <label
          className="flex h-9 cursor-pointer items-center gap-1.5 rounded-md border border-border bg-muted/40 px-3 text-[12px] font-medium text-foreground transition-colors hover:bg-muted"
          title="Upload an image"
        >
          <svg
            width="13"
            height="13"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
            <polyline points="17 8 12 3 7 8" />
            <line x1="12" y1="3" x2="12" y2="15" />
          </svg>
          Upload
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={(e) => handleFile(e.target.files?.[0] ?? null)}
          />
        </label>
        {hasImage ? (
          <Button variant="outline" size="sm" onClick={() => onChange("")}>
            Clear
          </Button>
        ) : null}
      </div>
      <Input
        id={id}
        value={value.startsWith("data:") ? "" : value}
        placeholder={placeholder ?? "Or paste an image URL"}
        onChange={(e) => onChange(e.target.value)}
      />
      {hasImage ? (
        <div className="overflow-hidden rounded-md border border-border bg-background">
          {/* eslint-disable-next-line @remotion/warn-native-media-tag -- editor preview, not rendered video */}
          <img
            src={value}
            alt="Selected image preview"
            className="block h-28 w-full object-cover"
          />
        </div>
      ) : null}
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
