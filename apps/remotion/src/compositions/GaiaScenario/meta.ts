import type { CompositionInfo } from "../../schema";
import type { GaiaScenarioProps } from "./GaiaScenario";
import powerMorningBriefing from "./power-morning-briefing.json";
import type { Scenario } from "./types";

export const GAIA_SCENARIO_FPS = 60;
export const GAIA_SCENARIO_WIDTH = 1080;
export const GAIA_SCENARIO_HEIGHT = 1920;
// Default 1 minute. Real durations are computed from each scenario's
// state machine via timing.totalDurationFrames(scenario, fps).
export const GAIA_SCENARIO_DURATION = GAIA_SCENARIO_FPS * 60;

// Default scenario = the gold-standard "power-morning-briefing" demo from
// gaia-demo-videos. Multi-tool flow (calendar + todos + search) with rich
// bot synthesis — exercises every major chat-ui state type in one example.
const defaultScenario = powerMorningBriefing as Scenario;

export const gaiaScenarioDefaultProps: GaiaScenarioProps = {
  title: "",
  theme: "dark",
  backgroundColor: "",
  padding: 32,
  borderRadius: 0,
  scale: 2.5,
  userAvatarUrl: "https://github.com/aryanranderiya.png",
  botAvatarUrl: "/images/logos/logo.webp",
  toolCallsExpanded: true,
  scenarioJson: JSON.stringify(defaultScenario, null, 2),
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
      kind: "image",
      key: "userAvatarUrl",
      label: "User avatar",
      placeholder: "https://github.com/aryanranderiya.png",
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
