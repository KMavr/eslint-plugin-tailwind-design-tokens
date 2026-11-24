import { describe, it, expect } from 'vitest';
import { parseArbitrarySpacing, toPx, toScaleStep } from '../../src/lib/spacing';

/**
 * Spec for src/lib/spacing.ts
 *
 * parseArbitrarySpacing(cls): split a single class token with an arbitrary
 *   spacing value into { prefix, negative, utility, value, suffix }, or null if
 *   it is not an arbitrary spacing class.
 *     - prefix: variants (split at the last `:`) plus a leading `!`
 *     - suffix: a trailing `!` (v4 important)
 *     - negative: `-m-[4px]` or `m-[-4px]`
 *   A fix can be rebuilt as `${prefix}${negative ? '-' : ''}${utility}-${step}${suffix}`.
 *
 * toPx(value, rootFontSize): convert a px/rem length to px, or null for anything
 *   else (calc, var, %, viewport units, unitless).
 *
 * toScaleStep(px, basePx, increment = 0.25): the scale step as a string when px
 *   is a multiple of `increment` base steps (0.25, 0.5 or 1), else null.
 */

describe('spacing', () => {
  describe('parseArbitrarySpacing', () => {
    it('should parse a bare arbitrary padding class', () => {
      expect(parseArbitrarySpacing('p-[16px]')).toEqual({
        prefix: '',
        negative: false,
        utility: 'p',
        value: '16px',
        suffix: '',
      });
    });

    it('should keep variants in the prefix', () => {
      expect(parseArbitrarySpacing('md:hover:mt-[1.5rem]')).toEqual({
        prefix: 'md:hover:',
        negative: false,
        utility: 'mt',
        value: '1.5rem',
        suffix: '',
      });
    });

    it('should handle arbitrary variants containing a colon', () => {
      expect(parseArbitrarySpacing('[&:hover]:p-[16px]')).toMatchObject({
        prefix: '[&:hover]:',
        utility: 'p',
        value: '16px',
      });
    });

    it('should keep a leading important marker in the prefix', () => {
      expect(parseArbitrarySpacing('md:!p-[4px]')).toMatchObject({
        prefix: 'md:!',
        utility: 'p',
        suffix: '',
      });
    });

    it('should keep a trailing important marker in the suffix', () => {
      expect(parseArbitrarySpacing('p-[4px]!')).toMatchObject({
        prefix: '',
        utility: 'p',
        value: '4px',
        suffix: '!',
      });
    });

    it('should detect a leading negative sign', () => {
      expect(parseArbitrarySpacing('-m-[4px]')).toMatchObject({
        negative: true,
        utility: 'm',
        value: '4px',
      });
    });

    it('should detect a negative value inside the brackets', () => {
      expect(parseArbitrarySpacing('m-[-4px]')).toMatchObject({
        negative: true,
        utility: 'm',
        value: '4px',
      });
    });

    it('should match the longest utility', () => {
      expect(parseArbitrarySpacing('min-w-[8px]')).toMatchObject({ utility: 'min-w' });
      expect(parseArbitrarySpacing('max-h-[8px]')).toMatchObject({ utility: 'max-h' });
      expect(parseArbitrarySpacing('inset-x-[2px]')).toMatchObject({ utility: 'inset-x' });
      expect(parseArbitrarySpacing('space-y-[8px]')).toMatchObject({ utility: 'space-y' });
      expect(parseArbitrarySpacing('gap-x-[8px]')).toMatchObject({ utility: 'gap-x' });
    });

    it('should parse sizing and position utilities', () => {
      ['w', 'h', 'size', 'top', 'right', 'bottom', 'left', 'start', 'end', 'inset'].forEach(
        (utility) => {
          expect(parseArbitrarySpacing(`${utility}-[8px]`)).toMatchObject({ utility });
        },
      );
    });

    it('should keep non-length values for toPx to exempt', () => {
      expect(parseArbitrarySpacing('w-[calc(100%-1rem)]')).toMatchObject({
        utility: 'w',
        value: 'calc(100%-1rem)',
      });
    });

    it('should return null for non-arbitrary classes', () => {
      expect(parseArbitrarySpacing('p-4')).toBeNull();
      expect(parseArbitrarySpacing('md:mt-6')).toBeNull();
    });

    it('should return null for arbitrary values on other utilities', () => {
      expect(parseArbitrarySpacing('bg-[#fff]')).toBeNull();
      expect(parseArbitrarySpacing('text-[14px]')).toBeNull();
      expect(parseArbitrarySpacing('rounded-[6px]')).toBeNull();
      expect(parseArbitrarySpacing('pointer-events-[none]')).toBeNull();
    });
  });

  describe('toPx', () => {
    it('should return px values as numbers', () => {
      expect(toPx('16px', 16)).toBe(16);
      expect(toPx('0.5px', 16)).toBe(0.5);
    });

    it('should convert rem using the root font size', () => {
      expect(toPx('1.5rem', 16)).toBe(24);
      expect(toPx('.25rem', 16)).toBe(4);
      expect(toPx('1.5rem', 10)).toBe(15);
    });

    it('should return null for exempt values', () => {
      ['50%', '10vh', '100dvw', 'calc(1px+1px)', 'var(--gap)', '0', '1em', 'auto'].forEach(
        (value) => {
          expect(toPx(value, 16)).toBeNull();
        },
      );
    });
  });

  describe('toScaleStep', () => {
    it('should return whole steps', () => {
      expect(toScaleStep(16, 4)).toBe('4');
      expect(toScaleStep(0, 4)).toBe('0');
    });

    it('should return quarter and half steps', () => {
      expect(toScaleStep(2, 4)).toBe('0.5');
      expect(toScaleStep(1, 4)).toBe('0.25');
      expect(toScaleStep(6, 4)).toBe('1.5');
    });

    it('should return null when off the scale', () => {
      expect(toScaleStep(37.5, 4)).toBeNull();
      expect(toScaleStep(0.5, 4)).toBeNull();
    });

    it('should tolerate floating-point error', () => {
      expect(toScaleStep(0.1 * 30, 4)).toBe('0.75');
      expect(toScaleStep(24, 8)).toBe('3');
    });

    it('should accept half steps but reject quarter steps with an increment of 0.5', () => {
      expect(toScaleStep(6, 4, 0.5)).toBe('1.5');
      expect(toScaleStep(16, 4, 0.5)).toBe('4');
      expect(toScaleStep(37, 4, 0.5)).toBeNull();
      expect(toScaleStep(1, 4, 0.5)).toBeNull();
    });

    it('should accept only whole steps with an increment of 1', () => {
      expect(toScaleStep(16, 4, 1)).toBe('4');
      expect(toScaleStep(6, 4, 1)).toBeNull();
      expect(toScaleStep(2, 4, 1)).toBeNull();
    });

    it('should default to quarter steps', () => {
      expect(toScaleStep(37, 4)).toBe('9.25');
      expect(toScaleStep(37, 4, 0.25)).toBe('9.25');
    });
  });
});
