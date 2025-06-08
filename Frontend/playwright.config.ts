import { PlaywrightTestConfig } from '@playwright/test';

const config: PlaywrightTestConfig = {
  testDir: './e2e',
  use: {
    headless: true,
    baseURL: 'http://localhost:4200',
  },
};

export default config;
