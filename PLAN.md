# Plan

## What the brief actually requires

Three features — keyword **search with date/category/source filters**, a **personalized feed** (preferred sources, categories, authors), and **mobile-responsive** design. Plus: React + TypeScript, **at least 3** of the seven listed data sources, Docker with docs, and explicit grading on DRY/KISS/SOLID.

Docker and the docs are already done. Everything else is unbuilt.

## The one non-obvious finding: the source list is partly fiction

Of the seven listed sources, only three are realistically usable today:

- **The Guardian** — Open Platform, free key, clean and well-documented. Solid.
- **New York Times** — Article Search API, free key. Solid.
- **NewsAPI.org** — free key. Note items **1 ("NewsAPI") and 7 ("NewsAPI.org") are the same service**, listed twice.

The rest are dead ends: **OpenNews** is a journalism nonprofit, not an API; **NewsCred** pivoted to Welcome and killed public access; **BBC News** has no public API (it's *inside* NewsAPI as a source). So the honest reading is "pick the three that exist," which is what I'd do — and I'd say so in the README, since noticing it is itself a signal.

One catch worth designing around: NewsAPI's free tier **rejects browser requests** and is dev-only. That single constraint settles the architecture.

## Architecture

**Server-side proxy through Pages Router API routes.** All three providers are called from `pages/api/articles.ts`, never from the browser. This kills three birds: API keys stay server-only (no `NEXT_PUBLIC_`, so they remain runtime env vars in Docker rather than build args), CORS disappears, and NewsAPI's no-browser rule is satisfied for free.

**The adapter layer is the heart of it** — and the thing being graded. One interface, three implementations:

```
lib/sources/types.ts      NewsSource interface, Article, ArticleQuery
lib/sources/guardian.ts   Guardian response  -> Article
lib/sources/nyt.ts        NYT response       -> Article
lib/sources/newsapi.ts    NewsAPI response   -> Article
lib/sources/registry.ts   the list; add a source by adding one file
lib/aggregator.ts         fan out, merge, dedupe, sort
```

Each adapter does two mappings: internal `ArticleQuery` → its provider's query params, and its provider's response → the normalized `Article` (`id, title, description, url, imageUrl, publishedAt, source, category, author`). The feed depends only on the interface, so a fourth source is a new file plus a registry entry — nothing else changes. That's open-closed and dependency-inversion demonstrated concretely rather than asserted.

**Capability mismatch is the real design problem.** The providers don't support the same filters — Guardian filters by `section`, NYT by `section_name` via `fq`, NewsAPI only supports `category` on `top-headlines` (not on `everything`), and none filter reliably by author. So each adapter **declares what it supports**, the aggregator pushes supported filters down to the provider, and applies the remainder in-memory after normalization. Author filtering is always post-normalization.

**Aggregation:** fan out with `Promise.allSettled` so one dead provider degrades the feed instead of emptying it, then dedupe (by URL) and sort by `publishedAt` descending.

## Build order

1. **UI library on Tailwind** — the presentational primitives every later step composes, built before any feature so no feature invents its own button.

   ```
   components/UI/Button.tsx      variants: primary | secondary | ghost; sizes; loading state
   components/UI/Input.tsx       text + date inputs, with label and error slots
   components/UI/Select.tsx      single + multi select (sources, categories, authors)
   components/UI/Checkbox.tsx    preference toggles
   components/UI/Chip.tsx        active-filter pills, source/category tags
   components/UI/Card.tsx        surface primitive the article card sits on
   components/UI/Skeleton.tsx    loading placeholders
   components/UI/Spinner.tsx
   components/UI/EmptyState.tsx
   components/UI/Drawer.tsx      filter panel on mobile, sidebar on desktop
   lib/cn.ts                     clsx + tailwind-merge class merger
   ```

   No barrel `index.ts`. Every consumer imports the component directly — `import { Button } from "@/components/UI/Button"`.

   Two supporting pieces: **design tokens** (colors, spacing, radii, font sizes) declared as CSS variables in the `@theme inline` block of `styles/globals.css` — Tailwind v4 is configured in CSS, there is no `tailwind.config.js` — and a **variant pattern**, `cva` (or a small local equivalent) so a component's styles live in one table instead of scattered ternaries.

   Adds two small deps: `clsx` + `tailwind-merge` (and optionally `class-variance-authority`). This is the DRY half of the grading rubric made visible: Tailwind class strings are written **once**, in a primitive, and every feature composes them. Each primitive is presentational and stateless — single responsibility, no data fetching, no business logic.

2. **Types + adapters + aggregator** with the `/api/articles` route — pure functions, no UI. Testable in isolation.
3. **Feed UI** (`components/feed/ArticleCard.tsx`, `ArticleList.tsx`, …): article card, list, loading/empty/error states, responsive layout — composed from the step-1 primitives, adding no new raw Tailwind beyond layout.
4. **Search + filters**, with filter state held in **URL query params** — shareable links, working back button, and no separate state library.
5. **Personalized feed**: preferences (sources, categories, authors) in `localStorage`, applied as default filters. Client-only, so it needs care to avoid a hydration mismatch.

## Two open calls

**Filter state in the URL vs. React state.** URL params are better (shareable, back button, SSR-friendly), and cost nothing extra. Default to that.

**Tests.** There's no test runner. The adapters are pure mapping functions — the single highest-value thing to test, and a visible DRY/SOLID signal for a grader. Adding Vitest with a handful of adapter tests is maybe 30 minutes. Worth it, but it's scope beyond the brief.

## Open questions

- Are Guardian / NYT / NewsAPI keys already available, or should the adapters be built against fixtures with keys dropped into `.env.local` at the end?
