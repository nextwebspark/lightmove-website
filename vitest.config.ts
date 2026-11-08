import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    include: ['src/**/*.test.ts', 'docs-site/src/**/*.test.ts', 'tests/**/*.test.ts'],
    environment: 'node',
  },
});
