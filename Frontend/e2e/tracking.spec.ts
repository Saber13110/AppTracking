import { test, expect } from '@playwright/test';

// Mock response for the tracking API
const mockTracking = {
  success: true,
  data: {
    tracking_number: 'FEDEXID',
    carrier: 'FedEx',
    status: { status: 'In transit', description: 'On the way', is_delivered: false },
    tracking_history: [{ status: 'In transit', description: 'Departed', timestamp: '2024-01-01T00:00:00Z' }],
    currentLocation: { latitude: 33.5, longitude: -7.6 }
  }
};

test('tracking flow', async ({ page }) => {
  // Intercept backend call and return mock data
  await page.route('**/api/v1/tracking/*', route => {
    route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(mockTracking)
    });
  });

  await page.goto('/tracking/FEDEXID');

  // Wait for timeline
  await expect(page.getByRole('list', { name: 'Historique du suivi' })).toBeVisible();
  // Map region
  await expect(page.getByRole('region', { name: 'Tracking map' })).toBeVisible();

  // Open and close a modal
  await page.getByRole('button', { name: 'Schedule' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');

  // Test share button
  await page.evaluate(() => {
    (navigator as any).share = () => Promise.resolve();
  });
  await page.getByRole('button', { name: 'Share' }).click();

  // Print button
  await page.evaluate(() => { window.print = () => {}; });
  await page.getByRole('button', { name: 'Print' }).click();

  // Save button
  await page.getByRole('button', { name: 'Save' }).click();
  const saved = await page.evaluate(() => localStorage.getItem('savedTrackingNumbers'));
  expect(saved).toContain('FEDEXID');

  // Export PDF
  await page.route('**/export?format=pdf', route => route.fulfill({ status: 200, body: '' }));
  await page.getByRole('button', { name: 'Export PDF' }).click();

  // Export CSV
  await page.route('**/export?format=csv', route => route.fulfill({ status: 200, body: '' }));
  await page.getByRole('button', { name: 'Export CSV' }).click();
});
