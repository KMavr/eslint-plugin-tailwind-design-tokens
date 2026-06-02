import type { ESLint } from 'eslint';
import { createRequire } from 'node:module';
import noHardcodedColors from './rules/no-hardcoded-colors';
import noDefaultPalette from './rules/no-default-palette';

const { version } = createRequire(__filename)('../package.json') as { version: string };

const NAMESPACE = 'tailwind-design-tokens';

const recommendedRules = {
  [`${NAMESPACE}/no-hardcoded-colors`]: 'error',
  [`${NAMESPACE}/no-default-palette`]: 'error',
} as const;

const plugin: ESLint.Plugin = {
  meta: {
    name: 'eslint-plugin-tailwind-design-tokens',
    version,
  },
  rules: {
    'no-hardcoded-colors': noHardcodedColors,
    'no-default-palette': noDefaultPalette,
  },
  configs: {},
};

plugin.configs!.recommended = {
  plugins: [NAMESPACE],
  rules: recommendedRules,
};

plugin.configs!['flat/recommended'] = [
  {
    plugins: { [NAMESPACE]: plugin },
    rules: recommendedRules,
  },
];

export = plugin;
