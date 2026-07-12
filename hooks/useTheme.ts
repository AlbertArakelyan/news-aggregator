import { useCallback, useEffect, useSyncExternalStore } from "react";

import {
  DEFAULT_THEME,
  ResolvedTheme,
  Theme,
  applyResolvedTheme,
  getStoredTheme,
  getSystemTheme,
  storeTheme,
  subscribeToTheme,
} from "@/lib/theme";

interface UseThemeResult {
  /** The stored preference, including "system". */
  theme: Theme;
  /** What the user actually sees — "system" resolved against the OS setting. */
  resolvedTheme: ResolvedTheme;
  setTheme: (next: Theme) => void;
}

/**
 * Theme lives in localStorage and matchMedia — external, mutable, and unknowable
 * to the server. useSyncExternalStore is the primitive for exactly that: it
 * hydrates from getServerSnapshot (so server and client HTML agree), then
 * immediately re-renders with the real client value. That is why there is no
 * isMounted flag and no setState in an effect here.
 *
 * The <html> class is already correct before React runs — the blocking script in
 * _document set it. The effect below only keeps it in sync afterwards, when the
 * preference or the OS setting changes.
 */
export default function useTheme(): UseThemeResult {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getStoredTheme,
    () => DEFAULT_THEME,
  );

  const systemTheme = useSyncExternalStore(
    subscribeToTheme,
    getSystemTheme,
    (): ResolvedTheme => "light",
  );

  const resolvedTheme: ResolvedTheme = theme === "system" ? systemTheme : theme;

  useEffect(() => {
    applyResolvedTheme(resolvedTheme);
  }, [resolvedTheme]);

  const setTheme = useCallback((next: Theme) => {
    storeTheme(next);
  }, []);

  return { theme, resolvedTheme, setTheme };
}
