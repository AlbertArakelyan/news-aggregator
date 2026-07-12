# lib

Framework-free modules: no JSX, no React imports, no Next imports. Lowercase filenames (`theme.ts`, `aggregator.ts`). Plain named exports — no default export, no barrel `index.ts`.

Everything here should be a **pure function or a thin wrapper over one browser/Node API**, which is what makes it the only layer worth unit-testing.

## Know which side each module runs on

This is the security boundary of the whole project, so be deliberate:

- **Server-only** — `lib/sources/*` and `lib/aggregator.ts`. They read `process.env.*_API_KEY`, and `aggregator.ts` imports `registry.ts`, which imports every adapter. Import either from a component and the provider endpoints *and* the key-reading code land in the browser bundle. This repo is public.
- **Client-safe** — `lib/articles.ts`, `lib/query.ts`, `lib/preferences.ts`, `lib/storage.ts`, `lib/sources/types.ts`. Pure, no env, no registry.
- **Isomorphic** — `lib/theme.ts`: safe on both, but guards anything touching `window`/`localStorage`, because `_document` also imports it during SSR.

This split is why `dedupeByUrl` and `sortByNewest` live in `lib/articles.ts` rather than beside the aggregator that uses them: infinite scroll needs `dedupeByUrl` on the client when appending a page, and importing the aggregator to get it would have dragged the adapters along.

Two rules that keep the boundary honest:

- **`lib/query.ts` must never import `registry.ts`.** The filter UI imports `query.ts`. The canonical source-id list therefore lives in the import-free `lib/sources/types.ts`.
- After any change here, check that the **provider endpoints** never reach the client:

  ```bash
  grep -rlE "guardianapis|api\.nytimes\.com|newsapi\.org" .next/static/   # must find nothing
  ```

  Do **not** grep for `_API_KEY`. The variable *names* are legitimately in the client bundle — `SourceStatus` names them when no source is configured, so the reader is told what to set. A name is not a secret; a **value** is. To check for values, compare the contents of `.env` against the chunks, not the identifiers.

Never prefix a key `NEXT_PUBLIC_`. That inlines it into client JS at build time. Server-side keys stay runtime-only in `environment:` / `env_file`.

## The inlined-script exception

`lib/theme.ts` exports `THEME_INIT_SCRIPT` as a **string**, inlined into `<head>` by `_document`. It cannot import from the module that defines it, so its literals are duplicated on purpose. Change one, change the other — there is no type-checking across that boundary.

Guard `localStorage` access with `try`/`catch`: it throws outright in some privacy modes, and a preference is never worth breaking the page over. Guard the storage read **separately** from the system-preference check, so a storage failure still honors the OS setting.
