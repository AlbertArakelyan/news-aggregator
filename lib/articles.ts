import { Article } from "./sources/types";

/**
 * Pure article helpers, shared by the server aggregator and the client's
 * infinite-scroll append.
 *
 * They live here rather than in `lib/aggregator.ts` because that module imports
 * `registry.ts` — and therefore every adapter, and the code that reads the API
 * keys. A client component importing the aggregator would pull all of it into
 * the browser bundle, and this repo is public.
 */

/** The same story is syndicated across providers; keep the first (newest) copy. */
export function dedupeByUrl(articles: Article[]): Article[] {
  const seen = new Set<string>();

  return articles.filter((article) => {
    // Ignore tracking params and trailing slashes, or the same story survives
    // twice under two spellings of one url.
    const key = article.url.split("?")[0].replace(/\/+$/, "").toLowerCase();

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);

    return true;
  });
}

export function sortByNewest(articles: Article[]): Article[] {
  return [...articles].sort(
    (a, b) =>
      new Date(b.publishedAt).getTime() - new Date(a.publishedAt).getTime(),
  );
}

/**
 * Appends the next page onto what is already on screen.
 *
 * Deliberately does **not** re-sort the whole list. Each provider returns its
 * own pages newest-first, but they paginate independently, so a globally
 * re-sorted list would let a page-2 article jump *above* articles the reader has
 * already scrolled past — the list would rearrange itself under their thumb.
 * Append order is stable; that matters more here than perfect global ordering.
 */
export function appendPage(current: Article[], next: Article[]): Article[] {
  return dedupeByUrl([...current, ...next]);
}
