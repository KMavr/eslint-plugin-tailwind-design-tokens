import { Linter, type Rule } from 'eslint';
import { describe, it, expect } from 'vitest';
import noHardcodedColors from '../../src/rules/no-hardcoded-colors';
import noDefaultPalette from '../../src/rules/no-default-palette';
import noArbitrarySpacing from '../../src/rules/no-arbitrary-spacing';

/**
 * Schema-validation spec for every rule.
 *
 * Each rule declares an options `schema` with `additionalProperties: false`.
 * ESLint validates rule options against that schema and throws synchronously
 * ("Configuration for rule ... is invalid") when they don't match.
 *
 * We use the Linter API rather than RuleTester here: RuleTester is wired into
 * Vitest's deferred `it()` in the other specs, so its schema errors fire inside
 * a later callback, not synchronously — `expect(() => ...).toThrow()` would miss
 * them. `linter.verify()` throws inline, so it's the right tool for this.
 */

const linter = new Linter();

// Lint trivial code with the given rule + options; throws if options are invalid.
const lintWith = (ruleId: string, rule: Rule.RuleModule, options: unknown) =>
  linter.verify('const c = "x";', {
    plugins: { t: { rules: { [ruleId]: rule } } },
    rules: { [`t/${ruleId}`]: ['error', options] as Linter.RuleEntry },
  });

describe('rules schema', () => {
  describe('no-hardcoded-colors options schema', () => {
    it('should accept a fully valid options object', () => {
      expect(() =>
        lintWith('no-hardcoded-colors', noHardcodedColors, {
          cssFile: './globals.css',
          configFile: './tailwind.config.js',
          tokens: { '#0a0a0a': 'ink' },
          allow: ['transparent', '/^rgb\\(/'],
        }),
      ).not.toThrow();
    });

    it('should reject an unknown property (additionalProperties: false)', () => {
      expect(() => lintWith('no-hardcoded-colors', noHardcodedColors, { foo: true })).toThrow();
    });

    it('should reject a non-string cssFile', () => {
      expect(() => lintWith('no-hardcoded-colors', noHardcodedColors, { cssFile: 123 })).toThrow();
    });

    it('should reject a non-object tokens map', () => {
      expect(() =>
        lintWith('no-hardcoded-colors', noHardcodedColors, { tokens: 'nope' }),
      ).toThrow();
    });

    it('should reject non-string token values', () => {
      expect(() =>
        lintWith('no-hardcoded-colors', noHardcodedColors, { tokens: { '#fff': 1 } }),
      ).toThrow();
    });

    it('should reject a non-array allow', () => {
      expect(() => lintWith('no-hardcoded-colors', noHardcodedColors, { allow: 'red' })).toThrow();
    });

    it('should reject non-string allow entries', () => {
      expect(() => lintWith('no-hardcoded-colors', noHardcodedColors, { allow: [1, 2] })).toThrow();
    });
  });

  describe('no-default-palette options schema', () => {
    it('should accept a valid allow array', () => {
      expect(() =>
        lintWith('no-default-palette', noDefaultPalette, { allow: ['red-500', '/^blue-/'] }),
      ).not.toThrow();
    });

    it('should reject an unknown property (additionalProperties: false)', () => {
      expect(() => lintWith('no-default-palette', noDefaultPalette, { foo: 1 })).toThrow();
    });

    it('should reject a non-array allow', () => {
      expect(() =>
        lintWith('no-default-palette', noDefaultPalette, { allow: 'red-500' }),
      ).toThrow();
    });

    it('should reject non-string allow entries', () => {
      expect(() => lintWith('no-default-palette', noDefaultPalette, { allow: [42] })).toThrow();
    });
  });

  describe('no-arbitrary-spacing options schema', () => {
    const lint = (options: unknown) =>
      lintWith('no-arbitrary-spacing', noArbitrarySpacing, options);

    it('should accept a fully valid options object', () => {
      expect(() =>
        lint({
          cssFile: './globals.css',
          allow: ['w-[37px]', '/^h-\\[/'],
          rootFontSize: 10,
          stepIncrement: 0.5,
        }),
      ).not.toThrow();
    });

    it('should accept empty options', () => {
      expect(() => lint({})).not.toThrow();
    });

    it('should accept every supported stepIncrement', () => {
      [0.25, 0.5, 1].forEach((stepIncrement) => {
        expect(() => lint({ stepIncrement })).not.toThrow();
      });
    });

    it('should reject configFile because the rule is Tailwind v4 only', () => {
      expect(() => lint({ configFile: './tailwind.config.js' })).toThrow();
    });

    it('should reject an unknown property (additionalProperties: false)', () => {
      expect(() => lint({ foo: true })).toThrow();
    });

    it('should reject an unsupported stepIncrement', () => {
      expect(() => lint({ stepIncrement: 0.3 })).toThrow();
      expect(() => lint({ stepIncrement: '0.5' })).toThrow();
    });

    it('should reject a non-positive or non-number rootFontSize', () => {
      expect(() => lint({ rootFontSize: 0 })).toThrow();
      expect(() => lint({ rootFontSize: -16 })).toThrow();
      expect(() => lint({ rootFontSize: '16' })).toThrow();
    });

    it('should reject a non-string cssFile', () => {
      expect(() => lint({ cssFile: 123 })).toThrow();
    });

    it('should reject a non-array allow', () => {
      expect(() => lint({ allow: 'w-[37px]' })).toThrow();
    });

    it('should reject non-string allow entries', () => {
      expect(() => lint({ allow: [42] })).toThrow();
    });
  });
});
