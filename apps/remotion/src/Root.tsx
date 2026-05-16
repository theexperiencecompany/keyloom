import "./index.css";
import { Composition } from "remotion";
import { componentsById } from "./components";
import {
  BROWSER_SCROLL_DURATION,
  BROWSER_SCROLL_FPS,
  BROWSER_SCROLL_HEIGHT,
  BROWSER_SCROLL_WIDTH,
  BrowserScroll,
} from "./compositions/BrowserScroll";
import { MyComposition } from "./compositions/Composition";
import {
  calculateFollowerMetadata,
  FOLLOWER_DURATION,
  FOLLOWER_FPS,
  FOLLOWER_HEIGHT,
  FOLLOWER_WIDTH,
  FollowerCelebration,
} from "./compositions/FollowerCelebration";
import {
  HERO_DEMO_DURATION,
  HERO_DEMO_FPS,
  HERO_DEMO_HEIGHT,
  HERO_DEMO_WIDTH,
  HeroDemo,
} from "./compositions/HeroDemo";
import {
  INTRO_TEXT_DURATION,
  INTRO_TEXT_FPS,
  INTRO_TEXT_HEIGHT,
  INTRO_TEXT_WIDTH,
  IntroText,
} from "./compositions/IntroText";
import { ProjectComposition } from "./compositions/Project/Project";
import { DEFAULT_PROJECT, type Project, projectDuration } from "./project";
import { compositions } from "./registry";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {compositions.map((c) => (
        <Composition
          key={c.id}
          id={c.id}
          component={componentsById[c.id]!}
          durationInFrames={c.durationInFrames}
          fps={c.fps}
          width={c.width}
          height={c.height}
          defaultProps={c.defaultProps}
          calculateMetadata={c.calculateMetadata}
        />
      ))}
      <Composition
        id="BrowserScroll"
        component={BrowserScroll}
        durationInFrames={BROWSER_SCROLL_DURATION}
        fps={BROWSER_SCROLL_FPS}
        width={BROWSER_SCROLL_WIDTH}
        height={BROWSER_SCROLL_HEIGHT}
        defaultProps={{
          imageFile: "page.png",
          pageHeight: 2400,
        }}
      />
      <Composition
        id="IntroText"
        component={IntroText}
        durationInFrames={INTRO_TEXT_DURATION}
        fps={INTRO_TEXT_FPS}
        width={INTRO_TEXT_WIDTH}
        height={INTRO_TEXT_HEIGHT}
      />
      <Composition
        id="FollowerCelebration"
        component={FollowerCelebration}
        durationInFrames={FOLLOWER_DURATION}
        fps={FOLLOWER_FPS}
        width={FOLLOWER_WIDTH}
        height={FOLLOWER_HEIGHT}
        defaultProps={{
          username: "t3dotgg",
          userAvatarUrl: "https://avatars.githubusercontent.com/t3dotgg?s=200",
          followerCount: 0,
          followers: [],
        }}
        calculateMetadata={calculateFollowerMetadata}
      />
      <Composition
        id="HeroDemo"
        component={HeroDemo}
        durationInFrames={HERO_DEMO_DURATION}
        fps={HERO_DEMO_FPS}
        width={HERO_DEMO_WIDTH}
        height={HERO_DEMO_HEIGHT}
      />
      <Composition
        id="MyComp"
        component={MyComposition}
        durationInFrames={60}
        fps={30}
        width={1280}
        height={720}
      />
      <Composition
        id="Project"
        component={ProjectComposition}
        durationInFrames={projectDuration(DEFAULT_PROJECT)}
        fps={DEFAULT_PROJECT.fps}
        width={DEFAULT_PROJECT.width}
        height={DEFAULT_PROJECT.height}
        defaultProps={DEFAULT_PROJECT}
        calculateMetadata={({ props }) => {
          const project = props as Project;
          return {
            durationInFrames: projectDuration(project),
            fps: project.fps,
            width: project.width,
            height: project.height,
          };
        }}
      />
    </>
  );
};
