import { describe, expect, it } from "vitest";

import { hasActiveFilters, parseArticleQuery, toQueryParams } from "../query";

describe("parseArticleQuery", () => {
  it("rejects a malformed date instead of passing junk to a provider", () => {
    // A bad date would 400 the whole source, taking the feed down with it.
    expect(parseArticleQuery({ from: "12/07/2026" }).from).toBeUndefined();
    expect(parseArticleQuery({ from: "2026-07-12" }).from).toBe("2026-07-12");
  });

  it("drops an unknown category rather than filtering on nonsense", () => {
    expect(parseArticleQuery({ category: "sports" }).category).toBeUndefined();
    expect(parseArticleQuery({ category: "sport" }).category).toBe("sport");
  });

  it("drops an unknown source id", () => {
    expect(parseArticleQuery({ sources: "guardian,bloomberg" }).sources).toEqual([
      "guardian",
    ]);
  });

  it("clamps a hostile page size", () => {
    expect(parseArticleQuery({ pageSize: "5000" }).pageSize).toBe(20);
    expect(parseArticleQuery({ pageSize: "-1" }).pageSize).toBe(20);
    expect(parseArticleQuery({ page: "0" }).page).toBe(1);
  });

  it("takes the first value when a param is repeated", () => {
    expect(parseArticleQuery({ q: ["climate", "sport"] }).keyword).toBe("climate");
  });
});

describe("toQueryParams", () => {
  it("omits empty and default values, so a cleared filter leaves no litter", () => {
    expect(toQueryParams({ page: 1, pageSize: 20 })).toEqual({});
    expect(toQueryParams({ keyword: "", category: undefined })).toEqual({});
  });

  it("keeps a page only when it is past the first", () => {
    expect(toQueryParams({ page: 1 })).toEqual({});
    expect(toQueryParams({ page: 3 })).toEqual({ page: "3" });
  });

  it("round-trips with parseArticleQuery", () => {
    // The two directions are the whole URL contract. If they drift, a shared
    // link silently means something different to the server than to the client.
    const original = {
      keyword: "climate",
      from: "2026-07-01",
      to: "2026-07-12",
      category: "science" as const,
      sources: ["guardian" as const, "nyt" as const],
      authors: ["Jane Doe"],
      page: 2,
    };

    const reparsed = parseArticleQuery(toQueryParams(original));

    expect(reparsed).toMatchObject(original);
  });
});

describe("hasActiveFilters", () => {
  it("is false for an untouched feed", () => {
    expect(hasActiveFilters(parseArticleQuery({}))).toBe(false);
  });

  it("is true as soon as anything filters", () => {
    expect(hasActiveFilters(parseArticleQuery({ q: "climate" }))).toBe(true);
    expect(hasActiveFilters(parseArticleQuery({ sources: "nyt" }))).toBe(true);
  });

  it("ignores paging — page 2 of nothing is still unfiltered", () => {
    expect(hasActiveFilters(parseArticleQuery({ pageSize: "20" }))).toBe(false);
  });
});
