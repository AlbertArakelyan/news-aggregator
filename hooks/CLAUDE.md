# Hooks

`useCamelCase.ts`, one hook per file, named after the hook, default export.

## Client-only state must not break hydration

The server cannot know what is in `localStorage` or what the OS theme is. Read that state with **`useSyncExternalStore`**, not with a mount flag.

`hooks/useTheme.ts` is the worked example. The wrong version — `useState` seeded with a default, corrected in a `useEffect` — is what people reach for first. It is wrong twice over:

1. `yarn lint` **fails** on it. The `react-hooks/set-state-in-effect` rule rejects `setState` inside an effect, and that rule is on.
2. It forces an `isMounted` flag through every consumer, and renders one frame of the wrong value.

`useSyncExternalStore` hydrates from a server snapshot, then re-renders with the real client value. No flag, no effect, no mismatch:

```ts
const theme = useSyncExternalStore(subscribe, getClientSnapshot, () => DEFAULT);
```

Apply this to the personalized-feed preferences (step 6 of `PLAN.md`) — same problem, same solution.

## An effect may touch the DOM, never setState

Syncing a class onto `document.documentElement` in an effect is fine. Setting React state in one is not.

## Keep the storage details out

The hook composes; it does not own the storage keys or the parsing. Those live in `lib/` (`lib/theme.ts` holds the key, the validation, the `matchMedia` query, and the blocking init script). The hook subscribes to them.

`reactStrictMode` is on, so effects double-invoke in development. Write subscriptions and fetches to tolerate it.
