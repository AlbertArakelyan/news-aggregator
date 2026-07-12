import {
  ArticleQuery,
  CATEGORY_IDS,
  CategoryId,
  SOURCE_IDS,
  SourceId,
} from "./sources/types";

/**
 * The URL is the single source of truth for the feed's filters — which makes a
 * filtered feed a shareable, server-rendered link, gives the back button correct
 * behaviour for free, and means no client-side filter state to keep in sync.
 *
 * This module owns **both directions** of that contract, so they cannot drift:
 *
 *   parseArticleQuery : URL  -> ArticleQuery   (server: SSR + the API route)
 *   toQueryParams     : ArticleQuery -> URL    (client: the filter controls)
 *
 * It deliberately does **not** import `registry.ts`. The filter UI imports this
 * module, and registry pulls in every adapter — which would put the provider
 * endpoints, and the code that reads the API keys, into the browser bundle.
 */
export type RawQuery = Partial<Record<string, string | string[]>>;

const DEFAULT_PAGE_SIZE = 20;
const MAX_PAGE_SIZE = 50;
const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

function first(value: string | string[] | undefined): string | undefined {
  const raw = Array.isArray(value) ? value[0] : value;
  const trimmed = raw?.trim();

  return trimmed ? trimmed : undefined;
}

function list(value: string | string[] | undefined): string[] {
  const raw = Array.isArray(value) ? value : value ? value.split(",") : [];

  return raw.map((item) => item.trim()).filter(Boolean);
}

function date(value: string | string[] | undefined): string | undefined {
  const raw = first(value);

  // Reject anything that is not YYYY-MM-DD rather than passing junk to a
  // provider, which would 400 the whole source.
  return raw && ISO_DATE.test(raw) ? raw : undefined;
}

export function parseArticleQuery(raw: RawQuery): ArticleQuery {
  const pageNumber = Number(first(raw.page) ?? 1);
  const pageSize = Number(first(raw.pageSize) ?? DEFAULT_PAGE_SIZE);

  return {
    keyword: first(raw.q),
    from: date(raw.from),
    to: date(raw.to),
    categories: list(raw.categories).filter((id): id is CategoryId =>
      CATEGORY_IDS.includes(id as CategoryId),
    ),
    authors: list(raw.authors),
    sources: list(raw.sources).filter((id): id is SourceId =>
      SOURCE_IDS.includes(id as SourceId),
    ),
    page: Number.isFinite(pageNumber) && pageNumber > 0 ? pageNumber : 1,
    pageSize:
      Number.isFinite(pageSize) && pageSize > 0 && pageSize <= MAX_PAGE_SIZE
        ? pageSize
        : DEFAULT_PAGE_SIZE,
  };
}

/**
 * The inverse. Empty and default values are omitted, so clearing a filter
 * removes it from the URL instead of leaving `?q=&category=` litter behind.
 */
export function toQueryParams(query: ArticleQuery): Record<string, string> {
  const params: Record<string, string> = {};

  if (query.keyword) {
    params.q = query.keyword;
  }

  if (query.from) {
    params.from = query.from;
  }

  if (query.to) {
    params.to = query.to;
  }

  if (query.categories?.length) {
    params.categories = query.categories.join(",");
  }

  if (query.authors?.length) {
    params.authors = query.authors.join(",");
  }

  if (query.sources?.length) {
    params.sources = query.sources.join(",");
  }

  if (query.page && query.page > 1) {
    params.page = String(query.page);
  }

  return params;
}

/** Whether anything is filtered — drives the "Clear all" affordance. */
export function hasActiveFilters(query: ArticleQuery): boolean {
  return Object.keys(toQueryParams(query)).length > 0;
}
