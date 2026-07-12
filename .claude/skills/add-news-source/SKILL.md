---
name: add-news-source
description: Add a news provider adapter (Guardian, NYT, NewsAPI, …) that normalizes one API's response onto the internal Article type. Use when adding or changing a data source, wiring an API key, or touching lib/sources. This is the architecture the case study is graded on — open-closed and dependency inversion made concrete.
argument-hint: "[source-name]"
allowed-tools: Read, Write, Edit, Glob, Grep, Bash
---

Add a news source adapter named `$1`.

The whole point: **adding a source must not require editing the feed, the API route, or any component.** One new file plus one registry line. If your change touches anything else, the abstraction is wrong.

Read `lib/sources/CLAUDE.md` first — it holds the contract.

## 1. Implement the contract

Create `lib/sources/<name>.ts` exporting an object satisfying `NewsSource` (`lib/sources/types.ts`):

```ts
const guardian: NewsSource = {
  id: "guardian",
  name: "The Guardian",
  capabilities: { keyword: true, dateRange: true, category: true, author: false },
  buildRequest(query: ArticleQuery): Request | URL,
  parseResponse(raw: unknown): Article[],
};
```

Two mappings, and nothing else:

- **`ArticleQuery` → the provider's query params.** Only the filters this provider actually supports.
- **The provider's response → `Article[]`.** Every field normalized; no provider-shaped data escapes this file.

## 2. Declare capabilities honestly

The providers do **not** support the same filters. Guardian filters by `section`, NYT by `section_name` via `fq`, NewsAPI supports `category` only on `top-headlines` (not `everything`), and none of them filter reliably by author.

Whatever you set `false`, the aggregator applies **in memory after normalization** instead. Lying here means a filter silently does nothing — declare what the API genuinely supports, not what you wish it did.

## 3. Register it

Add it to `lib/sources/registry.ts`. That is the only file outside your adapter that changes.

## 4. Keys are server-side only

Read the key from `process.env.<NAME>_API_KEY` and add it to **`.env.example` with an empty value** (this repo is public) and to your local `.env`.

**Never prefix a key `NEXT_PUBLIC_`.** That inlines it into the browser bundle at build time and publishes it. Adapters run only inside `pages/api/*` — that server-side proxy is precisely why the keys stay secret, why CORS is a non-issue, and why NewsAPI's free tier (which rejects browser requests) works at all.

## 5. Failure is normal, not exceptional

The aggregator fans out with `Promise.allSettled`. One dead provider must degrade the feed, never empty it. Your adapter should throw a clear error rather than return `[]` on a non-200 — the difference between "this source is down" and "no articles matched" is visible to the user.

## 6. Verify

Mapping logic is pure, so test it against a recorded fixture rather than the live API:

```bash
yarn lint && yarn build
```

Then exercise the route with the source enabled:

```bash
curl -s 'http://localhost:3000/api/articles?q=climate' | jq '.articles[0]'
```

Confirm: every `Article` field populated, `publishedAt` is an ISO string, and a deliberately bad key produces a degraded-but-working feed rather than a 500.
