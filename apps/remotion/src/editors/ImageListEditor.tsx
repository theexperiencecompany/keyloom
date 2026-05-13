"use client";

import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";

export type ImageListItem = {
  name: string;
  url: string;
};

type Props = {
  label: string;
  itemLabel?: string;
  max?: number;
  value: ImageListItem[];
  onChange: (next: ImageListItem[]) => void;
};

export function ImageListEditor({
  label,
  itemLabel = "Item",
  max,
  value,
  onChange,
}: Props) {
  const items = Array.isArray(value) ? value : [];

  function update(index: number, patch: Partial<ImageListItem>) {
    onChange(
      items.map((item, i) => (i === index ? { ...item, ...patch } : item)),
    );
  }
  function remove(index: number) {
    onChange(items.filter((_, i) => i !== index));
  }
  function move(index: number, direction: -1 | 1) {
    const target = index + direction;
    if (target < 0 || target >= items.length) return;
    const next = items.slice();
    [next[index], next[target]] = [next[target]!, next[index]!];
    onChange(next);
  }
  function add() {
    onChange([...items, { name: `${itemLabel} ${items.length + 1}`, url: "" }]);
  }
  function readFile(index: number, file: File | null) {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        update(index, { url: reader.result });
      }
    };
    reader.readAsDataURL(file);
  }

  const atMax = typeof max === "number" && items.length >= max;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="text-[12px] font-medium">{label}</div>
        <div className="text-[10px] text-muted-foreground">
          {items.length}
          {typeof max === "number" ? ` / ${max}` : ""}
        </div>
      </div>
      <ul className="space-y-2">
        {items.map((item, i) => (
          <li
            key={i}
            className="rounded-md border border-border/60 bg-muted/20 p-2.5 space-y-2"
          >
            <div className="flex items-center gap-2">
              {item.url ? (
                // biome-ignore lint/a11y/useAltText: editor preview only
                // eslint-disable-next-line @remotion/warn-native-media-tag
                <img
                  src={item.url}
                  alt=""
                  className="h-9 w-9 shrink-0 rounded border border-border object-contain bg-background"
                />
              ) : (
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded border border-dashed border-border text-[10px] text-muted-foreground">
                  IMG
                </div>
              )}
              <Input
                value={item.name}
                placeholder={`${itemLabel} name`}
                className="flex-1"
                onChange={(e) => update(i, { name: e.target.value })}
              />
              <div className="flex shrink-0 items-center gap-0.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(i, -1)}
                  disabled={i === 0}
                  title="Move up"
                >
                  ↑
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => move(i, 1)}
                  disabled={i === items.length - 1}
                  title="Move down"
                >
                  ↓
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  onClick={() => remove(i)}
                  title="Remove"
                >
                  ×
                </Button>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <label className="flex h-8 cursor-pointer items-center gap-1.5 rounded border border-border bg-muted/40 px-2.5 text-[11px] font-medium hover:bg-muted">
                Upload
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => readFile(i, e.target.files?.[0] ?? null)}
                />
              </label>
              <Input
                value={item.url.startsWith("data:") ? "" : item.url}
                placeholder="Or paste image URL"
                className="h-8 text-[11px]"
                onChange={(e) => update(i, { url: e.target.value })}
              />
              {item.url.startsWith("data:") && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => update(i, { url: "" })}
                >
                  Clear
                </Button>
              )}
            </div>
          </li>
        ))}
      </ul>
      <Button
        type="button"
        variant="outline"
        size="sm"
        onClick={add}
        disabled={atMax}
        className="w-full"
      >
        + Add {itemLabel.toLowerCase()}
      </Button>
    </div>
  );
}
