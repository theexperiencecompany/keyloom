import { useEffect } from "react";

/**
 * The studio is a dark-first editor (like CapCut / Premiere) — its light theme
 * reads washed out. Force dark on <html> while the studio is mounted so panels
 * AND portalled UI (dropdowns, modals, popovers in <body>) all render dark,
 * then restore the user's theme on leave.
 */
export function useForceDarkTheme() {
  useEffect(() => {
    const root = document.documentElement;
    const hadDark = root.classList.contains("dark");
    const hadLight = root.classList.contains("light");
    const prevColorScheme = root.style.colorScheme;
    root.classList.add("dark");
    root.classList.remove("light");
    root.style.colorScheme = "dark";
    return () => {
      if (!hadDark) root.classList.remove("dark");
      if (hadLight) root.classList.add("light");
      root.style.colorScheme = prevColorScheme;
    };
  }, []);
}
