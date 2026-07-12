export type SourceId = "guardian" | "nyt" | "newsapi";

/**
 * The internal article shape. Every provider normalizes onto this, and nothing
 * provider-shaped escapes an adapter — the aggregator, the API route and the
 * components know only this type.
 */
export interface Article {
  /** Stable across refetches: `<sourceId>:<provider's own id>`. */
  id: string;
  title: string;
  description: string | null;
  url: string;
  imageUrl: string | null;
  /** ISO 8601. Providers disagree on format; adapters are responsible for this. */
  publishedAt: string;
  author: string | null;
  /** Normalized category id, or null when the provider does not say. */
  category: CategoryId | null;
  source: {
    id: SourceId;
    name: string;
  };
}

/**
 * Categories are normalized because the providers name them differently:
 * Guardian has a `technology` section, NYT a `Technology` section_name.
 */
export type CategoryId =
  | "business"
  | "culture"
  | "health"
  | "politics"
  | "science"
  | "sport"
  | "technology"
  | "world";

export const CATEGORY_IDS: CategoryId[] = [
  "business",
  "culture",
  "health",
  "politics",
  "science",
  "sport",
  "technology",
  "world",
];

/** The internal query. Each adapter maps this onto its provider's params. */
export interface ArticleQuery {
  keyword?: string;
  /** YYYY-MM-DD. */
  from?: string;
  to?: string;
  category?: CategoryId;
  /** Post-normalization filter — no provider does author filtering reliably. */
  authors?: string[];
  /** Which sources to query. Omitted means all configured ones. */
  sources?: SourceId[];
  page?: number;
  pageSize?: number;
}

/**
 * What a provider's API genuinely supports — not what we wish it did.
 *
 * Whatever is `false` here, the aggregator applies in memory after
 * normalization instead. Lying makes a filter silently do nothing, which is the
 * worst failure mode available: the UI looks like it worked.
 */
export interface SourceCapabilities {
  keyword: boolean;
  dateRange: boolean;
  category: boolean;
  author: boolean;
}

/**
 * A news provider.
 *
 * `buildUrl` and `parse` are deliberately **pure** — no fetch, no env reads at
 * call time. The aggregator owns all the IO. That is what makes the mapping
 * logic testable against a recorded fixture instead of the live API.
 */
export interface NewsSource {
  id: SourceId;
  name: string;
  capabilities: SourceCapabilities;
  /** False when the API key is absent; the aggregator skips it rather than 401ing. */
  isConfigured: () => boolean;
  buildUrl: (query: ArticleQuery) => string;
  parse: (raw: unknown) => Article[];
}

/** Per-source outcome, so the UI can say *which* provider failed. */
export interface SourceResult {
  id: SourceId;
  name: string;
  ok: boolean;
  count: number;
  error?: string;
}

export interface AggregateResult {
  articles: Article[];
  sources: SourceResult[];
}
