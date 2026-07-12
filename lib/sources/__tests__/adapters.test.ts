import { afterEach, describe, expect, it, vi } from "vitest";

import guardianFixture from "../__fixtures__/guardian.json";
import newsapiFixture from "../__fixtures__/newsapi.json";
import nytFixture from "../__fixtures__/nyt.json";
import guardian from "../guardian";
import newsapi from "../newsapi";
import nyt from "../nyt";

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("guardian", () => {
  const articles = guardian.parse(guardianFixture);

  it("drops articles with an unparseable date", () => {
    // The fixture has 3 results; the third has webPublicationDate "not-a-date".
    expect(articles).toHaveLength(2);
    expect(articles.map((a) => a.title)).not.toContain(
      "Unparseable date — must be dropped",
    );
  });

  it("strips HTML from trailText", () => {
    expect(articles[0].description).toBe(
      "Analysts say the squeeze is finally loosening.",
    );
  });

  it("strips the 'by' prefix from a byline", () => {
    expect(articles[1].author).toBe("Jane Doe");
  });

  it("maps sectionId onto the internal category", () => {
    expect(articles[0].category).toBe("technology");
    expect(articles[1].category).toBe("business");
  });

  it("normalizes the date to ISO", () => {
    expect(articles[0].publishedAt).toBe("2026-07-10T14:05:00.000Z");
  });

  it("nulls a missing image rather than emitting undefined", () => {
    expect(articles[1].imageUrl).toBeNull();
  });

  it("maps health onto the society section, which is what the Guardian has", () => {
    vi.stubEnv("GUARDIAN_API_KEY", "k");
    const url = new URL(guardian.buildUrl({ category: "health" }));

    expect(url.searchParams.get("section")).toBe("society");
  });

  it("requests the fields the response otherwise omits", () => {
    vi.stubEnv("GUARDIAN_API_KEY", "k");
    const url = new URL(guardian.buildUrl({}));

    expect(url.searchParams.get("show-fields")).toBe(
      "trailText,thumbnail,byline",
    );
  });
});

describe("nyt", () => {
  const articles = nyt.parse(nytFixture);

  it("drops a doc with no headline", () => {
    expect(articles).toHaveLength(2);
  });

  it("parses the +0000 offset NYT sends, not just Z", () => {
    expect(articles[0].publishedAt).toBe("2026-07-11T09:30:00.000Z");
  });

  it("absolutizes a root-relative multimedia url", () => {
    expect(articles[0].imageUrl).toBe(
      "https://static01.nyt.com/images/2026/07/11/tech/ai-chips/ai-chips-articleLarge.jpg",
    );
  });

  it("handles the newer nested multimedia shape, already absolute", () => {
    expect(articles[1].imageUrl).toBe(
      "https://static01.nyt.com/images/2026/07/10/mars.jpg",
    );
  });

  it("falls back to snippet when abstract is empty", () => {
    expect(articles[1].description).toBe("The capsule touched down in Utah.");
  });

  it("sends YYYYMMDD dates, not ISO", () => {
    vi.stubEnv("NYT_API_KEY", "k");
    const url = new URL(nyt.buildUrl({ from: "2026-07-01", to: "2026-07-31" }));

    expect(url.searchParams.get("begin_date")).toBe("20260701");
    expect(url.searchParams.get("end_date")).toBe("20260731");
  });

  it("builds the fq filter-query syntax for a category", () => {
    vi.stubEnv("NYT_API_KEY", "k");
    const url = new URL(nyt.buildUrl({ category: "business" }));

    expect(url.searchParams.get("fq")).toBe('section_name:("Business Day")');
  });

  it("is zero-indexed on page, unlike the others", () => {
    vi.stubEnv("NYT_API_KEY", "k");
    const url = new URL(nyt.buildUrl({ page: 1 }));

    expect(url.searchParams.get("page")).toBe("0");
  });

  it("does not require the NYT secret — Article Search takes the key alone", () => {
    vi.stubEnv("NYT_API_KEY", "k");
    vi.stubEnv("NYT_SECRET_API_KEY", "");

    expect(nyt.isConfigured()).toBe(true);
  });
});

describe("newsapi", () => {
  const articles = newsapi.parse(newsapiFixture);

  it("drops [Removed] tombstones and empty titles", () => {
    // 4 in the fixture: one "[Removed]", one with an empty title.
    expect(articles).toHaveLength(2);
    expect(articles.map((a) => a.title)).not.toContain("[Removed]");
  });

  it("keeps the underlying outlet as the source name", () => {
    expect(articles[0].source.name).toBe("Reuters");
    expect(articles[0].source.id).toBe("newsapi");
  });

  it("reports no category, because /everything never returns one", () => {
    expect(articles[0].category).toBeNull();
    expect(newsapi.capabilities.category).toBe(false);
  });

  it("falls back to a broad q, since /everything 400s without one", () => {
    vi.stubEnv("NEWSAPI_KEY", "k");
    const url = new URL(newsapi.buildUrl({}));

    expect(url.searchParams.get("q")).toBe("news");
  });
});

describe("every adapter", () => {
  it("is unconfigured when its key is absent, so it is skipped not 401ed", () => {
    vi.stubEnv("GUARDIAN_API_KEY", "");
    vi.stubEnv("NYT_API_KEY", "");
    vi.stubEnv("NEWSAPI_KEY", "");

    expect(guardian.isConfigured()).toBe(false);
    expect(nyt.isConfigured()).toBe(false);
    expect(newsapi.isConfigured()).toBe(false);
  });

  it("never lets a malformed response throw", () => {
    for (const source of [guardian, nyt, newsapi]) {
      expect(source.parse(null)).toEqual([]);
      expect(source.parse({})).toEqual([]);
      expect(source.parse({ response: { results: "nonsense" } })).toEqual([]);
    }
  });

  it("emits a complete Article for every field the type declares", () => {
    const article = guardian.parse(guardianFixture)[0];

    expect(article).toMatchObject({
      id: expect.stringContaining("guardian:"),
      title: expect.any(String),
      url: expect.stringContaining("https://"),
      publishedAt: expect.stringMatching(/^\d{4}-\d{2}-\d{2}T.*Z$/),
      source: { id: "guardian", name: "The Guardian" },
    });
  });
});
