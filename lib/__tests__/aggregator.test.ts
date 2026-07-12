import { describe, expect, it } from "vitest";

import {
  applyUnsupportedFilters,
  dedupeByUrl,
  sortByNewest,
} from "../aggregator";
import guardianFixture from "../sources/__fixtures__/guardian.json";
import newsapiFixture from "../sources/__fixtures__/newsapi.json";
import guardian from "../sources/guardian";
import newsapi from "../sources/newsapi";
import { Article, NewsSource } from "../sources/types";

const guardianArticles = guardian.parse(guardianFixture);
const newsapiArticles = newsapi.parse(newsapiFixture);

describe("dedupeByUrl", () => {
  it("collapses the same story syndicated across two providers", () => {
    // The fixtures deliberately share one story: the Guardian's chip-shortage
    // piece reappears via NewsAPI with a ?utm_source= tacked on.
    const merged = [...guardianArticles, ...newsapiArticles];
    const titles = merged
      .map((a) => a.title)
      .filter((t) => t === "Chip shortage eases as new fabs come online");

    expect(titles).toHaveLength(2);

    const deduped = dedupeByUrl(merged);
    const survivors = deduped.filter(
      (a) => a.title === "Chip shortage eases as new fabs come online",
    );

    expect(survivors).toHaveLength(1);
    // The Guardian's copy comes first in the array, so it is the one kept.
    expect(survivors[0].source.id).toBe("guardian");
  });

  it("ignores trailing slashes and query strings when comparing", () => {
    const base = guardianArticles[0];
    const twin: Article = {
      ...base,
      id: "other:1",
      url: `${base.url}/?utm_campaign=x`,
    };

    expect(dedupeByUrl([base, twin])).toHaveLength(1);
  });
});

describe("sortByNewest", () => {
  it("orders by publishedAt descending across sources", () => {
    const sorted = sortByNewest([...guardianArticles, ...newsapiArticles]);
    const dates = sorted.map((a) => new Date(a.publishedAt).getTime());

    expect(dates).toEqual([...dates].sort((a, b) => b - a));
  });

  it("does not mutate its input", () => {
    const input = [...guardianArticles];
    const before = input.map((a) => a.id);

    sortByNewest(input);

    expect(input.map((a) => a.id)).toEqual(before);
  });
});

describe("applyUnsupportedFilters", () => {
  it("filters category in memory for a source that cannot do it server-side", () => {
    expect(newsapi.capabilities.category).toBe(false);

    // NewsAPI's /everything reports no category, so its articles have
    // category === null and correctly cannot satisfy a category filter. The
    // alternative — passing them through — would leak unfiltered results into a
    // filtered feed, which is the silent failure this design exists to prevent.
    const filtered = applyUnsupportedFilters(newsapiArticles, newsapi, {
      category: "technology",
    });

    expect(filtered).toHaveLength(0);
  });

  it("leaves a supported filter alone — the provider already applied it", () => {
    expect(guardian.capabilities.category).toBe(true);

    const filtered = applyUnsupportedFilters(guardianArticles, guardian, {
      category: "technology",
    });

    // Untouched: the Guardian filtered by section server-side, so re-filtering
    // here would double-apply and drop the business article it legitimately
    // returned for a different query.
    expect(filtered).toHaveLength(guardianArticles.length);
  });

  it("always filters authors in memory — no provider does it reliably", () => {
    const filtered = applyUnsupportedFilters(guardianArticles, guardian, {
      authors: ["jane"],
    });

    expect(filtered).toHaveLength(1);
    expect(filtered[0].author).toBe("Jane Doe");
  });

  it("excludes an article with no author when an author filter is set", () => {
    const anonymous: Article = { ...guardianArticles[0], author: null };
    const filtered = applyUnsupportedFilters([anonymous], guardian, {
      authors: ["jane"],
    });

    expect(filtered).toHaveLength(0);
  });

  it("applies a date range in memory only when the source cannot", () => {
    const incapable: NewsSource = {
      ...guardian,
      capabilities: { ...guardian.capabilities, dateRange: false },
    };

    const filtered = applyUnsupportedFilters(guardianArticles, incapable, {
      from: "2026-07-10",
    });

    // Only the 10 July article survives; the 9 July one is before the range.
    expect(filtered).toHaveLength(1);
    expect(filtered[0].publishedAt.startsWith("2026-07-10")).toBe(true);
  });

  it("treats the 'to' date as inclusive of the whole day", () => {
    const incapable: NewsSource = {
      ...guardian,
      capabilities: { ...guardian.capabilities, dateRange: false },
    };

    // The article is at 14:05 on the 10th; a naive `new Date("2026-07-10")`
    // bound is midnight and would wrongly exclude it.
    const filtered = applyUnsupportedFilters(guardianArticles, incapable, {
      to: "2026-07-10",
    });

    expect(filtered.map((a) => a.publishedAt)).toContain(
      "2026-07-10T14:05:00.000Z",
    );
  });
});
