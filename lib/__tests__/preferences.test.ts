import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  EMPTY_PREFERENCES,
  Preferences,
  getPreferences,
  hasPreferences,
  preferencesToQuery,
  resolvePersonalizedQuery,
  storePreferences,
} from "../preferences";
import { parseArticleQuery } from "../query";

// A minimal localStorage. The real one is unavailable in the node test env, and
// stubbing it here also lets us prove the code survives it throwing.
function stubStorage(initial: Record<string, string> = {}, throws = false) {
  const store = new Map(Object.entries(initial));

  vi.stubGlobal("window", {
    localStorage: {
      getItem: (key: string) => {
        if (throws) throw new Error("blocked");
        return store.get(key) ?? null;
      },
      setItem: (key: string, value: string) => {
        if (throws) throw new Error("blocked");
        store.set(key, value);
      },
      removeItem: (key: string) => store.delete(key),
    },
    dispatchEvent: () => true,
  });

  return store;
}

beforeEach(() => {
  vi.unstubAllGlobals();
});

describe("getPreferences", () => {
  it("returns a stable reference when nothing changed", () => {
    stubStorage({
      "feed-preferences": JSON.stringify({ sources: ["nyt"], categories: [], authors: [] }),
    });

    // useSyncExternalStore compares snapshots by reference. A fresh object on
    // every call would re-render forever, so the parse must be cached.
    expect(getPreferences()).toBe(getPreferences());
  });

  it("discards a source or category it does not recognise", () => {
    stubStorage({
      "feed-preferences": JSON.stringify({
        sources: ["nyt", "bloomberg"],
        categories: ["science", "gardening"],
        authors: ["  Jane Doe  ", ""],
      }),
    });

    const prefs = getPreferences();

    // localStorage holds whatever an older build, or the user, left there.
    expect(prefs.sources).toEqual(["nyt"]);
    expect(prefs.categories).toEqual(["science"]);
    expect(prefs.authors).toEqual(["Jane Doe"]);
  });

  it("falls back to empty on corrupt JSON rather than crashing the feed", () => {
    stubStorage({ "feed-preferences": "{not json" });

    expect(getPreferences()).toEqual(EMPTY_PREFERENCES);
  });

  it("survives localStorage throwing, as it does in some privacy modes", () => {
    stubStorage({}, true);

    expect(getPreferences()).toEqual(EMPTY_PREFERENCES);
    expect(() => storePreferences(EMPTY_PREFERENCES)).not.toThrow();
  });
});

describe("hasPreferences", () => {
  it("is false until something is actually chosen", () => {
    expect(hasPreferences(EMPTY_PREFERENCES)).toBe(false);
    expect(
      hasPreferences({ sources: [], categories: [], authors: ["Jane"] }),
    ).toBe(true);
  });
});

describe("preferencesToQuery", () => {
  it("maps preferences onto the ordinary filter fields", () => {
    // Preferences *are* filters — this is what lets the personalized feed ride
    // the existing URL contract instead of becoming a second way to narrow it.
    const preferences: Preferences = {
      sources: ["guardian"],
      categories: ["science", "technology"],
      authors: ["Jane Doe"],
    };

    expect(preferencesToQuery(preferences)).toEqual({
      sources: ["guardian"],
      categories: ["science", "technology"],
      authors: ["Jane Doe"],
    });
  });
});

describe("resolvePersonalizedQuery", () => {
  const saved: Preferences = {
    sources: ["guardian"],
    categories: ["science"],
    authors: [],
  };

  it("personalizes a bare feed", () => {
    const query = resolvePersonalizedQuery(saved, parseArticleQuery({}));

    expect(query).toEqual({
      sources: ["guardian"],
      categories: ["science"],
      authors: [],
    });
  });

  it("leaves an already-filtered URL alone — the URL is an explicit choice", () => {
    // A shared link, or a filter the reader set, must outrank a stored default.
    // Otherwise opening someone's link would silently rewrite it to your feed.
    expect(
      resolvePersonalizedQuery(saved, parseArticleQuery({ q: "climate" })),
    ).toBeNull();

    expect(
      resolvePersonalizedQuery(saved, parseArticleQuery({ sources: "nyt" })),
    ).toBeNull();
  });

  it("does nothing when nothing is saved", () => {
    expect(
      resolvePersonalizedQuery(EMPTY_PREFERENCES, parseArticleQuery({})),
    ).toBeNull();
  });

  it("leaves an explicit page alone — rewriting it would lose the reader's place", () => {
    // ?page=2 is state the reader navigated to. Personalizing would silently
    // send them back to page 1 of a different feed.
    expect(
      resolvePersonalizedQuery(saved, parseArticleQuery({ page: "2" })),
    ).toBeNull();
  });
});
