# lib

Framework-free modules: no JSX, no React imports, no Next imports. Lowercase filenames (`theme.ts`, `aggregator.ts`). Plain named exports — no default export, no barrel `index.ts`.

Everything here should be a **pure function or a thin wrapper over one browser/Node API**, which is what makes it the only layer worth unit-testing.

## Know which side each module runs on

This is the security boundary of the whole project, so be deliberate:

- **Server-only** (`lib/sources/*`, the aggregator): reads `process.env.*_API_KEY`. These are imported **only** from `pages/api/*`. If a component imports one, the key it reads is compiled into the browser bundle — and this repo is public.
- **Isomorphic** (`lib/theme.ts`): safe on both, but guards anything touching `window`/`localStorage`, because it is also imported by `_document` during SSR.

Never prefix a key `NEXT_PUBLIC_`. That inlines it into client JS at build time. Server-side keys stay runtime-only in `environment:` / `env_file`.

## The inlined-script exception

`lib/theme.ts` exports `THEME_INIT_SCRIPT` as a **string**, inlined into `<head>` by `_document`. It cannot import from the module that defines it, so its literals are duplicated on purpose. Change one, change the other — there is no type-checking across that boundary.

Guard `localStorage` access with `try`/`catch`: it throws outright in some privacy modes, and a preference is never worth breaking the page over. Guard the storage read **separately** from the system-preference check, so a storage failure still honors the OS setting.
