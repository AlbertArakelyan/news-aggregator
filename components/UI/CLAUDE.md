# UI primitives — rules

This folder is the in-house UI library. Every component in here must follow the same shape so they compose predictably.

The pattern is taken from the sibling **Lumark** project — `../Lumark/src/components/UI/Button/` and `.../Input/` are the reference implementations. Read them before adding a component here.

## When to add a component here

- **Yes**: the element is a reusable presentational primitive (button, input, select, checkbox, chip, card, skeleton, spinner, drawer, etc.). It has UI sense outside any one feature.
- **No**: the markup is feature-specific (an article card, the filter bar, the preferences panel) — keep it next to the feature in `components/<feature>/`, as a flat PascalCase file sharing that folder's `types.ts`.

Before writing new markup elsewhere, scan this folder first and reuse what exists. If a primitive is *missing*, add it here rather than reaching for an external UI library.

## The pattern (non-negotiable)

1. **File layout**: `<Name>/<Name>.tsx` + `<Name>/types.ts`. One folder per component. `export default` the component.
2. **No barrel `index.ts`.** Consumers import the file directly: `import Button from "@/components/UI/Button/Button"`.
3. **`types.ts`** exports:
   - `I<Name>Props` (capital `I` prefix).
   - The string-literal union types the component exposes — `<Name>SizeType`, `<Name>VariantType`, `<Name>RoundedType`, `<Name>IconPositionType`, etc.
4. **`I<Name>Props` extends the native HTML attributes of the root element**:
   - `<button>` → `ButtonHTMLAttributes<HTMLButtonElement>`
   - `<input>` → `InputHTMLAttributes<HTMLInputElement>`
   - `<select>` → `SelectHTMLAttributes<HTMLSelectElement>`
   - `<a>` → `AnchorHTMLAttributes<HTMLAnchorElement>`
   - plain `<div>` wrapper → `HTMLAttributes<HTMLDivElement>`
5. **Also extend `PropsWithChildren` only when the component renders children.**
6. **Component is `FC<I<Name>Props>`.** Destructure your own named props, leave `...rest` (or `...props`) for spreading.
7. **Where `{...rest}` goes**: onto the **root element by default**, or onto the **most semantically important element when the component wraps its root** — an `Input` spreads onto the inner `<input>`, not the wrapper `<div>`, because `<input>` is what callers actually configure (`value`, `onChange`, `placeholder`, `type`).
8. **Multiple `*ClassName` props** — one per meaningful structural layer, named for its role: `wrapperClassName`, `labelClassName`, `buttonContentClassName`, `iconWrapperClassName`. The plain destructured `className` is reserved for the root / most-important element so it composes with `{...rest}`.
9. **Variant props are string-literal unions** mapped through a `Record<UnionType, string>` inside `useMemo`, with a fallback to a sensible default:
   ```ts
   const buttonSize = useMemo(() => {
     const sizeMapping: Record<ButtonSizeType, string> = { xs: '...', sm: '...', md: '...' };
     return sizeMapping[size] || sizeMapping.md;
   }, [size]);
   ```
10. **Styling is inline Tailwind utility classes**, composed with template literals. No CSS modules, no styled-components, no CSS-in-JS, no external UI libs, and **no `clsx` / `tailwind-merge` / `class-variance-authority`** — Lumark deliberately uses none of them, and neither do we.
11. **Theme tokens**: this project is **Tailwind v4, configured CSS-first** — there is no `tailwind.config.js`. Tokens are CSS variables in the `@theme inline` block of `styles/globals.css`. Use the semantic classes they generate (`bg-primary`, `bg-surface`, `text-text-color`, `border-border-color`, `bg-danger`, …). Never hardcode hex colors; if a token is missing, add it to `globals.css`.

## Don'ts

- Don't create a barrel `index.ts`.
- Don't reach for an icon library other than `lucide-react`.
- Don't add `forwardRef` unless a consumer actually needs the ref.
- Don't put any emojis in component code.
- Don't fetch data or hold business logic in here — primitives are presentational and stateless.
