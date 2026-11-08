import js from '@eslint/js';
import astro from 'eslint-plugin-astro';
import { defineConfig, globalIgnores } from 'eslint/config';
import globals from 'globals';
import tseslint from 'typescript-eslint';

export default defineConfig([
  globalIgnores([
    'functions/lib/',
    'functions/node_modules/',
    'dist/',
    '.astro/',
    'node_modules/',
    'design/',
    '.lighthouseci/',
    'public/',
    'docs-site/dist/',
    'docs-site/.astro/',
    'docs-site/public/',
  ]),
  js.configs.recommended,
  tseslint.configs.strict,
  astro.configs.recommended,
  {
    languageOptions: {
      globals: { ...globals.node },
    },
    rules: {
      '@typescript-eslint/no-explicit-any': 'error',
      '@typescript-eslint/consistent-type-imports': 'error',
      'no-console': ['error', { allow: ['warn', 'error'] }],
    },
  },
  {
    files: ['src/**/*.astro', 'docs-site/src/**/*.astro'],
    languageOptions: { globals: { ...globals.browser } },
  },
]);
