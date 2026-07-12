import { dedupeByUrl, sortByNewest } from "./articles";
import guardianFixture from "./sources/__fixtures__/guardian.json";
import newsapiFixture from "./sources/__fixtures__/newsapi.json";
import nytFixture from "./sources/__fixtures__/nyt.json";
import { SOURCES, getConfiguredSources } from "./sources/registry";
import {
  AggregateResult,
  Article,
  ArticleQuery,
  NewsSource,
  SourceCapabilities,
  SourceId,
  SourceResult,
} from "./sources/types";

const REQUEST_TIMEOUT_MS = 8000;

const FIXTURES: Record<SourceId, unknown> = {
  guardian: guardianFixture,
  nyt: nytFixture,
  newsapi: newsapiFixture,
};

/**
 * Offline mode: serve the recorded fixtures instead of calling the providers.
 *
 * Set NEWS_FIXTURES=1 to develop the whole app — SSR, the API route, the feed —
 * without real API keys, or when the free-tier rate limit is spent. Off unless
 * explicitly enabled, and server-only, so it can never reach a browser.
 */
const isFixtureMode = () => process.env.NEWS_FIXTURES === "1";

/**
 * In fixture mode nothing was filtered upstream, because `buildUrl` is never
 * called — so *every* filter is unsupported and must be applied in memory.
 *
 * Without this, a source that declares `category: true` has its category filter
 * skipped in both places (the provider never saw it, and applyUnsupportedFilters
 * trusts the capability), and a filtered feed silently returns unfiltered
 * articles. Exactly the failure the capability model exists to prevent.
 */
const NOTHING_SUPPORTED: SourceCapabilities = {
  keyword: false,
  dateRange: false,
  category: false,
  author: false,
};

/**
 * Server-only. Imported from `pages/api/*` and `getServerSideProps` — never from
 * a component, because it reads the API keys.
 */
async function fetchFromSource(
  source: NewsSource,
  query: ArticleQuery,
): Promise<Article[]> {
  if (isFixtureMode()) {
    // A fixture is a single recorded page. Serving it again for page 2 would
    // hand infinite scroll the same articles forever, so the fixtures simply
    // run out — which is exactly what a real source does eventually.
    if ((query.page ?? 1) > 1) {
      return [];
    }

    // Still goes through parse(), so fixture mode exercises the real
    // normalization path rather than a parallel one that could drift from it.
    return source.parse(FIXTURES[source.id]);
  }

  const response = await fetch(source.buildUrl(query), {
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    headers: { Accept: "application/json" },
  });

  // Throw rather than return [] — "this source is down" and "no articles
  // matched" are different facts, and the user can see the difference.
  if (!response.ok) {
    throw new Error(`${source.name} returned ${response.status}`);
  }

  return source.parse(await response.json());
}

/**
 * Filters the provider could not apply itself, applied here instead.
 *
 * Driven by each adapter's declared `capabilities`: whatever it reports as
 * unsupported is handled in memory, so a filter behaves identically to the user
 * regardless of which provider happens to back it.
 */
export function applyUnsupportedFilters(
  articles: Article[],
  source: NewsSource,
  query: ArticleQuery,
): Article[] {
  let result = articles;

  if (query.keyword && !source.capabilities.keyword) {
    const needle = query.keyword.toLowerCase();

    result = result.filter(
      (article) =>
        article.title.toLowerCase().includes(needle) ||
        (article.description?.toLowerCase().includes(needle) ?? false),
    );
  }

  if (query.categories?.length && !source.capabilities.category) {
    const wanted = query.categories;

    // A provider that does not report categories (NewsAPI's /everything) yields
    // articles with category === null, which cannot match — so an unsupported
    // category filter correctly excludes that source rather than leaking
    // unfiltered results into a filtered feed.
    result = result.filter(
      (article) => article.category !== null && wanted.includes(article.category),
    );
  }

  if (query.from && !source.capabilities.dateRange) {
    const from = new Date(query.from).getTime();
    result = result.filter(
      (article) => new Date(article.publishedAt).getTime() >= from,
    );
  }

  if (query.to && !source.capabilities.dateRange) {
    // Inclusive of the whole "to" day, which is what a date picker implies.
    const to = new Date(`${query.to}T23:59:59.999Z`).getTime();
    result = result.filter(
      (article) => new Date(article.publishedAt).getTime() <= to,
    );
  }

  // No provider filters by author reliably, so this is always post-normalization.
  if (query.authors?.length) {
    const wanted = query.authors.map((author) => author.toLowerCase());

    result = result.filter((article) =>
      article.author
        ? wanted.some((author) => article.author!.toLowerCase().includes(author))
        : false,
    );
  }

  return result;
}

/**
 * Fan out to every configured source, normalize, and merge.
 *
 * `allSettled`, not `all`: one dead provider must degrade the feed, never empty
 * it. A failing source is reported in `sources` so the UI can name it while
 * still rendering everything else.
 */
export async function aggregate(query: ArticleQuery): Promise<AggregateResult> {
  // In fixture mode every source is available — gating on isConfigured() would
  // skip them all when no keys are set, which is exactly the case fixture mode
  // exists to serve.
  const available = isFixtureMode() ? SOURCES : getConfiguredSources();

  const selected = available.filter(
    (source) => !query.sources?.length || query.sources.includes(source.id),
  );

  const settled = await Promise.allSettled(
    selected.map(async (source) => {
      const fetched = await fetchFromSource(source, query);

      // Fixtures bypass buildUrl, so the provider applied nothing.
      const effective = isFixtureMode()
        ? { ...source, capabilities: NOTHING_SUPPORTED }
        : source;

      return {
        // The count *before* our in-memory filtering. This is what says whether
        // the provider has more pages — filtering to zero on one page does not
        // mean the source is exhausted, and using the filtered count would end
        // the feed early whenever a filter happened to be aggressive.
        fetchedCount: fetched.length,
        articles: applyUnsupportedFilters(fetched, effective, query),
      };
    }),
  );

  const sources: SourceResult[] = [];
  let articles: Article[] = [];
  let hasMore = false;

  settled.forEach((outcome, index) => {
    const source = selected[index];

    if (outcome.status === "fulfilled") {
      articles = articles.concat(outcome.value.articles);

      if (outcome.value.fetchedCount > 0) {
        hasMore = true;
      }

      sources.push({
        id: source.id,
        name: source.name,
        ok: true,
        count: outcome.value.articles.length,
      });

      return;
    }

    sources.push({
      id: source.id,
      name: source.name,
      ok: false,
      count: 0,
      error:
        outcome.reason instanceof Error
          ? outcome.reason.message
          : "Request failed",
    });
  });

  return { articles: sortByNewest(dedupeByUrl(articles)), sources, hasMore };
}
