import type { CompositionInfo } from "../../schema";
import type { GaiaScenarioProps } from "./GaiaScenario";
import type { Scenario } from "./types";

export const GAIA_SCENARIO_FPS = 60;
export const GAIA_SCENARIO_WIDTH = 1080;
export const GAIA_SCENARIO_HEIGHT = 1920;
// Default 1 minute. Real durations are computed from each scenario's
// state machine via timing.totalDurationFrames(scenario, fps).
export const GAIA_SCENARIO_DURATION = GAIA_SCENARIO_FPS * 60;

// Mirror of /Users/aryan/Projects/GAIA/gaia-demo-videos/scenarios/morning-email-triage.json
const morningEmailTriage: Scenario = {
  id: "morning-email-triage",
  title: "Morning Email Triage — AI Inbox Commander",
  viewport: { width: 390, height: 844 },
  settings: { theme: "dark" },
  states: [
    {
      type: "user_message",
      text: "Go through my inbox and tell me what needs my attention today",
      typingSpeed: 42,
      pauseAfter: 700,
    },
    {
      type: "loading",
      text: "Reading your inbox...",
      toolInfo: {
        toolCategory: "gmail",
        showCategory: true,
      },
      duration: 1600,
      pauseAfter: 150,
    },
    {
      type: "tool_calls",
      entries: [
        {
          tool_name: "tool_calls_data",
          tool_category: "gmail",
          data: [
            {
              tool_name: "gmail_fetch_inbox",
              tool_category: "gmail",
              message: "Fetched 14 unread emails from the last 12 hours",
              inputs: { query: "is:unread newer_than:12h", max_results: 50 },
              output:
                "14 unread emails found — 2 flagged high priority, 3 require action, 5 FYI/CC'd, 4 newsletters",
            },
          ],
          timestamp: null,
        },
      ],
      pauseAfter: 1200,
    },
    {
      type: "bot_message",
      text: "Good morning! I've gone through your **14 unread emails** and sorted them by priority. Here's the breakdown:\n\n🔴 **Urgent (2)**\n- **Lisa Chen (CEO)** — Needs the updated board deck by **5 PM today**.\n- **Marcus Webb (Acme Corp)** — Client escalation about the API outage.\n\n🟡 **Action Required (3)**\n- **David Park (Legal)** — NDA needs your signature by Wednesday\n- **Priya Sharma (Design)** — Wants feedback on dashboard mockups\n- **Jordan Liu (Engineering)** — PR review request, marked blocking",
      streamingSpeed: 5,
      follow_up_actions: [
        "Draft reply to CEO",
        "Handle client escalation",
        "Archive newsletters",
        "Show full inbox",
      ],
      pauseAfter: 4000,
    },
  ],
};

export const gaiaScenarioDefaultProps: GaiaScenarioProps = {
  title: "",
  theme: "dark",
  backgroundColor: "",
  padding: 32,
  borderRadius: 0,
  scale: 2.5,
  scenarioJson: JSON.stringify(morningEmailTriage, null, 2),
};

export const gaiaScenarioInfo: CompositionInfo<GaiaScenarioProps> = {
  id: "GaiaScenario",
  title: "GAIA",
  description:
    "Render a GAIA chat scenario from JSON. Fills the parent canvas at any size.",
  durationInFrames: GAIA_SCENARIO_DURATION,
  fps: GAIA_SCENARIO_FPS,
  width: GAIA_SCENARIO_WIDTH,
  height: GAIA_SCENARIO_HEIGHT,
  defaultProps: gaiaScenarioDefaultProps,
  fields: [
    {
      kind: "text",
      key: "title",
      label: "Header label",
      placeholder: "Optional small header above the chat",
    },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "dark", label: "Dark" },
        { value: "light", label: "Light" },
      ],
    },
    {
      kind: "color",
      key: "backgroundColor",
      label: "Background color",
    },
    {
      kind: "number",
      key: "padding",
      label: "Padding",
      min: 0,
      max: 200,
    },
    {
      kind: "number",
      key: "borderRadius",
      label: "Border radius",
      min: 0,
      max: 200,
    },
    {
      kind: "number",
      key: "scale",
      label: "Chat scale",
      min: 1,
      max: 5,
    },
    {
      kind: "section",
      key: "advanced",
      label: "Advanced options",
      description:
        "Raw scenario JSON. Paste any scenario from gaia-demo-videos/scenarios/.",
      defaultOpen: false,
      fields: [
        {
          kind: "textarea",
          key: "scenarioJson",
          label: "Scenario JSON",
          rows: 24,
        },
      ],
    },
    // The full per-state editor lives below the section/JSON view —
    // each state's fields render in their own collapsible row.
    {
      kind: "scenario",
      key: "scenarioJson",
      label: "States",
    },
  ],
};
