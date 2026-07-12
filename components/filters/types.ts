import { HTMLAttributes } from "react";

import { ArticleQuery, SourceId } from "@/lib/sources/types";

/**
 * The source list is passed down from the server rather than imported from
 * `registry.ts`: importing the registry into a client component would pull every
 * adapter — and the code that reads the API keys — into the browser bundle.
 */
export interface ISourceOption {
  id: SourceId;
  name: string;
}

export interface IFilterPanelProps extends HTMLAttributes<HTMLFormElement> {
  filters: ArticleQuery;
  sourceOptions: ISourceOption[];
  onFiltersChange: (patch: Partial<ArticleQuery>) => void;
}

export interface IFilterBarProps extends HTMLAttributes<HTMLDivElement> {
  filters: ArticleQuery;
  sourceOptions: ISourceOption[];
  isActive: boolean;
  onFiltersChange: (patch: Partial<ArticleQuery>) => void;
  onClear: () => void;
}

export interface IActiveFiltersProps extends HTMLAttributes<HTMLDivElement> {
  filters: ArticleQuery;
  sourceOptions: ISourceOption[];
  isActive: boolean;
  onFiltersChange: (patch: Partial<ArticleQuery>) => void;
  onClear: () => void;
}

export interface ISearchInputProps {
  value: string;
  onSearch: (keyword: string) => void;
}
