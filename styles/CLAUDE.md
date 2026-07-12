# Styles

**Tailwind v4, configured CSS-first.** There is no `tailwind.config.js` and there should not be — v4 does not read one unless you explicitly `@config` it in, and that is the legacy v3 path. The theme lives in CSS.

## Two files, two jobs

**`base.css`** — the tokens, in two layers:

- **Raw palette** (`--neutral-500`, `--red-400`): literal colors. **No component ever references these.**
- **Semantic aliases** (`--surface`, `--muted-text`, `--danger`, `--primary`): what a thing *is*, built from the raw palette.

`.dark` re-points the **aliases** at different raw values. That is the entire theming mechanism: every component follows without changing a single class.

**`globals.css`** — exposes the aliases to Tailwind:

```css
@theme inline {
  --color-surface: var(--surface);
}
```

`inline` is **required**. Without it Tailwind compiles the value in at build time and the class freezes to one color instead of following the theme.

## Adding a color means editing both files

A token in `base.css` with no mapping in `globals.css` generates **no class** and fails silently. Use `/add-design-token`, which walks the whole procedure including the contrast check.

## Dark mode is class-based

`<html class="dark">`, driven by `@custom-variant dark (&:where(.dark, .dark *))`, because the preference is a three-way user choice — light / dark / system — and `prefers-color-scheme` alone cannot express an override.

**You should almost never write a `dark:` class.** The tokens already swap; `bg-surface` is correct in both themes. A `dark:` class is nearly always a missing token.

## Contrast is a requirement, not an aspiration

Every text/background pair meets **WCAG AA** in both themes (4.5:1 body, 3:1 large/secondary). This has already caught a real defect: `--neutral-450` exists solely because `--neutral-400` gave light-theme `subtle-text` only 2.48:1.

Changing a color means re-running the check. `/add-design-token` has the script.

## Palette intent — do not casually "brighten" this

Monochrome ink on warm newsprint neutrals. **Chroma is reserved for status** (danger / success / warning / info), so the only saturated color on screen always carries meaning. The primary action is ink in light and paper in dark — it *inverts* rather than holding a fixed hue.

There is deliberately **no brand accent**. Any accent hue collides with red/green/amber/blue, leaving violet (the generic "AI" look) or teal/magenta (which fight with success). Dropping it is what makes the design read flat, high-contrast, and editorial. Adding one back is a design decision, not a tweak.
