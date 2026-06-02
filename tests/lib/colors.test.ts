import { describe, it, expect } from 'vitest';
import { normalizeColor, findColors } from '../../src/lib/colors';

/**
 * Spec for src/lib/colors.ts
 *
 * normalizeColor(raw): reduce a single color literal to a canonical string so
 *   that trivial spelling differences compare equal. Returns null if `raw` is
 *   not a recognised color.
 *
 *   - Hex is fully canonicalised (target format, used for token matching):
 *       lowercase, expand 3->6 and 4->8, drop a fully-opaque alpha (`ff`).
 *   - rgb/hsl/oklch get light normalisation only (lowercase the function name,
 *       turn `_` and `,` into spaces, collapse runs of whitespace). No
 *       cross-format conversion — detect/dedupe, not token-match.
 *
 * findColors(text): scan an arbitrary string and return every color literal it
 *   contains, each as { raw, normalized, index }. `raw` is the exact matched
 *   substring; `index` is its start offset in `text`.
 */

describe('colors', () => {
  describe('normalizeColor — hex', () => {
    it('should lowercase', () => {
      expect(normalizeColor('#AABBCC')).toBe('#aabbcc');
    });

    it('should expand 3-digit shorthand to 6', () => {
      expect(normalizeColor('#abc')).toBe('#aabbcc');
      expect(normalizeColor('#FFF')).toBe('#ffffff');
    });

    it('should expand 4-digit shorthand (rgba) to 8', () => {
      expect(normalizeColor('#abcd')).toBe('#aabbccdd');
    });

    it('should drop a fully-opaque alpha (ff) from 8-digit hex', () => {
      expect(normalizeColor('#aabbccff')).toBe('#aabbcc');
      expect(normalizeColor('#0A0A0AFF')).toBe('#0a0a0a');
    });

    it('should drop a fully-opaque alpha after expanding 4-digit shorthand', () => {
      expect(normalizeColor('#abcf')).toBe('#aabbcc');
    });

    it('should keep a partial alpha on 8-digit hex', () => {
      expect(normalizeColor('#aabbcc80')).toBe('#aabbcc80');
    });

    it('should reject invalid hex lengths', () => {
      expect(normalizeColor('#12')).toBeNull();
      expect(normalizeColor('#12345')).toBeNull();
      expect(normalizeColor('#1234567')).toBeNull();
    });

    it('should reject non-hex characters', () => {
      expect(normalizeColor('#gggggg')).toBeNull();
    });
  });

  describe('normalizeColor — rgb / hsl / oklch', () => {
    it('should lowercase the function name', () => {
      expect(normalizeColor('RGB(10 10 10)')).toBe('rgb(10 10 10)');
    });

    it('should turn commas into spaces and collapse whitespace', () => {
      expect(normalizeColor('rgb(10,  10,10)')).toBe('rgb(10 10 10)');
    });

    it('should turn Tailwind underscores into spaces', () => {
      expect(normalizeColor('rgb(255_0_0)')).toBe('rgb(255 0 0)');
    });

    it('should normalize rgba', () => {
      expect(normalizeColor('rgba(0, 0, 0, 0.5)')).toBe('rgba(0 0 0 0.5)');
    });

    it('should normalize hsl and hsla', () => {
      expect(normalizeColor('HSL(0, 0%, 4%)')).toBe('hsl(0 0% 4%)');
      expect(normalizeColor('hsla(0_0%_4%_/_0.5)')).toBe('hsla(0 0% 4% / 0.5)');
    });

    it('should normalize oklch', () => {
      expect(normalizeColor('OKLCH(0.2_0_0)')).toBe('oklch(0.2 0 0)');
    });
  });

  describe('normalizeColor — non-colors', () => {
    it('should return null for arbitrary text', () => {
      expect(normalizeColor('hello')).toBeNull();
      expect(normalizeColor('')).toBeNull();
      expect(normalizeColor('red')).toBeNull();
    });
  });

  describe('findColors', () => {
    it('should return [] when there are no colors', () => {
      expect(findColors('flex items-center gap-2')).toEqual([]);
    });

    it('should find a bare hex literal with its index', () => {
      const text = "color: '#0A0A0A'";
      expect(findColors(text)).toEqual([{ raw: '#0A0A0A', normalized: '#0a0a0a', index: 8 }]);
    });

    it('should find a hex inside a Tailwind arbitrary value', () => {
      const matches = findColors('bg-[#fff]');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({ raw: '#fff', normalized: '#ffffff', index: 4 });
    });

    it('should find rgb() inside a Tailwind arbitrary value (underscores)', () => {
      const matches = findColors('text-[rgb(255_0_0)]');
      expect(matches).toHaveLength(1);
      expect(matches[0]).toMatchObject({ raw: 'rgb(255_0_0)', normalized: 'rgb(255 0 0)' });
    });

    it('should find multiple colors across a className string', () => {
      const matches = findColors('bg-[#0a0a0a] text-[oklch(0.2_0_0)]');
      expect(matches.map((m) => m.normalized)).toEqual(['#0a0a0a', 'oklch(0.2 0 0)']);
    });

    it('should find hsl/oklch function literals', () => {
      expect(findColors('hsl(0 0% 4%)').map((m) => m.normalized)).toEqual(['hsl(0 0% 4%)']);
      expect(findColors('oklch(0.2 0 0)').map((m) => m.normalized)).toEqual(['oklch(0.2 0 0)']);
    });

    it('should not match hex-like substrings of longer alphanumeric runs', () => {
      expect(findColors('id-1234567-x')).toEqual([]);
      expect(findColors('#deadbeef12')).toEqual([]);
    });

    it('should preserve the raw substring exactly as written', () => {
      const [m] = findColors('border-[#ABCD]');
      expect(m.raw).toBe('#ABCD');
      expect(m.normalized).toBe('#aabbccdd');
    });
  });
});
