import { defineConfig } from '@playwright/test';

const port = process.env.E2E_PORT ?? '8787';

export default defineConfig({
  testDir: 'tests/e2e',
  outputDir: 'test-results',
  reporter: [['list'], ['html', { open: 'never', outputFolder: 'playwright-report' }]],
  use: { baseURL: `http://localhost:${port}` },
  webServer: {
    command: `pnpm build && pnpm exec wrangler dev --port ${port}`,
    url: `http://localhost:${port}`,
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});
