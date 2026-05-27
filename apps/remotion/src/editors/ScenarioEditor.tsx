"use client";

import {
  ArrowDown01Icon,
  ArrowUp01Icon,
  Brain02Icon,
  BubbleChatIcon,
  ClockIcon,
  Delete02Icon,
  Loading03Icon,
  PauseIcon,
  PlusSignIcon,
  ToolsIcon,
  UserIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@workspace/ui/components/accordion";
import { Button } from "@workspace/ui/components/button";
import { Input } from "@workspace/ui/components/input";
import { Label } from "@workspace/ui/components/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import { useState } from "react";
import {
  getToolCategory,
  TOOL_CATEGORIES,
} from "../compositions/GaiaScenario/toolCategories";
import type {
  BotMessageState,
  LoadingState,
  PauseState,
  Scenario,
  ScenarioState,
  ScenarioStateType,
  ThinkingState,
  ToolCallEntry,
  ToolCallsState,
  UserMessageState,
} from "../compositions/GaiaScenario/types";
import type { EditorProps } from "../schema";

// The editor accepts and emits the full scenario JSON string so it can plug
// into the existing scenarioJson prop without schema rewiring on consumers.
export function ScenarioEditor({
  label,
  value,
  onChange,
}: EditorProps<string> & { label?: string }) {
  const scenario = parseScenario(value);
  const allKeys = scenario.states.map((_, i) => `s-${i}`);
  const [openKeys, setOpenKeys] = useState<string[]>(allKeys);

  function patch(next: Partial<Scenario>) {
    const merged: Scenario = { ...scenario, ...next };
    onChange(JSON.stringify(merged, null, 2));
  }

  function patchState(i: number, patchedState: ScenarioState) {
    const states = scenario.states.slice();
    states[i] = patchedState;
    // Coupling: when a tool_calls state's first call changes
    // category, propagate to the immediately preceding loading
    // state so the loading icon stays in sync. Only touches loading
    // states that are using a tool integration (not wave spinner).
    if (patchedState.type === "tool_calls") {
      const firstCall = patchedState.entries[0]?.data[0];
      const newCategory = firstCall?.tool_category;
      const prev = states[i - 1];
      if (
        newCategory &&
        prev &&
        prev.type === "loading" &&
        prev.toolInfo?.toolCategory &&
        prev.toolInfo.toolCategory !== newCategory
      ) {
        states[i - 1] = {
          ...prev,
          toolInfo: { ...prev.toolInfo, toolCategory: newCategory },
        };
      }
    }
    patch({ states });
  }

  function addState(type: ScenarioStateType) {
    // Coupling: a tool_calls state is almost always preceded by a
    // loading state with the same category. Auto-insert the pair so
    // the user only adds one entry from the menu — they can still
    // edit each independently afterwards.
    if (type === "tool_calls") {
      const loadingIdx = scenario.states.length;
      const toolCallsIdx = loadingIdx + 1;
      const states: ScenarioState[] = [
        ...scenario.states,
        {
          type: "loading",
          text: "Working on it…",
          duration: 1200,
          toolInfo: { toolCategory: "general" },
          pauseAfter: 100,
        },
        defaultState("tool_calls"),
      ];
      patch({ states });
      setOpenKeys((prev) => [...prev, `s-${loadingIdx}`, `s-${toolCallsIdx}`]);
      return;
    }
    const newIndex = scenario.states.length;
    const states = [...scenario.states, defaultState(type)];
    patch({ states });
    setOpenKeys((prev) => [...prev, `s-${newIndex}`]);
  }

  function removeState(i: number) {
    const states = scenario.states.slice();
    states.splice(i, 1);
    patch({ states });
  }

  function moveState(i: number, dir: -1 | 1) {
    const j = i + dir;
    if (j < 0 || j >= scenario.states.length) return;
    const states = scenario.states.slice();
    [states[i], states[j]] = [states[j]!, states[i]!];
    patch({ states });
  }

  const allOpen = openKeys.length === allKeys.length && allKeys.length > 0;

  return (
    <div className="bg-background">
      <div className="space-y-3 px-5 py-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-foreground">
              {label ?? "States"}
            </p>
            <p className="mt-0.5 text-[11px] text-muted-foreground">
              Each state plays back in order. Add, reorder, or edit per-state
              fields below.
            </p>
          </div>
          <AddStateButton onAdd={addState} />
        </div>

        {scenario.states.length > 0 && (
          <div className="flex justify-end">
            <button
              type="button"
              onClick={() => setOpenKeys(allOpen ? [] : allKeys)}
              className="text-[11px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
            >
              {allOpen ? "Collapse all" : "Expand all"}
            </button>
          </div>
        )}

        <Accordion
          type="multiple"
          value={openKeys}
          onValueChange={setOpenKeys}
          className="space-y-2"
        >
          {scenario.states.map((state, i) => (
            <AccordionItem
              key={`${state.type}-${i}`}
              value={`s-${i}`}
              className="rounded-md border border-border/60 bg-muted/20"
            >
              <AccordionTrigger className="px-3 py-2 text-xs font-semibold hover:no-underline">
                <span className="flex flex-1 items-center justify-between gap-2 pr-2">
                  <span className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground/70 tabular-nums">
                      {String(i + 1).padStart(2, "0")}
                    </span>
                    <HugeiconsIcon
                      icon={stateMeta(state.type).icon}
                      size={14}
                      className={stateMeta(state.type).iconClass}
                    />
                    <span>{stateMeta(state.type).label}</span>
                  </span>
                  <span className="flex items-center gap-0.5">
                    <IconButton
                      title="Move up"
                      icon={ArrowUp01Icon}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveState(i, -1);
                      }}
                    />
                    <IconButton
                      title="Move down"
                      icon={ArrowDown01Icon}
                      onClick={(e) => {
                        e.stopPropagation();
                        moveState(i, 1);
                      }}
                    />
                    <IconButton
                      title="Delete"
                      icon={Delete02Icon}
                      destructive
                      onClick={(e) => {
                        e.stopPropagation();
                        removeState(i);
                      }}
                    />
                  </span>
                </span>
              </AccordionTrigger>
              <AccordionContent className="space-y-3 px-3 pb-3">
                <StateFields state={state} onChange={(s) => patchState(i, s)} />
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </div>
  );
}

// Compact "+ Add state" button at the top-right of the header that opens a
// menu of state types via Select. Select isn't a real dropdown menu but it
// gives us free positioning + outside-click handling.
function AddStateButton({
  onAdd,
}: {
  onAdd: (type: ScenarioStateType) => void;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Select
      open={open}
      onOpenChange={setOpen}
      onValueChange={(v) => {
        onAdd(v as ScenarioStateType);
        setOpen(false);
      }}
    >
      <SelectTrigger
        size="sm"
        className="h-7 w-auto shrink-0 gap-1 px-2 text-[11px] [&>svg:last-child]:hidden"
      >
        <span className="flex items-center gap-1">
          <HugeiconsIcon icon={PlusSignIcon} size={12} />
          Add state
        </span>
      </SelectTrigger>
      <SelectContent align="end">
        {STATE_TYPE_META.map((meta) => (
          <SelectItem key={meta.type} value={meta.type}>
            <span className="flex items-center gap-2">
              <HugeiconsIcon
                icon={meta.icon}
                size={14}
                className={meta.iconClass}
              />
              <span>{meta.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function IconButton({
  title,
  icon,
  destructive,
  onClick,
}: {
  title: string;
  icon: typeof ArrowUp01Icon;
  destructive?: boolean;
  onClick: (e: React.MouseEvent) => void;
}) {
  return (
    <Button
      variant="ghost"
      size="icon"
      title={title}
      onClick={onClick}
      className={`size-6 rounded ${
        destructive
          ? "hover:bg-red-500/10 hover:text-red-500"
          : "hover:bg-foreground/10"
      }`}
    >
      <HugeiconsIcon icon={icon} size={12} />
    </Button>
  );
}

const STATE_TYPE_META: {
  type: ScenarioStateType;
  label: string;
  icon: typeof UserIcon;
  iconClass: string;
}[] = [
  {
    type: "user_message",
    label: "User",
    icon: UserIcon,
    iconClass: "text-sky-500",
  },
  {
    type: "bot_message",
    label: "Bot",
    icon: BubbleChatIcon,
    iconClass: "text-violet-500",
  },
  {
    type: "loading",
    label: "Loading",
    icon: Loading03Icon,
    iconClass: "text-amber-500",
  },
  {
    type: "tool_calls",
    label: "Tool calls",
    icon: ToolsIcon,
    iconClass: "text-emerald-500",
  },
  {
    type: "thinking",
    label: "Thinking",
    icon: Brain02Icon,
    iconClass: "text-pink-500",
  },
  {
    type: "pause",
    label: "Pause",
    icon: PauseIcon,
    iconClass: "text-zinc-400",
  },
];

function stateMeta(type: ScenarioStateType) {
  return (
    STATE_TYPE_META.find((m) => m.type === type) ?? {
      type,
      label: type,
      icon: ClockIcon,
      iconClass: "text-zinc-400",
    }
  );
}

function StateFields({
  state,
  onChange,
}: {
  state: ScenarioState;
  onChange: (s: ScenarioState) => void;
}) {
  switch (state.type) {
    case "user_message":
      return <UserMessageFields state={state} onChange={onChange} />;
    case "bot_message":
      return <BotMessageFields state={state} onChange={onChange} />;
    case "loading":
      return <LoadingFields state={state} onChange={onChange} />;
    case "thinking":
      return <ThinkingFields state={state} onChange={onChange} />;
    case "tool_calls":
      return <ToolCallsFields state={state} onChange={onChange} />;
    case "pause":
      return <PauseFields state={state} onChange={onChange} />;
    case "todo_data":
    case "image":
      return (
        <p className="text-[11px] text-muted-foreground">
          Edit this state via the JSON view below for now.
        </p>
      );
  }
}

// ─── Per-state field groups ─────────────────────────────────────────────────

function UserMessageFields({
  state,
  onChange,
}: {
  state: UserMessageState;
  onChange: (s: UserMessageState) => void;
}) {
  return (
    <>
      <FieldRow label="Text">
        <Textarea
          rows={3}
          value={state.text}
          onChange={(e) => onChange({ ...state, text: e.target.value })}
        />
      </FieldRow>
      <NumberRow
        label="Typing speed (ms/char)"
        value={state.typingSpeed}
        onChange={(typingSpeed) => onChange({ ...state, typingSpeed })}
      />
      <NumberRow
        label="Pause after (ms)"
        value={state.pauseAfter ?? 0}
        onChange={(pauseAfter) => onChange({ ...state, pauseAfter })}
      />
    </>
  );
}

function BotMessageFields({
  state,
  onChange,
}: {
  state: BotMessageState;
  onChange: (s: BotMessageState) => void;
}) {
  return (
    <>
      <FieldRow label="Text (markdown supported)">
        <Textarea
          rows={6}
          value={state.text}
          onChange={(e) => onChange({ ...state, text: e.target.value })}
        />
      </FieldRow>
      <NumberRow
        label="Streaming speed (ms/char)"
        value={state.streamingSpeed}
        onChange={(streamingSpeed) => onChange({ ...state, streamingSpeed })}
      />
      <FollowUpActionsEditor
        actions={state.follow_up_actions ?? []}
        onChange={(follow_up_actions) =>
          onChange({ ...state, follow_up_actions })
        }
      />
      <NumberRow
        label="Pause after (ms)"
        value={state.pauseAfter ?? 0}
        onChange={(pauseAfter) => onChange({ ...state, pauseAfter })}
      />
    </>
  );
}

function LoadingFields({
  state,
  onChange,
}: {
  state: LoadingState;
  onChange: (s: LoadingState) => void;
}) {
  // "Wave spinner" mode = no toolInfo (chat-ui falls back to
  // <WaveSpinnerSquare>). "Tool integration" mode = a toolInfo with
  // a real category. Pick which one is active by whether toolInfo
  // has a non-empty category.
  const isToolMode = !!state.toolInfo?.toolCategory;
  return (
    <>
      <FieldRow label="Indicator">
        <Select
          value={isToolMode ? "tool" : "spinner"}
          onValueChange={(v) => {
            if (v === "spinner") {
              onChange({ ...state, toolInfo: undefined });
            } else {
              onChange({
                ...state,
                toolInfo: { toolCategory: "general" },
              });
            }
          }}
        >
          <SelectTrigger>
            <span>
              {isToolMode ? "Tool integration" : "Wave spinner (default)"}
            </span>
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="spinner">Wave spinner (default)</SelectItem>
            <SelectItem value="tool">Tool integration</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
      <FieldRow label="Loading text">
        <Input
          value={state.text}
          onChange={(e) => onChange({ ...state, text: e.target.value })}
        />
      </FieldRow>
      <NumberRow
        label="Duration (ms)"
        value={state.duration}
        onChange={(duration) => onChange({ ...state, duration })}
      />
      {isToolMode && (
        <FieldRow label="Tool category">
          <ToolCategorySelect
            value={state.toolInfo?.toolCategory ?? "general"}
            onChange={(v) =>
              onChange({
                ...state,
                toolInfo: {
                  ...(state.toolInfo ?? { toolCategory: "general" }),
                  toolCategory: v,
                },
              })
            }
          />
        </FieldRow>
      )}
      <NumberRow
        label="Pause after (ms)"
        value={state.pauseAfter ?? 0}
        onChange={(pauseAfter) => onChange({ ...state, pauseAfter })}
      />
    </>
  );
}

function ThinkingFields({
  state,
  onChange,
}: {
  state: ThinkingState;
  onChange: (s: ThinkingState) => void;
}) {
  return (
    <>
      <FieldRow label="Thinking content">
        <Textarea
          rows={4}
          value={state.content}
          onChange={(e) => onChange({ ...state, content: e.target.value })}
        />
      </FieldRow>
      <NumberRow
        label="Duration (ms)"
        value={state.duration}
        onChange={(duration) => onChange({ ...state, duration })}
      />
      <NumberRow
        label="Pause after (ms)"
        value={state.pauseAfter ?? 0}
        onChange={(pauseAfter) => onChange({ ...state, pauseAfter })}
      />
    </>
  );
}

function ToolCallsFields({
  state,
  onChange,
}: {
  state: ToolCallsState;
  onChange: (s: ToolCallsState) => void;
}) {
  // The scenario schema groups tool calls into "entries" (one per
  // tool_calls_data envelope). For the editor we flatten one layer down
  // and let the user manage individual ToolCallEntry items — each one
  // owns its category, so multiple integrations in one state work fine.
  const flatCalls: {
    entryIdx: number;
    callIdx: number;
    call: ToolCallEntry;
  }[] = [];
  state.entries.forEach((entry, entryIdx) => {
    entry.data.forEach((call, callIdx) => {
      flatCalls.push({ entryIdx, callIdx, call });
    });
  });

  function patchCall(
    entryIdx: number,
    callIdx: number,
    patch: Partial<ToolCallEntry>,
  ) {
    const entries = state.entries.map((entry, i) => {
      if (i !== entryIdx) return entry;
      const data = entry.data.map((call, j) =>
        j === callIdx ? { ...call, ...patch } : call,
      );
      // Keep the envelope's tool_category in sync with the first call's
      // category — chat-ui reads it when rendering loading states.
      const tool_category = data[0]?.tool_category ?? entry.tool_category;
      return { ...entry, data, tool_category };
    });
    onChange({ ...state, entries });
  }

  function addCall() {
    const fresh: ToolCallEntry = {
      tool_name: "new_tool",
      tool_category: "general",
      message: "",
      inputs: {},
      output: "",
    };
    if (state.entries.length === 0) {
      onChange({
        ...state,
        entries: [
          {
            tool_name: "tool_calls_data",
            tool_category: "general",
            data: [fresh],
            timestamp: null,
          },
        ],
      });
      return;
    }
    const entries = state.entries.map((entry, i) =>
      i === state.entries.length - 1
        ? { ...entry, data: [...entry.data, fresh] }
        : entry,
    );
    onChange({ ...state, entries });
  }

  function removeCall(entryIdx: number, callIdx: number) {
    const entries = state.entries
      .map((entry, i) => {
        if (i !== entryIdx) return entry;
        const data = entry.data.filter((_, j) => j !== callIdx);
        return { ...entry, data };
      })
      .filter((entry) => entry.data.length > 0);
    onChange({ ...state, entries });
  }

  return (
    <>
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-[12px]">Tool calls</Label>
          <Button
            variant="outline"
            size="sm"
            className="h-6 gap-1 px-2 text-[11px]"
            onClick={addCall}
          >
            <HugeiconsIcon icon={PlusSignIcon} size={11} />
            Add call
          </Button>
        </div>
        {flatCalls.length === 0 && (
          <p className="rounded-md border border-dashed border-border/60 px-3 py-4 text-center text-[11px] text-muted-foreground">
            No tool calls yet. Click "Add call" to create one.
          </p>
        )}
        {flatCalls.map(({ entryIdx, callIdx, call }) => {
          return (
            <div
              key={`${entryIdx}-${callIdx}`}
              className="space-y-2 rounded-md border border-border/60 bg-background/50 p-2.5"
            >
              <div className="flex items-center gap-2">
                <div className="min-w-0 flex-1">
                  <ToolCategorySelect
                    value={call.tool_category}
                    onChange={(v) =>
                      patchCall(entryIdx, callIdx, { tool_category: v })
                    }
                  />
                </div>
                <IconButton
                  title="Remove call"
                  icon={Delete02Icon}
                  destructive
                  onClick={() => removeCall(entryIdx, callIdx)}
                />
              </div>
              <FieldRow label="Tool name">
                <Input
                  value={call.tool_name}
                  onChange={(e) =>
                    patchCall(entryIdx, callIdx, { tool_name: e.target.value })
                  }
                  placeholder="e.g. google_calendar_today"
                />
              </FieldRow>
              <FieldRow label="Message">
                <Input
                  value={call.message}
                  onChange={(e) =>
                    patchCall(entryIdx, callIdx, { message: e.target.value })
                  }
                  placeholder="Short status, e.g. 'Retrieved 4 events'"
                />
              </FieldRow>
              <FieldRow label="Output">
                <Textarea
                  rows={3}
                  value={call.output}
                  onChange={(e) =>
                    patchCall(entryIdx, callIdx, { output: e.target.value })
                  }
                  placeholder="What the tool returned (shown in the expanded accordion)"
                />
              </FieldRow>
              <FieldRow label="Inputs (JSON, optional)">
                <Textarea
                  rows={2}
                  value={
                    Object.keys(call.inputs).length === 0
                      ? ""
                      : JSON.stringify(call.inputs, null, 2)
                  }
                  onChange={(e) => {
                    const raw = e.target.value.trim();
                    if (!raw) {
                      patchCall(entryIdx, callIdx, { inputs: {} });
                      return;
                    }
                    try {
                      patchCall(entryIdx, callIdx, {
                        inputs: JSON.parse(raw) as Record<string, unknown>,
                      });
                    } catch {
                      // Ignore until JSON is valid.
                    }
                  }}
                  placeholder='{"date": "2026-03-13"}'
                />
              </FieldRow>
            </div>
          );
        })}
      </div>
      <NumberRow
        label="Pause after (ms)"
        value={state.pauseAfter ?? 0}
        onChange={(pauseAfter) => onChange({ ...state, pauseAfter })}
      />
    </>
  );
}

// Branded category select shared by LoadingFields and ToolCallsFields.
function ToolCategorySelect({
  value,
  onChange,
}: {
  value: string;
  onChange: (v: string) => void;
}) {
  const cat = getToolCategory(value);
  return (
    <Select value={value} onValueChange={onChange}>
      <SelectTrigger className="w-full">
        <span className="flex min-w-0 items-center gap-2">
          <ToolCategoryGlyph cat={cat} size={14} />
          <span className="truncate">{cat.label}</span>
        </span>
      </SelectTrigger>
      <SelectContent className="max-h-72">
        {TOOL_CATEGORIES.map((c) => (
          <SelectItem key={c.key} value={c.key}>
            <span className="flex items-center gap-2">
              <ToolCategoryGlyph cat={c} size={14} />
              <span>{c.label}</span>
            </span>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

function ToolCategoryGlyph({
  cat,
  size = 14,
}: {
  cat: ReturnType<typeof getToolCategory>;
  size?: number;
}) {
  if (cat.kind === "image") {
    return (
      <img
        src={cat.src}
        alt=""
        width={size}
        height={size}
        className="aspect-square shrink-0 object-contain"
      />
    );
  }
  return (
    <HugeiconsIcon
      icon={cat.icon}
      size={size}
      className={`shrink-0 ${cat.iconClass}`}
    />
  );
}

function FollowUpActionsEditor({
  actions,
  onChange,
}: {
  actions: string[];
  onChange: (next: string[]) => void;
}) {
  function update(i: number, value: string) {
    const next = actions.slice();
    next[i] = value;
    onChange(next);
  }
  function remove(i: number) {
    onChange(actions.filter((_, j) => j !== i));
  }
  function add() {
    onChange([...actions, ""]);
  }
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-[12px]">Follow-up actions</Label>
        <Button
          variant="outline"
          size="sm"
          className="h-6 gap-1 px-2 text-[11px]"
          onClick={add}
        >
          <HugeiconsIcon icon={PlusSignIcon} size={11} />
          Add action
        </Button>
      </div>
      {actions.length === 0 && (
        <p className="rounded-md border border-dashed border-border/60 px-3 py-3 text-center text-[11px] text-muted-foreground">
          No follow-up actions. Click "Add action" to create one.
        </p>
      )}
      {actions.map((action, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <Input
            value={action}
            onChange={(e) => update(i, e.target.value)}
            placeholder="e.g. Show full inbox"
          />
          <IconButton
            title="Remove action"
            icon={Delete02Icon}
            destructive
            onClick={() => remove(i)}
          />
        </div>
      ))}
    </div>
  );
}

function PauseFields({
  state,
  onChange,
}: {
  state: PauseState;
  onChange: (s: PauseState) => void;
}) {
  return (
    <NumberRow
      label="Duration (ms)"
      value={state.duration}
      onChange={(duration) => onChange({ ...state, duration })}
    />
  );
}

// ─── Shared row primitives ──────────────────────────────────────────────────

function FieldRow({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="space-y-1.5">
      <Label className="text-[12px]">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground">{hint}</p>}
    </div>
  );
}

function NumberRow({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <FieldRow label={label}>
      <Input
        type="number"
        value={value}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (!Number.isNaN(n)) onChange(n);
        }}
      />
    </FieldRow>
  );
}

// ─── Helpers ────────────────────────────────────────────────────────────────

const FALLBACK_SCENARIO: Scenario = {
  id: "scenario",
  title: "Scenario",
  viewport: { width: 390, height: 844 },
  settings: { theme: "dark" },
  states: [],
};

function parseScenario(json: string): Scenario {
  try {
    const parsed = JSON.parse(json) as Partial<Scenario>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.states)
    ) {
      return FALLBACK_SCENARIO;
    }
    return {
      id: parsed.id ?? "scenario",
      title: parsed.title ?? "Scenario",
      viewport: parsed.viewport ?? FALLBACK_SCENARIO.viewport,
      settings: parsed.settings ?? { theme: "dark" },
      states: parsed.states as ScenarioState[],
    };
  } catch {
    return FALLBACK_SCENARIO;
  }
}

function defaultState(type: ScenarioStateType): ScenarioState {
  switch (type) {
    case "user_message":
      return { type, text: "", typingSpeed: 45, pauseAfter: 600 };
    case "bot_message":
      return { type, text: "", streamingSpeed: 6, pauseAfter: 3000 };
    case "loading":
      return {
        type,
        text: "Working on it…",
        duration: 1500,
        // No toolInfo by default → chat-ui's LoadingIndicator falls
        // back to <WaveSpinnerSquare>. Editor exposes "Tool
        // integration" as the alternative indicator type.
        pauseAfter: 200,
      };
    case "tool_calls":
      return { type, entries: [], pauseAfter: 800 };
    case "thinking":
      return { type, content: "", duration: 2000, pauseAfter: 300 };
    case "pause":
      return { type, duration: 1000 };
    case "todo_data":
      return {
        type,
        data: {
          action: "list",
          todos: [],
          stats: {
            total: 0,
            completed: 0,
            pending: 0,
            overdue: 0,
            today: 0,
            upcoming: 0,
          },
        },
      };
    case "image":
      return { type, image_data: { url: "" } };
  }
}
