import { readStorage, subscribeToStorage, writeStorage } from "./storage";

export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const DEFAULT_THEME: Theme = "system";

const DARK_CLASS = "dark";
const DARK_QUERY = "(prefers-color-scheme: dark)";

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function getStoredTheme(): Theme {
  const stored = readStorage(THEME_STORAGE_KEY);

  return stored === "light" || stored === "dark" || stored === "system"
    ? stored
    : DEFAULT_THEME;
}

export function storeTheme(theme: Theme): void {
  writeStorage(THEME_STORAGE_KEY, theme);
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle(DARK_CLASS, resolved === "dark");
}

/**
 * Fires on: this tab's setTheme, another tab's setTheme, and OS-level changes.
 *
 * The OS listener is the one thing preferences do not need, which is why the
 * shared storage subscription is wrapped rather than used directly.
 */
export function subscribeToTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);
  const unsubscribeFromStorage = subscribeToStorage(onChange);

  query.addEventListener("change", onChange);

  return () => {
    unsubscribeFromStorage();
    query.removeEventListener("change", onChange);
  };
}

/**
 * Runs blocking in <head> before first paint, so a dark-theme visitor never sees
 * a white flash. It cannot import from this module — it is inlined as a string
 * into the HTML — so the literals below are duplicated deliberately. Keep them in
 * sync with the constants above.
 *
 * Wrapped in try/catch because localStorage throws outright in some privacy
 * modes, and a theme preference is never worth breaking the page over.
 */
export const THEME_INIT_SCRIPT = `
(function () {
  var theme = "${DEFAULT_THEME}";
  try {
    var stored = localStorage.getItem("${THEME_STORAGE_KEY}");
    if (stored === "light" || stored === "dark" || stored === "system") theme = stored;
  } catch (e) {}
  try {
    var isDark = theme === "dark" || (theme === "system" && window.matchMedia("${DARK_QUERY}").matches);
    document.documentElement.classList.toggle("${DARK_CLASS}", isDark);
  } catch (e) {}
})();
`.trim();
