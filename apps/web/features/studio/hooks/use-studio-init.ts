import { compositionsById } from "@workspace/compositions/registry";
import { useEffect, useRef } from "react";
import { toast } from "sonner";
import { takeStashedStudioProject } from "@/lib/fork";
import { takeSceneProject } from "@/lib/scene-handoff";
import type { StudioAction } from "../state/reducer";

/**
 * One-time studio seeding on mount, in priority order:
 *  0. A customized showcase scene from this tab's sessionStorage, explicitly
 *     requested with ?from=showcase.
 *  1. A forked project handed off from the dashboard (stashed in localStorage
 *     because its source code is too large for a URL param) — replaces the
 *     whole project.
 *  2. `/studio?component=<id>` deep-link — adds that composition as a clip.
 * The URL is cleaned up afterwards so a refresh doesn't re-apply it.
 */
export function useStudioInit(dispatch: React.Dispatch<StudioAction>) {
  const didInit = useRef(false);
  useEffect(() => {
    if (didInit.current) return;
    didInit.current = true;

    const params = new URLSearchParams(window.location.search);
    if (params.get("from") === "showcase") {
      try {
        const project = takeSceneProject(window.sessionStorage);
        if (!project) throw new Error("Missing scene");
        dispatch({ type: "LOAD_PROJECT", project });
        dispatch({ type: "SELECT_CLIP", clipId: project.clips[0]?.id ?? null });
      } catch {
        toast.error(
          "Your scene could not be opened. Go back to Explore and try again.",
        );
      }
      window.history.replaceState(null, "", "/studio");
      return;
    }

    const stashed = takeStashedStudioProject();
    if (stashed) {
      dispatch({ type: "LOAD_PROJECT", project: stashed });
      window.history.replaceState(null, "", "/studio");
      return;
    }

    const id = params.get("component");
    if (id && compositionsById[id]) {
      dispatch({ type: "ADD_CLIP", compositionId: id });
      window.history.replaceState(null, "", "/studio");
    }
  }, [dispatch]);
}
