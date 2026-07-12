import { Newspaper } from "lucide-react";

import EmptyState from "@/components/UI/EmptyState/EmptyState";

import ArticleCard from "./ArticleCard";
import ArticleCardSkeleton from "./ArticleCardSkeleton";
import { IArticleListProps } from "./types";

const SKELETON_COUNT = 6;

/**
 * Owns the grid, and therefore all three states — loading, empty, and loaded.
 *
 * The alternative (a separate skeleton component with its own grid) means the
 * same responsive classes written twice, and a layout that jumps the moment they
 * drift apart.
 */
const ArticleList = ({
  articles,
  isLoading = false,
  className = "",
  ...rest
}: IArticleListProps) => {
  if (!isLoading && articles.length === 0) {
    return (
      <EmptyState
        icon={<Newspaper className="size-8" />}
        title="No articles found"
        description="Try a different keyword, or widen the date range."
        {...rest}
      />
    );
  }

  return (
    <div
      aria-busy={isLoading || undefined}
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
      {...rest}
    >
      {isLoading
        ? Array.from({ length: SKELETON_COUNT }, (_, index) => (
            <ArticleCardSkeleton key={index} />
          ))
        : articles.map((article) => (
            <ArticleCard key={article.id} article={article} />
          ))}
    </div>
  );
};

export default ArticleList;
