# Pages

**Pages Router, Next.js 16.** There is no `app/` directory and no React Server Components. App Router idioms do not apply here: no `"use client"`, no `app/layout.tsx`, no route handlers. Read `node_modules/next/dist/docs/02-pages/` before writing routing or data-fetching code — this Next version differs from what you likely remember.

Filenames are **lowercase** — the router derives URLs from them, so `pages/Index.tsx` would serve `/Index`. This is the one place the PascalCase-for-components rule does not apply.

## The routes

| | |
|---|---|
| `index.tsx` | The feed. `getServerSideProps` calls `aggregate` directly — every provider call is server-side. Filters and saved preferences live in the URL, so applying either re-runs this. |
| `api/articles.ts` | The aggregator over HTTP. **The feed does not use it** — it is the inspection surface for verifying an adapter without the UI in the way. |
| `_app.tsx` | Geist font variables + the app-wide shell. Fonts live here, not per-page, so the variables are in scope for every route. |
| `_document.tsx` | Carries the blocking theme script. |
| `api/hello.ts` | create-next-app sample. Replaceable. |

## `_document.tsx` — do not "tidy" the inline script

The `<script dangerouslySetInnerHTML>` in `<head>` sets the theme class **before first paint**. Without it, a dark-theme visitor gets a white flash while React boots.

It must stay a plain blocking inline script. It cannot be `next/script`, it cannot be deferred, and it cannot wait for React. It looks like something to clean up. It is not.

## `pages/api/*` — the security boundary

This repo is **public**. API routes are the only place a news API key may be read.

- Keys come from `process.env.*` and are **never** prefixed `NEXT_PUBLIC_` — that inlines them into the browser bundle at build time.
- Components never call a provider directly. They call our own `/api/articles`, which calls the providers server-side.

That proxy earns its keep three times over: keys stay secret, CORS never arises, and NewsAPI's free tier — which rejects browser requests outright — works at all.

Keep handlers thin. Parse and validate the query, hand it to the aggregator in `lib/`, return `Article[]`. No mapping logic here; that belongs in `lib/sources/`.

## Pages compose, they do not style

A page adds layout and nothing else. Colors, borders, and radii come from primitives in `components/UI`. Semantic tokens only — no hex, no stock Tailwind colors, no `dark:` classes.
