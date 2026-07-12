import { hasActiveFilters } from "./query";
import { readStorage, removeStorage, writeStorage } from "./storage";
import {
  ArticleQuery,
  CATEGORY_IDS,
  CategoryId,
  SOURCE_IDS,
  SourceId,
} from "./sources/types";

export const PREFERENCES_STORAGE_KEY = "feed-preferences";

/** The reader's default feed: preferred sources, categories and authors. */
export interface Preferences {
  sources: SourceId[];
  categories: CategoryId[];
  authors: string[];
}

/**
 * A single frozen instance, reused as both the empty value and the server
 * snapshot. `useSyncExternalStore` compares snapshots by reference — returning a
 * fresh `{ sources: [], ... }` each call would re-render forever.
 */
export const EMPTY_PREFERENCES: Preferences = Object.freeze({
  sources: [],
  categories: [],
  authors: [],
}) as Preferences;

/** localStorage holds whatever an older build, or a user, put there. Trust none of it. */
function parsePreferences(raw: string | null): Preferences {
  if (!raw) {
    return EMPTY_PREFERENCES;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<Preferences>;

    return {
      sources: (parsed.sources ?? []).filter((id): id is SourceId =>
        SOURCE_IDS.includes(id as SourceId),
      ),
      categories: (parsed.categories ?? []).filter((id): id is CategoryId =>
        CATEGORY_IDS.includes(id as CategoryId),
      ),
      authors: (parsed.authors ?? [])
        .filter((author): author is string => typeof author === "string")
        .map((author) => author.trim())
        .filter(Boolean),
    };
  } catch {
    // Corrupt JSON — fall back rather than crash the feed.
    return EMPTY_PREFERENCES;
  }
}

// Snapshot cache. getPreferences() runs on every render, and JSON.parse yields a
// new object each time; without caching against the raw string, every render
// would produce a new reference and useSyncExternalStore would loop forever.
let cachedRaw: string | null = null;
let cachedValue: Preferences = EMPTY_PREFERENCES;

export function getPreferences(): Preferences {
  const raw = readStorage(PREFERENCES_STORAGE_KEY);

  if (raw !== cachedRaw) {
    cachedRaw = raw;
    cachedValue = parsePreferences(raw);
  }

  return cachedValue;
}

/** The stable server snapshot: the server cannot know a reader's preferences. */
export function getServerPreferences(): Preferences {
  return EMPTY_PREFERENCES;
}

export function storePreferences(preferences: Preferences): void {
  writeStorage(PREFERENCES_STORAGE_KEY, JSON.stringify(preferences));
}

export function clearStoredPreferences(): void {
  removeStorage(PREFERENCES_STORAGE_KEY);
}

export function hasPreferences(preferences: Preferences): boolean {
  return (
    preferences.sources.length > 0 ||
    preferences.categories.length > 0 ||
    preferences.authors.length > 0
  );
}

/**
 * Preferences *are* filters — the personalized feed is the feed with the reader's
 * defaults already applied. Expressing them as an ArticleQuery is what lets them
 * flow through the existing URL contract instead of becoming a second, parallel
 * way to narrow the feed.
 */
export function preferencesToQuery(preferences: Preferences): ArticleQuery {
  return {
    sources: preferences.sources,
    categories: preferences.categories,
    authors: preferences.authors,
  };
}

/**
 * Whether a bare feed should be personalized, and with what.
 *
 * The decision is pure and lives here; the hook that calls it only navigates.
 * That split is what makes this rule testable without a browser or a router —
 * and the rule is subtle enough to be worth testing:
 *
 *   - The **URL wins**. A shared link, or a filter the reader set, is an
 *     explicit choice and outranks a stored default.
 *   - No preferences means no redirect.
 *
 * Returns null when the feed should be left exactly as it is.
 */
export function resolvePersonalizedQuery(
  preferences: Preferences,
  filters: ArticleQuery,
): ArticleQuery | null {
  // hasActiveFilters is reused, not reimplemented: query.ts owns what "filtered"
  // means, and it imports nothing from here, so there is no cycle.
  if (hasActiveFilters(filters) || !hasPreferences(preferences)) {
    return null;
  }

  return preferencesToQuery(preferences);
}
