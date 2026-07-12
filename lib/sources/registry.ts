import guardian from "./guardian";
import newsapi from "./newsapi";
import nyt from "./nyt";
import { NewsSource, SourceId } from "./types";

/**
 * Every source in the app. **This is the only file a new source touches** —
 * add the adapter, add it here, and the aggregator, the API route and every
 * component pick it up unchanged. If a new source forces an edit anywhere else,
 * the abstraction has leaked.
 */
export const SOURCES: NewsSource[] = [guardian, nyt, newsapi];

export function getSource(id: SourceId): NewsSource | undefined {
  return SOURCES.find((source) => source.id === id);
}

/** Sources with an API key present. An unconfigured source is skipped, not 401ed. */
export function getConfiguredSources(): NewsSource[] {
  return SOURCES.filter((source) => source.isConfigured());
}
