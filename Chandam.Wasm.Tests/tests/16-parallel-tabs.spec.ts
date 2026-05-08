/**
 * Test 14 – Parallel tab analysis
 *
 * Verifies that two independent browser contexts can run meter analysis
 * simultaneously without interfering with each other. This simulates a user
 * having two browser tabs open with different rule sets.
 */

import { test, expect } from '@playwright/test';
import { waitForWasmReady } from '../fixtures/wasm-ready';

const BASE_URL = process.env.CHANDAM_URL ?? 'http://localhost:5080';

test.describe('Parallel analysis in multiple tabs', () => {
  test('two browser contexts run independent analyses simultaneously', async ({
    browser,
  }) => {
    // Create two isolated contexts (simulating two tabs)
    const context1 = await browser.newContext();
    const context2 = await browser.newContext();
    const page1 = await context1.newPage();
    const page2 = await context2.newPage();

    try {
      // Navigate both to different rule set compute pages
      await page1.goto(`${BASE_URL}/compute/chandam/`);
      await page2.goto(`${BASE_URL}/compute/topella/`);
      await Promise.all([
        waitForWasmReady(page1),
        waitForWasmReady(page2),
      ]);

      // Load random poems in both
      await page1.locator('#btn-random').click();
      await page2.locator('#btn-random').click();
      await expect(page1.locator('#poem-editor')).not.toHaveValue('');
      await expect(page2.locator('#poem-editor')).not.toHaveValue('');

      // Analyze in both simultaneously
      await Promise.all([
        page1.locator('#btn-analyze').click(),
        page2.locator('#btn-analyze').click(),
      ]);

      // Both should show results independently
      await expect(page1.locator('#results-section')).toBeVisible({
        timeout: 15_000,
      });
      await expect(page2.locator('#results-section')).toBeVisible({
        timeout: 15_000,
      });

      // Both should have match cards
      await expect(page1.locator('.match-card').first()).toBeVisible();
      await expect(page2.locator('.match-card').first()).toBeVisible();

      // Verify they are on different pages (different URLs)
      expect(page1.url()).toContain('/compute/chandam/');
      expect(page2.url()).toContain('/compute/topella/');
    } finally {
      await context1.close();
      await context2.close();
    }
  });
});
