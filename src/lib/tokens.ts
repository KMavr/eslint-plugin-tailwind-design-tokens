import fs from 'node:fs';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
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

const THEME_OPEN_REGEX = /@theme(?:\s+[\w-]+)*\s*\{/g;
const STRING_OR_COMMENT_REGEX = /("(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*')|\/\*[\s\S]*?\*\//g;
const CSS_TOKEN_REGEX = /"(?:\\.|[^"\\])*"|'(?:\\.|[^'\\])*'|[{}]|[^"'{}]+/g;
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
  try {
    const { mtimeMs } = fs.statSync(abs);
    const key = `${kind}:${abs}`;
    const cached = fileCache.get(key);
    if (cached && cached.mtimeMs === mtimeMs) {
      return cached.tokens;
    }

    const tokens = compute();
    fileCache.set(key, { mtimeMs, tokens });
    return tokens;
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error);
    throw new Error(`eslint-plugin-tailwind-design-tokens: cannot load "${abs}": ${reason}`, {
      cause: error,
    });
  }
};

const topLevelBody = (css: string): string =>
  (css.match(CSS_TOKEN_REGEX) ?? []).reduce(
    (acc, token) => {
      if (acc.depth === 0) return acc;
      if (token === '{') return { ...acc, depth: acc.depth + 1 };
      if (token === '}') return { ...acc, depth: acc.depth - 1 };
      return acc.depth === 1 ? { ...acc, body: acc.body + token } : acc;
    },
    { depth: 1, body: '' },
  ).body;

const readThemeVars = (content: string): [string, string][] => {
  const css = content.replace(STRING_OR_COMMENT_REGEX, (_, str: string | undefined) => str ?? '');
  return [...css.matchAll(THEME_OPEN_REGEX)]
    .flatMap((theme) => [
      ...topLevelBody(css.slice(theme.index + theme[0].length)).matchAll(THEME_VAR_REGEX),
    ])
    .map((m) => [m[1], m[2].trim()]);
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

type ColorTree = Record<string, unknown>;

const isPlainObject = (value: unknown): value is ColorTree =>
  typeof value === 'object' && value !== null && !Array.isArray(value);

const deepMerge = (base: ColorTree, override: ColorTree): ColorTree =>
  Object.entries(override).reduce<ColorTree>(
    (acc, [key, value]) => ({
      ...acc,
      [key]: isPlainObject(acc[key]) && isPlainObject(value) ? deepMerge(acc[key], value) : value,
    }),
    base,
  );

// Runs in a fresh Node process: no CJS/ESM module cache, so edits to the config and to
// anything it imports are picked up. Functions are dropped by JSON, which is fine (not colors).
const CONFIG_LOADER_SCRIPT = `
import { pathToFileURL } from 'node:url';
try {
  const ns = await import(pathToFileURL(process.argv[1]).href);
  const mod = ns.default ?? ns;
  const theme = (mod?.default ?? mod)?.theme;
  const result = { colors: theme?.colors ?? {}, extend: theme?.extend?.colors ?? {} };
  process.stdout.write('\\n' + JSON.stringify(result));
} catch (error) {
  process.stderr.write(error instanceof Error ? error.message : String(error));
  process.exitCode = 1;
}
`;

const readConfigColors = (abs: string): { colors: ColorTree; extend: ColorTree } => {
  const result = spawnSync(
    process.execPath,
    ['--input-type=module', '-e', CONFIG_LOADER_SCRIPT, abs],
    {
      cwd: path.dirname(abs),
      encoding: 'utf-8',
      // Editor ESLint servers can run inside Electron; this makes its binary behave as Node.
      env: { ...process.env, ELECTRON_RUN_AS_NODE: '1' },
    },
  );
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || `exit code ${result.status}`);
  // The config may log to stdout; the JSON is always the last line.
  return JSON.parse(result.stdout.slice(result.stdout.lastIndexOf('\n') + 1));
};

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
      const { colors, extend } = readConfigColors(abs);
      return Object.fromEntries(
        flattenColors(deepMerge(colors, extend)).flatMap(([name, color]) => {
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
