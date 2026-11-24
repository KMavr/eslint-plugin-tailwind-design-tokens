# Example

A minimal, runnable project showing `eslint-plugin-tailwind-design-tokens` wired up against **both**
Tailwind token sources at once:

- [`theme.css`](./theme.css) — Tailwind **v4** `@theme` block (colors and a `--spacing-card`
  token), fed to the plugin via `cssFile`.
- [`tailwind.config.js`](./tailwind.config.js) — Tailwind **v3** theme, fed via `configFile`.

[`eslint.config.mjs`](./eslint.config.mjs) turns all three rules on. It points `no-hardcoded-colors`
at both files and `no-arbitrary-spacing` at `theme.css` (spacing is Tailwind v4 only).
[`src/Button.jsx`](./src/Button.jsx) (colors) and [`src/Card.jsx`](./src/Card.jsx) (spacing)
contain deliberate violations so the linter has something to report.

## Run it

This example consumes the plugin from the parent repo (`"file:.."`), so build the plugin first:

```sh
# from the repo root
npm install
npm run build

# then, in this folder
cd examples
npm install
npm run lint        # or: npx eslint .
```

To watch the auto-fix in action (`bg-[#0a0a0a]`, `p-[16px]` and `mt-[2rem]`):

```sh
npx eslint . --fix
```

## Expected output

Eight problems in total. `src/Button.jsx` reports four:

| Line                         | Rule                  | Why                                                                 |
| ---------------------------- | --------------------- | ------------------------------------------------------------------- |
| `className="bg-[#0a0a0a] …"` | `no-hardcoded-colors` | `#0a0a0a` → v4 token **ink**; `bg-[#0a0a0a]` auto-fixes to `bg-ink` |
| `className="… text-red-500"` | `no-default-palette`  | `text-red-500` is a stock palette class                             |
| `backgroundColor: '#f5f5f5'` | `no-hardcoded-colors` | `#f5f5f5` → v3 token **surface**                                    |
| `borderColor: '#2563eb'`     | `no-hardcoded-colors` | `#2563eb` → v4 token **primary**                                    |

`GoodButton` uses tokens only (`bg-ink`, `text-primary`, `var(--color-primary)`) and reports nothing.

`src/Card.jsx` reports four more:

| Class        | Rule                   | Why                                                                      |
| ------------ | ---------------------- | ------------------------------------------------------------------------ |
| `p-[16px]`   | `no-arbitrary-spacing` | 16px is 4 scale steps; auto-fixes to `p-4`                               |
| `mt-[2rem]`  | `no-arbitrary-spacing` | 2rem = 32px = 8 steps; auto-fixes to `mt-8`                              |
| `gap-[24px]` | `no-arbitrary-spacing` | matches both `gap-6` and the token `gap-card`, so offered as suggestions |
| `w-[37.5px]` | `no-arbitrary-spacing` | not a quarter step of the 4px base; reported without a fix               |

`GoodCard` uses on-scale classes, the `gap-card` token and an exempt `calc()` value, and reports
nothing.
