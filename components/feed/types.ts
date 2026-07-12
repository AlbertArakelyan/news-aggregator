import { HTMLAttributes, RefObject } from "react";

import { Article, SourceResult } from "@/lib/sources/types";

export interface IArticleCardProps extends HTMLAttributes<HTMLElement> {
  article: Article;
}

export interface IArticleListProps extends HTMLAttributes<HTMLDivElement> {
  articles: Article[];
  isLoading?: boolean;
}

export interface ISourceStatusProps extends HTMLAttributes<HTMLDivElement> {
  sources: SourceResult[];
}

export interface ILoadMoreProps extends HTMLAttributes<HTMLDivElement> {
  hasMore: boolean;
  isLoading: boolean;
  error: string | null;
  onLoadMore: () => void;
  sentinelRef: RefObject<HTMLDivElement | null>;
}

