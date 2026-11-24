import tailwindDesignTokens from 'eslint-plugin-tailwind-design-tokens';

// All three rules on as errors. no-hardcoded-colors reads tokens from BOTH sources:
//   - theme.css        -> Tailwind v4 @theme  (cssFile)
//   - tailwind.config.js -> Tailwind v3 theme  (configFile)
// so a hardcoded color that matches a token in either file is mapped to it.
// no-arbitrary-spacing is Tailwind v4 only, so it reads theme.css alone.
export default [
  {
    // Lint application source only — not this config or the Tailwind token files,
    // which legitimately contain raw color values.
    files: ['src/**/*.{js,jsx}'],
    languageOptions: {
      ecmaVersion: 2022,
      sourceType: 'module',
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { 'tailwind-design-tokens': tailwindDesignTokens },
    rules: {
      'tailwind-design-tokens/no-default-palette': 'error',
      'tailwind-design-tokens/no-hardcoded-colors': [
        'error',
        {
          cssFile: './theme.css',
          configFile: './tailwind.config.js',
        },
      ],
      'tailwind-design-tokens/no-arbitrary-spacing': ['error', { cssFile: './theme.css' }],
    },
  },
];
