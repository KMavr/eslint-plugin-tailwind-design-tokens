import { describe, it, expect } from 'vitest';
import { isDefaultPaletteClass, splitClasses } from '../../src/lib/tailwind';

/**
 * Spec for src/lib/tailwind.ts
 *
 * isDefaultPaletteClass(className): given a single class token, return the
 *   default-palette color part it uses (e.g. "red-500"), or null if it is not a
 *   default Tailwind palette color utility.
 *
 *   A match requires:
 *     - a known color-affecting prefix (text-, bg-, border-, ring-, fill-, ...)
 *     - followed by a default palette family (slate, gray, red, blue, ...)
 *     - followed by a valid shade (50 | 100..900 | 950)
 *
 *   Cross-version / real-world modifiers it must tolerate (stripped before the
 *   family-shade check, not part of the returned value):
 *     - trailing important `!`  (Tailwind v4:  text-red-500!)
 *     - leading important `!`   (Tailwind v3:  !text-red-500)
 *     - opacity modifier `/<n>` (bg-red-500/50)
 *     - variant prefixes        (hover:, md:dark:, [&:hover]:)
 *
 *   Out of scope (return null): design-system classes (text-primary), arbitrary
 *   values (bg-[#fff] — handled by colors.ts), white/black (no shade), and any
 *   non-color utility.
 */

describe('isDefaultPaletteClass', () => {
  it('should flag a default palette utility and return the color part', () => {
    expect(isDefaultPaletteClass('text-red-500')).toBe('red-500');
  });

  it('should flag across the different color prefixes', () => {
    expect(isDefaultPaletteClass('bg-gray-100')).toBe('gray-100');
    expect(isDefaultPaletteClass('border-blue-700')).toBe('blue-700');
    expect(isDefaultPaletteClass('ring-emerald-50')).toBe('emerald-50');
    expect(isDefaultPaletteClass('fill-rose-950')).toBe('rose-950');
    expect(isDefaultPaletteClass('divide-zinc-300')).toBe('zinc-300');
  });

  it('should handle overlapping prefixes (border- vs border-l-)', () => {
    expect(isDefaultPaletteClass('border-gray-100')).toBe('gray-100');
    expect(isDefaultPaletteClass('border-l-blue-700')).toBe('blue-700');
    expect(isDefaultPaletteClass('border-r-blue-700')).toBe('blue-700');
    expect(isDefaultPaletteClass('border-t-blue-700')).toBe('blue-700');
    expect(isDefaultPaletteClass('border-b-blue-700')).toBe('blue-700');
  });

  it('should flag the axis/logical border prefixes (border-x/y/s/e-)', () => {
    expect(isDefaultPaletteClass('border-x-blue-700')).toBe('blue-700');
    expect(isDefaultPaletteClass('border-y-blue-700')).toBe('blue-700');
    expect(isDefaultPaletteClass('border-s-blue-700')).toBe('blue-700');
    expect(isDefaultPaletteClass('border-e-blue-700')).toBe('blue-700');
  });

  it('should flag the v4 shadow and inset-ring color utilities', () => {
    expect(isDefaultPaletteClass('inset-shadow-red-500')).toBe('red-500');
    expect(isDefaultPaletteClass('inset-ring-blue-200')).toBe('blue-200');
    expect(isDefaultPaletteClass('text-shadow-sky-300')).toBe('sky-300');
    expect(isDefaultPaletteClass('drop-shadow-indigo-500/50')).toBe('indigo-500');
  });

  it('should flag the block-logical border prefixes (border-bs/be-)', () => {
    expect(isDefaultPaletteClass('border-bs-blue-700')).toBe('blue-700');
    expect(isDefaultPaletteClass('border-be-blue-700')).toBe('blue-700');
  });

  it('should flag scrollbar color utilities', () => {
    expect(isDefaultPaletteClass('scrollbar-thumb-gray-400')).toBe('gray-400');
    expect(isDefaultPaletteClass('scrollbar-track-gray-100')).toBe('gray-100');
  });

  it('should flag mask gradient stop colors', () => {
    expect(isDefaultPaletteClass('mask-linear-from-red-500')).toBe('red-500');
    expect(isDefaultPaletteClass('mask-radial-to-blue-200')).toBe('blue-200');
    expect(isDefaultPaletteClass('mask-t-from-black')).toBeNull();
    expect(isDefaultPaletteClass('mask-b-to-zinc-900')).toBe('zinc-900');
  });

  it('should not flag mask stop positions', () => {
    ['mask-linear-from-50%', 'mask-t-from-20', 'mask-radial-to-80%'].forEach((className) => {
      expect(isDefaultPaletteClass(className)).toBeNull();
    });
  });

  it('should flag the v4.2 palette families', () => {
    expect(isDefaultPaletteClass('bg-mauve-100')).toBe('mauve-100');
    expect(isDefaultPaletteClass('text-olive-700')).toBe('olive-700');
    expect(isDefaultPaletteClass('border-mist-50')).toBe('mist-50');
    expect(isDefaultPaletteClass('fill-taupe-950')).toBe('taupe-950');
  });

  it('should not flag shadow size utilities', () => {
    ['inset-shadow-sm', 'text-shadow-lg', 'drop-shadow-xl', 'inset-ring-2'].forEach((className) => {
      expect(isDefaultPaletteClass(className)).toBeNull();
    });
  });

  it('should flag ring-offset color utilities', () => {
    expect(isDefaultPaletteClass('ring-offset-red-500')).toBe('red-500');
    expect(isDefaultPaletteClass('ring-offset-slate-50')).toBe('slate-50');
  });

  it('should not flag non-color uses of the new prefixes (widths/offsets)', () => {
    expect(isDefaultPaletteClass('ring-offset-2')).toBeNull();
    expect(isDefaultPaletteClass('border-x-4')).toBeNull();
    expect(isDefaultPaletteClass('border-y-0')).toBeNull();
  });

  it('should accept the shade boundaries (50, X00, 950)', () => {
    expect(isDefaultPaletteClass('text-slate-50')).toBe('slate-50');
    expect(isDefaultPaletteClass('text-slate-900')).toBe('slate-900');
    expect(isDefaultPaletteClass('text-slate-950')).toBe('slate-950');
  });

  it('should reject invalid shades', () => {
    expect(isDefaultPaletteClass('text-red-0')).toBeNull();
    expect(isDefaultPaletteClass('text-red-250')).toBeNull();
    expect(isDefaultPaletteClass('text-red-1000')).toBeNull();
    expect(isDefaultPaletteClass('text-red')).toBeNull(); // no shade
  });

  it('should return null for non-color utilities', () => {
    expect(isDefaultPaletteClass('flex')).toBeNull();
    expect(isDefaultPaletteClass('items-center')).toBeNull();
    expect(isDefaultPaletteClass('gap-2')).toBeNull();
  });

  it('should return null for design-system / non-default classes', () => {
    expect(isDefaultPaletteClass('text-primary')).toBeNull();
    expect(isDefaultPaletteClass('bg-soft-green')).toBeNull();
  });

  it('should not flag white/black (no numeric shade)', () => {
    expect(isDefaultPaletteClass('bg-white')).toBeNull();
    expect(isDefaultPaletteClass('text-black')).toBeNull();
  });

  it('should return null for arbitrary values (handled elsewhere)', () => {
    expect(isDefaultPaletteClass('bg-[#fff]')).toBeNull();
    expect(isDefaultPaletteClass('text-[var(--color-ink)]')).toBeNull();
  });

  it('should tolerate the trailing important modifier (v4)', () => {
    expect(isDefaultPaletteClass('text-red-500!')).toBe('red-500');
  });

  it('should tolerate the leading important modifier (v3)', () => {
    expect(isDefaultPaletteClass('!text-red-500')).toBe('red-500');
  });

  it('should tolerate an opacity modifier and exclude it from the result', () => {
    expect(isDefaultPaletteClass('bg-red-500/50')).toBe('red-500');
  });

  it('should flag classes with a variant prefix', () => {
    expect(isDefaultPaletteClass('hover:bg-red-500')).toBe('red-500');
    expect(isDefaultPaletteClass('group-hover:border-l-gray-200')).toBe('gray-200');
  });

  it('should flag classes with stacked variant prefixes', () => {
    expect(isDefaultPaletteClass('md:dark:text-blue-500')).toBe('blue-500');
  });

  it('should flag classes with an arbitrary variant containing a colon', () => {
    expect(isDefaultPaletteClass('[&:hover]:bg-red-500')).toBe('red-500');
  });

  it('should tolerate variants combined with important and opacity modifiers', () => {
    expect(isDefaultPaletteClass('hover:!bg-red-500')).toBe('red-500');
    expect(isDefaultPaletteClass('dark:bg-red-500/50')).toBe('red-500');
  });

  it('should return null for variant-prefixed non-palette classes', () => {
    expect(isDefaultPaletteClass('hover:bg-primary')).toBeNull();
    expect(isDefaultPaletteClass('md:flex')).toBeNull();
  });
});

describe('splitClasses', () => {
  const names = (text: string) => splitClasses(text).map(({ className }) => className);

  it('should split on whitespace and report each class index', () => {
    expect(splitClasses('  p-4 bg-red-500')).toEqual([
      { className: 'p-4', index: 2 },
      { className: 'bg-red-500', index: 6 },
    ]);
  });

  it('should treat escaped whitespace as a separator', () => {
    expect(names(String.raw`flex\tbg-red-500\np-4`)).toEqual(['flex', 'bg-red-500', 'p-4']);
  });

  it('should keep other escapes inside the class', () => {
    expect(names(String.raw`a\\b content-[\"x\"]`)).toEqual([
      String.raw`a\\b`,
      String.raw`content-[\"x\"]`,
    ]);
  });
});
