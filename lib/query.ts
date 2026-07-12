import { SOURCES } from "./sources/registry";
import { ArticleQuery, CATEGORY_IDS, CategoryId, SourceId } from "./sources/types";

/**
 * Parses an untrusted query string into an ArticleQuery.
 *
 * Shared by `pages/api/articles.ts` and `getServerSideProps` on purpose: the
 * feed is reachable both by SSR (first load, shareable URL) and by client-side
 * fetch (filter changes), and the two must interpret the same URL identically.
 */
export type RawQuery = Partial<Record<string, string | string[]>>;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();

  return trimmed ? trimmed : undefined;
}

function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? value.split(",") : [];

  return raw.map((item) => item.trim()).filter(Boolean);
}

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function date(value: string | string[] | undefined): string | undefined {
  const raw = first(value);

  // Reject anything that is not YYYY-MM-DD rather than passing junk to a
  // provider, which would 400 the whole source.
  return raw && ISO_DATE.test(raw) ? raw : undefined;
}

const VALID_SOURCE_IDS = SOURCES.map((source) => source.id) as string[];

export function parseArticleQuery(raw: RawQuery): ArticleQuery {
  const category = first(raw.category);
  const pageNumber = Number(first(raw.page) ?? 1);
  const pageSize = Number(first(raw.pageSize) ?? 20);

  return {
    keyword: first(raw.q),
    from: date(raw.from),
    to: date(raw.to),
    category: CATEGORY_IDS.includes(category as CategoryId)
      ? (category as CategoryId)
      : undefined,
    authors: list(raw.authors),
    sources: list(raw.sources).filter((id): id is SourceId =>
      VALID_SOURCE_IDS.includes(id),
    ),
    page: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize > 0 && pageSize <= 50 ? pageSize : 20,
  };
}
