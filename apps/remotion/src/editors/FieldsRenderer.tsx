"use client";

import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@workspace/ui/components/select";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@workspace/ui/components/tabs";
import { compositions, compositionsById } from "../registry";
import type { Field, SectionField } from "../schema";
import { ChatEditor } from "./ChatEditor";
import { ImageListEditor, type ImageListItem } from "./ImageListEditor";
import { PrimitiveControl } from "./primitives";
import { ScenarioEditor } from "./ScenarioEditor";
import {
  type TerminalLineItem,
  TerminalLinesEditor,
} from "./TerminalLinesEditor";

type Props = {
  fields: Field[];
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
  /** Drop the outer padding so this renderer can nest inside accordions / panels. */
  compact?: boolean;
};

export function FieldsRenderer({
  fields,
  value,
  onChange,
  compact = false,
}: Props) {
  function set(key: string, v: unknown) {
    onChange({ ...value, [key]: v });
  }

  const hasChatField = fields.some((f) => f.kind === "chat");
  const hasScenarioField = fields.some((f) => f.kind === "scenario");
  const sectionFields = fields.filter(
    (f): f is SectionField => f.kind === "section",
  );
  const flatFields = fields.filter(
    (f) => f.kind !== "chat" && f.kind !== "section" && f.kind !== "scenario",
  );
  // imageList renders inline among flat fields.
  const chatField = fields.find((f) => f.kind === "chat");
  const scenarioField = fields.find((f) => f.kind === "scenario");

  return (
    <div className={`flex min-h-0 flex-col ${hasChatField ? "h-full" : ""}`}>
      {flatFields.length > 0 && (
        <div
          className={`shrink-0 space-y-4 ${compact ? "px-3 py-3" : "px-5 py-5"} ${
            hasChatField || hasScenarioField || sectionFields.length > 0
              ? "border-b border-border"
              : ""
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
            if (field.kind === "imageList") {
              return (
                <ImageListEditor
                  key={field.key}
                  label={field.label}
                  itemLabel={field.itemLabel}
                  max={field.max}
                  value={(value[field.key] as ImageListItem[]) ?? []}
                  onChange={(v) => set(field.key, v)}
                />
              );
            }
            if (field.kind === "terminalLines") {
              return (
                <TerminalLinesEditor
                  key={field.key}
                  label={field.label}
                  value={(value[field.key] as TerminalLineItem[]) ?? []}
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
            if (field.kind === "innerProps") {
              return (
                <InnerPropsControl
                  key={field.key}
                  fieldKey={field.key}
                  label={field.label}
                  innerCompositionId={
                    (value[field.compositionKey] as string) ?? ""
                  }
                  value={(value[field.key] as Record<string, unknown>) ?? {}}
                  onChange={(v) => set(field.key, v)}
                />
              );
            }
            if (field.kind === "audio") {
              return (
                <PrimitiveControl
                  key={field.key}
                  field={field}
                  value={value[field.key]}
                  extraValue={value[field.wordsKey]}
                  onChange={(v) => {
                    if (
                      v &&
                      typeof v === "object" &&
                      (v as { __audioBoth?: boolean }).__audioBoth
                    ) {
                      const { audioUrl, words } = v as {
                        audioUrl: string;
                        words: unknown[];
                      };
                      onChange({
                        ...value,
                        [field.key]: audioUrl,
                        [field.wordsKey]: words,
                      });
                    } else {
                      set(field.key, v);
                    }
                  }}
                />
              );
            }
            if (field.kind === "iconPreset") {
              return (
                <PrimitiveControl
                  key={field.key}
                  field={field}
                  value={value[field.key]}
                  // iconPreset writes BOTH `key` and `customKey` in one
                  // dispatch. The primitive control wraps both writes in a
                  // sentinel object so we can update both keys atomically
                  // here — UPDATE_CLIP_PROPS replaces props wholesale, so
                  // two single-key dispatches would clobber each other.
                  onChange={(v) => {
                    if (
                      v &&
                      typeof v === "object" &&
                      (v as { __iconPresetBoth?: boolean }).__iconPresetBoth
                    ) {
                      const { preset, custom } = v as {
                        preset: string;
                        custom: string;
                      };
                      onChange({
                        ...value,
                        [field.key]: preset,
                        [field.customKey]: custom,
                      });
                    } else {
                      set(field.key, v);
                    }
                  }}
                  extraValue={value[field.customKey]}
                  onExtraChange={(v) => set(field.customKey, v)}
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
      {scenarioField &&
      scenarioField.kind === "scenario" &&
      sectionFields.length > 0 ? (
        // States editor + raw JSON share the same key but are different
        // editing surfaces. Render them as tabs so the user picks one,
        // never both stacked.
        <ScenarioWithSectionsTabs
          scenarioField={scenarioField}
          sectionFields={sectionFields}
          value={value}
          set={set}
        />
      ) : (
        <>
          {scenarioField && scenarioField.kind === "scenario" && (
            <ScenarioEditor
              label={scenarioField.label}
              value={(value[scenarioField.key] ?? "") as string}
              onChange={(v) => set(scenarioField.key, v)}
            />
          )}
          {sectionFields.length > 0 && (
            <div className="shrink-0 px-5 py-3">
              <Accordion
                type="multiple"
                defaultValue={sectionFields
                  .filter((s) => s.defaultOpen)
                  .map((s) => s.key)}
                className="space-y-2"
              >
                {sectionFields.map((section) => (
                  <AccordionItem
                    key={section.key}
                    value={section.key}
                    className="rounded-md border border-border/60 bg-muted/20"
                  >
                    <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                      {section.label}
                    </AccordionTrigger>
                    <AccordionContent className="space-y-3 px-3 pb-3">
                      {section.description && (
                        <p className="text-[11px] text-muted-foreground">
                          {section.description}
                        </p>
                      )}
                      {section.fields.map((subField) => (
                        <PrimitiveControl
                          key={subField.key}
                          field={subField}
                          value={value[subField.key]}
                          onChange={(v) => set(subField.key, v)}
                          extraValue={
                            subField.kind === "iconPreset"
                              ? value[subField.customKey]
                              : undefined
                          }
                          onExtraChange={
                            subField.kind === "iconPreset"
                              ? (v) => set(subField.customKey, v)
                              : undefined
                          }
                        />
                      ))}
                    </AccordionContent>
                  </AccordionItem>
                ))}
              </Accordion>
            </div>
          )}
        </>
      )}
    </div>
  );
}

function ScenarioWithSectionsTabs({
  scenarioField,
  sectionFields,
  value,
  set,
}: {
  scenarioField: Extract<Field, { kind: "scenario" }>;
  sectionFields: SectionField[];
  value: Record<string, unknown>;
  set: (key: string, v: unknown) => void;
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col px-5 py-3">
      <Tabs defaultValue="states" className="gap-3">
        <TabsList className="self-start">
          <TabsTrigger value="states">{scenarioField.label}</TabsTrigger>
          {sectionFields.map((section) => (
            <TabsTrigger key={section.key} value={section.key}>
              {section.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <TabsContent value="states" className="-mx-5">
          <ScenarioEditor
            label={scenarioField.label}
            value={(value[scenarioField.key] ?? "") as string}
            onChange={(v) => set(scenarioField.key, v)}
          />
        </TabsContent>
        {sectionFields.map((section) => (
          <TabsContent
            key={section.key}
            value={section.key}
            className="space-y-3"
          >
            {section.description && (
              <p className="text-[11px] text-muted-foreground">
                {section.description}
              </p>
            )}
            {section.fields.map((subField) => (
              <PrimitiveControl
                key={subField.key}
                field={subField}
                value={value[subField.key]}
                onChange={(v) => set(subField.key, v)}
                extraValue={
                  subField.kind === "iconPreset"
                    ? value[subField.customKey]
                    : undefined
                }
                onExtraChange={
                  subField.kind === "iconPreset"
                    ? (v) => set(subField.customKey, v)
                    : undefined
                }
              />
            ))}
          </TabsContent>
        ))}
      </Tabs>
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

function InnerPropsControl({
  fieldKey,
  label,
  innerCompositionId,
  value,
  onChange,
}: {
  fieldKey: string;
  label: string;
  innerCompositionId: string;
  value: Record<string, unknown>;
  onChange: (next: Record<string, unknown>) => void;
}) {
  const innerInfo = compositionsById[innerCompositionId];

  if (!innerInfo) {
    return (
      <div className="rounded-md border border-border/60 bg-muted/20 px-3 py-2 text-[12px] text-muted-foreground">
        Pick a composition above to edit its content.
      </div>
    );
  }

  const merged = { ...innerInfo.defaultProps, ...value };

  return (
    <div className="rounded-md border border-border/60 bg-muted/20">
      <Accordion
        type="single"
        collapsible
        defaultValue={fieldKey}
        className="border-0"
      >
        <AccordionItem value={fieldKey} className="border-0">
          <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
            {label} · {innerInfo.title}
          </AccordionTrigger>
          <AccordionContent className="px-0 pb-0">
            <FieldsRenderer
              fields={innerInfo.fields}
              value={merged}
              onChange={onChange}
              compact
            />
          </AccordionContent>
        </AccordionItem>
      </Accordion>
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
