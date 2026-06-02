import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { normalizeColor } from './colors';

export interface TokenOptions {
  cssFile?: string;
  configFile?: string;
  tokens?: Record<string, string>;
}

const THEME_REGEX = /@theme\s*\{([^}]+)\}/s;
const COLOR_REGEX = /--color-([\w-]+)\s*:\s*([^;]+);/g;

const normalizeMap = (map: Record<string, string>): Record<string, string> =>
  Object.fromEntries(
    Object.entries(map).flatMap(([color, name]) => {
      const normalized = normalizeColor(color);
      return normalized ? [[normalized, name]] : [];
    }),
  );

const loadCssTokens = (cssFile: string | undefined, cwd: string): Record<string, string> => {
  if (!cssFile) return {};
  try {
    const content = fs.readFileSync(path.resolve(cwd, cssFile), 'utf-8');
    const theme = content.match(THEME_REGEX);
    if (!theme) return {};

    return Object.fromEntries(
      [...theme[1].matchAll(COLOR_REGEX)].flatMap((m) => {
        const value = normalizeColor(m[2].trim());
        return value ? [[value, m[1]]] : [];
      }),
    );
  } catch {
    return {};
  }
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

const loadConfigFileTokens = (
  configFile: string | undefined,
  cwd: string,
): Record<string, string> => {
  if (!configFile) return {};
  try {
    const abs = path.resolve(cwd, configFile);
    const config = createRequire(abs)(abs);

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
  } catch {
    return {};
  }
};

export const loadTokens = (options: TokenOptions, cwd = process.cwd()): Record<string, string> => ({
  ...loadCssTokens(options.cssFile, cwd),
  ...loadConfigFileTokens(options.configFile, cwd),
  ...normalizeMap(options.tokens ?? {}),
});
