"use client";

import { useEffect } from "react";

/**
 * TEMPORARY DEBUG. Logs every navigation to /docs/GaiaScenario along with
 * a stack trace, plus every click whose ancestor chain includes a link to
 * that URL. Also patches `dispatchNavigateAction`-adjacent paths by
 * intercepting `history.pushState` / `history.replaceState`.
 *
 * Remove once the auto-redirect bug is solved.
 */
export function DebugNavProbe() {
  useEffect(() => {
    const target = "/docs/GaiaScenario";
    const tag = "[NAV-PROBE]";

    const origPush = history.pushState.bind(history);
    const origReplace = history.replaceState.bind(history);

    history.pushState = (...args: Parameters<typeof history.pushState>) => {
      const url = String(args[2] ?? "");
      if (url.includes(target)) {
        console.warn(`${tag} pushState → ${url}`);
        console.trace(`${tag} pushState stack`);
      }
      return origPush(...args);
    };

    history.replaceState = (
      ...args: Parameters<typeof history.replaceState>
    ) => {
      const url = String(args[2] ?? "");
      if (url.includes(target)) {
        console.warn(`${tag} replaceState → ${url}`);
        console.trace(`${tag} replaceState stack`);
      }
      return origReplace(...args);
    };

    const onClickCapture = (e: MouseEvent) => {
      const path = e.composedPath() as Element[];
      const anchor = path.find(
        (el): el is HTMLAnchorElement =>
          el instanceof HTMLAnchorElement &&
          el.getAttribute("href")?.includes(target) === true,
      );
      if (anchor) {
        // Walk the path top-to-bottom (target first → document last) and
        // log every element so we can see the full DOM chain the click
        // travels through. This tells us whether the ToolCallsView
        // wrapper's onClick guard is even in the DOM.
        console.warn(
          `${tag} click bubbled to <a href="${anchor.getAttribute("href")}">`,
          {
            isTrusted: e.isTrusted,
            detail: e.detail,
            target: e.target,
            phase:
              e.eventPhase === 1
                ? "capturing"
                : e.eventPhase === 2
                  ? "target"
                  : "bubbling",
          },
        );
        console.log(`${tag} composedPath (target → document):`);
        for (const el of path) {
          if (el instanceof Element) {
            const tagName = el.tagName.toLowerCase();
            const id = el.id ? `#${el.id}` : "";
            const cls = el.className
              ? `.${String(el.className).split(/\s+/).slice(0, 3).join(".")}`
              : "";
            console.log(`  ${tagName}${id}${cls}`);
          } else {
            console.log("  (non-element)", el);
          }
        }
        console.trace(`${tag} click stack`);
      }
    };

    // Both phases: capture catches the descent, regular catches bubble.
    document.addEventListener("click", onClickCapture, true);
    document.addEventListener("click", onClickCapture, false);

    console.info(`${tag} installed — watching for nav to ${target}`);

    return () => {
      history.pushState = origPush;
      history.replaceState = origReplace;
      document.removeEventListener("click", onClickCapture, true);
      document.removeEventListener("click", onClickCapture, false);
    };
  }, []);

  return null;
}
