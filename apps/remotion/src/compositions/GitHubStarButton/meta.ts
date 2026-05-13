import type { CompositionInfo } from "../../schema";
import type { GitHubStarButtonProps } from "./GitHubStarButton";

export const GITHUB_STAR_BUTTON_DURATION = 180;
export const GITHUB_STAR_BUTTON_FPS = 60;
export const GITHUB_STAR_BUTTON_WIDTH = 1920;
export const GITHUB_STAR_BUTTON_HEIGHT = 1080;

export const githubStarButtonDefaultProps: GitHubStarButtonProps = {
  owner: "theexperiencecompany",
  repo: "motion-studio",
  startCount: 1240,
  endCount: 1289,
  theme: "light",
};

export const githubStarButtonInfo: CompositionInfo<GitHubStarButtonProps> = {
  id: "GitHubStarButton",
  title: "GitHub Star Button",
  description:
    "A pixel-faithful GitHub 'Star' button that animates a click, fills the star, bursts particles, and rolls the star count.",
  durationInFrames: GITHUB_STAR_BUTTON_DURATION,
  fps: GITHUB_STAR_BUTTON_FPS,
  width: GITHUB_STAR_BUTTON_WIDTH,
  height: GITHUB_STAR_BUTTON_HEIGHT,
  defaultProps: githubStarButtonDefaultProps,
  brandMode: "locked",
  fields: [
    { kind: "text", key: "owner", label: "Owner" },
    { kind: "text", key: "repo", label: "Repo" },
    { kind: "number", key: "startCount", label: "Starting star count", min: 0 },
    { kind: "number", key: "endCount", label: "Ending star count", min: 0 },
    {
      kind: "select",
      key: "theme",
      label: "Theme",
      options: [
        { value: "light", label: "Light" },
        { value: "dark", label: "Dark" },
      ],
    },
  ],
};
