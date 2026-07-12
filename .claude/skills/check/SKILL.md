---
name: check
description: Verify the app actually works — lint, typecheck/build, then boot it and drive the real routes. Run before saying a change is done. Use when asked to verify, test, or confirm something works.
disable-model-invocation: false
allowed-tools: Bash, Read, Grep
---

Verify the change end to end. **A green build is not verification** — Tailwind classes that were never generated, a `peer-*` rule that cannot match, and a theme script that throws all compile perfectly.

## 1. Static

```bash
yarn lint && yarn build
```

Both must be clean. `yarn lint` enforces `react-hooks/set-state-in-effect` — if it fires, do not add a mount flag; use `useSyncExternalStore` (see `hooks/useTheme.ts`).

## 2. Boot and drive it

```bash
# NEWS_FIXTURES=1 serves the recorded fixtures, so this needs no API keys and
# burns no free-tier quota.
nohup env NEWS_FIXTURES=1 yarn start > /dev/null 2>&1 &
sleep 6
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
curl -s "http://localhost:3000/api/articles?categories=science" | jq '.articles | length'
```

Then assert on the actual response, not just the status code — grep the HTML for the thing you changed. Drive the filters through the URL (`/?q=…`, `/?categories=…`, `/?sources=…`), since that is the whole data path.

Stop it when done, and confirm the port is free:

```bash
pkill -f "next start"
curl -s -o /dev/null --max-time 2 http://localhost:3000 && echo "STILL SERVING" || echo "port free"
```

## 3. If you touched a component or a hook, the HTML proves nothing

**A curl of the server HTML cannot see a client-side bug.** SSR renders once and succeeds; hydration, effects, and re-renders all happen afterwards. A render loop, a hydration mismatch, a broken event handler — all of them return a clean 200 and a perfect-looking page source.

This has already shipped once: a rest-spread in `pages/index.tsx` handed `useInfiniteArticles` a fresh object every render, the reset comparison never matched, and React bailed out with "Too many re-renders". Lint passed. Build passed. `curl` returned 200 with the full feed in it. The app was broken in the browser.

So for any change to a component or hook:

```bash
yarn test    # component/hook tests run in jsdom and DO catch this
```

If the thing you changed has no test that renders it **and re-renders it**, write one (see `hooks/__tests__/useInfiniteArticles.test.tsx`). Any hook that adjusts state during render, or resets on new props, needs one.

## 4. Check what the build actually emitted

For anything styling-related, confirm the class exists in the compiled CSS — Tailwind scans source as text, so a constructed class name is silently dropped:

```bash
CSS=$(find .next/static/chunks -name "*.css" | head -1)
grep -o "\.bg-surface\b" "$CSS"
```

Variant-prefixed utilities are escaped in the output (`.hover\:bg-primary:hover`), so grep the escaped form or you will get a false "missing".

## 5. Docker, if the container or its config changed

```bash
docker compose up --build -d
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
docker compose down
```

The dev profile is separate: `docker compose --profile dev up dev`, torn down with `docker compose --profile dev down -v` (the `-v` matters — it drops the anonymous volumes).

## 6. The DRY / KISS / SOLID pass — the one the brief grades

**Not optional, and not a formality.** Re-read the diff and act on what it surfaces. Working code is where this review starts, not where it ends.

- **DRY** — Did I rewrite something that exists? A Tailwind class string belongs in a primitive, written once. A provider quirk is normalized once, in its adapter. The query string is parsed once, in `lib/query.ts`. (But two things that merely *look* alike are not duplication — only unify what changes together.)
- **KISS** — Is anything here simpler if I delete it? Any dependency, flag, layer or option that nobody asked for and no failure demanded?
- **Single responsibility** — Is logic sitting in a component that belongs in `lib/`? Is a "primitive" holding state? (Then it is a feature component.)
- **Open-closed / dependency inversion** — Would a **fourth news source still be one new file plus one line in `registry.ts`**? Would a fifth primitive, or a new filter, still be a one-file change? If not, the abstraction leaked — fix the abstraction, not the caller.
- **Interface segregation** — Does every `SourceCapabilities` flag state what the API *genuinely* does? A lie there makes a filter silently do nothing while the UI looks fine.

Fix what this turns up **before** reporting the feature as done. For component work, also run the `ui-conformance` subagent.

## 7. Report honestly

Say what you ran and what it returned. If something failed, say so with the output. Never describe a change as verified because it compiled.
