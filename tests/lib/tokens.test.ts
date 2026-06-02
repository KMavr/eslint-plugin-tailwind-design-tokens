import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadTokens } from '../../src/lib/tokens';

/**
 * Spec for src/lib/tokens.ts — CSS @theme + inline tokens.
 *
 * loadTokens(options, cwd?): build a lookup of design-system colors so a rule
 *   can turn a detected color into a token name. Returns a plain object keyed by
 *   the NORMALIZED color value -> token name, e.g. { '#0a0a0a': 'ink' }.
 *
 *   Sources (merged; later source wins on conflict): cssFile -> inline tokens.
 *
 *   - cssFile (Tailwind v4): read the file, find the `@theme { ... }` block, and
 *       extract every `--color-<name>: <value>;`. The token name is `<name>`
 *       (the `--color-` prefix removed). The value is run through normalizeColor;
 *       non-color values (and non-`--color-` vars) are ignored.
 *   - tokens (inline): a { color: name } map; keys are normalized before storing.
 *
 *   Resolution: a relative cssFile is resolved against `cwd` (defaults to
 *   process.cwd()). Fail-soft: a missing/unparseable file yields no tokens from
 *   that source and never throws.
 */

let dir: string;

beforeEach(() => {
  dir = mkdtempSync(join(tmpdir(), 'tdt-tokens-'));
});

afterEach(() => {
  rmSync(dir, { recursive: true, force: true });
});

const writeCss = (contents: string) => {
  writeFileSync(join(dir, 'globals.css'), contents, 'utf-8');
};

describe('tokens', () => {
  describe('loadTokens — inline', () => {
    it('should normalize inline token keys', () => {
      expect(loadTokens({ tokens: { '#FFF': 'paper', '#0A0A0A': 'ink' } })).toEqual({
        '#ffffff': 'paper',
        '#0a0a0a': 'ink',
      });
    });

    it('should return an empty object when no sources are given', () => {
      expect(loadTokens({})).toEqual({});
    });
  });

  describe('loadTokens — cssFile (@theme)', () => {
    it('should extract --color-* declarations as normalized-color -> name', () => {
      writeCss(`@theme {
      --color-ink: #0A0A0A;
      --color-paper: #ffffff;
      --color-soft-green: #aef5c8;
    }`);
      expect(loadTokens({ cssFile: 'globals.css' }, dir)).toEqual({
        '#0a0a0a': 'ink',
        '#ffffff': 'paper',
        '#aef5c8': 'soft-green',
      });
    });

    it('should support rgb/hsl/oklch token values', () => {
      writeCss(`@theme {
      --color-brand: oklch(0.7 0.1 200);
      --color-muted: rgb(10 10 10);
    }`);
      expect(loadTokens({ cssFile: 'globals.css' }, dir)).toEqual({
        'oklch(0.7 0.1 200)': 'brand',
        'rgb(10 10 10)': 'muted',
      });
    });

    it('should ignore non-color theme vars and non-color values', () => {
      writeCss(`@theme {
      --color-ink: #0a0a0a;
      --spacing-4: 1rem;
      --color-bogus: not-a-color;
    }`);
      expect(loadTokens({ cssFile: 'globals.css' }, dir)).toEqual({ '#0a0a0a': 'ink' });
    });

    it('should return {} when there is no @theme block', () => {
      writeCss(`:root { --color-ink: #0a0a0a; }`);
      expect(loadTokens({ cssFile: 'globals.css' }, dir)).toEqual({});
    });

    it('should fail soft (return {}) when the file does not exist', () => {
      expect(() => loadTokens({ cssFile: 'does-not-exist.css' }, dir)).not.toThrow();
      expect(loadTokens({ cssFile: 'does-not-exist.css' }, dir)).toEqual({});
    });
  });

  describe('loadTokens — merge / precedence', () => {
    it('should merge css and inline, with inline winning on conflict', () => {
      writeCss(`@theme {
      --color-ink: #0a0a0a;
      --color-paper: #ffffff;
    }`);
      expect(
        loadTokens({ cssFile: 'globals.css', tokens: { '#0a0a0a': 'ink-override' } }, dir),
      ).toEqual({
        '#0a0a0a': 'ink-override',
        '#ffffff': 'paper',
      });
    });
  });
});
