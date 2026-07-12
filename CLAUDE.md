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
docker compose up --build     # http://localhost:3000
docker compose down
```

`Dockerfile` is a multi-stage build (`deps` → `builder` → `runner`) and `docker-compose.yml` runs the `runner` stage. The runtime image carries no `node_modules`: `next.config.ts` sets `output: "standalone"`, so `next build` emits `.next/standalone` with a self-contained `server.js`, and the runner stage copies that plus `.next/static` and `public/`. It runs as the non-root `nextjs` user and the container listens on `0.0.0.0:3000` via `HOSTNAME`/`PORT`.

Two consequences worth knowing before you change things:

- If you add a `server.js`-adjacent runtime file (a config, a JSON blob read with `fs`), output-file tracing may not detect it and it will be missing from the image. Add it to `outputFileTracingIncludes` in `next.config.ts`.
- `NEXT_PUBLIC_*` env vars are inlined at **build** time, so passing one only under `environment:` in compose will not reach browser code — it has to be a build arg. Server-side keys (which is where the news API keys belong) can stay runtime-only in `environment:`/`env_file`.

## What this project is

An interview take-home: the UI for a **news aggregator** that pulls articles from several news APIs and displays them in a clean, readable feed. The full brief is the one-page PDF at the repo root, `CS_Frontend Developer_2025.pdf`. Its requirements:

- **Search and filtering** — search articles by keyword; filter results by date, category, and source.
- **Personalized feed** — users pick preferred sources, categories, and authors.
- **Mobile-responsive** design.
- Fetch from **at least 3** of the listed data sources (NewsAPI, OpenNews, NewsCred, The Guardian, New York Times, BBC News, NewsAPI.org). Each has a different response shape, so expect an adapter/normalization layer that maps every source onto one internal `Article` type — that is the main architectural decision in this codebase.
- Must be **containerized with Docker**, with docs on running it in a container. No `Dockerfile` exists yet.
- Graded on DRY / KISS / SOLID, so favor small, single-responsibility modules over one large fetch-and-render component.

## State of the codebase

Still the unmodified `create-next-app` scaffold — `pages/index.tsx` is the Vercel splash page, `pages/api/hello.ts` is the sample handler, and `public/` holds the default SVGs. None of the news-aggregator features are built. Treat all of it as replaceable.

## Stack notes that bite

- **Next.js 16 with the Pages Router**, not the App Router. Routes live in `pages/`; there is no `app/` directory and no React Server Components. Do not reach for App Router idioms (`"use client"`, `app/layout.tsx`, route handlers) — see `@AGENTS.md` above, and read `node_modules/next/dist/docs/02-pages/` before writing routing or data-fetching code.
- **Tailwind CSS v4**, configured CSS-first. There is no `tailwind.config.js`; the theme lives in the `@theme inline` block in `styles/globals.css`, and PostCSS loads `@tailwindcss/postcss`. Add design tokens as CSS variables there.
- `@/*` is a path alias for the repo root (e.g. `@/styles/globals.css`).
- `reactStrictMode: true`, so effects double-invoke in dev — write fetches to tolerate it.
