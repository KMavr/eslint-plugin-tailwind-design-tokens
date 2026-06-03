import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../../src/rules/no-hardcoded-colors';

/**
 * Spec for src/rules/no-hardcoded-colors.ts
 *
 * Reports hardcoded color literals (hex / rgb / hsl / oklch) found anywhere in a
 * string Literal or TemplateLiteral quasi — inline styles, CSS-in-JS, and
 * Tailwind arbitrary values like bg-[#fff]. Detection comes from findColors
 * (../lib/colors); the token lookup comes from loadTokens (../lib/tokens).
 *
 * For each detected color:
 *   - if its normalized value maps to a token  -> messageId `useDesignToken`,
 *       data { color: <raw>, token: <name> }, plus a `replaceWithToken`
 *       suggestion that rewrites the color in place (string Literals only)
 *   - otherwise                                -> messageId `noHardcodedColor`,
 *       data { color: <raw> }
 *
 * Suggestions are only offered on plain string Literals: the in-place range math
 * assumes a single opening quote, which does not hold for TemplateLiteral quasis.
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
  ],
  invalid: [
    {
      // bare hex, no token map -> plain hardcoded-color report
      code: 'const c = "#0a0a0a";',
      errors: [{ messageId: 'noHardcodedColor', data: { color: '#0a0a0a' } }],
    },
    {
      // hex that maps to a token -> suggest swapping in the token in place
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
      // Tailwind arbitrary value with a token match -> rewrite the whole
      // prefix-[#hex] to the utility form, dropping the brackets (bg-paper, not bg-[paper])
      code: 'const c = "bg-[#fff]";',
      options: [{ tokens: { '#ffffff': 'paper' } }],
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
      // template literal quasi with a token match -> reported, but NO suggestion
      // (quote-offset range math is unsafe for quasis)
      code: 'const c = `#0a0a0a`;',
      options: [{ tokens: { '#0a0a0a': 'ink' } }],
      errors: [
        {
          messageId: 'useDesignToken',
          data: { color: '#0a0a0a', token: 'ink' },
          suggestions: [],
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
      code: 'const c = "#0a0a0a #ffffff";',
      errors: [
        { messageId: 'noHardcodedColor', data: { color: '#0a0a0a' } },
        { messageId: 'noHardcodedColor', data: { color: '#ffffff' } },
      ],
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
