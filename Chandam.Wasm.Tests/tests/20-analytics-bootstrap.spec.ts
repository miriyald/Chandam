/**
 * Test 20 – GA4 analytics bootstrap
 *
 * The inline snippet in index.html must expose gtag as a global and queue the
 * config call. Regression guard: the snippet previously declared gtag inside an
 * IIFE, so window.gtag was undefined and all tracking silently no-opped.
 *
 * On localhost the remote gtag.js must never be fetched.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

test.describe('Analytics bootstrap', () => {
  test('gtag global is defined and GA4 config is queued', async ({ page }) => {
    await gotoAndWait(page, '/');

    const state = await page.evaluate(() => {
      const w = window as any;
      const measurementId = w.GA4_MEASUREMENT_ID;
      return {
        gtagType: typeof w.gtag,
        measurementId,
        // Indexing works on Arguments objects; Array.isArray does not
        hasConfig: (w.dataLayer || []).some(
          (entry: any) => entry && entry[0] === 'config' && entry[1] === measurementId,
        ),
        remoteLoaded: !!document.querySelector('script[src*="googletagmanager.com"]'),
      };
    });

    expect(state.gtagType).toBe('function');
    expect(state.measurementId).toMatch(/^G-/);
    expect(state.hasConfig).toBe(true);
    expect(state.remoteLoaded).toBe(false);
  });
});
