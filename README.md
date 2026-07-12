# News Aggregator

The user interface for a news aggregator that pulls articles from several news APIs and presents them in a clean, easy-to-read feed. Built as the innoscripta Frontend Developer case study; the brief is `CS_Frontend Developer_2025.pdf` in this repo.

Features, per the brief — all implemented:

- **Search and filtering** — keyword search, plus date range, category and source filters. Filter state lives in the URL, so a filtered feed is a shareable, server-rendered link and the back button works.
- **Personalized feed** — preferred sources, categories and authors, saved locally and applied as your default filters.
- **Mobile-responsive** layout — filters collapse into a drawer.
- **Three data sources** — The Guardian, the New York Times, and NewsAPI — each normalized onto one internal `Article` type.
- Plus **infinite scroll** with server-side pagination, and a light/dark/system theme.

Of the seven sources the brief lists, only three are usable today: **OpenNews** is a journalism nonprofit rather than an API, **NewsCred** withdrew public access, and **BBC News** has no public API (it is available *inside* NewsAPI). "NewsAPI" and "NewsAPI.org" are the same service, listed twice. So the three above are the three that exist.

## Tech stack

| | Version | Notes |
|---|---|---|
| [Next.js](https://nextjs.org) | 16.2.10 | **Pages Router** (`pages/`), not the App Router |
| [React](https://react.dev) | 19.2.4 | with `react-dom` 19.2.4 |
| [TypeScript](https://www.typescriptlang.org) | 5.9.3 | `strict: true`; `@/*` aliases the repo root |
| [Tailwind CSS](https://tailwindcss.com) | 4.3.2 | v4, CSS-first — no `tailwind.config.js` |
| [ESLint](https://eslint.org) | 9.39.5 | flat config, `eslint-config-next` |
| Node.js | 20+ | the Docker image uses `node:22-alpine` |
| **Yarn** | **1.22 (Classic)** | **the package manager — see below** |

### Package manager: yarn (Classic v1)

This project uses **yarn**, and `yarn.lock` is the committed lockfile. There is no `package-lock.json`.

> [!WARNING]
> **Do not run `npm install`.** It ignores `yarn.lock`, resolves a different dependency tree, and writes a competing `package-lock.json`.

Use `yarn` for everything:

```bash
yarn install                  # install dependencies
yarn add <package>            # add a runtime dependency
yarn add -D <package>         # add a dev dependency
yarn install --frozen-lockfile  # reproducible install (CI / Docker)
```

`--frozen-lockfile` is the Yarn Classic flag. `--immutable` is Yarn Berry and will not work here.

## API keys — do this first

```bash
cp .env.example .env
```

Then open `.env` and fill in the values, **keeping the variable names exactly as they appear in `.env.example`** — the adapters read them by name. At least one key is needed; each is free.

| Variable | What it is | Where to get it |
|---|---|---|
| `GUARDIAN_API_KEY` | The Guardian's Open Platform. Backs keyword search, date range and category (their `section`) filtering. | Request a free developer key at <https://open-platform.theguardian.com/access/> — it is emailed to you, usually within a minute. |
| `NYT_API_KEY` | The New York Times **Article Search** API. Backs keyword search, date range and category (their `section.name`) filtering. | Sign in at <https://developer.nytimes.com/get-started>, create an app, enable the **Article Search API** for it, and copy the app's **API key**. NYT also shows an *API secret* — it is **not** used here: Article Search authenticates with the key alone, so there is no `NYT_SECRET_API_KEY` to set. |
| `NEWSAPI_KEY` | NewsAPI.org. Backs keyword search and date range. It has no category on the endpoint used, so category is filtered in memory instead. | Register at <https://newsapi.org/register> for a free key. The free tier is **development-only**: it rejects browser-origin requests (harmless here — every call is made server-side) and caps results at 100, so deep infinite-scroll pages will drop this source while the others keep going. |
| `NEWS_FIXTURES` | Optional escape hatch. Set to `1` to serve the recorded sample responses in `lib/sources/__fixtures__/` instead of calling the providers. | Nothing to obtain — it lets you run the whole app, including filters and infinite scroll, **with no keys and no network**. |

**A missing key is skipped, not fatal.** Set one, two, or all three: a source without a key is simply not queried, and the rest of the feed works.

Keys are read **server-side only** — in `getServerSideProps` and `pages/api/*` — and are deliberately never prefixed `NEXT_PUBLIC_`, which would inline them into the browser bundle. They are also never baked into the Docker image; Compose passes `.env` in at runtime.

No keys, or a spent rate limit? Run against the recorded fixtures instead — the whole app works, offline:

```bash
NEWS_FIXTURES=1 yarn dev          # or set NEWS_FIXTURES=1 in .env
```

> [!WARNING]
> **This repo ships only `.env.example`. There is no `.env`, and no API keys — you must supply your own.**
>
> `.env` is gitignored (the keys are secrets, and this repository is public), so a fresh clone has none. Without them the app still builds and serves a page, but **every source reports itself unconfigured, nothing is queried, and the feed is empty**. The page tells you so rather than pretending there is no news.

## Running locally

Requires Node.js 20+ and yarn 1.x.

```bash
yarn install
yarn dev
```

Open <http://localhost:3000>. The page hot-reloads as you edit files.

### Scripts

| Command | Description |
|---|---|
| `yarn dev` | Development server with hot reload on port 3000 |
| `yarn build` | Production build |
| `yarn start` | Serve the production build (run `yarn build` first) |
| `yarn lint` | Run ESLint across the project |
| `yarn test` | Run the test suite once (Vitest) |
| `yarn test:watch` | Re-run tests on change |

## Running with Docker

Requires Docker with the Compose plugin (`docker compose`, v2). Nothing else — you do **not** need Node or yarn installed on the host.

**`.env` must exist first** (see [API keys](#api-keys--do-this-first)). Compose passes it into the container at runtime via `env_file`; the image itself contains no keys, because `.dockerignore` keeps `.env` out of the build context so nothing is ever baked into a layer. Without it the container runs but shows no articles.

Two services are defined in `docker-compose.yml`:

| Service | Stage | Purpose |
|---|---|---|
| `web` | `runner` | Optimized production build. Starts by default. |
| `dev` | `dev` | Development server with hot reload. Opt-in, behind the `dev` profile. |

### 1. Production (default)

Builds the app and serves the optimized production output:

```bash
docker compose up --build
```

Then open <http://localhost:3000>.

Run it detached, and follow the logs:

```bash
docker compose up --build -d     # start in the background
docker compose logs -f web       # follow logs
docker compose ps                # show status
```

Stop and remove the containers:

```bash
docker compose down
```

### 2. Development with hot reload (`dev` profile)

This mounts your working directory into the container, so edits on your machine reload immediately inside it — no rebuild needed.

```bash
docker compose --profile dev up --build dev
```

Then open <http://localhost:3000> and edit any file under `pages/`; the browser updates on save.

The `dev` profile is opt-in: a plain `docker compose up` will **never** start it. Both services publish port 3000, so run one at a time (or stop the other first).

Tear it down — note the `-v`, which also removes the container's anonymous volumes:

```bash
docker compose --profile dev down -v
```

### Useful commands

```bash
# Open a shell inside the running container
docker compose exec web sh
docker compose --profile dev exec dev sh

# Rebuild from scratch, ignoring the build cache
docker compose build --no-cache

# Remove containers, volumes, and the built image
docker compose down -v --rmi local
```

### Troubleshooting

**The container runs but shows no articles.** It has no API keys. Create `.env` (`cp .env.example .env`) and put at least one key in it, then `docker compose up --build`. Compose reads `.env` through `env_file`; the image deliberately contains none. Confirm the keys arrived:

```bash
docker compose exec web sh -c 'echo "${GUARDIAN_API_KEY:-EMPTY}"'
```

To run with no keys at all, set `NEWS_FIXTURES=1` in `.env` and the app serves the recorded fixtures.

**A `docker compose run` container is still holding port 3000.** `docker compose down` does not remove one-off `run` containers. Clear them:

```bash
docker ps -aq --filter "name=news-aggregator" | xargs -r docker rm -f
```

**Port 3000 already in use.** Something else (often a local `yarn dev`, or the other compose service) holds the port. Stop it, or remap the host side in `docker-compose.yml` — e.g. `"3001:3000"` to serve on <http://localhost:3001>.

**Source edits do not reload in the `dev` service.** Make sure you started it via the profile (`--profile dev`) and not the `web` service, which serves a fixed production build and will not pick up changes.

**Permission errors, or the dev server cannot write `.next`.** The `dev` container runs as uid 1000 so files it writes through the bind mount belong to your host user rather than root. If you changed the Dockerfile's `dev` stage, its anonymous volumes may be stale: `docker compose --profile dev down -v` to drop them, then rebuild. A plain `down` (without `-v`) keeps them.

**Changes to `package.json` / `yarn.lock` are not picked up.** Dependencies are installed at image build time. Rebuild: `docker compose up --build`.

## How the Docker setup works

`Dockerfile` is a multi-stage build:

- **`deps`** — installs dependencies with `yarn install --frozen-lockfile`, in its own layer keyed on `package.json` + `yarn.lock`, so editing source code does not reinstall them.
- **`dev`** — the dependency tree plus the source, running `yarn dev`. Compose bind-mounts the repo over it for hot reload.
- **`builder`** — runs `yarn build`.
- **`runner`** — the production runtime.

The production image ships **without** `node_modules`. `next.config.ts` sets `output: "standalone"`, so `next build` emits `.next/standalone` containing a self-contained `server.js` plus only the dependencies actually traced as reachable; the `runner` stage copies that, `.next/static`, and `public/`. It runs as a non-root user and listens on `0.0.0.0:3000`.

## Project structure

```
lib/sources/      One adapter per provider. buildUrl + parse are pure, so the
                  aggregator owns all IO and the mappings test against fixtures.
lib/aggregator.ts Fans out with Promise.allSettled, dedupes, sorts. One dead
                  provider degrades the feed rather than emptying it.
lib/query.ts      Both directions of the URL <-> filter contract, in one place.
components/UI/    The in-house primitives (Button, Input, Drawer, ...).
components/feed/  Article card, list, source status, load-more.
components/filters/, components/preferences/
hooks/            useTheme, useArticleFilters, useInfiniteArticles, ...
pages/            Routes (Pages Router). pages/api/* are served at /api/*
styles/           base.css holds the design tokens; globals.css maps them to Tailwind
```

The one architectural decision worth calling out: **every provider is normalized behind a `NewsSource` interface**, and each adapter declares what its API *genuinely* supports (`SourceCapabilities`). Whatever a provider cannot filter server-side, the aggregator filters in memory — so a filter behaves identically to the reader regardless of which source backs it. Adding a fourth source is one new file plus one line in `lib/sources/registry.ts`; nothing else changes.

Three conventions worth knowing before adding code:

- This is the **Pages Router**. There is no `app/` directory and no React Server Components — App Router idioms (`"use client"`, `app/layout.tsx`) do not apply.
- **Tailwind v4 is configured in CSS**, not JavaScript. There is no `tailwind.config.js`; theme tokens are declared in `styles/base.css` and mapped in the `@theme inline` block of `styles/globals.css`.
- **API keys are server-side only.** Never import `lib/aggregator.ts` or `lib/sources/registry.ts` from a component — it would pull the provider endpoints and the key-reading code into the browser bundle.
