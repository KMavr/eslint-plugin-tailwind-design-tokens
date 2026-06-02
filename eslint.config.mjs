import tseslint from 'typescript-eslint';
import eslintPluginPrettierRecommended from 'eslint-plugin-prettier/recommended';

export default tseslint.config(
  { ignores: ['dist/**', 'coverage/**'] },
  ...tseslint.configs.recommended,
  {
    rules: {
      'no-nested-ternary': 'error',
      'no-unneeded-ternary': 'error',
    },
  },
  eslintPluginPrettierRecommended,
);
