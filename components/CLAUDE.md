# Components

Two kinds of component live here, and they follow **different** rules.

## Primitives — `components/UI/`

Reusable, presentational, stateless. Folder per component, `types.ts` beside it. See `components/UI/CLAUDE.md` — that file is the spec, and it is non-negotiable.

## Feature components — `components/<feature>/`

Everything else: markup that only makes sense inside one feature (`feed/ArticleCard.tsx`, `filters/FilterBar.tsx`, `theme/ThemeToggle.tsx`).

- **Flat PascalCase files in a lowercase folder.** No folder per component — that pattern is reserved for primitives.
- **One shared `types.ts` per feature folder**, not one per component.
- **No barrel `index.ts`.** Import the file directly.
- They may hold state, call hooks, and read data. That is exactly what makes them not primitives.

`ThemeToggle` is the worked example: it reads and writes theme state, so it lives in `components/theme/` rather than `components/UI/`, and it composes `Button` instead of restyling one.

## The rule that keeps this honest

**Compose primitives; do not re-style them.** A feature component should add layout (`flex`, `grid`, `gap`, spacing) and nothing else. If you find yourself writing `bg-*`, `border-*`, or `rounded-*` in a feature component, the primitive is missing a variant — add it there instead (`/add-ui-primitive`).

That is the DRY half of what this case study is graded on: a Tailwind class string is written **once**, in a primitive.

## Tokens

Semantic tokens only — `bg-surface`, `text-muted-text`, `border-border-color`. Never a hex, never a stock Tailwind color, never a `dark:` class. Full table in `components/UI/CLAUDE.md`.
