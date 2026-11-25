import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../../src/rules/no-hardcoded-colors';

/**
 * Spec for src/rules/no-hardcoded-colors.ts
 *
 * Reports hardcoded color literals (hex / rgb / hsl / oklch) found anywhere in a
 * string Literal or TemplateLiteral quasi — inline styles, CSS-in-JS, and
 * Tailwind arbitrary values like bg-[#fff]. Hex is only reported as the whole
 * string, inside an arbitrary bracket, or in a CSS declaration value; JSX href
 * values are skipped (#69). Detection comes from findColors
 * (../lib/colors); the token lookup comes from loadColorTokens (../lib/tokens).
 *
 * For each detected color:
 *   - if its normalized value maps to a token  -> messageId `useDesignToken`,
 *       data { color: <raw>, token: <name> }, plus a `replaceWithToken`
 *       suggestion that rewrites the color in place
 *   - otherwise                                -> messageId `noHardcodedColor`,
 *       data { color: <raw> }
 *
 * Fix ranges are computed from the raw source text, so escape sequences, JSX
 * entities and template quasis all fix at the right offset.
 *
 * Autofix (`--fix`, top-level `output`) is applied ONLY to the unambiguous
 * arbitrary-value case: a bracketed prefix-[#hex] is rewritten to the utility
 * form (bg-[#fff] -> bg-paper). Bare colors are never autofixed — they stay
 * suggestion-only — so a bare-color token match asserts no top-level `output`.
 *
 * Options: [{ cssFile?, configFile?, tokens?, allow? }]. These tests use the
 * inline `tokens` map (file-based loading is covered in tokens.test.ts). `allow`
 * whitelists specific colors by raw or normalized value.
 */

RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-hardcoded-colors', rule, {
  valid: [
    // no color literals at all
    'const c = "flex p-4 text-primary";',
    // named colors are out of scope (findColors only matches hex/rgb/hsl/oklch)
    'const c = "transparent";',
    // allowed by exact value
    { code: 'const c = "#0a0a0a";', options: [{ allow: ['#0a0a0a'] }] },
    // allowed via normalized value even though written differently
    { code: 'const c = "#0A0A0A";', options: [{ allow: ['#0a0a0a'] }] },
    // migration: a /regex/ allow entry silences a whole class of colors
    { code: 'const c = "rgb(10 10 10)";', options: [{ allow: ['/^rgb\\(/'] }] },
    { code: 'const c = "#0a0a0a";', options: [{ allow: ['/^#0a/'] }] },
    // hex-like text outside a bracket, CSS declaration or whole-string value (#69)
    'const s = "Fixed issue #123 and #4567";',
    'const s = "#123 was fixed";',
    'const c = "#0a0a0a #ffffff";',
    'const s = `See #cafe for ${x}`;',
    // anchors are never colors
    '<a href="#add">x</a>;',
    "<a href={'#feed'}>x</a>;",
  ],
  invalid: [
    {
      // bare hex, no token map -> plain hardcoded-color report
      code: 'const c = "#0a0a0a";',
      errors: [{ messageId: 'noHardcodedColor', data: { color: '#0a0a0a' } }],
    },
    {
      // bare hex that maps to a token -> suggestion only, NOT autofixed
      // (no top-level `output` => --fix leaves ambiguous bare colors untouched)
      code: 'const c = "#0a0a0a";',
      options: [{ tokens: { '#0a0a0a': 'ink' } }],
      errors: [
        {
          messageId: 'useDesignToken',
          data: { color: '#0a0a0a', token: 'ink' },
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'ink' },
              output: 'const c = "ink";',
            },
          ],
        },
      ],
    },
    {
      // token match is normalization-aware: written #FFF, token defined #ffffff
      code: 'const c = "#FFF";',
      options: [{ tokens: { '#ffffff': 'paper' } }],
      errors: [
        {
          messageId: 'useDesignToken',
          data: { color: '#FFF', token: 'paper' },
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'paper' },
              output: 'const c = "paper";',
            },
          ],
        },
      ],
    },
    {
      // Tailwind arbitrary value with a token match -> AUTOFIXED to the utility
      // form, dropping the brackets (bg-paper, not bg-[paper]). Top-level `output`
      // asserts the --fix result; the suggestion mirrors it.
      code: 'const c = "bg-[#fff]";',
      options: [{ tokens: { '#ffffff': 'paper' } }],
      output: 'const c = "bg-paper";',
      errors: [
        {
          messageId: 'useDesignToken',
          data: { color: '#fff', token: 'paper' },
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'paper' },
              output: 'const c = "bg-paper";',
            },
          ],
        },
      ],
    },
    {
      // autofix works for any color-affecting prefix, not just bg-
      code: 'const c = "text-[#0a0a0a]";',
      options: [{ tokens: { '#0a0a0a': 'ink' } }],
      output: 'const c = "text-ink";',
      errors: [
        {
          messageId: 'useDesignToken',
          data: { color: '#0a0a0a', token: 'ink' },
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'ink' },
              output: 'const c = "text-ink";',
            },
          ],
        },
      ],
    },
    {
      // template literal quasi with a token match -> suggestion, like a Literal
      code: 'const c = `#0a0a0a`;',
      options: [{ tokens: { '#0a0a0a': 'ink' } }],
      errors: [
        {
          messageId: 'useDesignToken',
          data: { color: '#0a0a0a', token: 'ink' },
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'ink' },
              output: 'const c = `ink`;',
            },
          ],
        },
      ],
    },
    {
      // arbitrary value in a later quasi -> autofixed at that quasi's offset
      code: 'const c = `${x} bg-[#fff]`;',
      options: [{ tokens: { '#ffffff': 'paper' } }],
      output: 'const c = `${x} bg-paper`;',
      errors: [
        {
          messageId: 'useDesignToken',
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'paper' },
              output: 'const c = `${x} bg-paper`;',
            },
          ],
        },
      ],
    },
    {
      // #64: a two-char escape before the color must not shift the fix range
      code: String.raw`const c = "a\\b bg-[#fff]";`,
      options: [{ tokens: { '#ffffff': 'paper' } }],
      output: String.raw`const c = "a\\b bg-paper";`,
      errors: [
        {
          messageId: 'useDesignToken',
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'paper' },
              output: String.raw`const c = "a\\b bg-paper";`,
            },
          ],
        },
      ],
    },
    {
      // #64: a unicode escape (6 raw chars, 1 cooked) before the color
      code: String.raw`const c = "\u00e9 bg-[#fff]";`,
      options: [{ tokens: { '#ffffff': 'paper' } }],
      output: String.raw`const c = "\u00e9 bg-paper";`,
      errors: [
        {
          messageId: 'useDesignToken',
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'paper' },
              output: String.raw`const c = "\u00e9 bg-paper";`,
            },
          ],
        },
      ],
    },
    {
      // #64: a JSX entity before the color
      code: '<div className="a &amp; bg-[#fff]" />;',
      options: [{ tokens: { '#ffffff': 'paper' } }],
      output: '<div className="a &amp; bg-paper" />;',
      errors: [
        {
          messageId: 'useDesignToken',
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'paper' },
              output: '<div className="a &amp; bg-paper" />;',
            },
          ],
        },
      ],
    },
    {
      // two arbitrary values in one string -> both fixed in a single pass,
      // each suggestion touches only its own color
      code: 'const c = "bg-[#fff] text-[#0a0a0a]";',
      options: [{ tokens: { '#ffffff': 'paper', '#0a0a0a': 'ink' } }],
      output: 'const c = "bg-paper text-ink";',
      errors: [
        {
          messageId: 'useDesignToken',
          data: { color: '#fff', token: 'paper' },
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'paper' },
              output: 'const c = "bg-paper text-[#0a0a0a]";',
            },
          ],
        },
        {
          messageId: 'useDesignToken',
          data: { color: '#0a0a0a', token: 'ink' },
          suggestions: [
            {
              messageId: 'replaceWithToken',
              data: { token: 'ink' },
              output: 'const c = "bg-[#fff] text-ink";',
            },
          ],
        },
      ],
    },
    {
      // Tailwind arbitrary value carries a hardcoded hex
      code: 'const c = "bg-[#fff]";',
      errors: [{ messageId: 'noHardcodedColor', data: { color: '#fff' } }],
    },
    {
      // rgb() function literal
      code: 'const c = "rgb(10 10 10)";',
      errors: [{ messageId: 'noHardcodedColor', data: { color: 'rgb(10 10 10)' } }],
    },
    {
      // multiple colors in one string -> one report each
      code: 'const c = "bg-[#0a0a0a] text-[#ffffff]";',
      errors: [
        { messageId: 'noHardcodedColor', data: { color: '#0a0a0a' } },
        { messageId: 'noHardcodedColor', data: { color: '#ffffff' } },
      ],
    },
    {
      // hex later in a CSS declaration value
      code: 'const c = `border: 1px solid #fff; box-shadow: 0 0 2px #000;`;',
      errors: [
        { messageId: 'noHardcodedColor', data: { color: '#fff' } },
        { messageId: 'noHardcodedColor', data: { color: '#000' } },
      ],
    },
    {
      // hex deeper inside an arbitrary value
      code: 'const c = "shadow-[0_0_2px_#000] bg-[linear-gradient(#fff,#000)]";',
      errors: [
        { messageId: 'noHardcodedColor', data: { color: '#000' } },
        { messageId: 'noHardcodedColor', data: { color: '#fff' } },
        { messageId: 'noHardcodedColor', data: { color: '#000' } },
      ],
    },
    {
      // whole-string hex in a non-href JSX attribute
      code: '<path fill="#000" />;',
      errors: [{ messageId: 'noHardcodedColor', data: { color: '#000' } }],
    },
    {
      // template literal quasi
      code: 'const c = `color: #0a0a0a; ${x}`;',
      errors: [{ messageId: 'noHardcodedColor' }],
    },
    {
      // CSS-in-JS / inline style object value in JSX
      code: '<div style={{ color: "#0a0a0a" }} />;',
      errors: [{ messageId: 'noHardcodedColor' }],
    },
    {
      // allow that does not match -> still reported
      code: 'const c = "#0a0a0a";',
      options: [{ allow: ['#ffffff'] }],
      errors: [{ messageId: 'noHardcodedColor' }],
    },
  ],
});
