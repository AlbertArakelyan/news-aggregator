# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Commands

**The package manager is yarn — Yarn Classic (v1). Never run `npm` in this repo, in a terminal or inside the Dockerfile.** `yarn.lock` is the committed lockfile and there is no `package-lock.json`; an `npm install` would silently ignore `yarn.lock` and resolve a different dependency tree. There is no `packageManager` field, so nothing enforces this but you.

- Add a dependency with `yarn add <pkg>` (`yarn add -D <pkg>` for dev), never `npm install <pkg>`.
- In CI/Docker the install is `yarn install --frozen-lockfile` — that is the v1 flag. `--immutable` is Yarn Berry and will error here.

```bash
yarn dev      # dev server on http://localhost:3000
yarn build    # production build
yarn start    # serve the production build
yarn lint     # eslint (flat config, no path arg needed)
```

There is no test runner configured yet. If tests are added, wire the script into `package.json` and record the single-test invocation here.

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

An interview take-home: the UI for a **news aggregator** that pulls articles from several news APIs and displays them in a clean, readable feed. The full brief is the one-page PDF at the repo root, `CS_Frontend Developer_2025.pdf`. Its requirements:

- **Search and filtering** — search articles by keyword; filter results by date, category, and source.
- **Personalized feed** — users pick preferred sources, categories, and authors.
- **Mobile-responsive** design.
- Fetch from **at least 3** of the listed data sources (NewsAPI, OpenNews, NewsCred, The Guardian, New York Times, BBC News, NewsAPI.org). Each has a different response shape, so expect an adapter/normalization layer that maps every source onto one internal `Article` type — that is the main architectural decision in this codebase.
- Must be **containerized with Docker**, with docs on running it in a container — done, see the Docker section above.
- Graded on DRY / KISS / SOLID, so favor small, single-responsibility modules over one large fetch-and-render component.

`PLAN.md` at the repo root holds the agreed build plan (UI library → adapters → feed → filters → personalized feed). Read it before starting feature work.

## State of the codebase

Done: Docker, the README, the design system (`styles/base.css` + theming), and the ten UI primitives in `components/UI`. See `PLAN.md` — steps 1 and 2 are complete.

Not built: everything that makes it a news aggregator. No source adapters, no `/api/articles`, no feed, no search, no filters, no preferences. `pages/index.tsx` is a `Hello world` placeholder and `pages/api/hello.ts` is still the create-next-app sample — treat both as replaceable.

`pages/ui.tsx` is a component gallery (a Storybook stand-in) rendering every primitive in every variant. Keep it in sync when the library changes, and **delete it before final delivery** — it is developer scaffolding, not product.

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
