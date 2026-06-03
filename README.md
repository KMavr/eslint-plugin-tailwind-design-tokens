# eslint-plugin-tailwind-design-tokens

[![CI](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/actions/workflows/ci.yml/badge.svg)](https://github.com/KMavr/eslint-plugin-tailwind-design-tokens/actions/workflows/ci.yml)
[![npm version](https://img.shields.io/npm/v/eslint-plugin-tailwind-design-tokens.svg)](https://www.npmjs.com/package/eslint-plugin-tailwind-design-tokens)

ESLint plugin that flags hardcoded colors and default Tailwind palette classes, steering you toward
your design-system tokens.

## Why

A design system defines a finite color palette as tokens — `--color-ink`, `bg-primary`,
`text-soft-green`. But nothing stops a raw `#0a0a0a`, an `rgb(10 10 10)`, or a stock `text-red-500`
from sneaking into a component, and every one of those quietly erodes the system. This plugin
catches them at lint time and, when the hardcoded value matches one of your tokens, tells you exactly
which token to use instead.

It understands where tokens live across Tailwind versions — a v4 `@theme` block, a v3
`tailwind.config.js`, or an inline map — so it works whatever your setup.

## Install

```sh
npm install --save-dev eslint-plugin-tailwind-design-tokens
# or
yarn add --dev eslint-plugin-tailwind-design-tokens
# or
pnpm add --save-dev eslint-plugin-tailwind-design-tokens
```

Requires ESLint 9+ (both the legacy `.eslintrc` and the flat config systems are supported).

## Usage

### Flat config (ESLint 9+, `eslint.config.mjs`)

Quick start with the recommended config:

```js
import tailwindDesignTokens from 'eslint-plugin-tailwind-design-tokens';

export default [...tailwindDesignTokens.configs['flat/recommended']];
```

Recommended turns both rules on as errors. To get **token suggestions** (not just "hardcoded color"
warnings), point `no-hardcoded-colors` at your token source:

```js
import tailwindDesignTokens from 'eslint-plugin-tailwind-design-tokens';

export default [
  {
    plugins: { 'tailwind-design-tokens': tailwindDesignTokens },
    rules: {
      'tailwind-design-tokens/no-default-palette': 'error',
      'tailwind-design-tokens/no-hardcoded-colors': [
        'error',
        { cssFile: './src/styles/globals.css' },
      ],
    },
  },
];
```

### Legacy config (`.eslintrc.json`)

```json
{
  "plugins": ["tailwind-design-tokens"],
  "extends": ["plugin:tailwind-design-tokens/recommended"]
}
```

Or configure the rules directly to add a token source:

```json
{
  "plugins": ["tailwind-design-tokens"],
  "rules": {
    "tailwind-design-tokens/no-default-palette": "error",
    "tailwind-design-tokens/no-hardcoded-colors": [
      "error",
      { "cssFile": "./src/styles/globals.css" }
    ]
  }
}
```

## Rules

| Rule                                                         | Description                                                                                                                                                                          |
| ------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [`no-hardcoded-colors`](./docs/rules/no-hardcoded-colors.md) | Disallow hardcoded color literals (hex, `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`, `oklch()`) anywhere in a string; suggests the matching design token when one exists. |
| [`no-default-palette`](./docs/rules/no-default-palette.md)   | Disallow default Tailwind palette classes (`text-red-500`, `bg-gray-100`, …).                                                                                                        |

## Configuring tokens

`no-hardcoded-colors` can read your design tokens from any combination of these sources (later
sources win on conflict: **cssFile < configFile < tokens**):

| Option       | Tailwind | What it reads                                                                                                                                                |
| ------------ | -------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `cssFile`    | v4       | `--color-*` declarations inside the `@theme { … }` block of the given CSS file.                                                                              |
| `configFile` | v3       | `theme.colors` / `theme.extend.colors` from a `tailwind.config.js` (nested palettes are flattened, e.g. `brand-500`; a `DEFAULT` key maps to the bare name). |
| `tokens`     | any      | An inline `{ "<color>": "<token-name>" }` map — for projects whose tokens live outside Tailwind.                                                             |

```js
'tailwind-design-tokens/no-hardcoded-colors': ['error', {
  cssFile: './src/styles/globals.css',     // Tailwind v4 @theme
  configFile: './tailwind.config.js',       // Tailwind v3
  tokens: { '#0a0a0a': 'ink' },             // inline / non-Tailwind
  allow: ['transparent', '#ffffff'],        // colors to ignore
}]
```

Color values are normalized before matching, so `#FFF` in your code matches a token defined as
`#ffffff`. Hex and the CSS color functions `rgb()`, `hsl()`, `hwb()`, `lab()`, `lch()`, `oklab()`,
and `oklch()` are all detected, including inside Tailwind arbitrary values like `bg-[#0a0a0a]`.

## How it works

- **`no-hardcoded-colors`** scans every string literal and template-literal quasi for color values,
  normalizes each, and looks it up in your token map. A match reports _"use the design token X"_; no
  match reports _"unexpected hardcoded color"_.
- **`no-default-palette`** splits class strings and flags any default Tailwind palette utility
  (`prefix-family-shade`), tolerating important (`!`) and opacity (`/50`) modifiers.

Token files are read once and cached per ESLint process, invalidated by file mtime.

## Contributing

Issues and PRs welcome. Local development:

```sh
npm install
npm test          # vitest
npm run lint
npm run typecheck
npm run build
```

## License

[MIT](./LICENSE) © Konstantinos Mavrikas
