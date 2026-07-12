export type Theme = "light" | "dark" | "system";
export type ResolvedTheme = "light" | "dark";

export const THEME_STORAGE_KEY = "theme";
export const DEFAULT_THEME: Theme = "system";

const DARK_CLASS = "dark";
const DARK_QUERY = "(prefers-color-scheme: dark)";

/** Dispatched on window when setTheme runs, so the store re-reads within this tab.
 *  ("storage" only fires in *other* tabs, which is why this exists.) */
const THEME_CHANGE_EVENT = "themechange";

export function getSystemTheme(): ResolvedTheme {
  return window.matchMedia(DARK_QUERY).matches ? "dark" : "light";
}

export function getStoredTheme(): Theme {
  // localStorage throws outright in some privacy modes; a theme is never worth
  // breaking the page over.
  try {
    const stored = window.localStorage.getItem(THEME_STORAGE_KEY);
    return stored === "light" || stored === "dark" || stored === "system"
      ? stored
      : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

export function storeTheme(theme: Theme): void {
  try {
    window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Preference simply will not persist. The session still themes correctly.
  }
  window.dispatchEvent(new Event(THEME_CHANGE_EVENT));
}

export function applyResolvedTheme(resolved: ResolvedTheme): void {
  document.documentElement.classList.toggle(DARK_CLASS, resolved === "dark");
}

/** Fires on: this tab's setTheme, another tab's setTheme, and OS-level changes. */
export function subscribeToTheme(onChange: () => void): () => void {
  const query = window.matchMedia(DARK_QUERY);

  window.addEventListener(THEME_CHANGE_EVENT, onChange);
  window.addEventListener("storage", onChange);
  query.addEventListener("change", onChange);

  return () => {
    window.removeEventListener(THEME_CHANGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
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
