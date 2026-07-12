# Source adapters

**This is the module the case study is graded on.** The brief asks for three news APIs with three different response shapes; the whole architectural question is how they become one feed without the feed knowing about any of them.

> Not built yet. This file is the contract to build against — see step 3 of `PLAN.md`.

## The contract

```
types.ts      NewsSource, Article, ArticleQuery, SourceCapabilities
guardian.ts   Guardian response  -> Article
nyt.ts        NYT response       -> Article
newsapi.ts    NewsAPI response   -> Article
registry.ts   the list of sources
```

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

The mappings are pure functions over recorded fixtures — the highest-value thing in the repo to test, and the clearest DRY/SOLID signal to a reviewer. Test against a saved response, not the live API.
