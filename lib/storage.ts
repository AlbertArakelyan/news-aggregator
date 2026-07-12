/**
 * The one place localStorage is touched.
 *
 * Both the theme and the feed preferences persist client-side and are read
 * through `useSyncExternalStore`, which needs a subscribe/snapshot pair. Rather
 * than write that twice, they share this.
 *
 * Every access is wrapped: localStorage throws outright in some privacy modes,
 * and neither a theme nor a saved filter is worth breaking the page over.
 */

/** Fired on write, so the store re-reads within this tab.
 *  ("storage" only fires in *other* tabs, which is why this exists.) */
const STORAGE_EVENT = "app:storage";

export function readStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

export function writeStorage(key: string, value: string): void {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // The value simply will not persist. The session still behaves correctly.
  }

  window.dispatchEvent(new Event(STORAGE_EVENT));
}

export function removeStorage(key: string): void {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Nothing to do — the key was already unreachable.
  }

  window.dispatchEvent(new Event(STORAGE_EVENT));
}

/** Fires on: this tab's writes, and another tab's writes. */
export function subscribeToStorage(onChange: () => void): () => void {
  window.addEventListener(STORAGE_EVENT, onChange);
  window.addEventListener("storage", onChange);

  return () => {
    window.removeEventListener(STORAGE_EVENT, onChange);
    window.removeEventListener("storage", onChange);
  };
}
