import fs from 'node:fs';
import path from 'node:path';
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

export const loadTokens = (options: TokenOptions, cwd = process.cwd()): Record<string, string> => ({
  ...loadCssTokens(options.cssFile, cwd),
  ...normalizeMap(options.tokens ?? {}),
});
