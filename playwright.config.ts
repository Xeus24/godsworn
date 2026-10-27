import { defineConfig } from '@playwright/test';

/**
 * Real-browser tests (npm run test:e2e). They drive the game in the installed
 * Google Chrome, so no browser download is needed. Unit tests stay in tests/.
 */
export default defineConfig({
  testDir: 'e2e',
  testMatch: '**/*.e2e.ts',
  timeout: 60_000,
  workers: 1,
  reporter: 'list',
  use: {
    baseURL: 'http://localhost:5199',
    channel: 'chrome',
    headless: true,
    viewport: { width: 1280, height: 900 },
  },
  webServer: {
    command: 'npm run dev -- --port 5199 --strictPort',
    url: 'http://localhost:5199',
    reuseExistingServer: true,
    timeout: 60_000,
  },
});
