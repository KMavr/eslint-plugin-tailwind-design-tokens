# eslint-plugin-tailwind-design-tokens

[![CI](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/actions/workflows/ci.yml/badge.svg)](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/eslint-plugin-tailwind-design-tokens.svg)](https://www.npmjs.com/package/eslint-plugin-tailwind-design-tokens)

ESLint plugin that flags hardcoded colors and default Tailwind palette classes, steering you toward
your design-system tokens.

> 🚧 **Work in progress** — the rules are being built. Not yet published to npm.

## Why

Design systems define a token palette (e.g. `--color-ink`, `bg-primary`). But it's easy for a raw
`#0a0a0a` or a stock `text-red-500` to sneak into a component, eroding the system over time. This
plugin catches those at lint time and points you at the right token.

## Planned rules

| Rule                  | Description                                                                                              |
| --------------------- | -------------------------------------------------------------------------------------------------------- |
| `no-hardcoded-colors` | Disallow hardcoded color literals (hex, `rgb()`, `hsl()`, `oklch()`); suggest the matching design token. |
| `no-default-palette`  | Disallow default Tailwind palette classes (`text-red-500`, `bg-gray-100`, …).                            |

Tokens are discovered from your Tailwind v4 `@theme` CSS, your v3 `tailwind.config.js`, or an inline
map in the rule options.

## License

[MIT](./LICENSE) © Konstantinos Mavrikas
