import type { NextApiRequest, NextApiResponse } from "next";

import { aggregate } from "@/lib/aggregator";
import { parseArticleQuery } from "@/lib/query";
import { AggregateResult } from "@/lib/sources/types";

/**
 * The server-side proxy. Every provider call happens here, never in the browser.
 *
 * This is what keeps the API keys out of the client bundle (the repo is public),
 * sidesteps CORS entirely, and makes NewsAPI's free tier usable at all — it
 * rejects browser-origin requests outright.
 *
 * The page SSRs its first render by calling `aggregate` directly from
 * `getServerSideProps` (per the Next docs: do not fetch your own API route from
 * it). This route exists for the *client-side* case — changing a filter should
 * refetch the feed without a full navigation.
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<AggregateResult | { error: string }>,
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    res.status(405).json({ error: "Method not allowed" });

    return;
  }

  try {
    const result = await aggregate(parseArticleQuery(req.query));

    // Brief shared cache, so a burst of identical filter changes does not spend
    // the free-tier rate limit; stale-while-revalidate keeps it feeling instant.
    res.setHeader(
      "Cache-Control",
      "public, s-maxage=60, stale-while-revalidate=300",
    );
    res.status(200).json(result);
  } catch (error) {
    // aggregate() already degrades per-source, so reaching here means something
    // broader broke. Never leak the message — a provider url carries the key.
    console.error("[/api/articles]", error);
    res.status(500).json({ error: "Failed to load articles" });
  }
}
