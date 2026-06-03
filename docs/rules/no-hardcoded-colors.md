# tailwind-design-tokens/no-hardcoded-colors

📝 Disallow hardcoded color values (hex, rgb, hsl, hwb, lab, lch, oklab, oklch); use design-system tokens.

💼 This rule is enabled in the ✅ `recommended` config.

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

## Rule details

This rule scans every string literal and template-literal quasi for color values and reports them.
It detects:

- **Hex** — `#fff`, `#ffffff`, `#ffffffff` (3/4/6/8 digits)
- **Functional** — `rgb()` / `rgba()`, `hsl()` / `hsla()`, `hwb()`, `lab()`, `lch()`, `oklab()`,
  `oklch()`
- **Tailwind arbitrary values** — the color inside `bg-[#0a0a0a]`, `text-[rgb(10_10_10)]`, etc.

Because it scans whole strings, it catches colors in className strings, inline `style` objects, and
CSS-in-JS alike.

Each detected color is normalized (lowercased, shorthand expanded, opaque alpha dropped) and looked
up in your configured token map:

- **Match found** → reports `useDesignToken`, naming the token to use instead.
- **No match** → reports `noHardcodedColor`.

The message shows the color exactly as you wrote it; normalization only drives the lookup.

## Examples

👎 Incorrect:

```js
const styles = { color: '#0a0a0a' };
const cls = 'bg-[#fff] text-[rgb(10_10_10)]';
const ring = 'oklch(0.7 0.1 200)';
```

👍 Correct:

```js
const styles = { color: 'var(--color-ink)' };
const cls = 'bg-ink text-muted';
```

## Options

```ts
{
  cssFile?: string;    // Tailwind v4: path to a CSS file with a @theme block
  configFile?: string; // Tailwind v3: path to tailwind.config.js
  tokens?: Record<string, string>; // inline { color: tokenName } map
  allow?: string[];    // color values to ignore (raw, normalized, or /regex/)
}
```

- **`cssFile`** — reads `--color-*` declarations from the `@theme { … }` block. Resolved relative to
  the lint working directory.
- **`configFile`** — `require`s the config and reads `theme.colors` / `theme.extend.colors`. Nested
  palettes flatten to `family-shade`; a `DEFAULT` key maps to the bare family name.
- **`tokens`** — an explicit map for tokens that don't live in a Tailwind file.
- **`allow`** — values to never flag (e.g. `'transparent'`, a deliberate brand hex). Matched against
  both the raw and normalized form, so `'#0a0a0a'` also allows `#0A0A0A`. An entry wrapped in
  slashes is treated as a regular expression (`/pattern/` or `/pattern/flags`), which is handy for
  migrations — e.g. `'/^rgb\\(/'` ignores every `rgb()` color. A malformed pattern is a config
  error and fails fast.

Sources merge, later winning on conflict: **cssFile < configFile < tokens**.

```js
'tailwind-design-tokens/no-hardcoded-colors': ['error', {
  cssFile: './src/styles/globals.css',
  allow: ['transparent', 'currentColor', '/^rgb\\(/'],
}]
```

## When not to use it

If you intentionally use raw colors (e.g. a project without a design system, or one-off marketing
pages), disable the rule for those files rather than fighting it.
