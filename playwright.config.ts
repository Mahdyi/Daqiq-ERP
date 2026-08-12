import { defineConfig, devices } from '@playwright/test';

const appBaseUrl = process.env.ERP_APP_BASE_URL ?? 'http://localhost:4200';
const browserChannel = process.env.PLAYWRIGHT_BROWSER_CHANNEL ?? 'chrome';

export default defineConfig({
  testDir: './e2e',
  timeout: 60_000,
  globalTimeout: 150_000,
  expect: {
    timeout: 15_000
  },
  fullyParallel: false,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  reporter: [['list'], ['html', { open: 'never' }]],
  use: {
    baseURL: appBaseUrl,
    channel: browserChannel,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
    video: 'off',
    locale: 'fa-IR',
    timezoneId: 'Asia/Tehran'
  },
  projects: [
    {
      name: 'demo-chromium',
      use: {
        ...devices['Desktop Chrome']
      }
    }
  ]
});
