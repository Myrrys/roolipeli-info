import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  webServer: {
    command: 'pnpm run dev',
    port: 4321,
    reuseExistingServer: !process.env.CI,
  },
  testDir: 'tests/e2e',
  projects: [
    {
      name: 'chromium',
      use: { ...devices['Desktop Chrome'] },
    },
  ],
});
