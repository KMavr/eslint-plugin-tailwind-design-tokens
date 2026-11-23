import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import fs, { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { tmpdir } from 'node:os';
import { loadColorTokens } from '../../src/lib/tokens';

/**
 * Spec for src/lib/tokens.ts — CSS @theme + inline tokens.
 *
 * loadColorTokens(options, cwd?): build a lookup of design-system colors so a rule
 *   can turn a detected color into a token name. Returns a plain object keyed by
 *   the NORMALIZED color value -> token name, e.g. { '#0a0a0a': 'ink' }.
 *
 *   Sources (merged; later source wins on conflict): cssFile -> inline tokens.
 *
 *   - cssFile (Tailwind v4): read the file, find every `@theme { ... }` block
 *       (including modifiers like `@theme inline`/`@theme static`; later blocks
 *       win), and extract every `--color-<name>: <value>;`. The token name is `<name>`
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

const writeConfig = (contents: string) => {
  writeFileSync(join(dir, 'tailwind.config.js'), contents, 'utf-8');
};

describe('tokens', () => {
  describe('loadColorTokens — inline', () => {
    it('should normalize inline token keys', () => {
      expect(loadColorTokens({ tokens: { '#FFF': 'paper', '#0A0A0A': 'ink' } })).toEqual({
        '#ffffff': 'paper',
        '#0a0a0a': 'ink',
      });
    });

    it('should return an empty object when no sources are given', () => {
      expect(loadColorTokens({})).toEqual({});
    });
  });

  describe('loadColorTokens — cssFile (@theme)', () => {
    it('should extract --color-* declarations as normalized-color -> name', () => {
      writeCss(`@theme {
      --color-ink: #0A0A0A;
      --color-paper: #ffffff;
      --color-soft-green: #aef5c8;
    }`);
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({
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
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({
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
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({ '#0a0a0a': 'ink' });
    });

    it('should read an @theme inline block', () => {
      writeCss(`@theme inline {
      --color-ink: #0a0a0a;
    }`);
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({ '#0a0a0a': 'ink' });
    });

    it('should read an @theme static block', () => {
      writeCss(`@theme static {
      --color-paper: #ffffff;
    }`);
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({ '#ffffff': 'paper' });
    });

    it('should merge colors from every @theme block in the file', () => {
      writeCss(`@theme {
      --color-ink: #0a0a0a;
    }
    :root { --background: #fafafa; }
    @theme inline {
      --color-surface: var(--background);
      --color-brand: #aabbcc;
    }
    @theme static {
      --color-paper: #ffffff;
    }`);
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({
        '#0a0a0a': 'ink',
        '#aabbcc': 'brand',
        '#ffffff': 'paper',
      });
    });

    it('should let a later @theme block win when two tokens share a color', () => {
      writeCss(`@theme {
      --color-ink: #0a0a0a;
    }
    @theme {
      --color-text: #0a0a0a;
    }`);
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({ '#0a0a0a': 'text' });
    });

    it('should not treat similarly named at-rules as @theme', () => {
      writeCss(`@theme-like {
      --color-ink: #0a0a0a;
    }`);
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({});
    });

    it('should return {} when there is no @theme block', () => {
      writeCss(`:root { --color-ink: #0a0a0a; }`);
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({});
    });

    it('should fail soft (return {}) when the file does not exist', () => {
      expect(() => loadColorTokens({ cssFile: 'does-not-exist.css' }, dir)).not.toThrow();
      expect(loadColorTokens({ cssFile: 'does-not-exist.css' }, dir)).toEqual({});
    });
  });

  describe('loadColorTokens — configFile (tailwind v3)', () => {
    it('should flatten nested theme colors to normalized-color -> name', () => {
      writeConfig(`module.exports = {
        theme: {
          extend: {
            colors: {
              ink: '#0A0A0A',
              brand: { 500: '#aabbcc', DEFAULT: '#111111' },
            },
          },
        },
      };`);
      expect(loadColorTokens({ configFile: 'tailwind.config.js' }, dir)).toEqual({
        '#0a0a0a': 'ink',
        '#aabbcc': 'brand-500',
        '#111111': 'brand',
      });
    });

    it('should read colors defined directly under theme', () => {
      writeConfig(`module.exports = { theme: { colors: { paper: '#ffffff' } } };`);
      expect(loadColorTokens({ configFile: 'tailwind.config.js' }, dir)).toEqual({
        '#ffffff': 'paper',
      });
    });

    it('should ignore non-color values (functions, css var refs)', () => {
      writeConfig(`module.exports = {
        theme: { extend: { colors: {
          ink: '#0a0a0a',
          dynamic: ({ opacityValue }) => 'rgba(0,0,0,' + opacityValue + ')',
          ref: 'var(--whatever)',
        } } },
      };`);
      expect(loadColorTokens({ configFile: 'tailwind.config.js' }, dir)).toEqual({
        '#0a0a0a': 'ink',
      });
    });

    it('should fail soft (return {}) when the config does not exist', () => {
      expect(() => loadColorTokens({ configFile: 'nope.config.js' }, dir)).not.toThrow();
      expect(loadColorTokens({ configFile: 'nope.config.js' }, dir)).toEqual({});
    });
  });

  describe('loadColorTokens — merge / precedence', () => {
    it('should merge css and inline, with inline winning on conflict', () => {
      writeCss(`@theme {
      --color-ink: #0a0a0a;
      --color-paper: #ffffff;
    }`);
      expect(
        loadColorTokens({ cssFile: 'globals.css', tokens: { '#0a0a0a': 'ink-override' } }, dir),
      ).toEqual({
        '#0a0a0a': 'ink-override',
        '#ffffff': 'paper',
      });
    });

    it('should apply precedence css < config < inline for the same color', () => {
      writeCss(`@theme { --color-x: #0a0a0a; }`);
      writeConfig(`module.exports = { theme: { colors: { y: '#0a0a0a' } } };`);
      expect(
        loadColorTokens(
          { cssFile: 'globals.css', configFile: 'tailwind.config.js', tokens: { '#0A0A0A': 'z' } },
          dir,
        ),
      ).toEqual({ '#0a0a0a': 'z' });
    });
  });

  describe('loadColorTokens — caching', () => {
    it('should not re-read an unchanged cssFile on repeated calls', () => {
      writeCss(`@theme { --color-ink: #0a0a0a; }`);
      const spy = vi.spyOn(fs, 'readFileSync');
      loadColorTokens({ cssFile: 'globals.css' }, dir);
      loadColorTokens({ cssFile: 'globals.css' }, dir);
      const reads = spy.mock.calls.filter(([p]) => String(p).endsWith('globals.css'));
      expect(reads).toHaveLength(1);
      spy.mockRestore();
    });

    it('should re-read and refresh when the cssFile changes (mtime)', () => {
      const file = join(dir, 'globals.css');
      writeCss(`@theme { --color-ink: #0a0a0a; }`);
      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({ '#0a0a0a': 'ink' });

      writeFileSync(file, `@theme { --color-ink: #ffffff; }`, 'utf-8');
      const future = new Date(Date.now() + 2000);
      fs.utimesSync(file, future, future);

      expect(loadColorTokens({ cssFile: 'globals.css' }, dir)).toEqual({ '#ffffff': 'ink' });
    });
  });
});
