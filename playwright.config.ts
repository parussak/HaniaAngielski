import { defineConfig } from '@playwright/test';
export default defineConfig({
  testDir: './tests/browser',
  timeout: 60000,
  use: { baseURL: 'http://127.0.0.1:5184', browserName: 'chromium', channel: 'msedge', headless: true },
  webServer: { command: 'npm.cmd run dev -- --port 5184 --strictPort', url: 'http://127.0.0.1:5184', reuseExistingServer: true },
});
