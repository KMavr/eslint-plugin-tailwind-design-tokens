import tseslint from 'typescript-eslint';
import eslintConfigPrettier from 'eslint-config-prettier';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**', 'examples/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
    },
  },
  eslintConfigPrettier,
);
