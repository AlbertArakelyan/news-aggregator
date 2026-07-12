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

`usePreferences` does exactly the same for the personalized feed's saved preferences — same problem, same solution.

## Adjusting state during render: the reference must be stable

`useInfiniteArticles` and `SearchInput` both reset state by comparing a value **during render** — the React-sanctioned alternative to a reset effect (an effect would trip `set-state-in-effect`, and would render one stale frame first):

```ts
const [seed, setSeed] = useState(initialArticles);

if (seed !== initialArticles) {
  setSeed(initialArticles);
  setArticles(initialArticles);
}
```

**The compared value must be stable across re-renders and change only on new props.** A prop that arrives on the props object is stable — React keeps that object identical until the page receives new props. Anything *synthesized during render* is not.

This shipped a render loop. The page did:

```tsx
function Feed({ sourceOptions, ...initial }) {   // rest-spread = new object EVERY render
  useInfiniteArticles(initial, filters);         // comparison never matches -> setState -> re-render -> ...
```

React bailed out with "Too many re-renders". **Pass the array or the primitive, never an object you built in the render.**

Two things make this class of bug dangerous:

- **SSR renders once, so it is invisible to a curl of the server HTML.** The loop only starts on the *second* client render — here, when `usePreferences` hydrated. A green build and a 200 response prove nothing about it.
- The regression test is in `hooks/__tests__/useInfiniteArticles.test.tsx`. It renders the hook in jsdom and forces a parent re-render. Add a test there for any new hook that adjusts state during render.

## Testing hooks

Component and hook tests opt into jsdom per file:

```ts
// @vitest-environment jsdom
```

The default is `node` (the `lib/` logic is pure). jsdom has no `IntersectionObserver` and no `fetch` — stub them. RTL's auto-cleanup does not register without Vitest globals, so `afterEach(cleanup)` is explicit.

## An effect may touch the DOM, never setState

Syncing a class onto `document.documentElement` in an effect is fine. Setting React state in one is not.

## Keep the storage details out

The hook composes; it does not own the storage keys or the parsing. Those live in `lib/` (`lib/theme.ts` holds the key, the validation, the `matchMedia` query, and the blocking init script). The hook subscribes to them.

`reactStrictMode` is on, so effects double-invoke in development. Write subscriptions and fetches to tolerate it.
