// TypeScript types for the gaia-demo-videos scenario JSON schema.
// Mirrors the format documented in
// /Users/aryan/Projects/GAIA/gaia-demo-videos/CLAUDE.md.

export type ToolCategory =
  | "google_calendar"
  | "todoist"
  | "search"
  | "gmail"
  | "general"
  | (string & {});

export type Viewport = {
  width: number;
  height: number;
};

export type ScenarioSettings = {
  theme?: "dark" | "light";
};

export type ToolInfo = {
  toolCategory: ToolCategory;
  showCategory?: boolean;
};

// --- Tool data payloads (attached to bot messages or tool_calls entries) ---

export type CalendarEvent = {
  summary: string;
  start: string;
  end: string;
  description?: string;
  attendees?: string[];
};

export type CalendarToolData = {
  tool_name: "calendar_options";
  tool_category: "google_calendar";
  data: CalendarEvent[];
  timestamp: string | null;
};

export type TodoStats = {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  today: number;
  upcoming: number;
};

export type TodoItem = {
  id: string;
  title: string;
  completed: boolean;
  priority?: "low" | "medium" | "high" | (string & {});
  due_date?: string | null;
  labels?: string[];
  subtasks?: TodoItem[];
  created_at?: string;
  updated_at?: string;
};

export type TodoData = {
  tool_name: "todo_data";
  tool_category: "todoist";
  data: {
    action: "list" | "create" | "update" | "delete" | (string & {});
    todos: TodoItem[];
    stats: TodoStats;
  };
  timestamp: string | null;
};

export type SearchResult = {
  title: string;
  url: string;
  snippet: string;
};

export type SearchToolData = {
  tool_name: "search_results";
  tool_category: "search";
  data: { results: SearchResult[] };
  timestamp: string | null;
};

export type ToolCallEntry = {
  tool_name: string;
  tool_category: ToolCategory;
  message: string;
  inputs: Record<string, unknown>;
  output: string;
};

export type ToolCallsData = {
  tool_name: "tool_calls_data";
  tool_category: ToolCategory;
  data: ToolCallEntry[];
  timestamp: string | null;
};

export type AnyToolData =
  | CalendarToolData
  | TodoData
  | SearchToolData
  | ToolCallsData;

export type ImageData = {
  url: string;
  prompt?: string;
  alt?: string;
};

export type MemoryData = {
  action: "create" | "update" | "delete" | (string & {});
  content: string;
};

// --- States ---

export type UserMessageState = {
  type: "user_message";
  text: string;
  typingSpeed: number; // ms per character
  pauseAfter?: number; // ms
};

export type BotMessageState = {
  type: "bot_message";
  text: string;
  streamingSpeed: number; // ms per character
  tool_data?: AnyToolData[];
  follow_up_actions?: string[];
  image_data?: ImageData;
  memory_data?: MemoryData;
  pauseAfter?: number; // ms
};

export type LoadingState = {
  type: "loading";
  text: string;
  duration: number; // ms
  toolInfo?: ToolInfo;
  pauseAfter?: number; // ms
};

export type ToolCallsState = {
  type: "tool_calls";
  entries: ToolCallsData[];
  pauseAfter?: number; // ms
};

export type ThinkingState = {
  type: "thinking";
  content: string;
  duration: number; // ms
  pauseAfter?: number; // ms
};

export type TodoDataState = {
  type: "todo_data";
  data: TodoData["data"];
  pauseAfter?: number; // ms
};

export type ImageState = {
  type: "image";
  image_data: ImageData;
  pauseAfter?: number; // ms
};

export type PauseState = {
  type: "pause";
  duration: number; // ms
  pauseAfter?: number; // ms
};

export type ScenarioState =
  | UserMessageState
  | BotMessageState
  | LoadingState
  | ToolCallsState
  | ThinkingState
  | TodoDataState
  | ImageState
  | PauseState;

export type ScenarioStateType = ScenarioState["type"];

export type Scenario = {
  id: string;
  title: string;
  viewport: Viewport;
  settings: ScenarioSettings;
  states: ScenarioState[];
};
