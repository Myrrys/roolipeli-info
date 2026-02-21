import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'pnpm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
    env: {
      ASTRO_DISABLE_TELEMETRY: 'true',
      ASTRO_TOOLBAR_ENABLED: 'false',
      PUBLIC_ENABLE_PASSWORD_LOGIN: 'true',
    },
  },
  testDir: 'tests/e2e',
  workers: process.env.CI ? 4 : 4,
  retries: process.env.CI ? 2 : 1,
  expect: {
    timeout: 10_000,
  },
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
