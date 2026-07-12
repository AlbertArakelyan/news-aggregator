# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## The bar this code is held to — check twice, every feature

The brief grades this explicitly:

> Incorporate best practices of software development such as **DRY** (Don't Repeat Yourself), **KISS** (Keep It Simple, Stupid), and **SOLID** (Single responsibility, Open-closed, Liskov substitution, Interface segregation, Dependency inversion) into your code.

This is not a closing formality. Run it **twice on every feature**:

1. **Before writing code** — decide where the logic belongs, what already exists that you should be reusing, and what the smallest thing that works actually is. Most violations are designed in, not typed in.
2. **After it works** — re-read the diff against the checklist below and *fix what it surfaces*. "It works" is when the review starts, not when it ends.

A feature is not done until the second pass is done.

### What each principle means *here* — concretely

**DRY.** A Tailwind class string is written **once**, in a primitive. If a feature component is writing `bg-*`, `border-*` or `rounded-*`, a primitive is missing a variant — add it there. Provider quirks are normalized **once**, in an adapter; nothing downstream re-parses a date or strips HTML. The query string is parsed **once**, in `lib/query.ts`, because SSR and the client-side refetch must read a shared link identically.

But: **duplication is cheaper than the wrong abstraction.** Two things that merely look alike are not a repetition. Only unify what changes together, for the same reason.

**KISS.** The bar for adding a dependency, a layer, or an abstraction is that the simple version has actually failed — not that it might. This codebase has said no to `clsx`/`tailwind-merge`/`cva` (plain template literals and `Record` maps do the job), to a custom listbox (a native `<select>` gives keyboard nav, type-ahead and the mobile picker for free), and to a portal in `Drawer` (nothing needs one yet). Prefer deleting code to adding a flag.

**SOLID** — the two letters that carry real weight in this codebase:

- **Single responsibility.** `buildUrl` and `parse` are pure; the aggregator owns *all* IO. That split is exactly why the adapters are testable against fixtures with no keys. Primitives are presentational and stateless — a component that reads state (`ThemeToggle`) is a feature component, not a primitive.
- **Open-closed + dependency inversion.** **Adding a fourth news source must be one new file plus one line in `registry.ts`.** If it forces an edit to the aggregator, the API route, or any component, the abstraction has leaked — fix the abstraction, not the caller. The feed depends on the `NewsSource` interface, never on a provider.
- **Interface segregation.** `SourceCapabilities` exists so an adapter declares only what its API *genuinely* does. Lying there makes a filter silently do nothing while the UI still looks like it worked — the worst failure mode available.
- **Liskov.** Any `NewsSource` must be substitutable for any other. An adapter that throws where others return `[]`, or returns provider-shaped data, breaks the fan-out.

### The end-of-feature pass

Before calling a feature done, answer these — and act on the answers:

- Did I re-implement something that exists? (a primitive, a `lib/` helper, a token)
- Did I put logic in a component that belongs in `lib/`, or in a page that belongs in a component?
- Would a **fourth source / a fifth primitive / a new filter** still be a one-file change?
- Is anything here simpler if I delete it? Any flag, layer or option nobody asked for?
- Is every new class a semantic token, and is every new module single-purpose?

Then run `/check` (it ends with this same pass) and, for component work, the `ui-conformance` subagent.

## Project setup for Claude Code

Rules are **scoped**: each folder carries the rules for its own module, loaded automatically when you work in it. This file holds only what is cross-cutting.

| Scope | Rules |
|---|---|
| `components/CLAUDE.md` | primitive vs feature component; compose, don't re-style |
| `components/UI/CLAUDE.md` | **the component pattern, non-negotiable** + the full token table |
| `hooks/CLAUDE.md` | `useSyncExternalStore` for client-only state; never `setState` in an effect |
| `lib/CLAUDE.md` | pure modules; which side of the server/client boundary each runs on |
| `lib/sources/CLAUDE.md` | **the adapter contract** — the module this case study is graded on |
| `pages/CLAUDE.md` | Pages Router (not App Router); API routes are the key boundary |
| `styles/CLAUDE.md` | the two token layers; Tailwind v4 is CSS-first |

**Skills** (`/name`, or Claude invokes them when relevant):

- `/add-ui-primitive <Name>` — scaffold a primitive to the project's component pattern
- `/add-news-source <name>` — add a provider adapter that normalizes onto `Article`
- `/add-design-token` — add a color correctly: both files, plus the WCAG check
- `/check` — verify for real: lint, build, boot, drive the routes, inspect the emitted CSS

**Subagents:**

- `ui-conformance` — audits components against the rules above (token discipline, no `FC`, no barrels, silent Tailwind traps)
- `docs-drift` — checks the markdown against what the code actually does. Docs here have gone stale twice; run it before committing a structural change.

**A `PreToolUse` hook blocks two commands** (`.claude/hooks/guard-bash.sh`), because both are easy to run from muscle memory and expensive to undo:

- **`npm`** — the lockfile is `yarn.lock`; an `npm install` would resolve a different tree.
- **`git add -A` / `git add .` / `git commit -a`** — this repo is public, and the working tree holds local-only files that must never be committed. Stage by explicit path and check `git diff --cached --name-only` before committing.

## Commands

**The package manager is yarn — Yarn Classic (v1). Never run `npm` in this repo, in a terminal or inside the Dockerfile.** `yarn.lock` is the committed lockfile and there is no `package-lock.json`; an `npm install` would silently ignore `yarn.lock` and resolve a different dependency tree. There is no `packageManager` field, so nothing enforces this but you.

- Add a dependency with `yarn add <pkg>` (`yarn add -D <pkg>` for dev), never `npm install <pkg>`.
- In CI/Docker the install is `yarn install --frozen-lockfile` — that is the v1 flag. `--immutable` is Yarn Berry and will error here.

```bash
yarn dev      # dev server on http://localhost:3000
yarn build    # production build
yarn start    # serve the production build
yarn lint     # eslint (flat config, no path arg needed)
yarn test     # vitest, single run
```

**Single test file / single test:**

```bash
yarn test lib/sources/__tests__/adapters.test.ts
yarn test -t "drops [Removed] tombstones"
yarn test:watch
```

Vitest does not read `tsconfig.json`, so the `@/*` alias is re-declared in `vitest.config.ts`. Tests live in `__tests__/` beside the code they cover; fixtures in `__fixtures__/`.

The default environment is **node** (the `lib/` logic is pure). A component or hook test opts into **jsdom** with `// @vitest-environment jsdom` at the top of the file. **Write one for any hook that adjusts state during render** — a render loop returns a clean 200 from the server and is invisible to `curl`; only a client render catches it. See `hooks/__tests__/useInfiniteArticles.test.tsx`, which exists because exactly that shipped.

Set **`NEWS_FIXTURES=1`** to run the whole app against the recorded fixtures with no API keys at all.

## Docker

```bash
docker compose up --build             # production build, http://localhost:3000
docker compose --profile dev up dev   # hot-reload dev server, same port
docker compose down -v                # -v also drops the dev anonymous volumes
```

`Dockerfile` is a multi-stage build (`deps` → `dev` | `builder` → `runner`). Compose has two services: `web` (the `runner` stage, the default — a bare `docker compose up` starts only this) and `dev` (the `dev` stage, gated behind the `dev` profile so it never starts by accident).

The **production** image carries no `node_modules`: `next.config.ts` sets `output: "standalone"`, so `next build` emits `.next/standalone` with a self-contained `server.js`, and the runner stage copies that plus `.next/static` and `public/`. It runs as the non-root `nextjs` user and listens on `0.0.0.0:3000` via `HOSTNAME`/`PORT`.

The **dev** service bind-mounts the repo over `/app` for hot reload, with anonymous volumes masking `/app/node_modules` and `/app/.next` so the container's dependencies and build output are not shadowed by (or written back over) the host's. Two non-obvious constraints hold it together:

- It runs as the image's built-in `node` user, which is **uid 1000** — the same uid as a typical Linux host user. That is what keeps files the container writes through the bind mount owned by you rather than by root. If you change the user, or run on a host where your uid isn't 1000, expect root-owned droppings in the working tree.
- `/app/.next` is created and chowned to `node` **in the image**, because an anonymous volume inherits its ownership from the image directory at creation time. If you edit that, `docker compose down -v` (not plain `down`) is required to drop the stale volume — otherwise the old ownership persists and the dev server fails to write.
- `next dev` binds `0.0.0.0` by default in Next 16, so no `-H` flag is needed for the port mapping to work. Dev output also goes to `.next/dev` (not `.next`), so a container dev server and a host `next build` don't collide.

Two consequences worth knowing before you change things:

- If you add a `server.js`-adjacent runtime file (a config, a JSON blob read with `fs`), output-file tracing may not detect it and it will be missing from the image. Add it to `outputFileTracingIncludes` in `next.config.ts`.
- `NEXT_PUBLIC_*` env vars are inlined at **build** time, so passing one only under `environment:` in compose will not reach browser code — it has to be a build arg. Server-side keys (which is where the news API keys belong) can stay runtime-only in `environment:`/`env_file`.

## What this project is

An interview take-home: the UI for a **news aggregator** that pulls articles from several news APIs and displays them in a clean, readable feed. The requirements it was given:

- **Search and filtering** — search articles by keyword; filter results by date, category, and source.
- **Personalized feed** — users pick preferred sources, categories, and authors.
- **Mobile-responsive** design.
- Fetch from **at least 3** of the listed data sources (NewsAPI, OpenNews, NewsCred, The Guardian, New York Times, BBC News, NewsAPI.org). Each has a different response shape, so expect an adapter/normalization layer that maps every source onto one internal `Article` type — that is the main architectural decision in this codebase.
- Must be **containerized with Docker**, with docs on running it in a container — done, see the Docker section above.
- Graded on DRY / KISS / SOLID, so favor small, single-responsibility modules over one large fetch-and-render component.

## State of the codebase

**Complete.** Every requirement in the brief is built: keyword search with date/category/source filters, a personalized feed (preferred sources, categories, authors), a mobile-responsive layout, three normalized data sources, Docker with docs, and DRY/KISS/SOLID enforced as a two-pass check on every feature. Plus infinite scroll with server-side pagination, and a light/dark/system theme.

The create-next-app leftovers (`pages/api/hello.ts`, the sample SVGs in `public/`) and the development-only component gallery (`pages/ui.tsx`) have all been deleted. What is here is what the app uses.

## Data flow

Everything provider-facing is **server-side**, because this repo is public and the keys must not reach the browser.

- `lib/sources/*` — one adapter per provider. `buildUrl` and `parse` are **pure**; the aggregator owns all IO. That is what makes them testable against fixtures.
- `lib/aggregator.ts` — fans out with `Promise.allSettled`, so one dead provider **degrades** the feed instead of emptying it, then dedupes by URL and sorts by date.
- `pages/index.tsx` — `getServerSideProps` calls `aggregate` **directly**, not our own `/api/articles`. The Next docs are explicit about this: GSSP already runs on the server, so proxying through your own route just adds a hop.
- `pages/api/articles.ts` — the same aggregator over HTTP. **Only infinite scroll calls it**, to append page 2 and beyond. It doubles as the inspection surface for verifying an adapter without the UI in the way (`/check` and `add-news-source` drive it).

**Filters live in the URL; the page number does not.** Applying a filter is a route change that re-runs `getServerSideProps` — so a filtered feed is a shareable, server-rendered link and the back button works. Paging is scroll state, not URL state: pushing `page` on every scroll would add a history entry per page and make the back button walk backwards through the feed instead of leaving it. So the first page is server-rendered and the rest are appended client-side, sending the same filters read from the URL.

`lib/query.ts` owns both directions of the URL contract (`parseArticleQuery` and `toQueryParams`); if they drift, a shared link means one thing to the server and another to the client — and a page-2 request would mean something different from the page-1 render.

`lib/articles.ts` holds the pure article helpers (`dedupeByUrl`, `sortByNewest`, `appendPage`) **because the client needs them too**. They cannot live in `lib/aggregator.ts`: that imports `registry.ts` → every adapter → the code that reads the API keys, and a client import would pull all of it into the browser bundle.

`lib/query.ts` must **never** import `registry.ts` — the filter UI imports `query.ts`, and the registry pulls in every adapter, which would put the provider endpoints and the key-reading code into the browser bundle. That is why the canonical source-id list lives in the import-free `lib/sources/types.ts`.

The component gallery that once lived at `pages/ui.tsx` has been **deleted** — it was developer scaffolding, not product. Primitives are now exercised through the feed itself and through `yarn test`. (`git show e95e664:pages/ui.tsx` recovers it if you want it locally; do not ship it.)

## Theming and design tokens

Colors live in **two layers**, and the distinction is load-bearing:

- `styles/base.css` — a **raw palette** (`--neutral-500`, `--red-400`) that no component may reference, plus **semantic aliases** (`--surface`, `--muted-text`, `--danger`, `--primary`) built from it. `.dark` re-points the *aliases* at different raw values.
- `styles/globals.css` — an `@theme inline` block mapping each alias to a Tailwind color, which is what generates `bg-surface`, `text-muted-text`, and so on. `inline` is required: it keeps the value a live `var()` reference instead of freezing it at build time, and that is what lets one class follow the theme.

**Add a color in both files or the class will not exist.** Components use only the semantic classes — never a hex, never a stock Tailwind color (`bg-white`, `text-zinc-500`), never a raw palette step. The full token table is in `components/UI/CLAUDE.md`.

Because the tokens swap themselves, **`dark:` classes are almost never needed** — `bg-surface` is already right in both themes. `@custom-variant dark (&:where(.dark, .dark *))` in `globals.css` points Tailwind's `dark:` at the class, for the rare case that a rule cannot be expressed as a token.

Dark mode is **class-based** (`<html class="dark">`), not `prefers-color-scheme`, because the preference is a three-way user choice — light / dark / system — and a media query cannot express the override. Two pieces make it correct:

- `lib/theme.ts` exports `THEME_INIT_SCRIPT`, run **blocking in `<head>`** from `pages/_document.tsx`. It sets the class before first paint; without it a dark-theme visitor sees a white flash. It cannot be `next/script` and cannot wait for React, so it is inlined as a string — the literals inside it duplicate the module's constants deliberately. Keep them in sync.
- `hooks/useTheme.ts` reads localStorage and `matchMedia` via **`useSyncExternalStore`**, which hydrates from a server snapshot and then re-renders with the real client value. This is why there is no `isMounted` flag and no `setState` in an effect — the `react-hooks/set-state-in-effect` lint rule rejects that pattern, and `lint` will fail on it. Reuse this approach for any other client-only persisted state (e.g. the personalized-feed preferences).

Every token pair was contrast-checked to WCAG AA in both themes. `--neutral-450` exists only because `--neutral-400` gave light-theme `subtle-text` 2.48:1. If you change a color, re-check it.

## Naming conventions

**Any file that contains a React component is `PascalCase` and named after the component it exports** — `Button.tsx`, `ArticleCard.tsx`, `EmptyState.tsx`. One component per file, and the filename matches the export.

Everything else stays lowercase: hooks (`useArticles.ts` — camelCase, named after the hook), plain modules (`cn.ts`, `aggregator.ts`, `guardian.ts`), and types (`types.ts`), because none of them export a component.

Directories are lowercase (`components/feed/`, `lib/sources/`) with one exception: **`components/UI/`** is capitalized, because UI is an acronym and is always written that way.

```
components/UI/Button/Button.tsx  UI primitive   -> own folder, PascalCase
components/UI/Button/types.ts    its props      -> lowercase, sits beside it
components/feed/ArticleCard.tsx  feature comp   -> PascalCase, lowercase folder, no folder of its own
components/feed/types.ts         shared types   -> one per feature folder
hooks/useArticles.ts             hook           -> camelCase
lib/sources/guardian.ts          plain module   -> lowercase
```

**UI primitives get a folder each** — `UI/<Name>/<Name>.tsx` + `UI/<Name>/types.ts`, default export, props interface named `I<Name>Props`. Feature components do not: they are flat PascalCase files in a lowercase feature folder, sharing one `types.ts`. The full rules for primitives live in `components/UI/CLAUDE.md` and are modelled on the sibling Lumark project (`../Lumark/src/components/UI/`) — read that before adding one.

Note that `pages/` is exempt — the Pages Router derives URLs from filenames, so those stay lowercase (`pages/index.tsx`, `pages/api/articles.ts`) even though they export components.

### Never write a barrel `index.ts`

**Do not create re-export barrel files** — no `components/UI/index.ts`, no `lib/sources/index.ts`, none anywhere. Import from the defining module directly:

```ts
import { Button } from "@/components/UI/Button";   // yes
import { Button } from "@/components/UI";          // no — no barrel exists
```

Barrels are pure indirection: they add a file to keep in sync on every rename, hide where a symbol actually lives, defeat "go to definition" jumping straight to the source, and make one import pull the whole folder into the module graph — which wrecks tree-shaking and slows cold builds. The only thing they buy is slightly shorter import lines, and the `@/*` alias already gives us that. If you find one, delete it and rewrite the imports.

## Stack notes that bite

- **Next.js 16 with the Pages Router**, not the App Router. Routes live in `pages/`; there is no `app/` directory and no React Server Components. Do not reach for App Router idioms (`"use client"`, `app/layout.tsx`, route handlers) — see `@AGENTS.md` above, and read `node_modules/next/dist/docs/02-pages/` before writing routing or data-fetching code.
- **Tailwind CSS v4**, configured CSS-first. There is no `tailwind.config.js`; the theme lives in the `@theme inline` block in `styles/globals.css`, and PostCSS loads `@tailwindcss/postcss`. Add design tokens as CSS variables there.
- `@/*` is a path alias for the repo root (e.g. `@/styles/globals.css`).
- `reactStrictMode: true`, so effects double-invoke in dev — write fetches to tolerate it.
