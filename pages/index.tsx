import Head from "next/head";
import type { GetServerSideProps } from "next";

import ArticleList from "@/components/feed/ArticleList";
import SourceStatus from "@/components/feed/SourceStatus";
import ThemeToggle from "@/components/theme/ThemeToggle";
import { aggregate } from "@/lib/aggregator";
import { parseArticleQuery } from "@/lib/query";
import { AggregateResult } from "@/lib/sources/types";

type FeedProps = AggregateResult;

export default function Feed({ articles, sources }: FeedProps) {
  return (
    <>
      <Head>
        <title>News Aggregator</title>
        <meta
          name="description"
          content="Articles from The Guardian, the New York Times and NewsAPI in one feed."
        />
      </Head>

      <main className="mx-auto max-w-6xl px-6 py-12">
        <header className="mb-8 flex flex-wrap items-start justify-between gap-6">
          <div>
            <h1 className="text-3xl font-semibold tracking-tight">News</h1>
            <p className="mt-2 text-muted-text">
              {articles.length} articles from{" "}
              {sources.filter((source) => source.ok).length} sources.
            </p>
          </div>

          <ThemeToggle />
        </header>

        <SourceStatus sources={sources} className="mb-6" />

        <ArticleList articles={articles} />
      </main>
    </>
  );
}

/**
 * Data is fetched **on the server**, never in the browser.
 *
 * `aggregate` is called directly rather than through `/api/articles`: the Next
 * docs are explicit that getServerSideProps should call the data source itself,
 * since it already runs on the server — proxying through our own route would
 * just add a network hop.
 *
 * This is also what keeps the API keys secret. Everything `aggregate` touches is
 * eliminated from the client bundle, so `GUARDIAN_API_KEY` and friends never
 * reach the browser — which matters, because this repo is public.
 *
 * Search and filters (step 5) read from the same URL query, so a filtered feed
 * stays a shareable, server-rendered link. Static generation is not an option
 * here: the feed depends on a per-request query string. If a "top headlines"
 * page with no filters is ever added, `getStaticProps` with `revalidate` would
 * suit it, and `getStaticPaths` would suit per-category routes.
 */
export const getServerSideProps: GetServerSideProps<FeedProps> = async (
  context,
) => {
  const result = await aggregate(parseArticleQuery(context.query));

  // Same cache posture as the API route, so an SSR hit and a client-side filter
  // change do not have different freshness.
  context.res.setHeader(
    "Cache-Control",
    "public, s-maxage=60, stale-while-revalidate=300",
  );

  return { props: result };
};
