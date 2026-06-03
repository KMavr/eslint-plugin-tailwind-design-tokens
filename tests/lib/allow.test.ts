import { describe, it, expect } from 'vitest';
import { makeAllowMatcher } from '../../src/lib/allow';

/**
 * Spec for src/lib/allow.ts
 *
 * makeAllowMatcher(entries) builds a predicate (value) => boolean used by both
 * rules to whitelist colors/classes. Entries are matched two ways:
 *   - exact string  ("#0a0a0a", "text-red-500")  -> Set membership (back-compat)
 *   - /pattern/ or /pattern/flags                  -> compiled RegExp test
 *
 * The matcher is built once; regexes are compiled eagerly, so an invalid pattern
 * throws at build time (a config error the user should see, not swallow).
 */

describe('makeAllowMatcher', () => {
  it('should match nothing when there are no entries', () => {
    const isAllowed = makeAllowMatcher();
    expect(isAllowed('#0a0a0a')).toBe(false);
    expect(isAllowed('text-red-500')).toBe(false);
  });

  it('should match plain entries exactly (back-compat)', () => {
    const isAllowed = makeAllowMatcher(['#0a0a0a', 'text-red-500']);
    expect(isAllowed('#0a0a0a')).toBe(true);
    expect(isAllowed('text-red-500')).toBe(true);
    expect(isAllowed('#0a0a0b')).toBe(false);
    expect(isAllowed('text-red-501')).toBe(false);
  });

  it('should treat a /pattern/ entry as a regular expression', () => {
    const isAllowed = makeAllowMatcher(['/^rgb\\(/', '/-(red|rose)-/']);
    expect(isAllowed('rgb(10 10 10)')).toBe(true);
    expect(isAllowed('text-red-500')).toBe(true);
    expect(isAllowed('text-rose-700')).toBe(true);
    expect(isAllowed('text-blue-500')).toBe(false);
    expect(isAllowed('hsl(0 0% 0%)')).toBe(false);
  });

  it('should honor regex flags after the closing slash', () => {
    const isAllowed = makeAllowMatcher(['/RED/i']);
    expect(isAllowed('text-red-500')).toBe(true);
  });

  it('should mix exact and regex entries', () => {
    const isAllowed = makeAllowMatcher(['#ffffff', '/^#0a/']);
    expect(isAllowed('#ffffff')).toBe(true); // exact
    expect(isAllowed('#0a0a0a')).toBe(true); // regex
    expect(isAllowed('#123456')).toBe(false);
  });

  it('should treat empty // as a literal exact entry, not a regex', () => {
    const isAllowed = makeAllowMatcher(['//']);
    expect(isAllowed('//')).toBe(true);
    expect(isAllowed('anything')).toBe(false); // an empty regex would match everything
  });

  it('should treat a lone slash as an exact entry', () => {
    const isAllowed = makeAllowMatcher(['/']);
    expect(isAllowed('/')).toBe(true);
    expect(isAllowed('x')).toBe(false);
  });

  it('should throw at build time on an invalid regex pattern', () => {
    expect(() => makeAllowMatcher(['/(/'])).toThrow();
  });
});
