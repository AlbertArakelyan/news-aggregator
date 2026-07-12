import { useCallback, useSyncExternalStore } from "react";

import {
  Preferences,
  clearStoredPreferences,
  getPreferences,
  getServerPreferences,
  hasPreferences,
  storePreferences,
} from "@/lib/preferences";
import { subscribeToStorage } from "@/lib/storage";

interface UsePreferencesResult {
  preferences: Preferences;
  /** Whether the reader has saved anything — drives the personalized-feed badge. */
  isPersonalized: boolean;
  savePreferences: (next: Preferences) => void;
  clearPreferences: () => void;
}

/**
 * The same shape as useTheme, for the same reason: preferences live in
 * localStorage, which the server cannot see. `useSyncExternalStore` hydrates from
 * a server snapshot and then re-renders with the real client value — no
 * isMounted flag, and no setState in an effect (which `yarn lint` rejects).
 *
 * `getPreferences` caches its parse against the raw string. Returning a freshly
 * parsed object each call would hand React a new reference every render, and
 * useSyncExternalStore would loop forever.
 */
export default function usePreferences(): UsePreferencesResult {
  const preferences = useSyncExternalStore(
    subscribeToStorage,
    getPreferences,
    getServerPreferences,
  );

  const savePreferences = useCallback((next: Preferences) => {
    storePreferences(next);
  }, []);

  const clearPreferences = useCallback(() => {
    clearStoredPreferences();
  }, []);

  return {
    preferences,
    isPersonalized: hasPreferences(preferences),
    savePreferences,
    clearPreferences,
  };
}
