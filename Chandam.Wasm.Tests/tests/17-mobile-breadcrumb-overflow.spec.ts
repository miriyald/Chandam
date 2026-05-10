/**
 * Test 17 - Mobile breadcrumb back-link behavior
 *
 * Ensures breadcrumbs on mobile collapse to show only the last parent
 * as a back-link, hiding ancestors and the current page name.
 */

import { test, expect, gotoAndWait } from '../fixtures/wasm-ready';

async function getFirstLearnRulePath(
  page: import('@playwright/test').Page,
): Promise<string> {
  await gotoAndWait(page, '/learn/chandam/');

  const firstLearnLink = page
    .locator('.rule-list-item .rule-item-actions a[href*="/learn/chandam/"]')
    .first();

  await expect(firstLearnLink).toBeVisible();

  const href = await firstLearnLink.getAttribute('href');
  expect(href).toBeTruthy();

  return href!;
}

test.describe('Mobile breadcrumb back-link behavior', () => {
  test('breadcrumbs show only parent as back-link on mobile', async ({
    page,
    isMobile,
  }) => {
    test.skip(!isMobile, 'Mobile-only test');

    const learnPath = await getFirstLearnRulePath(page);
    await gotoAndWait(page, learnPath);

    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    // Ancestors should be hidden
    const ancestors = page.locator('.breadcrumb-ancestor');
    const ancestorCount = await ancestors.count();
    for (let i = 0; i < ancestorCount; i++) {
      await expect(ancestors.nth(i)).toBeHidden();
    }

    // Separators should be hidden
    const separators = page.locator('.breadcrumb-separator');
    const sepCount = await separators.count();
    for (let i = 0; i < sepCount; i++) {
      await expect(separators.nth(i)).toBeHidden();
    }

    // Current page name should be hidden
    const current = page.locator('.breadcrumb-current');
    await expect(current).toBeHidden();

    // Parent link should be visible as back-link
    const parent = page.locator('.breadcrumb-parent');
    await expect(parent).toBeVisible();
  });

  test('mobile breadcrumb visual baseline', async ({ page, isMobile }) => {
    test.skip(!isMobile, 'Mobile-only test');

    const learnPath = await getFirstLearnRulePath(page);
    await gotoAndWait(page, learnPath);

    const breadcrumbs = page.locator('.breadcrumbs');
    await expect(breadcrumbs).toBeVisible();

    await expect(breadcrumbs).toHaveScreenshot('mobile-breadcrumb-back-link.png', {
      timeout: 15_000,
      maxDiffPixelRatio: 0.02,
    });
  });
});
