# tailwind-design-tokens/no-default-palette

📝 Disallow default Tailwind palette colors; use design-system tokens.

💼 This rule is enabled in the ✅ `recommended` config.

<!-- end auto-generated rule header -->

## Rule details

This rule splits class strings and flags any utility that uses a **default Tailwind palette color** —
a known color prefix, followed by a default family, followed by a valid shade:

```
prefix-family-shade
   |      |      └── 50 | 100..900 | 950
   |      └───────── slate, gray, zinc, red, blue, emerald, … (the stock palette)
   └──────────────── text-, bg-, border-, ring-, fill-, stroke-, divide-, from-, …
```

It tolerates real-world modifiers, stripping them before the check:

- **important** — leading `!` (Tailwind v3, `!text-red-500`) and trailing `!` (v4, `text-red-500!`)
- **opacity** — `text-red-500/50`

Out of scope (not reported): design-system classes (`text-primary`), arbitrary values
(`bg-[#fff]` — that's [`no-hardcoded-colors`](./no-hardcoded-colors.md)), and `white` / `black`
(no numeric shade).

## Examples

👎 Incorrect:

```jsx
<div className="text-red-500 bg-gray-100 border-blue-700/40" />
```

👍 Correct:

```jsx
<div className="text-primary bg-surface border-accent" />
```

## Options

```ts
{
  allow?: string[]; // class tokens, color parts, or /regex/ to ignore
}
```

- **`allow`** — entries to never flag, useful during a migration. Matches either the full class
  token (`'bg-gray-100'`) or just the color part (`'gray-100'`). An entry wrapped in slashes is
  treated as a regular expression (`/pattern/` or `/pattern/flags`) tested against both forms — e.g.
  `'/^red-/'` whitelists the entire red family while you migrate it. A malformed pattern is a config
  error and fails fast.

```js
'tailwind-design-tokens/no-default-palette': ['error', {
  allow: ['gray-100', 'bg-white', '/^red-/'],
}]
```

## When not to use it

If your project intentionally uses the stock Tailwind palette rather than a custom token set, this
rule isn't for you.
