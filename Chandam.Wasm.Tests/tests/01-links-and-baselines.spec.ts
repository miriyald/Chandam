/**
 * Test 01 – Link checker + visual baseline snapshots
 *
 * For every known application route:
 *  1. Navigate directly (simulating a hard refresh / deep link).
 *  2. Wait for WASM runtime to initialise.
 *  3. Assert no browser console errors were emitted.
 *  4. Collect all same-origin <a href> links and verify they resolve (200).
 *  5. Take a named screenshot for visual regression (desktop & mobile projects).
 *
 * Run with `--update-snapshots` on first execution to create baseline images.
 */

import { test, expect } from '../fixtures/wasm-ready';
import { gotoAndWait } from '../fixtures/wasm-ready';

// ---------------------------------------------------------------------------
// Routes to visit
// ---------------------------------------------------------------------------
const ROUTES: Array<{ path: string; name: string; visibleSelector: string }> = [
  { path: '/', name: 'home', visibleSelector: '.home-page-landing' },
  { path: '/rule-sets', name: 'rule-sets', visibleSelector: '.rule-sets-page' },
  { path: '/compute/chandam/', name: 'compute-chandam', visibleSelector: '.compute-rule-set-page' },
  { path: '/compute/topella/', name: 'compute-topella', visibleSelector: '.compute-rule-set-page' },
  { path: '/learn/chandam/', name: 'learn-chandam', visibleSelector: '.learn-index-page' },
  { path: '/learn/topella/', name: 'learn-topella', visibleSelector: '.learn-index-page' },
  { path: '/create-rule', name: 'create-rule', visibleSelector: '#create-rule-btn' },
  { path: '/about', name: 'about', visibleSelector: '#content' },
  { path: '/credits', name: 'credits', visibleSelector: '#content' },
  { path: '/contact', name: 'contact', visibleSelector: '#content' },
];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Returns all unique same-origin href values found on the current page. */
async function collectSameOriginLinks(
  page: import('@playwright/test').Page,
): Promise<string[]> {
  const baseUrl = new URL(page.url());
  const hrefs: string[] = await page.$$eval(
    'a[href]',
    (anchors, origin) =>
      anchors
        .map((a) => (a as HTMLAnchorElement).href)
        .filter((href) => href.startsWith(origin)),
    baseUrl.origin,
  );
  return [...new Set(hrefs)];
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

for (const route of ROUTES) {
  test(`[${route.name}] page loads without errors`, async ({ page, consoleErrors }) => {
    await gotoAndWait(page, route.path);

    // Route-specific container must render.
    await expect(page.locator(route.visibleSelector)).toBeVisible({
      timeout: 10_000,
    });

    // No JS errors during page load
    expect(consoleErrors, `Console errors on ${route.path}`).toHaveLength(0);
  });

  test(`[${route.name}] same-origin links resolve`, async ({ page }) => {
    // Large routes (e.g., learn-topella) enumerate many links and need more time.
    test.setTimeout(120_000);

    await gotoAndWait(page, route.path);

    const links = await collectSameOriginLinks(page);

    for (const href of links) {
      // Use Playwright's request context to do a HEAD check
      const response = await page.request.head(href, {
        failOnStatusCode: false,
      });
      expect(
        response.status(),
        `Link ${href} on page ${route.path} returned ${response.status()}`,
      ).toBeLessThan(400);
    }
  });

  test(`[${route.name}] visual baseline`, async ({ page }) => {
    await gotoAndWait(page, route.path);

    // Allow animations/fonts to settle
    await page.waitForTimeout(500);

    await expect(page).toHaveScreenshot(`${route.name}.png`, {
      timeout: 15_000,
      // Allow up to 6% pixel difference for mobile rendering variance
      maxDiffPixelRatio: 0.06,
      // Mask dynamic content that changes between runs
      mask: [page.locator('#version-info')],
    });
  });
}
