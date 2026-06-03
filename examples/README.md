# Example

A minimal, runnable project showing `eslint-plugin-tailwind-design-tokens` wired up against **both**
Tailwind token sources at once:

- [`theme.css`](./theme.css) — Tailwind **v4** `@theme` block, fed to the plugin via `cssFile`.
- [`tailwind.config.js`](./tailwind.config.js) — Tailwind **v3** theme, fed via `configFile`.

[`eslint.config.mjs`](./eslint.config.mjs) turns both rules on and points `no-hardcoded-colors` at
those two files. [`src/Button.jsx`](./src/Button.jsx) contains deliberate violations so the linter
has something to report.

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

To watch the auto-fix in action (the arbitrary-value case only):

```sh
npx eslint . --fix
```

## Expected output

`src/Button.jsx` reports four problems:

| Line                         | Rule                  | Why                                                                 |
| ---------------------------- | --------------------- | ------------------------------------------------------------------- |
| `className="bg-[#0a0a0a] …"` | `no-hardcoded-colors` | `#0a0a0a` → v4 token **ink**; `bg-[#0a0a0a]` auto-fixes to `bg-ink` |
| `className="… text-red-500"` | `no-default-palette`  | `text-red-500` is a stock palette class                             |
| `backgroundColor: '#f5f5f5'` | `no-hardcoded-colors` | `#f5f5f5` → v3 token **surface**                                    |
| `borderColor: '#2563eb'`     | `no-hardcoded-colors` | `#2563eb` → v4 token **primary**                                    |

`GoodButton` uses tokens only (`bg-ink`, `text-primary`, `var(--color-primary)`) and reports nothing.
