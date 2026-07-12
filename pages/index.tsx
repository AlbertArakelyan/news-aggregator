import type { GetServerSideProps } from "next";
import Head from "next/head";

import ArticleList from "@/components/feed/ArticleList";
import SourceStatus from "@/components/feed/SourceStatus";
import ActiveFilters from "@/components/filters/ActiveFilters";
import FilterBar from "@/components/filters/FilterBar";
import { ISourceOption } from "@/components/filters/types";
import PreferencesButton from "@/components/preferences/PreferencesButton";
import ThemeToggle from "@/components/theme/ThemeToggle";
import useArticleFilters from "@/hooks/useArticleFilters";
import usePersonalizedDefaults from "@/hooks/usePersonalizedDefaults";
import usePreferences from "@/hooks/usePreferences";
import useRouteLoading from "@/hooks/useRouteLoading";
import { aggregate } from "@/lib/aggregator";
import { parseArticleQuery } from "@/lib/query";
import { SOURCES } from "@/lib/sources/registry";
import { AggregateResult } from "@/lib/sources/types";

interface FeedProps extends AggregateResult {
  sourceOptions: ISourceOption[];
}

export default function Feed({ articles, sources, sourceOptions }: FeedProps) {
  const { filters, isActive, setFilters, clearFilters } = useArticleFilters();
  const { preferences } = usePreferences();
  const isLoading = useRouteLoading();

  // Saved preferences become URL filters on a bare visit — so the personalized
  // feed is the same feed, on the same single data path, and stays a shareable
  // link. An explicit filter in the URL always outranks a stored default.
  usePersonalizedDefaults(preferences, filters);

  return (
    <>
      <Head>
        <title>News Aggregator</title>
        <meta
          name="description"
          content="Articles from The Guardian, the New York Times and NewsAPI in one feed."
        />
      </Head>

      <main className="mx-auto max-w-7xl px-6 py-10">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">News</h1>
            <p className="mt-2 text-muted-text">
              {isLoading
                ? "Searching…"
                : `${articles.length} articles from ${
                    sources.filter((source) => source.ok).length
                  } sources.`}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <PreferencesButton sourceOptions={sourceOptions} />
            <ThemeToggle />
          </div>
        </header>

        <div className="grid gap-8 lg:grid-cols-[16rem_1fr]">
          <FilterBar
            filters={filters}
            sourceOptions={sourceOptions}
            isActive={isActive}
            onFiltersChange={setFilters}
            onClear={clearFilters}
          />

          <div className="min-w-0">
            <ActiveFilters
              filters={filters}
              sourceOptions={sourceOptions}
              isActive={isActive}
              onFiltersChange={setFilters}
              onClear={clearFilters}
              className="mb-5"
            />

            <SourceStatus sources={sources} className="mb-5" />

            <ArticleList articles={articles} isLoading={isLoading} />
          </div>
        </div>
      </main>
    </>
  );
}

/**
 * Every provider call happens here, on the server. The keys never reach the
 * browser — which matters, because this repo is public.
 *
 * `aggregate` is called directly rather than through `/api/articles`: the Next
 * docs are explicit that getServerSideProps should call the data source itself,
 * since it already runs on the server.
 *
 * Filters live in the URL, so applying one is a route change that re-runs this
 * function. That is the whole data path — there is no second, client-side fetch
 * to keep in sync, and a filtered feed is a shareable, server-rendered link.
 *
 * Static generation is not an option here: the feed depends on a per-request
 * query string. A future unfiltered "top headlines" page would suit
 * `getStaticProps` with `revalidate`, and per-category routes `getStaticPaths`.
 */
export const getServerSideProps: GetServerSideProps<FeedProps> = async (
  context,
) => {
  const result = await aggregate(parseArticleQuery(context.query));

  context.res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300",
  );

  return {
    props: {
      ...result,
      // Passed down rather than imported by the filter UI: importing the
      // registry into a client component would pull every adapter — and the
      // code that reads the API keys — into the browser bundle.
      sourceOptions: SOURCES.map(({ id, name }) => ({ id, name })),
    },
  };
};
