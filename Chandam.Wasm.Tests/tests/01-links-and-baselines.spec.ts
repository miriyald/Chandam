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
const ROUTES: Array<{ path: string; name: string; expectedContent: string }> = [
  { path: '/',               name: 'home',            expectedContent: 'ఛందం' },
  { path: '/rule-sets',      name: 'rule-sets',       expectedContent: 'Rule Sets' },
  { path: '/compute/chandam/', name: 'compute-chandam', expectedContent: 'Rule Set' },
  { path: '/compute/topella/', name: 'compute-topella', expectedContent: 'Rule Set' },
  { path: '/learn/chandam/',   name: 'learn-chandam',   expectedContent: 'Rule Set' },
  { path: '/learn/topella/',   name: 'learn-topella',   expectedContent: 'Rule Set' },
  { path: '/create-rule',    name: 'create-rule',     expectedContent: 'నియమ' },
  { path: '/about',          name: 'about',           expectedContent: 'పరిచయం' },
  { path: '/credits',        name: 'credits',         expectedContent: 'కృతజ్ఞతలు' },
  { path: '/contact',        name: 'contact',         expectedContent: 'సంప్రదింపులు' },
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

    // Page body must contain expected text
    await expect(page.locator('body')).toContainText(route.expectedContent, {
      timeout: 10_000,
    });

    // No JS errors during page load
    expect(consoleErrors, `Console errors on ${route.path}`).toHaveLength(0);
  });

  test(`[${route.name}] same-origin links resolve`, async ({ page }) => {
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
      // Allow up to 2% pixel difference for font rendering variance
      maxDiffPixelRatio: 0.02,
      // Mask dynamic content that changes between runs
      mask: [page.locator('#version-info')],
    });
  });
}
