import { Newspaper } from "lucide-react";

import EmptyState from "@/components/UI/EmptyState/EmptyState";

import ArticleCard from "./ArticleCard";
import { IArticleListProps } from "./types";

const ArticleList = ({ articles, className = "", ...rest }: IArticleListProps) => {
  if (articles.length === 0) {
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
      className={`grid gap-4 sm:grid-cols-2 lg:grid-cols-3 ${className}`}
      {...rest}
    >
      {articles.map((article) => (
        <ArticleCard key={article.id} article={article} />
      ))}
    </div>
  );
};

export default ArticleList;
