import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { normalizeColor } from './colors';

export interface ColorTokenOptions {
  cssFile?: string;
  configFile?: string;
  tokens?: Record<string, string>;
}

export interface SpacingTokens {
  base: string | null;
  named: Record<string, string>;
}

const THEME_REGEX = /@theme(?:\s+[\w-]+)*\s*\{([^}]+)\}/g;
const THEME_VAR_REGEX = /--([\w-]+)\s*:\s*([^;]+)/g;

const DEFAULT_SPACING = '0.25rem';

interface CacheEntry {
  mtimeMs: number;
  tokens: Record<string, string>;
}

const fileCache = new Map<string, CacheEntry>();

interface CacheRequest {
  kind: string;
  abs: string;
  compute: () => Record<string, string>;
}

const readThroughCache = ({ kind, abs, compute }: CacheRequest): Record<string, string> => {
  let mtimeMs: number;
  try {
    mtimeMs = fs.statSync(abs).mtimeMs;
  } catch {
    return {};
  }

  const key = `${kind}:${abs}`;
  const cached = fileCache.get(key);
  if (cached && cached.mtimeMs === mtimeMs) {
    return cached.tokens;
  }

  const tokens = safeCompute(compute);
  fileCache.set(key, { mtimeMs, tokens });
  return tokens;
};

const readThemeVars = (content: string): [string, string][] =>
  [...content.matchAll(THEME_REGEX)]
    .flatMap((theme) => [...theme[1].matchAll(THEME_VAR_REGEX)])
    .map((m) => [m[1], m[2].trim()]);

const safeCompute = (compute: () => Record<string, string>): Record<string, string> => {
  try {
    return compute();
  } catch {
    return {};
  }
};

const normalizeMap = (map: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(map).flatMap(([color, name]) => {
      const normalized = normalizeColor(color);
      return normalized ? [[normalized, name]] : [];
    }),
  );

const loadCssColorTokens = (cssFile: string | undefined, cwd: string): Record<string, string> => {
  if (!cssFile) return {};
  const abs = path.resolve(cwd, cssFile);
  return readThroughCache({
    kind: 'color',
    abs,
    compute: () =>
      Object.fromEntries(
        readThemeVars(fs.readFileSync(abs, 'utf-8'))
          .filter(([name]) => name.startsWith('color-'))
          .flatMap(([name, raw]) => {
            const value = normalizeColor(raw);
            return value ? [[value, name.slice('color-'.length)]] : [];
          }),
      ),
  });
};

const tokenName = (prefix: string, key: string): string => {
  if (key === 'DEFAULT') return prefix;
  return prefix ? `${prefix}-${key}` : key;
};

const flattenColors = (tree: Record<string, unknown>, prefix = ''): [string, string][] =>
  Object.entries(tree).flatMap(([key, value]): [string, string][] => {
    const name = tokenName(prefix, key);
    if (typeof value === 'string') {
      return [[name, value]];
    }
    if (value && typeof value === 'object') {
      return flattenColors(value as Record<string, unknown>, name);
    }
    return [];
  });

const loadConfigColorTokens = (
  configFile: string | undefined,
  cwd: string,
): Record<string, string> => {
  if (!configFile) return {};
  const abs = path.resolve(cwd, configFile);
  return readThroughCache({
    kind: 'config-color',
    abs,
    compute: () => {
      const req = createRequire(abs);
      // Bust Node's own module cache so an edited config actually reloads.
      delete req.cache[abs];
      const config = req(abs);

      const colors: Record<string, unknown> = {
        ...config?.theme?.colors,
        ...config?.theme?.extend?.colors,
      };

      return Object.fromEntries(
        flattenColors(colors).flatMap(([name, color]) => {
          const normalized = normalizeColor(color);
          return normalized ? [[normalized, name]] : [];
        }),
      );
    },
  });
};

export const loadColorTokens = (
  options: ColorTokenOptions,
  cwd = process.cwd(),
): Record<string, string> => ({
  ...loadCssColorTokens(options.cssFile, cwd),
  ...loadConfigColorTokens(options.configFile, cwd),
  ...normalizeMap(options.tokens ?? {}),
});

export const loadSpacingTokens = (
  cssFile: string | undefined,
  cwd = process.cwd(),
): SpacingTokens => {
  if (!cssFile) return { base: DEFAULT_SPACING, named: {} };
  const abs = path.resolve(cwd, cssFile);

  const vars = readThroughCache({
    kind: 'spacing',
    abs,
    compute: () =>
      Object.fromEntries(
        readThemeVars(fs.readFileSync(abs, 'utf-8')).filter(
          ([name]) => name === 'spacing' || name.startsWith('spacing-'),
        ),
      ),
  });
  const { spacing = DEFAULT_SPACING, ...rest } = vars;
  return {
    base: spacing === 'initial' ? null : spacing,
    named: Object.fromEntries(
      Object.entries(rest)
        .filter(([, value]) => value !== 'initial')
        .map(([name, value]) => [name.slice('spacing-'.length), value]),
    ),
  };
};
