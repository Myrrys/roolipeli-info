import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'pnpm run dev --port 4322',
    port: 4322,
    reuseExistingServer: !process.env.CI,
    env: {
      ASTRO_DISABLE_TELEMETRY: 'true',
      ASTRO_TOOLBAR_ENABLED: 'false',
    },
  },
  testDir: 'tests/e2e',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
