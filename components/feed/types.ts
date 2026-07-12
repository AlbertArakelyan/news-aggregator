import { HTMLAttributes } from "react";

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

