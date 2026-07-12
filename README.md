# News Aggregator

The user interface for a news aggregator that pulls articles from several news APIs and presents them in a clean, easy-to-read feed. Built as the innoscripta Frontend Developer case study; the brief is `CS_Frontend Developer_2025.pdf` in this repo.

Target features, per the brief:

- **Search and filtering** — search articles by keyword, filter results by date, category, and source.
- **Personalized feed** — choose preferred sources, categories, and authors.
- **Mobile-responsive** layout.
- Articles fetched from **at least three** of the permitted data sources (NewsAPI, OpenNews, NewsCred, The Guardian, New York Times, BBC News, NewsAPI.org).

> **Status:** project scaffolding and Docker setup are in place; the aggregator features above are not implemented yet.

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

> ⚠️ **Do not run `npm install`.** It ignores `yarn.lock`, resolves a different dependency tree, and writes a competing `package-lock.json`. Use `yarn` for everything:

```bash
yarn install                  # install dependencies
yarn add <package>            # add a runtime dependency
yarn add -D <package>         # add a dev dependency
yarn install --frozen-lockfile  # reproducible install (CI / Docker)
```

`--frozen-lockfile` is the Yarn Classic flag. `--immutable` is Yarn Berry and will not work here.

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

## Running with Docker

Requires Docker with the Compose plugin (`docker compose`, v2). Nothing else — you do **not** need Node or yarn installed on the host.

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
pages/            Routes (Pages Router). pages/api/* are API routes served at /api/*
styles/           Global CSS; the Tailwind v4 theme lives in globals.css
public/           Static assets, served from /
next.config.ts    Next.js config (standalone output, React strict mode)
Dockerfile        Multi-stage build: deps -> dev | builder -> runner
docker-compose.yml
```

Two conventions worth knowing before adding code:

- This is the **Pages Router**. There is no `app/` directory and no React Server Components — App Router idioms (`"use client"`, `app/layout.tsx`) do not apply.
- **Tailwind v4 is configured in CSS**, not JavaScript. There is no `tailwind.config.js`; theme tokens are declared in the `@theme inline` block in `styles/globals.css`.
