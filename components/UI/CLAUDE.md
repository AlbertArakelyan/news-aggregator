# UI primitives — rules

This folder is the in-house UI library. Every component in here must follow the same shape so they compose predictably.

The pattern is taken from the sibling **Lumark** project — `../Lumark/src/components/UI/Button/` and `.../Input/` are the reference implementations. Read them before adding a component here.

## When to add a component here

- **Yes**: the element is a reusable presentational primitive (button, input, select, checkbox, chip, card, skeleton, spinner, drawer, etc.). It has UI sense outside any one feature.
- **No**: the markup is feature-specific (an article card, the filter bar, the preferences panel) — keep it next to the feature in `components/<feature>/`, as a flat PascalCase file sharing that folder's `types.ts`.

Before writing new markup elsewhere, scan this folder first and reuse what exists. If a primitive is *missing*, add it here rather than reaching for an external UI library.

## The gallery at `/ui` — keep it in sync

`pages/ui.tsx` renders every primitive in every variant. It is our stand-in for Storybook, and the only place the whole library is visible at once.

**Adding a component, or changing its props or variants, means updating `pages/ui.tsx` in the same change.** A variant that is not in the gallery is a variant nobody looks at, and it will break unnoticed. Add the new component as its own `<Section>`, showing each variant, each size, and the disabled / loading / error states where they apply.

It is developer scaffolding, not product: **delete `pages/ui.tsx` before final delivery.**

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
5. **Never use `FC<…>`.** Type the destructured parameter directly:
   ```tsx
   const Button = ({ variant = "primary", className = "", ...rest }: PropsWithChildren<IButtonProps>) => { … };
   export default Button;
   ```
6. **`children` never belongs in the props interface.** The interface extends only the root element's native attributes. If the component renders children, wrap it at the signature — `PropsWithChildren<IButtonProps>` — rather than adding `PropsWithChildren` to the `extends` list. A component with no children (`Input`, `Select`, `Skeleton`, `Spinner`) is typed as the bare `I<Name>Props`.
7. **`Omit` any native prop you redefine.** `HTMLAttributes` already declares `title?: string` (the tooltip). A component whose `title` is a rendered `ReactNode` must `extends Omit<HTMLAttributes<HTMLDivElement>, "title">`, or TypeScript rejects the interface — see `Drawer/types.ts` and `EmptyState/types.ts`. The same applies to `size` on `<input>`/`<select>`, which is why those use `inputElSize` / `selectElSize`.
8. **Where `{...rest}` goes**: onto the **root element by default**, or onto the **most semantically important element when the component wraps its root** — an `Input` spreads onto the inner `<input>`, not the wrapper `<div>`, because `<input>` is what callers actually configure (`value`, `onChange`, `placeholder`, `type`).
9. **Multiple `*ClassName` props** — one per meaningful structural layer, named for its role: `wrapperClassName`, `labelClassName`, `buttonContentClassName`, `iconWrapperClassName`. The plain destructured `className` is reserved for the root / most-important element so it composes with `{...rest}`.
10. **Variant props are string-literal unions** mapped through a `Record<UnionType, string>` inside `useMemo`, with a fallback to a sensible default:
   ```ts
   const buttonSize = useMemo(() => {
     const sizeMapping: Record<ButtonSizeType, string> = { xs: '...', sm: '...', md: '...' };
     return sizeMapping[size] || sizeMapping.md;
   }, [size]);
   ```
11. **Styling is inline Tailwind utility classes**, composed with template literals. No CSS modules, no styled-components, no CSS-in-JS, no external UI libs, and **no `clsx` / `tailwind-merge` / `class-variance-authority`** — Lumark deliberately uses none of them, and neither do we.
12. **Theme tokens** — the full set, defined in `styles/base.css` and exposed to Tailwind by the `@theme inline` block in `styles/globals.css`:

    | Role | Classes |
    |---|---|
    | surfaces | `bg-background`, `bg-surface`, `bg-surface-hover`, `bg-surface-sunken` |
    | text | `text-text-color`, `text-muted-text`, `text-subtle-text` |
    | lines | `border-border-color`, `border-border-strong` |
    | primary action | `bg-primary`, `bg-primary-hover`, `bg-primary-active`, `text-primary-foreground` |
    | secondary action | `bg-secondary`, `bg-secondary-hover`, `bg-secondary-active`, `text-secondary-foreground` |
    | ghost action | `bg-ghost-hover`, `bg-ghost-active` |
    | status | `bg-danger`, `text-danger`, `bg-danger-bg`, `text-danger-foreground` — same shape for `success`, `warning`, `info` |
    | danger action | `bg-danger-hover`, `bg-danger-active` — only `danger` has these, because only it is also a Button variant |
    | focus ring | `ring-ring` (with `focus-visible:ring-3`) |

    **Never hardcode a hex, never use a Tailwind stock color (`bg-white`, `text-zinc-500`), and never reach for a raw palette step (`--neutral-400`) directly.** Only the semantic aliases above. If a token is missing, add it to `base.css` *and* map it in `globals.css` — both, or Tailwind will not generate the class.

    Because the tokens themselves swap with the theme, **you should almost never write a `dark:` class.** `bg-surface` is already correct in both themes. Reach for `dark:` only when a rule cannot be expressed as a token (e.g. inverting an image).

13. **Class names must be statically analyzable.** Tailwind scans source as plain text, so a constructed class like `` `bg-${status}` `` is never generated. Write the full class in every branch of your `Record` maps.
14. **`peer-*` compiles to a *sibling* combinator**, so it cannot reach a descendant. `Checkbox` drives its tick with `peer-checked:[&_svg]:opacity-100` on the sibling span — putting `peer-checked:opacity-100` on the nested icon itself silently never matches.

## Don'ts

- Don't create a barrel `index.ts`.
- Don't reach for an icon library other than `lucide-react`.
- Don't add `forwardRef` unless a consumer actually needs the ref.
- Don't put any emojis in component code.
- Don't fetch data or hold business logic in here — primitives are presentational and stateless.
