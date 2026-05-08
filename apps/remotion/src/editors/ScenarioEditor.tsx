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
  SelectValue,
} from "@workspace/ui/components/select";
import { Textarea } from "@workspace/ui/components/textarea";
import type {
  BotMessageState,
  LoadingState,
  PauseState,
  Scenario,
  ScenarioState,
  ScenarioStateType,
  ThinkingState,
  ToolCallsData,
  ToolCallsState,
  UserMessageState,
} from "../compositions/GaiaScenario/types";
import type { EditorProps } from "../schema";

// The editor accepts and emits the full scenario JSON string so it can plug
// into the existing scenarioJson prop without schema rewiring on consumers.
export function ScenarioEditor({ value, onChange }: EditorProps<string>) {
  const scenario = parseScenario(value);

  function patch(next: Partial<Scenario>) {
    const merged: Scenario = { ...scenario, ...next };
    onChange(JSON.stringify(merged, null, 2));
  }

  function patchState(i: number, patchedState: ScenarioState) {
    const states = scenario.states.slice();
    states[i] = patchedState;
    patch({ states });
  }

  function addState(type: ScenarioStateType) {
    const states = [...scenario.states, defaultState(type)];
    patch({ states });
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

  return (
    <div className="bg-background">
      <div className="space-y-4 px-5 py-4">
        <Accordion
          type="multiple"
          defaultValue={scenario.states.map((_, i) => `s-${i}`)}
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

        <AddStateMenu onAdd={addState} />
      </div>
    </div>
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

function AddStateMenu({ onAdd }: { onAdd: (type: ScenarioStateType) => void }) {
  return (
    <div className="space-y-2 rounded-md border border-dashed border-border/60 bg-muted/10 p-3">
      <Label className="text-[12px]">Add state</Label>
      <div className="grid grid-cols-3 gap-1.5">
        {STATE_TYPE_META.map((meta) => (
          <button
            type="button"
            key={meta.type}
            onClick={() => onAdd(meta.type)}
            className="flex flex-col items-center gap-1 rounded-md border border-border/40 bg-background px-2 py-2 text-[11px] font-medium text-foreground transition-colors hover:border-foreground/30 hover:bg-foreground/5"
            title={meta.label}
          >
            <HugeiconsIcon
              icon={meta.icon}
              size={16}
              className={meta.iconClass}
            />
            <span>{meta.label}</span>
          </button>
        ))}
      </div>
    </div>
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
      <FieldRow label="Follow-up actions (one per line)">
        <Textarea
          rows={3}
          value={(state.follow_up_actions ?? []).join("\n")}
          onChange={(e) =>
            onChange({
              ...state,
              follow_up_actions: e.target.value
                .split("\n")
                .map((s) => s.trim())
                .filter(Boolean),
            })
          }
        />
      </FieldRow>
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
  return (
    <>
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
      <FieldRow label="Tool category">
        <Select
          value={state.toolInfo?.toolCategory ?? "general"}
          onValueChange={(v) =>
            onChange({
              ...state,
              toolInfo: {
                ...(state.toolInfo ?? { toolCategory: "general" }),
                toolCategory: v,
              },
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="general">General</SelectItem>
            <SelectItem value="gmail">Gmail</SelectItem>
            <SelectItem value="google_calendar">Google Calendar</SelectItem>
            <SelectItem value="todoist">Todoist</SelectItem>
            <SelectItem value="search">Search</SelectItem>
          </SelectContent>
        </Select>
      </FieldRow>
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
  return (
    <>
      <FieldRow
        label="Entries (JSON)"
        hint="Array of tool_calls_data entries. See gaia-demo-videos/CLAUDE.md."
      >
        <Textarea
          rows={8}
          value={JSON.stringify(state.entries, null, 2)}
          onChange={(e) => {
            try {
              const entries = JSON.parse(e.target.value) as ToolCallsData[];
              onChange({ ...state, entries });
            } catch {
              // Ignore invalid JSON until user finishes typing.
            }
          }}
        />
      </FieldRow>
      <NumberRow
        label="Pause after (ms)"
        value={state.pauseAfter ?? 0}
        onChange={(pauseAfter) => onChange({ ...state, pauseAfter })}
      />
    </>
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
        toolInfo: { toolCategory: "general" },
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
