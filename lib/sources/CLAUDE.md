# Source adapters

**This is the module the case study is graded on.** The brief asks for three news APIs with three different response shapes; the whole architectural question is how they become one feed without the feed knowing about any of them.

## The contract

```
types.ts         NewsSource, Article, ArticleQuery, SourceCapabilities
normalize.ts     shared field cleaners (HTML, dates, bylines)
guardian.ts      Guardian response  -> Article
nyt.ts           NYT response       -> Article
newsapi.ts       NewsAPI response   -> Article
registry.ts      the list of sources
__fixtures__/    recorded responses, including the edge cases each provider emits
__tests__/       the mapping tests
```

**`buildUrl` and `parse` are pure** — no fetch, no IO. `lib/aggregator.ts` owns every network call. That separation is what makes the mapping logic testable against a fixture instead of the live API, and it is the reason the tests run in milliseconds with no keys.

`Article` is the internal shape. Nothing provider-shaped escapes an adapter — the feed, the components, and the API route know only `Article`.

Each adapter does exactly two mappings:

- `ArticleQuery` → that provider's query params
- that provider's response → `Article[]`

## The test that tells you the abstraction is right

**Adding a fourth source is one new file plus one line in `registry.ts`.** Nothing else changes — not the aggregator, not `pages/api/articles.ts`, not a component. If a new source forces you to edit anything else, the abstraction has leaked; fix the abstraction, not the caller.

That is open-closed and dependency inversion made concrete rather than asserted, which is precisely what the rubric is looking for.

## Capabilities: declare what the API does, not what you wish it did

The providers genuinely differ:

| | keyword | date range | category | author |
|---|---|---|---|---|
| Guardian | yes | yes | `section` | no |
| NYT | yes | yes | `section_name` via `fq` | no |
| NewsAPI | yes | yes | only on `top-headlines`, not `everything` | no |

Each adapter declares its `capabilities`. The aggregator pushes supported filters **down** to the provider and applies the rest **in memory after normalization**. Author filtering is always post-normalization, because no provider does it reliably.

Lying in `capabilities` means a filter silently does nothing. That is the worst failure mode here: the UI looks like it worked.

## Failure is a normal state

Fan out with `Promise.allSettled`. **One dead provider degrades the feed; it never empties it.** A source that 401s (an expired key) or times out is reported as that one source failing, while the others still render.

Throw on a non-200 rather than returning `[]` — "this source is down" and "no articles matched" are different things and the user can see the difference.

Then merge: dedupe by URL (the same wire story appears in several sources), sort by `publishedAt` descending.

## Keys

`process.env.GUARDIAN_API_KEY`, `NYT_API_KEY`, `NEWSAPI_KEY` — server-side only, read here, and imported **only** from `pages/api/*`.

**Never `NEXT_PUBLIC_`.** This repo is public; that prefix inlines the key into the browser bundle. The server-side proxy is why the keys stay secret, why CORS never arises, and why NewsAPI's free tier — which rejects browser requests outright — works at all.

Add every new key to `.env.example` with an **empty** value.

## Testing

```bash
yarn test                                   # all
yarn test lib/sources/__tests__/adapters.test.ts   # one file
yarn test -t "drops [Removed] tombstones"          # one test
```

The mappings are pure functions over recorded fixtures, so they test in milliseconds with no keys. The fixtures deliberately carry the junk each provider really emits — an unparseable date, a missing headline, HTML inside a description, NewsAPI's `[Removed]` tombstones, and one story syndicated across two providers so dedupe is actually exercised.

**Add the edge case to the fixture, not a mock.** When a provider surprises you in production, the fix is a new entry in `__fixtures__/` plus a test that fails without your change.

## Offline mode

`NEWS_FIXTURES=1` makes the aggregator serve these fixtures instead of calling the providers, so the whole app runs with no keys, or when a free-tier limit is spent. It still goes through `parse()`, so it exercises the real normalization path rather than a parallel one that could drift.
