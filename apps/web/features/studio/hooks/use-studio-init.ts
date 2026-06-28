import { compositionsById } from "@workspace/compositions/registry";
import { useEffect, useRef } from "react";
import { takeStashedStudioProject } from "@/lib/fork";
import type { StudioAction } from "../state/reducer";

/**
 * One-time studio seeding on mount, in priority order:
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

    const stashed = takeStashedStudioProject();
    if (stashed) {
      dispatch({ type: "LOAD_PROJECT", project: stashed });
      window.history.replaceState(null, "", "/studio");
      return;
    }

    const id = new URLSearchParams(window.location.search).get("component");
    if (id && compositionsById[id]) {
      dispatch({ type: "ADD_CLIP", compositionId: id });
      window.history.replaceState(null, "", "/studio");
    }
  }, [dispatch]);
}
