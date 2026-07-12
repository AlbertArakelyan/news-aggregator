import Button from "@/components/UI/Button/Button";
import Spinner from "@/components/UI/Spinner/Spinner";

import { ILoadMoreProps } from "./types";

/**
 * The end of the feed: the scroll sentinel, the loading state, and an explicit
 * button.
 *
 * The button is not a fallback — it is the accessible path. Infinite scroll
 * alone strands keyboard users, who never trigger an IntersectionObserver, and
 * leaves no way to retry after a failed fetch. The observer is the convenience;
 * the button is the interface.
 */
const LoadMore = ({
  hasMore,
  isLoading,
  error,
  onLoadMore,
  sentinelRef,
  className = "",
  ...rest
}: ILoadMoreProps) => {
  return (
    <div
      className={`flex flex-col items-center gap-3 py-10 ${className}`}
      {...rest}
    >
      {/* Sits above the fold of the fetch: useOnScreen fires ~600px early, so
          the next page is already arriving when the reader gets here. */}
      <div ref={sentinelRef} aria-hidden="true" />

      {isLoading ? (
        <span className="flex items-center gap-2 text-sm text-muted-text">
          <Spinner size="sm" />
          Loading more…
        </span>
      ) : null}

      {error ? (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      ) : null}

      {!isLoading && hasMore ? (
        <Button variant="secondary" onClick={onLoadMore}>
          {error ? "Try again" : "Load more"}
        </Button>
      ) : null}

      {!hasMore && !isLoading ? (
        <p className="text-sm text-subtle-text">That is everything.</p>
      ) : null}
    </div>
  );
};

export default LoadMore;
