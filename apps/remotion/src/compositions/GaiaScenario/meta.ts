import type { CompositionInfo } from "../../schema";
import type { GaiaScenarioProps } from "./GaiaScenario";
import powerMorningBriefing from "./power-morning-briefing.json";
import { totalDurationFrames } from "./timing";
import type { Scenario } from "./types";

export const GAIA_SCENARIO_FPS = 60;
export const GAIA_SCENARIO_WIDTH = 1920;
export const GAIA_SCENARIO_HEIGHT = 1080;

// Default scenario = the gold-standard "power-morning-briefing" demo from
// gaia-demo-videos. Multi-tool flow (calendar + todos + search) with rich
// bot synthesis — exercises every major chat-ui state type in one example.
const defaultScenario = powerMorningBriefing as Scenario;

// Compute composition duration from a scenario's state-machine
// length + a 1s tail buffer so the last bot bubble has time to
// finish streaming. Used both for the registration-time fallback
// (the default scenario) and inside calculateMetadata, which
// re-runs whenever scenarioJson changes in the studio.
const FRAME_BUFFER = 60; // 1 second @ 60fps

function durationFromScenario(scenario: Scenario, fps: number): number {
  return totalDurationFrames(scenario, fps) + FRAME_BUFFER;
}

function safeParseScenario(json: string): Scenario | null {
  try {
    const parsed = JSON.parse(json) as Partial<Scenario>;
    if (
      !parsed ||
      typeof parsed !== "object" ||
      !Array.isArray(parsed.states)
    ) {
      return null;
    }
    return parsed as Scenario;
  } catch {
    return null;
  }
}

export const GAIA_SCENARIO_DURATION = durationFromScenario(
  defaultScenario,
  GAIA_SCENARIO_FPS,
);

export const gaiaScenarioDefaultProps: GaiaScenarioProps = {
  title: "",
  theme: "dark",
  backgroundColor: "",
  padding: 32,
  borderRadius: 0,
  scale: 2.5,
  userAvatarUrl: "https://avatars.githubusercontent.com/aryanranderiya?s=200",
  botAvatarUrl: "/images/logos/logo.webp",
  toolCallsExpanded: "true",
  scenarioJson: JSON.stringify(defaultScenario, null, 2),
};

export const gaiaScenarioInfo: CompositionInfo<GaiaScenarioProps> = {
  id: "GaiaScenario",
  category: "media",
  // Internal/branded composition — invisible to the studio agent.
  hideFromAgent: true,
  title: "GAIA",
  description:
    "Render a GAIA chat scenario from JSON. Fills the parent canvas at any size.",
  durationInFrames: GAIA_SCENARIO_DURATION,
  fps: GAIA_SCENARIO_FPS,
  width: GAIA_SCENARIO_WIDTH,
  height: GAIA_SCENARIO_HEIGHT,
  defaultProps: gaiaScenarioDefaultProps,
  // Re-derive durationInFrames whenever scenarioJson changes so the
  // timeline card hugs the actual content length. Falls back to the
  // registration-time default when the JSON is invalid.
  calculateMetadata: ({ props }) => {
    const scenario = safeParseScenario(props.scenarioJson ?? "");
    if (!scenario) return {};
    return {
      durationInFrames: durationFromScenario(scenario, GAIA_SCENARIO_FPS),
    };
  },
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
      kind: "image",
      key: "userAvatarUrl",
      label: "User avatar",
      placeholder: "https://avatars.githubusercontent.com/aryanranderiya?s=200",
    },
    {
      kind: "image",
      key: "botAvatarUrl",
      label: "Bot avatar (GAIA logo)",
      placeholder: "/images/logos/logo.webp",
    },
    {
      kind: "select",
      key: "toolCallsExpanded",
      label: "Tool calls expanded",
      options: [
        { value: "true", label: "Yes (default)" },
        { value: "false", label: "No (collapsed)" },
      ],
    },
    // The per-state editor and the raw JSON view share the same
    // scenarioJson key. FieldsRenderer pairs them as tabs ("States" /
    // "JSON") so the user picks one editing surface or the other —
    // never both stacked.
    {
      kind: "scenario",
      key: "scenarioJson",
      label: "States",
    },
    {
      kind: "section",
      key: "advanced",
      label: "JSON",
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
  ],
};
