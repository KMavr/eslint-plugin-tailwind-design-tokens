import { RuleTester } from 'eslint';
import { describe, it } from 'vitest';
import rule from '../../src/rules/no-default-palette';

/**
 * Spec for src/rules/no-default-palette.ts
 *
 * Reports use of default Tailwind palette color classes (text-red-500,
 * bg-gray-100, ...) so teams stick to design-system tokens. Detection is
 * delegated to isDefaultPaletteClass from ../lib/tailwind.
 *
 * Surface: string Literals and TemplateLiteral quasis (covers className="...",
 * const x = "...", and JSX). Each whitespace-separated class token is checked.
 *
 * Message id: `noDefaultPalette`, with data { className, color }.
 * Options: [{ allow?: string[] }] — class tokens or color parts to ignore
 *   (e.g. "red-500" or "text-red-500") during a migration.
 */

// Wire ESLint's RuleTester into Vitest's lifecycle.
RuleTester.describe = describe;
RuleTester.it = it;

const ruleTester = new RuleTester({
  languageOptions: {
    ecmaVersion: 2022,
    sourceType: 'module',
    parserOptions: { ecmaFeatures: { jsx: true } },
  },
});

ruleTester.run('no-default-palette', rule, {
  valid: [
    // no color utilities at all
    'const c = "flex items-center gap-2";',
    // design-system tokens, not the default palette
    'const c = "text-primary bg-soft-green";',
    // white/black have no numeric shade -> not flagged
    'const c = "bg-white text-black";',
    // arbitrary values are the other rule's concern
    'const c = "bg-[#fff] text-[var(--color-ink)]";',
    // explicitly allowed by color part
    { code: 'const c = "text-red-500";', options: [{ allow: ['red-500'] }] },
    // explicitly allowed by full class token
    { code: 'const c = "bg-gray-100";', options: [{ allow: ['bg-gray-100'] }] },
    // JSX with only safe classes
    '<div className="flex text-primary" />;',
  ],
  invalid: [
    {
      code: 'const c = "text-red-500";',
      errors: [
        { messageId: 'noDefaultPalette', data: { className: 'text-red-500', color: 'red-500' } },
      ],
    },
    {
      // two offenders in one string -> two reports
      code: 'const c = "bg-gray-100 border-blue-700";',
      errors: [{ messageId: 'noDefaultPalette' }, { messageId: 'noDefaultPalette' }],
    },
    {
      // newly covered prefixes are flagged end-to-end
      code: 'const c = "ring-offset-blue-600 border-x-red-500";',
      errors: [
        {
          messageId: 'noDefaultPalette',
          data: { className: 'ring-offset-blue-600', color: 'blue-600' },
        },
        {
          messageId: 'noDefaultPalette',
          data: { className: 'border-x-red-500', color: 'red-500' },
        },
      ],
    },
    {
      // template literal quasi
      code: 'const c = `bg-red-500 ${x}`;',
      errors: [{ messageId: 'noDefaultPalette' }],
    },
    {
      // JSX className attribute
      code: '<div className="text-red-500" />;',
      errors: [{ messageId: 'noDefaultPalette' }],
    },
    {
      // important modifier still resolves to the palette color
      code: 'const c = "text-red-500!";',
      errors: [
        { messageId: 'noDefaultPalette', data: { className: 'text-red-500!', color: 'red-500' } },
      ],
    },
    {
      // allow list that does not match -> still reported
      code: 'const c = "text-red-500";',
      options: [{ allow: ['blue-500'] }],
      errors: [{ messageId: 'noDefaultPalette' }],
    },
  ],
});
