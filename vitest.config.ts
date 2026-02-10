import { defineConfig } from 'vitest/config';

export default defineConfig({
  cacheDir: 'node_modules/.vitest',
  test: {
    globals: true,
    environment: 'node',
    exclude: [
      '**/node_modules/**',
      '**/dist/**',
      '**/tests/e2e/**',
      '**/.{idea,git,cache,output,temp}/**',
    ],
  },
});
