import { useCallback, useRef, useState } from "react";

import { appendPage } from "@/lib/articles";
import { toQueryParams } from "@/lib/query";
import { AggregateResult, Article, ArticleQuery } from "@/lib/sources/types";


import useOnScreen from "./useOnScreen";

interface UseInfiniteArticlesResult {
  articles: Article[];
  isLoadingMore: boolean;
  hasMore: boolean;
  error: string | null;
  loadMore: () => void;
  /** Attach to the sentinel element at the end of the list. */
  sentinelRef: React.RefObject<HTMLDivElement | null>;
}

/**
 * Page 1 arrives from `getServerSideProps`; this fetches the rest.
 *
 * Infinite scroll is the one place the app genuinely needs a client-side fetch,
 * and it is why `/api/articles` exists. The filters still come from the URL — a
 * further page is the *same query* with a higher page number — so there is still
 * one definition of what is being asked for.
 *
 * `page` deliberately stays out of the URL. Pushing it on every scroll would add
 * a history entry per page and make the back button walk backwards through the
 * feed instead of leaving it.
 */
export default function useInfiniteArticles(
  initialArticles: Article[],
  initialHasMore: boolean,
  filters: ArticleQuery,
): UseInfiniteArticlesResult {
  const [articles, setArticles] = useState<Article[]>(initialArticles);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // New props mean the filters changed and getServerSideProps re-ran: start the
  // list over. Adjusted during render rather than in an effect — an effect would
  // trip react-hooks/set-state-in-effect, and would append one stale page before
  // resetting.
  //
  // The seed MUST be a reference that is stable across re-renders and changes
  // only on new props. `initialArticles` is exactly that: it arrives on the props
  // object, which React keeps identical until the page receives new props.
  //
  // Taking an object here instead (`initial: AggregateResult`) caused a render
  // loop: the caller built it with a rest-spread, so it was a fresh object every
  // render, the comparison below never matched, and setState-during-render ran
  // forever. Pass the array, not a synthesized object.
  const [seed, setSeed] = useState(initialArticles);

  if (seed !== initialArticles) {
    setSeed(initialArticles);
    setArticles(initialArticles);
    setHasMore(initialHasMore);
    setPage(1);
    setError(null);
  }

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  // Guards against a second request while one is in flight. A ref, not state,
  // because the observer can fire again before a re-render lands.
  const isFetching = useRef(false);

  const loadMore = useCallback(async () => {
    if (isFetching.current || !hasMore) {
      return;
    }

    isFetching.current = true;
    setIsLoadingMore(true);
    setError(null);

    const nextPage = page + 1;

    try {
      // Built from the same URL contract the server parses, so a page-2 request
      // cannot mean something different from the page-1 render.
      const params = new URLSearchParams({
        ...toQueryParams(filters),
        page: String(nextPage),
      });

      const response = await fetch(`/api/articles?${params}`);

      if (!response.ok) {
        throw new Error("Could not load more articles");
      }

      const result = (await response.json()) as AggregateResult;

      // Deduped on append: the same story can surface again on a later page, and
      // React would throw on the duplicate key.
      setArticles((current) => appendPage(current, result.articles));
      setHasMore(result.hasMore);
      setPage(nextPage);
    } catch {
      // Do not clear hasMore — the reader can retry with the button.
      setError("Could not load more articles.");
    } finally {
      isFetching.current = false;
      setIsLoadingMore(false);
    }
  }, [filters, hasMore, page]);

  // An error disables the observer rather than being retried automatically:
  // retrying on every scroll tick would hammer a failing endpoint. The reader
  // retries explicitly, with the button.
  useOnScreen(sentinelRef, loadMore, hasMore && !error);

  return {
    articles,
    isLoadingMore,
    hasMore,
    error,
    loadMore: () => void loadMore(),
    sentinelRef,
  };
}
