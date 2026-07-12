import { useRouter } from "next/router";
import { useCallback, useMemo } from "react";

import { hasActiveFilters, parseArticleQuery, toQueryParams } from "@/lib/query";
import { ArticleQuery } from "@/lib/sources/types";

interface UseArticleFiltersResult {
  filters: ArticleQuery;
  isActive: boolean;
  /** Merge a patch into the current filters and push it to the URL. */
  setFilters: (patch: Partial<ArticleQuery>) => void;
  clearFilters: () => void;
}

/**
 * Filter state lives in the URL, not in React.
 *
 * That is what makes a filtered feed a shareable link, gives the back button
 * correct behaviour for free, and keeps `getServerSideProps` the *only* place
 * articles are fetched — pushing a new query re-runs it on the server. There is
 * no second client-side fetch path to keep in sync, and no filter state that can
 * disagree with the address bar.
 */
export default function useArticleFilters(): UseArticleFiltersResult {
  const router = useRouter();

  // Parsed with the same function the server uses, so the client and the server
  // can never disagree about what a URL means.
  const filters = useMemo(
    () => parseArticleQuery(router.query),
    [router.query],
  );

  const push = useCallback(
    (next: ArticleQuery) => {
      router.push(
        { pathname: router.pathname, query: toQueryParams(next) },
        undefined,
        // Keep the reader where they are; a filter change is not a new page.
        { scroll: false },
      );
    },
    [router],
  );

  const setFilters = useCallback(
    (patch: Partial<ArticleQuery>) => {
      // Any filter change resets paging — page 3 of the old results is
      // meaningless against a new query.
      push({ ...filters, ...patch, page: 1 });
    },
    [filters, push],
  );

  const clearFilters = useCallback(() => {
    push({});
  }, [push]);

  return {
    filters,
    isActive: hasActiveFilters(filters),
    setFilters,
    clearFilters,
  };
}
