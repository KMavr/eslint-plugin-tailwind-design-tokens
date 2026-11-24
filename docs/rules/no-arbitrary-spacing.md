# tailwind-design-tokens/no-arbitrary-spacing

📝 Disallow arbitrary spacing values; use the spacing scale or design-system tokens.

🔧💡 This rule is automatically fixable by the [`--fix` CLI option](https://eslint.org/docs/latest/user-guide/command-line-interface#--fix) and manually fixable by [editor suggestions](https://eslint.org/docs/latest/use/core-concepts#rule-suggestions).

<!-- end auto-generated rule header -->

> **Tailwind v4 only.** The scale is read from `@theme` in your CSS. v3 configs are not read.

## Rule details

In Tailwind v4 every numeric spacing class is on the scale: `p-13` is `13 × --spacing`. Arbitrary
values are where code drifts off the system, so this rule flags them in spacing and sizing
utilities and offers the on-scale class instead.

It checks:

- **Padding and margin**: `p`, `px`, `py`, `pt`, `pr`, `pb`, `pl`, `ps`, `pe`, the same for `m`,
  including negative margins (`-m-[4px]` and `m-[-4px]`)
- **Gaps**: `gap`, `gap-x`, `gap-y`, `space-x`, `space-y`
- **Sizing**: `w`, `h`, `size`, `min-w`, `min-h`, `max-w`, `max-h`
- **Position**: `inset`, `inset-x`, `inset-y`, `top`, `right`, `bottom`, `left`, `start`, `end`

Variants (`md:hover:`) and important markers (`!p-…`, `p-…!`) are kept in the fix.

For each arbitrary `px` or `rem` value, the rule looks for replacements:

- **The scale step**: the value divided by `--spacing`, when it lands on a `stepIncrement`.
- **Named tokens**: every `--spacing-*` token with the same size.

Then:

- **One match** → autofix: `p-[16px]` → `p-4`.
- **Several matches** → suggestions to pick from, no autofix: `p-[24px]` → `p-6` or `p-card`.
- **No match** → reported without a fix: `w-[37.5px]`.

Not reported: values that aren't `px` or `rem` (`calc()`, `var()`, `%`, `vh`/`vw`/`dvh`, `em`,
bare `0`), and arbitrary values on other utilities (`bg-[#fff]`, `text-[14px]`, `rounded-[6px]`).

## Examples

With the default `--spacing: 0.25rem` and `@theme { --spacing-card: 24px; }`:

👎 Incorrect:

```jsx
<div className="p-[16px] mt-[1.5rem] md:-mx-[8px] w-[37.5px]" />
<div className="gap-[24px]" /> {/* gap-6 or gap-card */}
```

👍 Correct:

```jsx
<div className="p-4 mt-6 md:-mx-2 w-[calc(100%-1rem)]" />
<div className="gap-card" />
```

## Options

```ts
{
  cssFile?: string;              // path to the CSS file with your @theme block
  allow?: string[];              // classes to ignore (exact or /regex/)
  rootFontSize?: number;         // px per rem, default 16
  stepIncrement?: 0.25 | 0.5 | 1; // smallest scale step to suggest, default 0.25
}
```

- **`cssFile`**: reads `--spacing` (the scale base) and `--spacing-*` (named tokens) from every
  `@theme` block. Resolved relative to the lint working directory. Without it, the base is
  Tailwind's default `0.25rem` and there are no named tokens. `--spacing: initial` turns the
  numeric scale off, so only named tokens are suggested.
- **`allow`**: classes to never flag, such as a deliberate one-off. An entry wrapped in slashes is
  a regular expression (`'/^h-\\[/'` ignores every arbitrary height). A malformed pattern is a
  config error and fails fast.
- **`rootFontSize`**: used to compare `px` and `rem` values. Change it only if your root font size
  isn't 16px.
- **`stepIncrement`**: Tailwind v4 accepts steps in quarters (`p-0.25`, `w-9.25`), so with a 4px
  base almost any whole-pixel value has an on-scale class. Raise the increment if your team only
  uses half or whole steps:

  | `w-[37px]`       | Result              |
  | ---------------- | ------------------- |
  | `0.25` (default) | autofix to `w-9.25` |
  | `0.5`            | reported, no fix    |
  | `1`              | reported, no fix    |

```js
'tailwind-design-tokens/no-arbitrary-spacing': ['error', {
  cssFile: './src/styles/globals.css',
  stepIncrement: 0.5,
  allow: ['/^max-w-\\[/'],
}]
```

## When not to use it

If your project is on Tailwind v3, or if arbitrary spacing values are an accepted part of your
codebase, this rule isn't for you.
