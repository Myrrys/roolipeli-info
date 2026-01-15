import { defineConfig } from 'vitest/config';

export default defineConfig({
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
