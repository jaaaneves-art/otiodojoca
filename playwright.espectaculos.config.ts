import { defineConfig, devices } from '@playwright/test';
// Fixed loopback-only target. No environment override can point this suite at production.
export default defineConfig({
 testDir: './tests/espectaculos', testMatch: '**/*.spec.ts', fullyParallel: false, workers: 1,
 timeout: 60000, expect: { timeout: 15000 }, retries: 0,
 outputDir: '/tmp/otj-espectaculos-e2e-results', reporter: 'list',
 use: { baseURL: 'http://127.0.0.1:4318', trace: 'off', screenshot: 'off', video: 'off' },
 projects: [{ name: 'chromium', use: { ...devices['Desktop Chrome'], browserName: 'chromium' } }],
 webServer: { command: 'node scripts/espectaculos/e2e/start.mjs', url: 'http://127.0.0.1:4318/espectaculos', reuseExistingServer: false, timeout: 180000 },
});
