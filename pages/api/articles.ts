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
 * **Who calls this, and who does not.**
 *
 * The *first* page never comes from here. Filters live in the URL, so a filter
 * change re-runs `getServerSideProps`, which calls `aggregate` directly — the
 * Next docs are explicit that a page should not fetch its own API route.
 *
 * **Infinite scroll does call this**, and it is the reason the route exists.
 * Appending page 2 is a genuinely client-side concern: page is scroll state, not
 * URL state (putting it in the URL would add a history entry per scroll and make
 * the back button walk backwards through the feed). The client sends the same
 * filters it read from the URL, so a later page cannot mean something different
 * from the first.
 *
 * It doubles as the inspection surface: it is how an adapter is verified without
 * the UI in the way (`/check` and the `add-news-source` skill both drive it).
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
