import "./index.css";
import { Composition } from "remotion";
import { componentsById } from "./components";
import { ProjectComposition } from "./compositions/Project/Project";
import { DEFAULT_PROJECT, type Project, projectDuration } from "./project";
import { withRemotionQueryClient } from "./query-client";
import { compositions } from "./registry";

export const RemotionRoot: React.FC = () => {
  return (
    <>
      {compositions.map((c) => (
        <Composition
          key={c.id}
          id={c.id}
          component={withRemotionQueryClient(componentsById[c.id]!)}
          durationInFrames={c.durationInFrames}
          fps={c.fps}
          width={c.width}
          height={c.height}
          defaultProps={c.defaultProps}
          calculateMetadata={c.calculateMetadata}
        />
      ))}
      <Composition
        id="Project"
        component={withRemotionQueryClient(ProjectComposition)}
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
