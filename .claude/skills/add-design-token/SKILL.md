---
name: add-design-token
description: Add or change a color/design token correctly — raw palette in base.css, semantic alias, Tailwind mapping in globals.css, plus a WCAG AA contrast check in both themes. Use when a component needs a color that does not exist yet, or when changing the palette.
allowed-tools: Read, Edit, Write, Bash
paths: styles/**
---

Tokens live in **two layers**. Adding a color means touching **both files** — one alone and the Tailwind class silently will not exist.

## 1. `styles/base.css`

- **Raw palette** (`--neutral-500`, `--red-400`): literal colors. No component ever references these.
- **Semantic alias** (`--surface`, `--muted-text`, `--danger`): what the thing *is*. Built from the raw palette.

Add the alias to **both** `:root` (light) and `.dark`. Dark is not "the same color dimmer" — status hues go *brighter* on a dark canvas, and hover/active invert direction (light theme darkens on hover; dark theme lightens).

## 2. `styles/globals.css`

Map the alias into the `@theme inline` block:

```css
@theme inline {
  --color-<name>: var(--<name>);
}
```

`inline` is required — it keeps the value a live `var()` reference instead of freezing it at build time, which is exactly what lets one class follow the theme.

Only now does `bg-<name>` / `text-<name>` / `border-<name>` exist.

## 3. Contrast-check it — every text/background pair, both themes

This is not optional; it has already caught one real defect (`subtle-text` at 2.48:1, which is why `--neutral-450` exists).

Targets: **4.5:1** for body text, **3:1** for large/secondary text and UI boundaries.

```bash
node -e '
const lin = c => { c/=255; return c<=0.03928 ? c/12.92 : Math.pow((c+0.055)/1.055, 2.4); };
const L = h => { const [r,g,b]=[1,3,5].map(i=>parseInt(h.slice(i,i+2),16)); return 0.2126*lin(r)+0.7152*lin(g)+0.0722*lin(b); };
const ratio = (a,b) => { const [x,y]=[L(a),L(b)].sort((p,q)=>q-p); return ((x+0.05)/(y+0.05)).toFixed(2); };
console.log(ratio("#918c84", "#ffffff"));  // fg, bg
'
```

If a pair fails, adjust the **raw** value (or add a half-step, as `--neutral-450` did) — never weaken the requirement.

## 4. Verify the class actually generates

Tailwind only emits classes it finds in source. After `yarn build`:

```bash
grep -o "\-\-color-<name>" .next/static/chunks/*.css   # token exposed
grep -o "\.bg-<name>" .next/static/chunks/*.css        # utility generated
```

Remember variant-prefixed classes are escaped in the CSS (`.hover\:bg-<name>:hover`), so grep for the escaped form when checking those.

## 5. Record it

Add the new token to the table in `components/UI/CLAUDE.md`, so the next person knows it exists and does not reinvent it as a hex.
