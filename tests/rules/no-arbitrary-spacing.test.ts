import { RuleTester } from 'eslint';
import { afterAll, describe, it } from 'vitest';
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import rule from '../../src/rules/no-arbitrary-spacing';

/**
 * Spec for src/rules/no-arbitrary-spacing.ts
 *
 * Reports arbitrary spacing/sizing values (p-[16px], mt-[1.5rem], w-[37px]...)
 * and offers the on-scale class instead. Tailwind v4 only: the scale base is
 * `--spacing` (default 0.25rem) and named tokens are `--spacing-*`, both read
 * from `cssFile`.
 *
 * Surface: string Literals and TemplateLiteral quasis, split on whitespace.
 *
 * Candidates for a class are the scale step (when the value is a multiple of
 * `stepIncrement` base steps) plus every named token with the same px value.
 *   - 0 candidates: `offScale`, no fix
 *   - 1 candidate:  `useScale` with an autofix
 *   - 2+ candidates: `useScale` with one suggestion per candidate, no autofix
 *
 * Exempt (not reported): non-px/rem values (calc, var, %, viewport units, 0),
 * allowed classes, arbitrary values on non-spacing utilities, and negatives on
 * utilities without negative values (padding, gap, sizing).
 *
 * Options: [{ cssFile?, allow?, rootFontSize? = 16, stepIncrement? = 0.25 }].
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

const dir = mkdtempSync(join(tmpdir(), 'tdt-spacing-rule-'));
afterAll(() => rmSync(dir, { recursive: true, force: true }));

const writeCss = (name: string, contents: string) => {
  const file = join(dir, name);
  writeFileSync(file, contents, 'utf-8');
  return file;
};

const namedCss = writeCss('named.css', `@theme { --spacing-card: 24px; --spacing-section: 2rem; }`);
const noScaleCss = writeCss(
  'no-scale.css',
  `@theme { --spacing: initial; --spacing-card: 24px; --spacing-section: 2rem; }`,
);
const wideBaseCss = writeCss('wide-base.css', `@theme { --spacing: 8px; }`);

ruleTester.run('no-arbitrary-spacing', rule, {
  valid: [
    // on-scale classes
    'const c = "p-4 mt-6 w-full gap-x-2";',
    // exempt values
    'const c = "w-[calc(100%-1rem)] h-[50vh] p-[var(--gap)] m-[0] w-[50%]";',
    // arbitrary values on non-spacing utilities
    'const c = "bg-[#fff] text-[14px] rounded-[6px]";',
    // allowed by exact class
    { code: 'const c = "w-[37px]";', options: [{ allow: ['w-[37px]'] }] },
    // allowed by regex
    { code: 'const c = "h-[13px] h-[37.5px]";', options: [{ allow: ['/^h-\\[/'] }] },
    // JSX with only on-scale classes
    '<div className="flex p-4" />;',
    // negatives on utilities Tailwind has no negative values for are not touched
    'const c = "-p-[4px] px-[-4px] -gap-[8px] w-[-4px]";',
  ],
  invalid: [
    {
      code: 'const c = "p-[16px]";',
      output: 'const c = "p-4";',
      errors: [{ messageId: 'useScale', data: { className: 'p-[16px]', suggestion: 'p-4' } }],
    },
    {
      // rem converts through the default root font size
      code: 'const c = "mt-[1.5rem]";',
      output: 'const c = "mt-6";',
      errors: [{ messageId: 'useScale', data: { className: 'mt-[1.5rem]', suggestion: 'mt-6' } }],
    },
    {
      // only the offending class changes
      code: 'const c = "flex p-[16px] text-primary";',
      output: 'const c = "flex p-4 text-primary";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // variants and a trailing important marker are kept
      code: 'const c = "md:hover:p-[16px]!";',
      output: 'const c = "md:hover:p-4!";',
      errors: [
        {
          messageId: 'useScale',
          data: { className: 'md:hover:p-[16px]!', suggestion: 'md:hover:p-4!' },
        },
      ],
    },
    {
      // a leading important marker is kept
      code: 'const c = "!px-[8px]";',
      output: 'const c = "!px-2";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      code: 'const c = "-m-[4px]";',
      output: 'const c = "-m-1";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // a negative value inside the brackets moves to the front
      code: 'const c = "m-[-4px]";',
      output: 'const c = "-m-1";',
      errors: [{ messageId: 'useScale', data: { className: 'm-[-4px]', suggestion: '-m-1' } }],
    },
    {
      code: 'const c = "min-w-[2px]";',
      output: 'const c = "min-w-0.5";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      code: 'const c = "inset-x-[12px]";',
      output: 'const c = "inset-x-3";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      code: 'const c = "space-y-[20px]";',
      output: 'const c = "space-y-5";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // quarter steps are on the scale by default
      code: 'const c = "w-[37px]";',
      output: 'const c = "w-9.25";',
      errors: [{ messageId: 'useScale', data: { className: 'w-[37px]', suggestion: 'w-9.25' } }],
    },
    {
      // stepIncrement: 1 rejects the quarter step
      code: 'const c = "w-[37px]";',
      options: [{ stepIncrement: 1 }],
      output: null,
      errors: [{ messageId: 'offScale', data: { className: 'w-[37px]' } }],
    },
    {
      // stepIncrement: 0.5 accepts half steps
      code: 'const c = "w-[6px]";',
      options: [{ stepIncrement: 0.5 }],
      output: 'const c = "w-1.5";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      code: 'const c = "w-[37.5px]";',
      output: null,
      errors: [{ messageId: 'offScale', data: { className: 'w-[37.5px]' } }],
    },
    {
      // the rem base scales with rootFontSize too: 1rem is p-4 at any root size
      code: 'const c = "p-[1rem]";',
      options: [{ rootFontSize: 10 }],
      output: 'const c = "p-4";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // at a 10px root the base is 2.5px, so 10px is p-4
      code: 'const c = "p-[10px]";',
      options: [{ rootFontSize: 10 }],
      output: 'const c = "p-4";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // ...and 16px (6.4 steps) is off the scale
      code: 'const c = "p-[16px]";',
      options: [{ rootFontSize: 10 }],
      output: null,
      errors: [{ messageId: 'offScale', data: { className: 'p-[16px]' } }],
    },
    {
      // --spacing from cssFile sets the base
      code: 'const c = "p-[16px]";',
      options: [{ cssFile: wideBaseCss }],
      output: 'const c = "p-2";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // a scale step and a named token both match -> suggestions, no autofix
      code: 'const c = "p-[24px]";',
      options: [{ cssFile: namedCss }],
      output: null,
      errors: [
        {
          messageId: 'useScale',
          data: { className: 'p-[24px]', suggestion: 'p-6' },
          suggestions: [
            {
              messageId: 'useScale',
              data: { className: 'p-[24px]', suggestion: 'p-6' },
              output: 'const c = "p-6";',
            },
            {
              messageId: 'useScale',
              data: { className: 'p-[24px]', suggestion: 'p-card' },
              output: 'const c = "p-card";',
            },
          ],
        },
      ],
    },
    {
      // --spacing: initial disables the scale, so only the named token is left
      code: 'const c = "p-[24px]";',
      options: [{ cssFile: noScaleCss }],
      output: 'const c = "p-card";',
      errors: [{ messageId: 'useScale', data: { className: 'p-[24px]', suggestion: 'p-card' } }],
    },
    {
      // named rem tokens match px values
      code: 'const c = "gap-[32px]";',
      options: [{ cssFile: noScaleCss }],
      output: 'const c = "gap-section";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // no scale and no matching token -> report without a fix
      code: 'const c = "p-[16px]";',
      options: [{ cssFile: noScaleCss }],
      output: null,
      errors: [{ messageId: 'offScale' }],
    },
    {
      // each occurrence is reported and fixed on its own range, in one pass
      code: 'const c = "p-[16px] md:p-[16px]";',
      output: 'const c = "p-4 md:p-4";',
      errors: [{ messageId: 'useScale' }, { messageId: 'useScale' }],
    },
    {
      // #65: fixing p-[4px] must not rewrite an allowed variant of it
      code: 'const c = "p-[4px] md:p-[4px]";',
      options: [{ allow: ['md:p-[4px]'] }],
      output: 'const c = "p-1 md:p-[4px]";',
      errors: [{ messageId: 'useScale', data: { className: 'p-[4px]', suggestion: 'p-1' } }],
    },
    {
      // #65: an uncovered utility containing the class as a substring is untouched
      code: 'const c = "p-[4px] scroll-p-[4px] scroll-mt-[4px]";',
      output: 'const c = "p-1 scroll-p-[4px] scroll-mt-[4px]";',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // #65: each suggestion rewrites only its own class
      code: 'const c = "p-[24px] md:p-[24px]";',
      options: [{ cssFile: namedCss }],
      output: null,
      errors: [
        {
          messageId: 'useScale',
          data: { className: 'p-[24px]', suggestion: 'p-6' },
          suggestions: [
            {
              messageId: 'useScale',
              data: { className: 'p-[24px]', suggestion: 'p-6' },
              output: 'const c = "p-6 md:p-[24px]";',
            },
            {
              messageId: 'useScale',
              data: { className: 'p-[24px]', suggestion: 'p-card' },
              output: 'const c = "p-card md:p-[24px]";',
            },
          ],
        },
        {
          messageId: 'useScale',
          data: { className: 'md:p-[24px]', suggestion: 'md:p-6' },
          suggestions: [
            {
              messageId: 'useScale',
              data: { className: 'md:p-[24px]', suggestion: 'md:p-6' },
              output: 'const c = "p-[24px] md:p-6";',
            },
            {
              messageId: 'useScale',
              data: { className: 'md:p-[24px]', suggestion: 'md:p-card' },
              output: 'const c = "p-[24px] md:p-card";',
            },
          ],
        },
      ],
    },
    {
      // #65: fixes don't overlap, so more than 10 classes are fixed in a single pass
      code: 'const c = "p-[4px] px-[8px] py-[12px] pt-[16px] pr-[20px] pb-[24px] pl-[28px] m-[4px] mx-[8px] my-[12px] mt-[16px]";',
      output: 'const c = "p-1 px-2 py-3 pt-4 pr-5 pb-6 pl-7 m-1 mx-2 my-3 mt-4";',
      errors: Array(11).fill({ messageId: 'useScale' }),
    },
    {
      // raw offsets: a two-char escape before the class must not shift the fix
      code: String.raw`const c = "a\\b p-[16px]";`,
      output: String.raw`const c = "a\\b p-4";`,
      errors: [{ messageId: 'useScale' }],
    },
    {
      // raw offsets: an escaped tab separates classes
      code: String.raw`const c = "flex\tp-[16px]";`,
      output: String.raw`const c = "flex\tp-4";`,
      errors: [{ messageId: 'useScale', data: { className: 'p-[16px]', suggestion: 'p-4' } }],
    },
    {
      // raw offsets: a JSX entity before the class
      code: '<div className="a &amp; p-[16px]" />;',
      output: '<div className="a &amp; p-4" />;',
      errors: [{ messageId: 'useScale' }],
    },
    {
      // raw offsets: a class in a later quasi is fixed at that quasi's offset
      code: 'const c = `${x} p-[16px]`;',
      output: 'const c = `${x} p-4`;',
      errors: [{ messageId: 'useScale' }],
    },
    {
      code: 'const c = `p-[16px] ${x}`;',
      output: 'const c = `p-4 ${x}`;',
      errors: [{ messageId: 'useScale' }],
    },
    {
      code: '<div className="flex p-[16px]" />;',
      output: '<div className="flex p-4" />;',
      errors: [{ messageId: 'useScale' }],
    },
  ],
});
