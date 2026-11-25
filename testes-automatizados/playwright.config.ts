import { defineConfig } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  timeout: 30000,
  use: {
    headless: false,
    video: 'on',
    screenshot: 'on',
  },
  reporter: [['list'], ['html', { open: 'never' }]],
});
