---
name: Bug report
about: A rule reports the wrong thing, misses something, or the plugin errors
title: ''
labels: bug
assignees: ''
---

## What happened

<!-- What did the plugin do, and what did you expect instead? -->

## Which rule

- [ ] `no-hardcoded-colors`
- [ ] `no-default-palette`
- [ ] other / not sure

## Reproduction

**Code being linted:**

```jsx
// the smallest snippet that shows the problem
```

**ESLint config (rule options):**

```js
// the relevant part of your eslint.config / .eslintrc, including any cssFile/configFile/tokens/allow
```

**Token source (if relevant):** the `@theme` block, `tailwind.config.js` colors, or inline `tokens`.

## Expected vs. actual

- **Expected:** <!-- e.g. "no report" / "should suggest token `ink`" -->
- **Actual:** <!-- the message you got, or the absence of one -->

## Environment

- Plugin version:
- ESLint version:
- Node version:
