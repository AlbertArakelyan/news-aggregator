# Plan

## What the brief actually requires

Three features — keyword **search with date/category/source filters**, a **personalized feed** (preferred sources, categories, authors), and **mobile-responsive** design. Plus: React + TypeScript, **at least 3** of the seven listed data sources, Docker with docs, and explicit grading on DRY/KISS/SOLID.

Docker and the docs are already done. Everything else is unbuilt.

## The one non-obvious finding: the source list is partly fiction

Of the seven listed sources, only three are realistically usable today:

- **The Guardian** — Open Platform, free key, clean and well-documented. Solid.
- **New York Times** — Article Search API, free key. Solid.
- **NewsAPI.org** — free key. Note items **1 ("NewsAPI") and 7 ("NewsAPI.org") are the same service**, listed twice.

The rest are dead ends: **OpenNews** is a journalism nonprofit, not an API; **NewsCred** pivoted to Welcome and killed public access; **BBC News** has no public API (it's *inside* NewsAPI as a source). So the honest reading is "pick the three that exist," which is what I'd do — and I'd say so in the README, since noticing it is itself a signal.

One catch worth designing around: NewsAPI's free tier **rejects browser requests** and is dev-only. That single constraint settles the architecture.

## Architecture

**Server-side proxy through Pages Router API routes.** All three providers are called from `pages/api/articles.ts`, never from the browser. This kills three birds: API keys stay server-only (no `NEXT_PUBLIC_`, so they remain runtime env vars in Docker rather than build args), CORS disappears, and NewsAPI's no-browser rule is satisfied for free.

**The adapter layer is the heart of it** — and the thing being graded. One interface, three implementations:

```
lib/sources/types.ts      NewsSource interface, Article, ArticleQuery
lib/sources/guardian.ts   Guardian response  -> Article
lib/sources/nyt.ts        NYT response       -> Article
lib/sources/newsapi.ts    NewsAPI response   -> Article
lib/sources/registry.ts   the list; add a source by adding one file
lib/aggregator.ts         fan out, merge, dedupe, sort
```

Each adapter does two mappings: internal `ArticleQuery` → its provider's query params, and its provider's response → the normalized `Article` (`id, title, description, url, imageUrl, publishedAt, source, category, author`). The feed depends only on the interface, so a fourth source is a new file plus a registry entry — nothing else changes. That's open-closed and dependency-inversion demonstrated concretely rather than asserted.

**Capability mismatch is the real design problem.** The providers don't support the same filters — Guardian filters by `section`, NYT by `section_name` via `fq`, NewsAPI only supports `category` on `top-headlines` (not on `everything`), and none filter reliably by author. So each adapter **declares what it supports**, the aggregator pushes supported filters down to the provider, and applies the remainder in-memory after normalization. Author filtering is always post-normalization.

**Aggregation:** fan out with `Promise.allSettled` so one dead provider degrades the feed instead of emptying it, then dedupe (by URL) and sort by `publishedAt` descending.

## Build order

1. **Design system — DONE.** Tokens and theming, built before the components because a `Button` cannot be written until `bg-primary` means something.

   ```
   styles/base.css        raw palette -> semantic aliases; .dark re-points the aliases
   styles/globals.css     @custom-variant dark + @theme inline (aliases -> Tailwind)
   lib/theme.ts           theme types, storage, and the blocking no-flash script
   hooks/useTheme.ts      useSyncExternalStore over localStorage + matchMedia
   pages/_document.tsx    runs the no-flash script in <head>
   pages/_app.tsx         Geist font variables, app-wide
   pages/index.tsx        temporary token preview — replaced by the feed in step 4
   ```

   **Two token layers.** A raw palette (literal colors, never referenced by a component) and semantic aliases (`--surface`, `--muted-text`, `--danger`) which are the *only* layer Tailwind exposes. Theming is therefore a swap of the alias layer: `.dark` re-points the same names at different raw values and every component follows without changing a class. Components use `bg-surface` / `text-muted-text`, never `bg-white` or a hex.

   **Palette — monochrome ink on warm newsprint neutrals.** Chroma is reserved exclusively for status (danger/success/warning/info), so the only saturated color on screen always carries meaning. The primary action is ink in light and paper in dark: it inverts rather than staying a fixed hue. This is a deliberate rejection of the accent-hue approach — any brand accent has to avoid colliding with red/green/amber/blue, which leaves violet (the generic "AI" look) or teal/magenta (which fight with success). Dropping the accent sidesteps the collision entirely and reads as flat, high-contrast, editorial.

   **Dark mode is class-based** (`<html class="dark">`), not `prefers-color-scheme`, because the preference is a *user choice* of light / dark / system — a media query alone cannot express the override. `@custom-variant dark (&:where(.dark, .dark *))` points Tailwind's `dark:` at that class, though components should rarely need `dark:` at all since the tokens already swap.

   The three things that make it correct rather than merely working:

   - **No flash of the wrong theme.** A blocking inline `<script>` in `_document`'s `<head>` sets the class before first paint. It cannot be `next/script` and it cannot wait for React.
   - **No hydration mismatch.** The server cannot know the theme, so `useTheme` reads localStorage and matchMedia through `useSyncExternalStore` — which hydrates from a server snapshot and then re-renders with the real value. That is why there is no `isMounted` flag and no `setState` in an effect.
   - **Accessible.** Every text/background pair was contrast-checked; all 22 meet WCAG AA in both themes. `--neutral-450` exists solely because the obvious choice (`--neutral-400`) gave light-theme `subtle-text` only 2.48:1.

2. **UI primitives — DONE.** The presentational components every later step composes, so no feature invents its own button.

   Structure follows the sibling **Lumark** project (`../Lumark/src/components/UI/`), which is the reference implementation. **One folder per component**, holding the component and its types:

   ```
   components/UI/Button/Button.tsx        + Button/types.ts     variants, sizes, icon, isLoading
   components/UI/Input/Input.tsx          + Input/types.ts      text + date, icon, error slot
   components/UI/Select/Select.tsx        + Select/types.ts     single + multi (sources, categories, authors)
   components/UI/Checkbox/Checkbox.tsx    + Checkbox/types.ts   preference toggles
   components/UI/Chip/Chip.tsx            + Chip/types.ts       active-filter pills, source/category tags
   components/UI/Card/Card.tsx            + Card/types.ts       surface the article card sits on
   components/UI/Skeleton/Skeleton.tsx    + Skeleton/types.ts   loading placeholders
   components/UI/Spinner/Spinner.tsx      + Spinner/types.ts
   components/UI/EmptyState/EmptyState.tsx + EmptyState/types.ts
   components/UI/Drawer/Drawer.tsx        + Drawer/types.ts     filter panel on mobile, sidebar on desktop
   ```

   The pattern each component must follow, matching Lumark:

   - **`export default`** the component. **No `FC<…>`** — type the destructured parameter directly. Import it directly too: `import Button from "@/components/UI/Button/Button"`. No barrel `index.ts` anywhere.
   - **`types.ts`** exports `I<Name>Props` (capital `I` prefix) plus the string-literal unions the component exposes — `ButtonVariantType`, `ButtonSizeType`, `ButtonRoundedType`, and so on.
   - **`I<Name>Props` extends the native HTML attributes of the root element** (`ButtonHTMLAttributes<HTMLButtonElement>`, `InputHTMLAttributes<HTMLInputElement>`, `HTMLAttributes<HTMLDivElement>` …) — and *only* those. `children` never goes in the interface: a component that renders children is typed `PropsWithChildren<IButtonProps>` at the signature. Any native prop being redefined must be `Omit`ted (`title` is `string` on `HTMLAttributes`, not `ReactNode`).
   - **`{...rest}` spreads onto the root element**, or onto the most semantically important element when the component wraps its root — `Input` spreads onto the inner `<input>`, since that is what callers configure.
   - **Variants are `Record<UnionType, string>` maps inside `useMemo`**, with a fallback to the default: `return sizeMapping[size] || sizeMapping.md;`.
   - **Extra `*ClassName` props** — one per meaningful structural layer (`wrapperClassName`, `labelClassName`, `buttonContentClassName`), while the plain `className` is reserved for the root element so it composes with `{...rest}`.
   - **Inline Tailwind utility classes only.** No CSS modules, no CSS-in-JS, no external UI library.

   **No new dependencies.** Lumark deliberately uses none of `clsx` / `tailwind-merge` / `class-variance-authority` — class strings are plain template literals and variants are the `useMemo` + `Record` maps above. Dropping the `lib/cn.ts` helper I originally planned keeps this at zero added deps, which is the KISS half of the rubric. `lucide-react` is the icon library if icons are needed (Lumark's choice; nothing else).

   Components consume the **step-1 semantic tokens** (`bg-primary`, `text-muted-text`, `border-border-color`, `bg-danger` …) and never hardcode a hex or a raw palette step.

   `components/UI/CLAUDE.md` holds these rules in full, so they are loaded automatically when working in that folder.

   This is the DRY half of the rubric made visible: Tailwind class strings are written **once**, in a primitive, and every feature composes them. Each primitive is presentational and stateless — single responsibility, no data fetching, no business logic.

   `lucide-react` is the only icon library (Lumark's choice). It is the sole dependency the UI library added.

   `ThemeToggle` deliberately lives in `components/theme/`, **not** in `components/UI/` — it reads and writes theme state, and primitives are presentational and stateless by rule. It composes `Button`.

   Multi-selection (sources, categories, authors) is done with `Checkbox` groups rather than a `multiple` `<select>`, which is poor UX on both desktop and mobile. `Select` is a styled *native* `<select>`: keyboard navigation, type-ahead, and the mobile OS picker come free, and none of it is worth reimplementing as a custom listbox.

3. **Types + adapters + aggregator** with the `/api/articles` route — pure functions, no UI. Testable in isolation.
4. **Feed UI**: article card, list, loading/empty/error states, responsive layout — composed from the step-2 primitives, adding no new raw Tailwind beyond layout. Replaces the temporary design-system preview at `pages/index.tsx`.

   Feature components do **not** get a folder each — that pattern is reserved for UI primitives. They are flat PascalCase files grouped by feature, sharing one `types.ts` per feature folder, exactly as Lumark does it in `Layouts/MainLayout/FilesPanel/`:

   ```
   components/feed/ArticleCard.tsx
   components/feed/ArticleList.tsx
   components/feed/types.ts
   ```
5. **Search + filters**, with filter state held in **URL query params** — shareable links, working back button, and no separate state library.
6. **Personalized feed**: preferences (sources, categories, authors) in `localStorage`, applied as default filters. Client-only — reuse the `useSyncExternalStore` approach from `useTheme` rather than reintroducing a mount flag.

## Two open calls

**Filter state in the URL vs. React state.** URL params are better (shareable, back button, SSR-friendly), and cost nothing extra. Default to that.

**Tests.** There's no test runner. The adapters are pure mapping functions — the single highest-value thing to test, and a visible DRY/SOLID signal for a grader. Adding Vitest with a handful of adapter tests is maybe 30 minutes. Worth it, but it's scope beyond the brief.

## Open questions

- Are Guardian / NYT / NewsAPI keys already available, or should the adapters be built against fixtures with keys dropped into `.env.local` at the end?
