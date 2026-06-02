import { describe, it, expect } from 'vitest';
import { isDefaultPaletteClass } from '../../src/lib/tailwind';

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
});
