import type { NextApiRequest, NextApiResponse } from "next";

import { aggregate } from "@/lib/aggregator";
import { parseArticleQuery } from "@/lib/query";
import { AggregateResult } from "@/lib/sources/types";

/**
 * The aggregator over HTTP. Every provider call happens server-side, never in
 * the browser — which is what keeps the API keys out of the client bundle (this
 * repo is public), sidesteps CORS, and makes NewsAPI's free tier usable at all,
 * since it rejects browser-origin requests outright.
 *
 * **The feed does not use this route.** Filters live in the URL, so applying one
 * re-runs `getServerSideProps`, which calls `aggregate` directly — the Next docs
 * are explicit that a page should not fetch its own API route. Keeping a second,
 * client-side fetch path would mean two ways to load the same data and two
 * states to keep in sync.
 *
 * It earns its place as the **inspection surface**: it is how an adapter is
 * verified without the UI in the way (`/check` and the `add-news-source` skill
 * both drive it), and it is the entry point if anything ever does need articles
 * client-side.
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
