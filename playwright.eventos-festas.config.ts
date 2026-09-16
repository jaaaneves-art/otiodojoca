import { defineConfig, devices } from '@playwright/test';
export default defineConfig({
  testDir: './tests/eventos-festas', testMatch: '**/*.spec.ts', workers: 1, fullyParallel: false,
  timeout: 60000, expect: { timeout: 15000 }, retries: 0,
  outputDir: '/tmp/otj-eventos-festas-e2e', reporter: 'list',
  use: { baseURL: 'http://127.0.0.1:4326', trace: 'off' },
  projects: [{ name: 'mobile-chromium', use: { ...devices['iPhone 13'], browserName: 'chromium', channel: 'chrome', launchOptions: { args: ['--no-sandbox'] } } }],
  webServer: { command: 'node scripts/eventos-festas/e2e/start.mjs', url: 'http://127.0.0.1:4326/eventos-festas', timeout: 180000, reuseExistingServer: false },
});
