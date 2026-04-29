/**
 * @file eslint.config.js
 * @description Universal ESLint flat config — TypeScript strict mode
 * @standard project-management/standards/config.md
 *
 * For JavaScript-only projects, replace `src/**\/*.ts` with `src/**\/*.js`
 * and remove `projectService` + `tsconfigRootDir`.
 */
import eslint from '@eslint/js';
import tseslint from 'typescript-eslint';

export default tseslint.config(
  eslint.configs.recommended,
  ...tseslint.configs.recommended,
  {
    files: ['src/**/*.ts'],
    languageOptions: {
      parserOptions: {
        projectService: true,
        tsconfigRootDir: import.meta.dirname,
      },
    },
    rules: {
      '@typescript-eslint/no-unused-vars': ['error', { argsIgnorePattern: '^_' }],
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': 'off',
    },
  },
  {
    ignores: ['dist/', 'node_modules/'],
  },
);
