import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: { baseURL: 'http://localhost:8787' },
  webServer: {
    command: 'pnpm build && pnpm exec wrangler dev --port 8787',
    url: 'http://localhost:8787',
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
