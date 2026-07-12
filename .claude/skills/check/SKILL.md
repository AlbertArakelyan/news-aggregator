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
nohup yarn start > /dev/null 2>&1 &
sleep 5
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000/ui
```

Then assert on the actual response, not just the status code — grep the HTML for the thing you changed.

Stop it when done, and confirm the port is free:

```bash
pkill -f "next start"
curl -s -o /dev/null --max-time 2 http://localhost:3000 && echo "STILL SERVING" || echo "port free"
```

## 3. Check what the build actually emitted

For anything styling-related, confirm the class exists in the compiled CSS — Tailwind scans source as text, so a constructed class name is silently dropped:

```bash
CSS=$(find .next/static/chunks -name "*.css" | head -1)
grep -o "\.bg-surface\b" "$CSS"
```

Variant-prefixed utilities are escaped in the output (`.hover\:bg-primary:hover`), so grep the escaped form or you will get a false "missing".

## 4. Docker, if the container or its config changed

```bash
docker compose up --build -d
curl -s -o /dev/null -w "%{http_code}\n" http://localhost:3000
docker compose down
```

The dev profile is separate: `docker compose --profile dev up dev`, torn down with `docker compose --profile dev down -v` (the `-v` matters — it drops the anonymous volumes).

## 5. Report honestly

Say what you ran and what it returned. If something failed, say so with the output. Never describe a change as verified because it compiled.
